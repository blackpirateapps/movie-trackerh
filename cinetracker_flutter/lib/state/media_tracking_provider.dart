import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api/api_interface.dart';
import '../services/api/cinetracker_api.dart';
import '../services/sync/sync_queue_service.dart';
import '../models/movie.dart';
import '../models/tv_show.dart';
import '../models/season.dart';
import '../models/episode.dart';
import '../models/dashboard_data.dart';
import '../models/diary_entry.dart';
import '../models/api_models.dart';

/// Provider that manages movie and TV tracking state, optimistic updates,
/// watchlist, favorites, diary, dashboard progression, and offline action queuing.
class MediaTrackingProvider extends ChangeNotifier {
  final CineTrackerApiInterface api;
  final CineTrackerApiInterface? fallbackMockApi;
  final SharedPreferences? prefs;
  late final SyncQueueService syncQueue;

  CineTrackerApiInterface get _api => api;

  bool _isLoading = false;
  String? _errorMessage;
  DashboardData? _dashboard;
  List<Movie> _movies = [];
  List<TvShow> _tvShows = [];
  List<DiaryEntry> _diary = [];
  List<Movie> _watchlistMovies = [];
  UserProfile? _userProfile;

  // In-memory season cache: showId -> (seasonNumber -> SeasonDetail)
  final Map<int, Map<int, SeasonDetail>> _seasonCache = {};

  MediaTrackingProvider({
    required this.api,
    this.fallbackMockApi,
    this.prefs,
    SyncQueueService? syncQueueService,
  }) : syncQueue = syncQueueService ?? SyncQueueService(prefs: prefs) {
    _rehydrateLocalCache();
  }

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  DashboardData? get dashboard => _dashboard;
  List<Movie> get movies => _movies;
  List<TvShow> get tvShows => _tvShows;
  List<DiaryEntry> get diary => _diary;
  UserProfile? get userProfile => _userProfile;
  List<Top4Item> get top4Favorites => _userProfile?.top4 ?? const [];

  // Convenient filtered getters
  TvShow? get featuredShow => _dashboard?.featuredShow;
  Episode? get nextEpisode => _dashboard?.nextEpisode;
  List<TvShowSummary> get otherActiveShows =>
      _dashboard?.otherActiveShows ?? const [];
  List<Movie> get lastWatchedMovies =>
      _dashboard?.lastWatchedMovies ?? const [];

  List<Movie> get watchedMovies =>
      _movies.where((m) => m.isWatched).toList();
  List<Movie> get watchlistMovies => _watchlistMovies;
  List<Movie> get favoriteMovies =>
      _movies.where((m) => m.isFavorite).toList();
  List<Movie> get unratedMovies =>
      _movies.where((m) => m.isWatched && m.userRating == null).toList();

  List<TvShow> get inProgressTvShows => _tvShows.where((s) {
        final totalWatched = s.seasons.fold<int>(
            0, (sum, sea) => sum + sea.episodes.where((e) => e.isWatched).length);
        return totalWatched > 0 &&
            (s.numberOfEpisodes == 0 || totalWatched < s.numberOfEpisodes);
      }).toList();

  List<TvShow> get completedTvShows => _tvShows.where((s) {
        final totalWatched = s.seasons.fold<int>(
            0, (sum, sea) => sum + sea.episodes.where((e) => e.isWatched).length);
        return s.numberOfEpisodes > 0 && totalWatched >= s.numberOfEpisodes;
      }).toList();

  List<TvShow> get watchlistTvShows =>
      _tvShows.where((s) => s.inWatchlist).toList();
  List<TvShow> get favoriteTvShows =>
      _tvShows.where((s) => s.isFavorite).toList();

  /// Rehydrate cached dashboard data from local SharedPreferences on cold start
  void _rehydrateLocalCache() {
    if (prefs == null) return;
    final raw = prefs!.getString('cinetracker_cached_dashboard');
    if (raw != null && raw.isNotEmpty && _dashboard == null) {
      try {
        final map = jsonDecode(raw);
        if (map is Map<String, dynamic>) {
          _dashboard = DashboardData.fromJson(map);
        } else if (map is Map) {
          _dashboard = DashboardData.fromJson(Map<String, dynamic>.from(map));
        }
      } catch (_) {}
    }
  }

  /// Persist current dashboard state to SharedPreferences
  void _persistDashboardLocally() {
    if (prefs == null || _dashboard == null) return;
    try {
      prefs!.setString(
          'cinetracker_cached_dashboard', jsonEncode(_dashboard!.toJson()));
    } catch (_) {}
  }

  /// Reset all local state (e.g. on logout or before a fresh login)
  void clearData() {
    _dashboard = null;
    _movies = [];
    _tvShows = [];
    _diary = [];
    _watchlistMovies = [];
    _userProfile = null;
    _errorMessage = null;
    _isLoading = false;
    _seasonCache.clear();
    prefs?.remove('cinetracker_cached_dashboard');
    syncQueue.clear();
    notifyListeners();
  }

  /// Initial multi-resource load.
  /// If [isGuest] is true, it may populate seeded mock data if offline/unauthenticated.
  /// When [isGuest] is false, it strictly loads live backend data and never displays mock data.
  Future<void> loadInitialData({bool isGuest = false}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    // Trigger sync of any actions queued while offline
    unawaited(_processSyncQueue());

    if (isGuest && fallbackMockApi != null) {
      try {
        final results = await Future.wait([
          fallbackMockApi!.getDashboard(refresh: true),
          fallbackMockApi!.getMovies(),
          fallbackMockApi!.getTvShows(),
          fallbackMockApi!.getDiary(),
          fallbackMockApi!.getMovies(watchlist: true),
        ]);

        _dashboard = results[0] as DashboardData;
        _movies = results[1] as List<Movie>;
        _tvShows = results[2] as List<TvShow>;
        _diary = results[3] as List<DiaryEntry>;
        _watchlistMovies = results[4] as List<Movie>;
        try {
          _userProfile = await fallbackMockApi!.getUserProfile('guest_cinephile');
        } catch (_) {}
        _isLoading = false;
        notifyListeners();
        return;
      } catch (_) {}
    }

    try {
      final results = await Future.wait([
        _api.getDashboard(refresh: true),
        _api.getMovies(),
        _api.getTvShows(),
        _api.getDiary(),
        _api.getMovies(watchlist: true),
      ]);

      _dashboard = results[0] as DashboardData;
      _movies = results[1] as List<Movie>;
      _tvShows = results[2] as List<TvShow>;
      _diary = results[3] as List<DiaryEntry>;
      _watchlistMovies = results[4] as List<Movie>;

      _persistDashboardLocally();

      final username = _api.currentUsername;
      if (username != null && username.isNotEmpty) {
        try {
          _userProfile = await _api.getUserProfile(username);
        } catch (_) {}
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Failed to load tracking data: $e';
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Silently or visibly refreshes dashboard
  Future<void> refreshDashboard({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      notifyListeners();
    }
    try {
      _dashboard = await _api.getDashboard(refresh: true);
      _persistDashboardLocally();
      _errorMessage = null;
    } catch (e) {
      if (!silent) _errorMessage = 'Failed to refresh dashboard: $e';
    } finally {
      if (!silent) _isLoading = false;
      notifyListeners();
    }
  }

  /// Refreshes movie collection
  Future<void> refreshMovies({bool silent = false}) async {
    try {
      _movies = await _api.getMovies();
      notifyListeners();
    } catch (e) {
      if (!silent) _errorMessage = 'Failed to refresh movies: $e';
    }
  }

  /// Refreshes TV show collection
  Future<void> refreshTvShows({bool silent = false}) async {
    try {
      _tvShows = await _api.getTvShows();
      notifyListeners();
    } catch (e) {
      if (!silent) _errorMessage = 'Failed to refresh TV shows: $e';
    }
  }

  /// Refreshes diary entries
  Future<void> refreshDiary({bool silent = false}) async {
    try {
      _diary = await _api.getDiary();
      notifyListeners();
    } catch (e) {
      if (!silent) _errorMessage = 'Failed to refresh diary: $e';
    }
  }

  /// Refreshes watchlist collection from live backend
  Future<void> refreshWatchlist({bool silent = false}) async {
    try {
      _watchlistMovies = await _api.getMovies(watchlist: true);
      notifyListeners();
    } catch (e) {
      if (!silent) _errorMessage = 'Failed to refresh watchlist: $e';
    }
  }

  /// Refreshes user profile from live backend
  Future<void> refreshUserProfile({bool silent = false}) async {
    final username = _api.currentUsername;
    if (username == null || username.isEmpty) return;
    try {
      _userProfile = await _api.getUserProfile(username);
      notifyListeners();
    } catch (e) {
      if (!silent) _errorMessage = 'Failed to refresh profile: $e';
    }
  }

  /// Returns cached SeasonDetail if already loaded in memory
  SeasonDetail? getCachedSeason(int showId, int seasonNumber) =>
      _seasonCache[showId]?[seasonNumber];

  /// Retrieves SeasonDetail, returning cached data immediately if available,
  /// or fetching from API and syncing season episodes into the show's season list.
  Future<SeasonDetail> getSeasonDetail(int showId, int seasonNumber) async {
    final showCache = _seasonCache[showId];
    if (showCache != null && showCache.containsKey(seasonNumber)) {
      return showCache[seasonNumber]!;
    }

    try {
      final detail = await _api.getSeasonDetail(showId, seasonNumber);
      _seasonCache.putIfAbsent(showId, () => {})[seasonNumber] = detail;

      // Sync season episodes into _tvShows if present
      final showIdx = _tvShows.indexWhere((s) => s.id == showId);
      if (showIdx != -1) {
        final show = _tvShows[showIdx];
        final updatedSeasons = List<Season>.from(show.seasons);
        final sIdx =
            updatedSeasons.indexWhere((s) => s.seasonNumber == seasonNumber);
        final newSeason = Season(
          id: detail.id,
          seasonNumber: detail.seasonNumber,
          name: detail.name,
          episodeCount: detail.episodes.length,
          posterPath: detail.posterPath,
          episodes: detail.episodes,
        );

        if (sIdx != -1) {
          updatedSeasons[sIdx] = newSeason;
        } else {
          updatedSeasons.add(newSeason);
          updatedSeasons
              .sort((a, b) => a.seasonNumber.compareTo(b.seasonNumber));
        }

        _tvShows[showIdx] = show.copyWith(seasons: updatedSeasons);
        notifyListeners();
      }

      return detail;
    } catch (e) {
      return SeasonDetail(
        id: showId * 1000 + seasonNumber,
        seasonNumber: seasonNumber,
        name: 'Season $seasonNumber',
      );
    }
  }

  /// Optimistically logs or rates a movie, then synchronizes with backend
  Future<void> logMovie(
    int movieId, {
    required double rating,
    String? review,
    String? watchedWhere,
    DateTime? watchedDate,
  }) async {
    final effectiveDate = watchedDate ?? DateTime.now();
    final intRating = rating.round().clamp(1, 10);

    // 1. Optimistic Movie update
    final movieIdx = _movies.indexWhere((m) => m.id == movieId);
    Movie updatedMovie;
    if (movieIdx != -1) {
      updatedMovie = _movies[movieIdx].copyWith(
        userRating: intRating,
        review: review,
        watchedDate: effectiveDate,
        watchedWhere: watchedWhere != null && watchedWhere.isNotEmpty
            ? [watchedWhere]
            : _movies[movieIdx].watchedWhere,
      );
      _movies[movieIdx] = updatedMovie;
    } else {
      updatedMovie = Movie(
        id: movieId,
        title: 'Movie #$movieId',
        userRating: intRating,
        review: review,
        watchedDate: effectiveDate,
        watchedWhere: watchedWhere != null && watchedWhere.isNotEmpty
            ? [watchedWhere]
            : const [],
      );
      _movies.insert(0, updatedMovie);
    }

    // 2. Optimistic Dashboard update
    if (_dashboard != null) {
      final existingLastWatched = List<Movie>.from(_dashboard!.lastWatchedMovies);
      existingLastWatched.removeWhere((m) => m.id == movieId);
      existingLastWatched.insert(0, updatedMovie);
      _dashboard = _dashboard!.copyWith(lastWatchedMovies: existingLastWatched);
      _persistDashboardLocally();
    }

    notifyListeners();

    // 3. Queue action for persistence and sync
    final action = PendingAction.create(
      type: 'log_movie',
      payload: {
        'movieId': movieId,
        'rating': rating,
        'review': review,
        'watchedWhere': watchedWhere != null && watchedWhere.isNotEmpty ? [watchedWhere] : null,
        'watchedDate': effectiveDate.toIso8601String(),
      },
    );
    await syncQueue.enqueue(action);

    // 4. Background push
    unawaited(_processSyncQueue());
  }

  /// Optimistically toggles movie watchlist status
  Future<void> toggleMovieWatchlist(int movieId) async {
    final wlIdx = _watchlistMovies.indexWhere((m) => m.id == movieId);
    final movieIdx = _movies.indexWhere((m) => m.id == movieId);
    final wasInWatchlist = wlIdx != -1;
    final nextWatchlistState = !wasInWatchlist;

    if (wasInWatchlist) {
      _watchlistMovies.removeAt(wlIdx);
    } else if (movieIdx != -1) {
      _watchlistMovies.insert(
          0, _movies[movieIdx].copyWith(inWatchlist: true));
    } else {
      _watchlistMovies.insert(
        0,
        Movie(
          id: movieId,
          title: 'Movie #$movieId',
          inWatchlist: true,
        ),
      );
    }

    if (movieIdx != -1) {
      _movies[movieIdx] =
          _movies[movieIdx].copyWith(inWatchlist: nextWatchlistState);
    }
    notifyListeners();

    final action = PendingAction.create(
      type: 'toggle_movie_watchlist',
      payload: {
        'movieId': movieId,
        'inWatchlist': nextWatchlistState,
      },
    );
    await syncQueue.enqueue(action);
    unawaited(_processSyncQueue());
  }

  /// Optimistically toggles movie favorite status
  Future<void> toggleMovieFavorite(int movieId) async {
    final movieIdx = _movies.indexWhere((m) => m.id == movieId);
    if (movieIdx != -1) {
      final nextFav = !_movies[movieIdx].isFavorite;
      _movies[movieIdx] = _movies[movieIdx].copyWith(isFavorite: nextFav);
      notifyListeners();

      final action = PendingAction.create(
        type: 'toggle_movie_favorite',
        payload: {
          'movieId': movieId,
          'isFavorite': nextFav,
        },
      );
      await syncQueue.enqueue(action);
      unawaited(_processSyncQueue());
    }
  }

  /// Optimistically toggles episode watched state with instant Dashboard hero advancement
  Future<void> toggleEpisodeWatched(
    int showId,
    int seasonNumber,
    int episodeNumber,
    bool watched, {
    double? rating,
    String? watchedDate,
  }) async {
    final dateStr = watchedDate ?? DateTime.now().toIso8601String();

    // 1. Optimistically mutate _dashboard.currentlyWatching immediately!
    if (_dashboard != null && _dashboard!.currentlyWatching != null) {
      final cw = _dashboard!.currentlyWatching!;
      if (cw.show.id == showId) {
        final delta = watched ? 1 : -1;
        final totalCount = cw.progress.totalEpisodesCount > 0
            ? cw.progress.totalEpisodesCount
            : (cw.show.numberOfEpisodes > 0 ? cw.show.numberOfEpisodes : 9999);
        final newWatchedCount =
            (cw.progress.watchedEpisodesCount + delta).clamp(0, totalCount);

        Episode? updatedNextEpisode;
        bool isCompleted = false;

        if (watched) {
          // Check if next episode exists in cached season
          final cachedSeason = _seasonCache[showId]?[seasonNumber];
          if (cachedSeason != null) {
            final nextInSeason = cachedSeason.episodes
                .where((e) => e.episodeNumber > episodeNumber && !e.isWatched)
                .firstOrNull;
            if (nextInSeason != null) {
              updatedNextEpisode = nextInSeason;
            }
          }

          // Fallback to episodeNumber + 1 if not finished
          if (updatedNextEpisode == null) {
            if (newWatchedCount < totalCount) {
              updatedNextEpisode = Episode(
                id: showId * 10000 + seasonNumber * 100 + (episodeNumber + 1),
                seasonNumber: seasonNumber,
                episodeNumber: episodeNumber + 1,
                name: 'Episode ${episodeNumber + 1}',
                isWatched: false,
              );
            } else {
              isCompleted = true;
              updatedNextEpisode = null;
            }
          }
        } else {
          updatedNextEpisode = Episode(
            id: showId * 10000 + seasonNumber * 100 + episodeNumber,
            seasonNumber: seasonNumber,
            episodeNumber: episodeNumber,
            name: 'Episode $episodeNumber',
            isWatched: false,
          );
        }

        final updatedCw = cw.copyWith(
          progress: cw.progress.copyWith(
            watchedEpisodesCount: newWatchedCount,
            lastWatched: watched
                ? LastWatchedEpisode(
                    seasonNumber: seasonNumber,
                    episodeNumber: episodeNumber,
                    watchedDate: DateTime.tryParse(dateStr),
                  )
                : null,
          ),
          nextEpisode: updatedNextEpisode,
          isCompleted: isCompleted,
        );

        _dashboard = _dashboard!.copyWith(currentlyWatching: updatedCw);
        _persistDashboardLocally();
      }
    }

    // 2. Optimistically mutate _seasonCache
    final cachedSeason = _seasonCache[showId]?[seasonNumber];
    if (cachedSeason != null) {
      final updatedEpisodes = cachedSeason.episodes.map((ep) {
        if (ep.episodeNumber != episodeNumber) return ep;
        return ep.copyWith(
          isWatched: watched,
          userRating: rating?.round().clamp(1, 10),
          watchedDate: DateTime.tryParse(dateStr),
        );
      }).toList();
      _seasonCache[showId]![seasonNumber] =
          cachedSeason.copyWith(episodes: updatedEpisodes);
    }

    // 3. Optimistically mutate local TV show if loaded in _tvShows
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    if (showIdx != -1) {
      final show = _tvShows[showIdx];
      final updatedSeasons = show.seasons.map((season) {
        if (season.seasonNumber != seasonNumber) return season;
        final updatedEpisodes = season.episodes.map((ep) {
          if (ep.episodeNumber != episodeNumber) return ep;
          return ep.copyWith(
            isWatched: watched,
            userRating: rating?.round().clamp(1, 10),
            watchedDate: DateTime.tryParse(dateStr),
          );
        }).toList();
        return season.copyWith(episodes: updatedEpisodes);
      }).toList();

      _tvShows[showIdx] = show.copyWith(seasons: updatedSeasons);
    }

    // 4. Notify listeners immediately - UI advances instantly on this frame
    notifyListeners();

    // 5. Enqueue persistent action
    final action = PendingAction.create(
      type: 'episode_watched',
      payload: {
        'showId': showId,
        'seasonNumber': seasonNumber,
        'episodeNumber': episodeNumber,
        'watched': watched,
        'rating': rating,
        'watchedDate': dateStr,
      },
    );
    await syncQueue.enqueue(action);

    // 6. Background push synchronization
    unawaited(_processSyncQueue());
  }

  /// Bulk mark season as watched
  Future<void> markSeasonWatched(int showId, int seasonNumber,
      {String? watchedDate}) async {
    final dateStr = watchedDate ?? DateTime.now().toIso8601String();

    // Optimistically mark all episodes in season cache as watched
    final cachedSeason = _seasonCache[showId]?[seasonNumber];
    if (cachedSeason != null) {
      final updatedEpisodes = cachedSeason.episodes.map((ep) {
        return ep.copyWith(
          isWatched: true,
          watchedDate: DateTime.tryParse(dateStr),
        );
      }).toList();
      _seasonCache[showId]![seasonNumber] =
          cachedSeason.copyWith(episodes: updatedEpisodes);
    }

    // Optimistically update _tvShows
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    if (showIdx != -1) {
      final show = _tvShows[showIdx];
      final updatedSeasons = show.seasons.map((season) {
        if (season.seasonNumber != seasonNumber) return season;
        final updatedEpisodes = season.episodes.map((ep) {
          return ep.copyWith(
            isWatched: true,
            watchedDate: DateTime.tryParse(dateStr),
          );
        }).toList();
        return season.copyWith(episodes: updatedEpisodes);
      }).toList();
      _tvShows[showIdx] = show.copyWith(seasons: updatedSeasons);
    }

    notifyListeners();

    final action = PendingAction.create(
      type: 'mark_season_watched',
      payload: {
        'showId': showId,
        'seasonNumber': seasonNumber,
        'watchedDate': dateStr,
      },
    );
    await syncQueue.enqueue(action);
    unawaited(_processSyncQueue());
  }

  /// Bulk mark show as watched
  Future<void> markShowWatched(int showId, {String? watchedDate}) async {
    final dateStr = watchedDate ?? DateTime.now().toIso8601String();

    // Mark all cached seasons for this show as watched
    final showCache = _seasonCache[showId];
    if (showCache != null) {
      for (final seasonNum in showCache.keys) {
        final season = showCache[seasonNum]!;
        final updatedEpisodes = season.episodes.map((ep) {
          return ep.copyWith(
            isWatched: true,
            watchedDate: DateTime.tryParse(dateStr),
          );
        }).toList();
        showCache[seasonNum] = season.copyWith(episodes: updatedEpisodes);
      }
    }

    // Update _tvShows
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    if (showIdx != -1) {
      final show = _tvShows[showIdx];
      final updatedSeasons = show.seasons.map((season) {
        final updatedEpisodes = season.episodes.map((ep) {
          return ep.copyWith(
            isWatched: true,
            watchedDate: DateTime.tryParse(dateStr),
          );
        }).toList();
        return season.copyWith(episodes: updatedEpisodes);
      }).toList();
      _tvShows[showIdx] = show.copyWith(seasons: updatedSeasons);
    }

    // Update _dashboard if featured show matches
    if (_dashboard != null && _dashboard!.currentlyWatching?.show.id == showId) {
      final cw = _dashboard!.currentlyWatching!;
      _dashboard = _dashboard!.copyWith(
        currentlyWatching: cw.copyWith(
          progress: cw.progress.copyWith(
            watchedEpisodesCount: cw.progress.totalEpisodesCount,
          ),
          nextEpisode: null,
          isCompleted: true,
        ),
      );
      _persistDashboardLocally();
    }

    notifyListeners();

    final action = PendingAction.create(
      type: 'mark_show_watched',
      payload: {
        'showId': showId,
        'watchedDate': dateStr,
      },
    );
    await syncQueue.enqueue(action);
    unawaited(_processSyncQueue());
  }

  /// Toggles TV show favorite
  Future<void> toggleTvFavorite(int showId) async {
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    if (showIdx != -1) {
      final nextFav = !_tvShows[showIdx].isFavorite;
      _tvShows[showIdx] = _tvShows[showIdx].copyWith(isFavorite: nextFav);
      notifyListeners();

      final action = PendingAction.create(
        type: 'toggle_tv_favorite',
        payload: {
          'showId': showId,
          'isFavorite': nextFav,
        },
      );
      await syncQueue.enqueue(action);
      unawaited(_processSyncQueue());
    }
  }

  /// Toggles TV show watchlist
  Future<void> toggleTvWatchlist(int showId) async {
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    if (showIdx != -1) {
      final nextWatch = !_tvShows[showIdx].inWatchlist;
      _tvShows[showIdx] = _tvShows[showIdx].copyWith(inWatchlist: nextWatch);
      notifyListeners();

      final action = PendingAction.create(
        type: 'toggle_tv_watchlist',
        payload: {
          'showId': showId,
        },
      );
      await syncQueue.enqueue(action);
      unawaited(_processSyncQueue());
    }
  }

  /// Process pending offline actions if connected to live API
  Future<void> _processSyncQueue() async {
    if (_api is CineTrackerApi) {
      final count = await syncQueue.processQueue(_api as CineTrackerApi);
      if (count > 0) {
        unawaited(refreshDashboard(silent: true));
        unawaited(refreshDiary(silent: true));
      }
    }
  }

  // Detail queries delegating directly to API
  Future<MovieDetail> getMovieDetail(int movieId) =>
      _api.getMovieDetail(movieId);
  Future<TvShowDetail> getTvShowDetail(int showId) =>
      _api.getTvShowDetail(showId);
}
