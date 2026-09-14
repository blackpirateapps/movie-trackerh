import '../../core/constants/api_constants.dart';
import '../../core/utils/serialization_helpers.dart';
import '../../models/user.dart';
import '../../models/movie.dart';
import '../../models/tv_show.dart';
import '../../models/search_result.dart';
import '../../models/user_stats.dart';
import '../../models/dashboard_data.dart';
import '../../models/api_key.dart';
import '../../models/diary_entry.dart';
import '../../models/api_models.dart';
import 'api_client.dart';
import 'api_interface.dart';

/// Live REST API client connecting to the CineTracker backend.
class CineTrackerApi implements CineTrackerApiInterface {
  final ApiClient _client;
  String? _currentUsername;

  CineTrackerApi(this._client);

  ApiClient get client => _client;

  @override
  String? get currentUsername => _currentUsername;

  @override
  Future<User?> checkSession() async {
    try {
      final res = await _client.get(ApiConstants.auth);
      if (res is Map && res['user'] != null) {
        final user = User.fromJson(Map<String, dynamic>.from(res['user'] as Map));
        _currentUsername = user.username;
        return user;
      }
      return null;
    } on UnauthorizedException {
      return null;
    }
  }

  @override
  Future<AuthResult> login(
      {required String email, required String password}) async {
    final res = await _client.post(ApiConstants.auth, body: {
      'action': 'login',
      'email': email,
      'password': password,
    });
    final user = User.fromJson(Map<String, dynamic>.from(res['user'] as Map));
    _currentUsername = user.username;
    final token = (res is Map && res['token'] != null)
        ? res['token'].toString()
        : _client.sessionToken;
    if (token != null && token.isNotEmpty) {
      _client.setSessionToken(token);
    }
    final message = res['message']?.toString() ?? 'Login successful!';
    return AuthResult(
        user: user, token: token, message: message);
  }

  @override
  Future<AuthResult> signup({
    required String username,
    required String email,
    required String password,
  }) async {
    final res = await _client.post(ApiConstants.auth, body: {
      'action': 'signup',
      'username': username,
      'email': email,
      'password': password,
    });
    final user = User.fromJson(Map<String, dynamic>.from(res['user'] as Map));
    _currentUsername = user.username;
    final token = (res is Map && res['token'] != null)
        ? res['token'].toString()
        : _client.sessionToken;
    if (token != null && token.isNotEmpty) {
      _client.setSessionToken(token);
    }
    final message = res['message']?.toString() ?? 'Signup successful!';
    return AuthResult(
        user: user, token: token, message: message);
  }

  @override
  Future<void> logout() async {
    try {
      await _client.post(ApiConstants.auth, body: {'action': 'logout'});
    } finally {
      _currentUsername = null;
    }
  }

  @override
  Future<DashboardData> getDashboard(
      {int? tvShowId, bool refresh = false}) async {
    final query = <String, dynamic>{};
    if (tvShowId != null) query['tvShowId'] = tvShowId;
    if (refresh) query['refresh'] = 'true';

    final res = await _client.get(ApiConstants.dashboard, queryParams: query);
    return DashboardData.fromJson(Map<String, dynamic>.from(res as Map));
  }

  @override
  Future<List<SearchResult>> search(String query, {String type = 'all'}) async {
    final res = await _client.get(ApiConstants.search, queryParams: {
      'q': query,
      'type': type,
    });
    if (res is List) {
      return res
          .map((item) =>
              SearchResult.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    }
    return [];
  }

  @override
  Future<UserStats> getStats({
    String? username,
    String timeframe = 'all',
    int? year,
    int? month,
    String? since,
    String? until,
    String media = 'all',
    bool refresh = false,
  }) async {
    var tf = timeframe;
    if (tf == 'year') tf = 'yearly';
    if (tf == 'month') tf = 'monthly';
    if (tf == 'week') tf = 'weekly';

    var med = media;
    if (med == 'movies') med = 'movie';

    final query = <String, dynamic>{
      'timeframe': tf,
      'media': med,
    };
    if (username != null) query['username'] = username;
    if (year != null) query['year'] = year;
    if (month != null) query['month'] = month;
    if (since != null) query['since'] = since;
    if (until != null) query['until'] = until;
    if (refresh) query['refresh'] = 'true';

    final res = await _client.get(ApiConstants.stats, queryParams: query);
    return UserStats.fromJson(Map<String, dynamic>.from(res as Map));
  }

  @override
  Future<List<Movie>> getMovies({bool? watchlist, bool? favorite}) async {
    final query = <String, dynamic>{};
    if (watchlist != null) query['watchlist'] = watchlist.toString();
    if (favorite != null) query['favorite'] = favorite.toString();

    try {
      final res = await _client.get(ApiConstants.movies, queryParams: query);
      if (res is List) {
        return res
            .map((m) => Movie.fromJson(Map<String, dynamic>.from(m as Map)))
            .toList();
      }
    } catch (_) {
      // Resilient fallback: fetch from user profile if /api/movies without id/query returns 400
      if (_currentUsername != null) {
        final userRes = await _client.get(
          ApiConstants.user,
          queryParams: {'username': _currentUsername!},
        );
        if (userRes is Map) {
          if (watchlist == true) {
            final items = userRes['watchlist'];
            if (items is List) {
              return items
                  .map((m) => Movie.fromJson(Map<String, dynamic>.from(m as Map)))
                  .toList();
            }
          } else {
            final items = userRes['movies'];
            if (items is List) {
              var list = items
                  .map((m) => Movie.fromJson(Map<String, dynamic>.from(m as Map)))
                  .toList();
              if (favorite == true) {
                list = list.where((m) => m.isFavorite).toList();
              }
              return list;
            }
          }
        }
      }
    }
    return [];
  }

  @override
  Future<MovieDetail> getMovieDetail(int movieId) async {
    final res = await _client
        .get(ApiConstants.movies, queryParams: {'id': movieId.toString()});
    return MovieDetail.fromJson(Map<String, dynamic>.from(res as Map));
  }

  @override
  Future<void> logMovie(
    int movieId, {
    required double rating,
    String? review,
    String? watchedWhere,
    DateTime? watchedDate,
  }) async {
    final body = <String, dynamic>{
      'movieId': movieId,
      'rating': rating,
    };
    if (review != null) body['review'] = review;
    if (watchedWhere != null) body['watchedWhere'] = watchedWhere;
    if (watchedDate != null) {
      body['watchedDate'] = SerializationHelpers.formatDateOnly(watchedDate);
    }
    await _client.post(ApiConstants.movies, body: body);
  }

  @override
  Future<bool> toggleMovieWatchlist(int movieId) async {
    final res = await _client.post(ApiConstants.movies, body: {
      'action': 'watchlist',
      'movieId': movieId,
    });
    if (res is Map && res['isInWatchlist'] != null) {
      return res['isInWatchlist'] == true;
    }
    return false;
  }

  @override
  Future<void> setMovieWatchlist(int movieId, bool inWatchlist) async {
    await _client.post(ApiConstants.movies, body: {
      'action': 'watchlist',
      'movieId': movieId,
      'inWatchlist': inWatchlist,
    });
  }

  @override
  Future<void> setMovieFavorite(int movieId, bool isFavorite) async {
    await _client.post(ApiConstants.movies, body: {
      'action': 'favorite',
      'movieId': movieId,
      'isFavorite': isFavorite,
    });
  }

  @override
  Future<List<TvShow>> getTvShows({bool? watchlist, bool? favorite}) async {
    final query = <String, dynamic>{};
    if (watchlist != null) query['watchlist'] = watchlist.toString();
    if (favorite != null) query['favorite'] = favorite.toString();

    try {
      final res = await _client.get(ApiConstants.tv, queryParams: query);
      if (res is List) {
        return res
            .map((s) => TvShow.fromJson(Map<String, dynamic>.from(s as Map)))
            .toList();
      }
    } catch (_) {
      // Resilient fallback: fetch from user profile if /api/tv without id/query returns 400
      if (_currentUsername != null) {
        final userRes = await _client.get(
          ApiConstants.user,
          queryParams: {'username': _currentUsername!},
        );
        if (userRes is Map) {
          final items = userRes['tvShows'];
          if (items is List) {
            var list = items
                .map((s) => TvShow.fromJson(Map<String, dynamic>.from(s as Map)))
                .toList();
            if (favorite == true) {
              list = list.where((s) => s.isFavorite).toList();
            }
            return list;
          }
        }
      }
    }
    return [];
  }

  @override
  Future<TvShowDetail> getTvShowDetail(int showId) async {
    final res = await _client
        .get(ApiConstants.tv, queryParams: {'id': showId.toString()});
    return TvShowDetail.fromJson(Map<String, dynamic>.from(res as Map));
  }

  @override
  Future<SeasonDetail> getSeasonDetail(int showId, int seasonNumber) async {
    final res = await _client.get(ApiConstants.tv, queryParams: {
      'id': showId.toString(),
      'season': seasonNumber.toString(),
    });
    return SeasonDetail.fromJson(Map<String, dynamic>.from(res as Map),
        showId: showId);
  }

  @override
  Future<void> toggleEpisodeWatched(
    int showId,
    int seasonNumber,
    int episodeNumber,
    bool watched, {
    double? rating,
    String? watchedDate,
  }) async {
    final body = <String, dynamic>{
      'action': 'episode_watched',
      'tvShowId': showId,
      'seasonNumber': seasonNumber,
      'episodeNumber': episodeNumber,
      'watched': watched,
    };
    if (rating != null) body['rating'] = rating;
    if (watchedDate != null) body['watchedDate'] = watchedDate;

    await _client.post(ApiConstants.tv, body: body);
  }

  @override
  Future<void> markSeasonWatched(int showId, int seasonNumber,
      {String? watchedDate}) async {
    final body = <String, dynamic>{
      'action': 'mark_season_watched',
      'tvShowId': showId,
      'seasonNumber': seasonNumber,
    };
    if (watchedDate != null) body['watchedDate'] = watchedDate;

    await _client.post(ApiConstants.tv, body: body);
  }

  @override
  Future<void> markShowWatched(int showId, {String? watchedDate}) async {
    final body = <String, dynamic>{
      'action': 'mark_show_watched',
      'tvShowId': showId,
    };
    if (watchedDate != null) body['watchedDate'] = watchedDate;

    await _client.post(ApiConstants.tv, body: body);
  }

  @override
  Future<bool> toggleTvFavorite(int showId, {bool? isFavorite}) async {
    final body = <String, dynamic>{
      'action': 'favorite',
      'tvShowId': showId,
    };
    if (isFavorite != null) body['isFavorite'] = isFavorite;

    final res = await _client.post(ApiConstants.tv, body: body);
    if (res is Map && res['isFavorite'] != null) {
      return res['isFavorite'] == true;
    }
    return false;
  }

  @override
  Future<bool> toggleTvWatchlist(int showId) async {
    final res = await _client.post(ApiConstants.tv, body: {
      'action': 'watchlist',
      'tvShowId': showId,
    });
    if (res is Map && res['isInWatchlist'] != null) {
      return res['isInWatchlist'] == true;
    }
    return false;
  }

  @override
  Future<List<DiaryEntry>> getDiary() async {
    try {
      final res = await _client.get('${ApiConstants.user}/diary');
      if (res is List) {
        return res
            .map((e) => DiaryEntry.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
    } catch (_) {
      // Fallback: /api/user?action=feed returns chronological watch history
      try {
        final feedRes = await _client.get(
          ApiConstants.user,
          queryParams: {'action': 'feed'},
        );
        if (feedRes is List) {
          return feedRes
              .map((e) => DiaryEntry.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList();
        }
      } catch (_) {
        // Further fallback: recentActivity from user profile
        if (_currentUsername != null) {
          final userRes = await _client.get(
            ApiConstants.user,
            queryParams: {'username': _currentUsername!},
          );
          if (userRes is Map && userRes['recentActivity'] is List) {
            return (userRes['recentActivity'] as List)
                .map((e) => DiaryEntry.fromJson(Map<String, dynamic>.from(e as Map)))
                .toList();
          }
        }
      }
    }
    return [];
  }

  @override
  Future<UserProfile> getUserProfile(String username) async {
    final res = await _client
        .get(ApiConstants.user, queryParams: {'username': username});
    return UserProfile.fromJson(Map<String, dynamic>.from(res as Map));
  }

  @override
  Future<List<ApiKey>> getApiKeys() async {
    final res = await _client.get(ApiConstants.keys);
    if (res is List) {
      return res
          .map((k) => ApiKey.fromJson(Map<String, dynamic>.from(k as Map)))
          .toList();
    } else if (res is Map && res['keys'] is List) {
      return (res['keys'] as List)
          .map((k) => ApiKey.fromJson(Map<String, dynamic>.from(k as Map)))
          .toList();
    }
    return [];
  }

  @override
  Future<ApiKeyCreateResult> createApiKey({String? name}) async {
    final body = <String, dynamic>{'action': 'create'};
    if (name != null) body['name'] = name;

    final res = await _client.post(ApiConstants.keys, body: body);
    return ApiKeyCreateResult.fromJson(Map<String, dynamic>.from(res as Map));
  }

  @override
  Future<void> revokeApiKey(int keyId) async {
    await _client.post(ApiConstants.keys, body: {
      'action': 'revoke',
      'keyId': keyId,
    });
  }

  @override
  Future<BatchImportResult> importLetterboxdCsv(String csvContent) async {
    final res = await _client.post(ApiConstants.importCsv, body: {
      'csv': csvContent,
    });
    return BatchImportResult.fromJson(Map<String, dynamic>.from(res as Map));
  }

  @override
  Future<DataExportResult> exportData({String? include, String? since}) async {
    final query = <String, dynamic>{};
    if (include != null) query['include'] = include;
    if (since != null) query['since'] = since;

    final res = await _client.get(ApiConstants.exportData, queryParams: query);
    return DataExportResult(format: 'json', data: res);
  }
}
