import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/utils/serialization_helpers.dart';
import '../api/cinetracker_api.dart';

/// Represents a persistent mutating action that has been executed locally
/// and queued to be pushed to the remote CineTracker backend.
class PendingAction {
  final String id;
  final String type;
  final Map<String, dynamic> payload;
  final DateTime createdAt;
  final int retryCount;

  const PendingAction({
    required this.id,
    required this.type,
    required this.payload,
    required this.createdAt,
    this.retryCount = 0,
  });

  factory PendingAction.create({
    required String type,
    required Map<String, dynamic> payload,
  }) {
    final now = DateTime.now();
    final uniqueId = '${type}_${now.microsecondsSinceEpoch}';
    return PendingAction(
      id: uniqueId,
      type: type,
      payload: payload,
      createdAt: now,
      retryCount: 0,
    );
  }

  PendingAction copyWith({
    int? retryCount,
  }) {
    return PendingAction(
      id: id,
      type: type,
      payload: payload,
      createdAt: createdAt,
      retryCount: retryCount ?? this.retryCount,
    );
  }

  factory PendingAction.fromJson(Map<String, dynamic> json) {
    return PendingAction(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      payload: Map<String, dynamic>.from(json['payload'] as Map? ?? {}),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      retryCount: SerializationHelpers.parseInt(json['retryCount'], 0),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'payload': payload,
        'createdAt': createdAt.toIso8601String(),
        'retryCount': retryCount,
      };
}

/// Offline FIFO action queue managing local persistence and background push synchronization.
/// When network is unavailable, changes are safely saved locally and replayed automatically
/// once internet connectivity is restored.
class SyncQueueService {
  static const String storageKey = 'cinetracker_pending_action_queue';

  final SharedPreferences? prefs;
  final List<PendingAction> _queue = [];
  bool _isProcessing = false;

  SyncQueueService({this.prefs}) {
    _loadFromStorage();
  }

  void _loadFromStorage() {
    if (prefs == null) return;
    final raw = prefs!.getString(storageKey);
    if (raw == null || raw.isEmpty) return;

    try {
      final list = jsonDecode(raw);
      if (list is List) {
        _queue.clear();
        for (final item in list) {
          if (item is Map<String, dynamic>) {
            _queue.add(PendingAction.fromJson(item));
          } else if (item is Map) {
            _queue.add(PendingAction.fromJson(Map<String, dynamic>.from(item)));
          }
        }
      }
    } catch (_) {
      // Ignore corrupted stored queue
    }
  }

  Future<void> _saveToStorage() async {
    if (prefs == null) return;
    final encoded = jsonEncode(_queue.map((a) => a.toJson()).toList());
    await prefs!.setString(storageKey, encoded);
  }

  int get pendingCount => _queue.length;
  bool get hasPendingActions => _queue.isNotEmpty;
  List<PendingAction> get pendingActions => List.unmodifiable(_queue);

  /// Enqueues a mutating action to be pushed to the backend.
  Future<void> enqueue(PendingAction action) async {
    _queue.add(action);
    await _saveToStorage();
  }

  /// Clears all queued actions (e.g. on user logout).
  Future<void> clear() async {
    _queue.clear();
    await _saveToStorage();
  }

  /// Drains queued actions in FIFO order, dispatching them to the remote [api].
  /// If a network error occurs, halts execution to preserve ordering until next run.
  Future<int> processQueue(CineTrackerApi api) async {
    if (_isProcessing || _queue.isEmpty) return 0;

    _isProcessing = true;
    int successCount = 0;

    try {
      final pendingList = List<PendingAction>.from(_queue);

      for (final action in pendingList) {
        bool succeeded = false;
        bool isRecoverableNetworkError = false;

        try {
          await _dispatchAction(api, action);
          succeeded = true;
        } on SocketException catch (_) {
          isRecoverableNetworkError = true;
        } on TimeoutException catch (_) {
          isRecoverableNetworkError = true;
        } catch (e) {
          // Check for network/client error messages
          final errStr = e.toString().toLowerCase();
          if (errStr.contains('clientexception') ||
              errStr.contains('connection refused') ||
              errStr.contains('failed host lookup') ||
              errStr.contains('network') ||
              errStr.contains('503') ||
              errStr.contains('502')) {
            isRecoverableNetworkError = true;
          } else {
            // Unrecoverable (e.g. 400 Bad Request or malformed item) - drop to avoid poison pill
            succeeded = false;
          }
        }

        if (succeeded) {
          _queue.removeWhere((a) => a.id == action.id);
          await _saveToStorage();
          successCount++;
        } else if (isRecoverableNetworkError) {
          // Increment retry count and stop processing until next connectivity window
          final idx = _queue.indexWhere((a) => a.id == action.id);
          if (idx != -1) {
            _queue[idx] = _queue[idx].copyWith(retryCount: _queue[idx].retryCount + 1);
            await _saveToStorage();
          }
          break; // Stop FIFO loop until connection restored
        } else {
          // Unrecoverable failure - remove from queue
          _queue.removeWhere((a) => a.id == action.id);
          await _saveToStorage();
        }
      }
    } finally {
      _isProcessing = false;
    }

    return successCount;
  }

  Future<void> _dispatchAction(CineTrackerApi api, PendingAction action) async {
    final p = action.payload;

    switch (action.type) {
      case 'episode_watched':
        await api.toggleEpisodeWatched(
          SerializationHelpers.parseInt(p['showId']),
          SerializationHelpers.parseInt(p['seasonNumber'], 1),
          SerializationHelpers.parseInt(p['episodeNumber'], 1),
          SerializationHelpers.parseBool(p['watched']),
          rating: SerializationHelpers.parseDouble(p['rating']),
          watchedDate: p['watchedDate']?.toString(),
        );
        break;

      case 'mark_season_watched':
        await api.markSeasonWatched(
          SerializationHelpers.parseInt(p['showId']),
          SerializationHelpers.parseInt(p['seasonNumber'], 1),
          watchedDate: p['watchedDate']?.toString(),
        );
        break;

      case 'mark_show_watched':
        await api.markShowWatched(
          SerializationHelpers.parseInt(p['showId']),
          watchedDate: p['watchedDate']?.toString(),
        );
        break;

      case 'log_movie':
        final rawRating = SerializationHelpers.parseDouble(p['rating']) ?? 0.0;
        final rawWhere = p['watchedWhere'];
        String? whereStr;
        if (rawWhere is List && rawWhere.isNotEmpty) {
          whereStr = rawWhere.first.toString();
        } else if (rawWhere != null) {
          whereStr = rawWhere.toString();
        }

        await api.logMovie(
          SerializationHelpers.parseInt(p['movieId']),
          rating: rawRating,
          review: p['review']?.toString(),
          watchedDate: p['watchedDate'] != null
              ? DateTime.tryParse(p['watchedDate'].toString())
              : null,
          watchedWhere: whereStr,
        );
        break;

      case 'toggle_movie_watchlist':
        await api.setMovieWatchlist(
          SerializationHelpers.parseInt(p['movieId']),
          SerializationHelpers.parseBool(p['inWatchlist']),
        );
        break;

      case 'toggle_movie_favorite':
        await api.setMovieFavorite(
          SerializationHelpers.parseInt(p['movieId']),
          SerializationHelpers.parseBool(p['isFavorite']),
        );
        break;

      case 'toggle_tv_favorite':
        await api.toggleTvFavorite(
          SerializationHelpers.parseInt(p['showId']),
          isFavorite: SerializationHelpers.parseBool(p['isFavorite']),
        );
        break;

      case 'toggle_tv_watchlist':
        await api.toggleTvWatchlist(
          SerializationHelpers.parseInt(p['showId']),
        );
        break;

      default:
        break;
    }
  }
}
