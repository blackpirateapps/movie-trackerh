import '../../models/user.dart';
import '../../models/movie.dart';
import '../../models/tv_show.dart';
import '../../models/search_result.dart';
import '../../models/user_stats.dart';
import '../../models/dashboard_data.dart';
import '../../models/api_key.dart';
import '../../models/diary_entry.dart';
import '../../models/api_models.dart';

/// Abstract contract for CineTracker API operations, implemented by
/// both [CineTrackerApi] (live REST) and [MockCineTrackerService] (hermetic in-memory mock).
abstract class CineTrackerApiInterface {
  // Session & Authentication
  String? get currentUsername;
  Future<User?> checkSession();
  Future<AuthResult> login({required String email, required String password});
  Future<AuthResult> signup(
      {required String username,
      required String email,
      required String password});
  Future<void> logout();

  // Dashboard & Home
  Future<DashboardData> getDashboard({int? tvShowId, bool refresh = false});

  // Search
  Future<List<SearchResult>> search(String query, {String type = 'all'});

  // Analytics & Stats
  Future<UserStats> getStats({
    String? username,
    String timeframe = 'all',
    int? year,
    int? month,
    String? since,
    String? until,
    String media = 'all',
    bool refresh = false,
  });

  // Movies
  Future<List<Movie>> getMovies({bool? watchlist, bool? favorite});
  Future<MovieDetail> getMovieDetail(int movieId);
  Future<void> logMovie(
    int movieId, {
    required double rating,
    String? review,
    String? watchedWhere,
    DateTime? watchedDate,
  });
  Future<bool> toggleMovieWatchlist(int movieId);
  Future<void> setMovieWatchlist(int movieId, bool inWatchlist);
  Future<void> setMovieFavorite(int movieId, bool isFavorite);

  // TV Shows & Episodes
  Future<List<TvShow>> getTvShows({bool? watchlist, bool? favorite});
  Future<TvShowDetail> getTvShowDetail(int showId);
  Future<SeasonDetail> getSeasonDetail(int showId, int seasonNumber);
  Future<void> toggleEpisodeWatched(
    int showId,
    int seasonNumber,
    int episodeNumber,
    bool watched, {
    double? rating,
    String? watchedDate,
  });
  Future<void> markSeasonWatched(int showId, int seasonNumber,
      {String? watchedDate});
  Future<void> markShowWatched(int showId, {String? watchedDate});
  Future<bool> toggleTvFavorite(int showId, {bool? isFavorite});
  Future<bool> toggleTvWatchlist(int showId);

  // Diary & Social
  Future<List<DiaryEntry>> getDiary();
  Future<UserProfile> getUserProfile(String username);

  // Developer API Keys
  Future<List<ApiKey>> getApiKeys();
  Future<ApiKeyCreateResult> createApiKey({String? name});
  Future<void> revokeApiKey(int keyId);

  // Import / Export
  Future<BatchImportResult> importLetterboxdCsv(String csvContent);
  Future<DataExportResult> exportData({String? include, String? since});
}
