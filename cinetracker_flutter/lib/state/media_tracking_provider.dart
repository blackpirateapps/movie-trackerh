import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/api/api_interface.dart';
import '../models/movie.dart';
import '../models/tv_show.dart';
import '../models/episode.dart';
import '../models/dashboard_data.dart';
import '../models/diary_entry.dart';
import '../models/api_models.dart';

/// Provider that manages movie and TV tracking state, optimistic updates,
/// watchlist, favorites, diary, and dashboard progression.
class MediaTrackingProvider extends ChangeNotifier {
  final CineTrackerApiInterface api;
  CineTrackerApiInterface get _api => api;

  bool _isLoading = false;
  String? _errorMessage;
  DashboardData? _dashboard;
  List<Movie> _movies = [];
  List<TvShow> _tvShows = [];
  List<DiaryEntry> _diary = [];

  MediaTrackingProvider({required this.api});

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  DashboardData? get dashboard => _dashboard;
  List<Movie> get movies => _movies;
  List<TvShow> get tvShows => _tvShows;
  List<DiaryEntry> get diary => _diary;

  // Convenient filtered getters
  TvShow? get featuredShow => _dashboard?.featuredShow;
  Episode? get nextEpisode => _dashboard?.nextEpisode;
  List<TvShowSummary> get otherActiveShows =>
      _dashboard?.otherActiveShows ?? const [];
  List<Movie> get lastWatchedMovies =>
      _dashboard?.lastWatchedMovies ?? const [];

  List<Movie> get watchedMovies =>
      _movies.where((m) => m.isWatched).toList();
  List<Movie> get watchlistMovies =>
      _movies.where((m) => m.inWatchlist).toList();
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

  /// Initial multi-resource load
  Future<void> loadInitialData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _api.getDashboard(refresh: true),
        _api.getMovies(),
        _api.getTvShows(),
        _api.getDiary(),
      ]);

      _dashboard = results[0] as DashboardData;
      _movies = results[1] as List<Movie>;
      _tvShows = results[2] as List<TvShow>;
      _diary = results[3] as List<DiaryEntry>;
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
    }

    notifyListeners();

    // 3. Remote synchronization
    try {
      await _api.logMovie(
        movieId,
        rating: rating,
        review: review,
        watchedWhere: watchedWhere,
        watchedDate: effectiveDate,
      );
      // Background sync diary and movies
      unawaited(refreshDiary(silent: true));
    } catch (e) {
      // Revert if error or log
      _errorMessage = 'Failed to log movie: $e';
      notifyListeners();
    }
  }

  /// Optimistically toggles movie watchlist status
  Future<void> toggleMovieWatchlist(int movieId) async {
    final movieIdx = _movies.indexWhere((m) => m.id == movieId);
    if (movieIdx != -1) {
      final current = _movies[movieIdx].inWatchlist;
      _movies[movieIdx] = _movies[movieIdx].copyWith(inWatchlist: !current);
      notifyListeners();
    }

    try {
      await _api.toggleMovieWatchlist(movieId);
    } catch (e) {
      // Revert on error
      if (movieIdx != -1) {
        final current = _movies[movieIdx].inWatchlist;
        _movies[movieIdx] = _movies[movieIdx].copyWith(inWatchlist: !current);
        notifyListeners();
      }
    }
  }

  /// Optimistically toggles movie favorite status
  Future<void> toggleMovieFavorite(int movieId) async {
    final movieIdx = _movies.indexWhere((m) => m.id == movieId);
    if (movieIdx != -1) {
      final nextFav = !_movies[movieIdx].isFavorite;
      _movies[movieIdx] = _movies[movieIdx].copyWith(isFavorite: nextFav);
      notifyListeners();

      try {
        await _api.setMovieFavorite(movieId, nextFav);
      } catch (e) {
        _movies[movieIdx] = _movies[movieIdx].copyWith(isFavorite: !nextFav);
        notifyListeners();
      }
    }
  }

  /// Optimistically toggles episode watched state
  Future<void> toggleEpisodeWatched(
    int showId,
    int seasonNumber,
    int episodeNumber,
    bool watched, {
    double? rating,
    String? watchedDate,
  }) async {
    // 1. Optimistically mutate local TV show if loaded
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
            watchedDate: watchedDate != null ? DateTime.tryParse(watchedDate) : null,
          );
        }).toList();
        return season.copyWith(episodes: updatedEpisodes);
      }).toList();

      _tvShows[showIdx] = show.copyWith(seasons: updatedSeasons);
    }

    notifyListeners();

    // 2. Remote synchronization
    try {
      await _api.toggleEpisodeWatched(
        showId,
        seasonNumber,
        episodeNumber,
        watched,
        rating: rating,
        watchedDate: watchedDate,
      );
      // Resync dashboard and diary silently
      unawaited(refreshDashboard(silent: true));
      unawaited(refreshDiary(silent: true));
    } catch (e) {
      _errorMessage = 'Failed to update episode: $e';
      notifyListeners();
    }
  }

  /// Bulk mark season as watched
  Future<void> markSeasonWatched(int showId, int seasonNumber,
      {String? watchedDate}) async {
    try {
      await _api.markSeasonWatched(showId, seasonNumber,
          watchedDate: watchedDate);
      await refreshDashboard(silent: true);
      await refreshTvShows(silent: true);
      await refreshDiary(silent: true);
    } catch (e) {
      _errorMessage = 'Failed to mark season watched: $e';
      notifyListeners();
    }
  }

  /// Bulk mark show as watched
  Future<void> markShowWatched(int showId, {String? watchedDate}) async {
    try {
      await _api.markShowWatched(showId, watchedDate: watchedDate);
      await refreshDashboard(silent: true);
      await refreshTvShows(silent: true);
      await refreshDiary(silent: true);
    } catch (e) {
      _errorMessage = 'Failed to mark show watched: $e';
      notifyListeners();
    }
  }

  /// Toggles TV show favorite
  Future<void> toggleTvFavorite(int showId) async {
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    if (showIdx != -1) {
      final nextFav = !_tvShows[showIdx].isFavorite;
      _tvShows[showIdx] = _tvShows[showIdx].copyWith(isFavorite: nextFav);
      notifyListeners();

      try {
        await _api.toggleTvFavorite(showId, isFavorite: nextFav);
      } catch (e) {
        _tvShows[showIdx] = _tvShows[showIdx].copyWith(isFavorite: !nextFav);
        notifyListeners();
      }
    }
  }

  /// Toggles TV show watchlist
  Future<void> toggleTvWatchlist(int showId) async {
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    if (showIdx != -1) {
      final nextWatch = !_tvShows[showIdx].inWatchlist;
      _tvShows[showIdx] = _tvShows[showIdx].copyWith(inWatchlist: nextWatch);
      notifyListeners();

      try {
        await _api.toggleTvWatchlist(showId);
      } catch (e) {
        _tvShows[showIdx] = _tvShows[showIdx].copyWith(inWatchlist: !nextWatch);
        notifyListeners();
      }
    }
  }

  // Detail queries delegating directly to API
  Future<MovieDetail> getMovieDetail(int movieId) =>
      _api.getMovieDetail(movieId);
  Future<TvShowDetail> getTvShowDetail(int showId) =>
      _api.getTvShowDetail(showId);
  Future<SeasonDetail> getSeasonDetail(int showId, int seasonNumber) =>
      _api.getSeasonDetail(showId, seasonNumber);
}
