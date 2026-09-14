import '../../core/utils/csv_parser.dart';
import '../../core/utils/serialization_helpers.dart';
import '../../models/user.dart';
import '../../models/movie.dart';
import '../../models/tv_show.dart';
import '../../models/season.dart';
import '../../models/episode.dart';
import '../../models/search_result.dart';
import '../../models/user_stats.dart';
import '../../models/dashboard_data.dart';
import '../../models/api_key.dart';
import '../../models/diary_entry.dart';
import '../../models/api_models.dart';
import 'api_interface.dart';

/// In-memory stateful mock service providing deterministic seed data
/// (Severance, Dune: Part Two, Ted Lasso, The Bear, Succession, 2026 stats, diary, watchlist)
/// with full local mutation support for testing & offline execution.
class MockCineTrackerService implements CineTrackerApiInterface {
  late User _currentUser;
  late List<Movie> _movies;
  late List<TvShow> _tvShows;
  late Map<int, Map<int, SeasonDetail>> _seasonDetails;
  late DashboardData _dashboard;
  late UserStats _stats;
  late List<DiaryEntry> _diary;
  late List<ApiKey> _apiKeys;

  @override
  String? get currentUsername => _currentUser.username;

  MockCineTrackerService() {
    resetToSeedData();
  }

  void resetToSeedData() {
    _currentUser = User(
      id: 1,
      username: 'alex_cinephile',
      email: 'alex@cinetracker.app',
      displayName: 'Alex Rivers',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      bio: 'Cinephile & TV enthusiast. Apple ecosystem purist.',
      createdAt: DateTime.parse('2024-01-15T00:00:00Z'),
    );

    _initMovies();
    _initTvShows();
    _initDashboard();
    _initStats();
    _initDiary();
    _initApiKeys();
  }

  void _initMovies() {
    _movies = [
      Movie(
        id: 693134,
        title: 'Dune: Part Two',
        overview:
            'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        releaseDate: DateTime(2024, 2, 27),
        posterPath: '/1pdfLvkZt9T9SDA52d5q5.jpg',
        backdropPath: '/xOMo8BRK7PfcBuilDy9.jpg',
        voteAverage: 8.2,
        runtime: 166,
        isFavorite: true,
        inWatchlist: false,
        userRating: 10,
        review:
            'Denis Villeneuve delivers an absolute cinematic masterwork. Visuals, sound design, and pacing are unmatched.',
        watchedWhere: const ['Cinema', 'Apple TV'],
        watchedDate: DateTime(2026, 9, 8),
      ),
      Movie(
        id: 872585,
        title: 'Oppenheimer',
        overview:
            'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II.',
        releaseDate: DateTime(2023, 7, 19),
        posterPath: '/8Gxv8gSFCU0XGDykEGv7z.jpg',
        backdropPath: '/rLb2cwF3Pazuxaj0s9.jpg',
        voteAverage: 8.1,
        runtime: 180,
        isFavorite: true,
        inWatchlist: false,
        userRating: 9,
        review:
            'A breathless technical marvel anchored by Cillian Murphy’s career-best performance.',
        watchedWhere: const ['Cinema'],
        watchedDate: DateTime(2026, 8, 14),
      ),
      Movie(
        id: 666277,
        title: 'Past Lives',
        overview:
            'Nora and Hae Sung, two deeply connected childhood friends, are wrested apart after Nora\'s family emigrates from South Korea.',
        releaseDate: DateTime(2023, 6, 2),
        posterPath: '/k3waqVXSnvCZWfJYNtdam.jpg',
        backdropPath: '/5YZbUmjbMa3ClvSW1W.jpg',
        voteAverage: 7.9,
        runtime: 106,
        isFavorite: true,
        inWatchlist: false,
        userRating: 9,
        review: 'Heartbreakingly tender portrait of longing and fate.',
        watchedWhere: const ['Apple TV'],
        watchedDate: DateTime(2026, 7, 20),
      ),
      Movie(
        id: 937287,
        title: 'Challengers',
        overview:
            'Tennis player-turned-coach Tashi has taken her husband Art and transformed him into a world-famous Grand Slam champion.',
        releaseDate: DateTime(2024, 4, 26),
        posterPath: '/H6vquwfKHKBLzVz.jpg',
        backdropPath: '/ga4olm4.jpg',
        voteAverage: 7.3,
        runtime: 131,
        isFavorite: false,
        inWatchlist: true,
      ),
      Movie(
        id: 915935,
        title: 'Anatomy of a Fall',
        overview:
            'A woman is suspected of her husband\'s murder, and their blind son faces a moral dilemma as the main witness.',
        releaseDate: DateTime(2023, 8, 23),
        posterPath: '/5fuh9v.jpg',
        voteAverage: 7.6,
        runtime: 152,
        isFavorite: false,
        inWatchlist: true,
      ),
      Movie(
        id: 157336,
        title: 'Interstellar',
        overview:
            'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
        releaseDate: DateTime(2014, 11, 5),
        posterPath: '/gEU2QniE6E77NI6Bl.jpg',
        voteAverage: 8.4,
        runtime: 169,
        isFavorite: true,
        inWatchlist: true,
      ),
    ];
  }

  void _initTvShows() {
    _seasonDetails = {};

    // 1. Severance (ID: 110492)
    final severanceS1Episodes = List.generate(
      9,
      (i) => Episode(
        id: 110492100 + i + 1,
        seasonNumber: 1,
        episodeNumber: i + 1,
        name: i == 8 ? 'The We We Are' : 'Episode ${i + 1}',
        overview: i == 8
            ? 'The team discovers the shocking truth on the outside world.'
            : 'Mark and his coworkers perform mysterious tasks on the severed floor.',
        airDate: DateTime(2022, 2, 18).add(Duration(days: i * 7)),
        runtime: 50,
        isWatched: true,
        userRating: i == 8 ? 10 : 9,
        watchedDate: DateTime(2026, 9, 12),
      ),
    );

    final severanceS2Episodes = [
      Episode(
        id: 110492201,
        seasonNumber: 2,
        episodeNumber: 1,
        name: 'The Aftermath',
        overview:
            'Mark and Dylan process the alarming revelations of the Overtime Contingency.',
        airDate: DateTime(2026, 9, 19),
        runtime: 54,
        isWatched: false,
      ),
      Episode(
        id: 110492202,
        seasonNumber: 2,
        episodeNumber: 2,
        name: 'Goodbye Mrs. Selvig',
        overview: 'Mark and the team discover a new tier in Lumon Industries.',
        airDate: DateTime(2026, 9, 26),
        runtime: 52,
        isWatched: false,
      ),
      ...List.generate(
        8,
        (i) => Episode(
          id: 110492203 + i,
          seasonNumber: 2,
          episodeNumber: i + 3,
          name: 'Season 2 Episode ${i + 3}',
          airDate: DateTime(2026, 10, 3).add(Duration(days: i * 7)),
          runtime: 50,
          isWatched: false,
        ),
      ),
    ];

    _seasonDetails[110492] = {
      1: SeasonDetail(
        id: 110492001,
        seasonNumber: 1,
        name: 'Season 1',
        episodes: severanceS1Episodes,
      ),
      2: SeasonDetail(
        id: 110492002,
        seasonNumber: 2,
        name: 'Season 2',
        episodes: severanceS2Episodes,
      ),
    };

    final severanceSeasons = [
      Season(
        id: 110492001,
        seasonNumber: 1,
        name: 'Season 1',
        episodeCount: 9,
        episodes: severanceS1Episodes,
      ),
      Season(
        id: 110492002,
        seasonNumber: 2,
        name: 'Season 2',
        episodeCount: 10,
        episodes: severanceS2Episodes,
      ),
    ];

    final severance = TvShow(
      id: 110492,
      name: 'Severance',
      overview:
          'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
      firstAirDate: DateTime(2022, 2, 18),
      posterPath: '/severance.jpg',
      backdropPath: '/severance_bg.jpg',
      voteAverage: 8.4,
      numberOfSeasons: 2,
      numberOfEpisodes: 19,
      isFavorite: true,
      inWatchlist: false,
      userRating: 10,
      status: 'Returning Series',
      seasons: severanceSeasons,
      watchedWhere: const ['Apple TV+'],
    );

    // 2. The Bear (ID: 136283)
    final theBearS1Episodes = List.generate(
      8,
      (i) => Episode(
        id: 136283100 + i + 1,
        seasonNumber: 1,
        episodeNumber: i + 1,
        name: 'Episode ${i + 1}',
        runtime: 32,
        isWatched: true,
        userRating: 9,
      ),
    );
    final theBearS2Episodes = List.generate(
      10,
      (i) => Episode(
        id: 136283200 + i + 1,
        seasonNumber: 2,
        episodeNumber: i + 1,
        name: 'Episode ${i + 1}',
        runtime: 32,
        isWatched: true,
        userRating: 9,
      ),
    );
    final theBearS3Episodes = List.generate(
      10,
      (i) => Episode(
        id: 136283300 + i + 1,
        seasonNumber: 3,
        episodeNumber: i + 1,
        name: 'Episode ${i + 1}',
        runtime: 32,
        isWatched: false,
        userRating: null,
      ),
    );

    final theBearSeasons = [
      Season(
        id: 136283001,
        seasonNumber: 1,
        name: 'Season 1',
        episodeCount: 8,
        episodes: theBearS1Episodes,
      ),
      Season(
        id: 136283002,
        seasonNumber: 2,
        name: 'Season 2',
        episodeCount: 10,
        episodes: theBearS2Episodes,
      ),
      Season(
        id: 136283003,
        seasonNumber: 3,
        name: 'Season 3',
        episodeCount: 10,
        episodes: theBearS3Episodes,
      ),
    ];

    _seasonDetails[136283] = {
      1: SeasonDetail(
        id: 136283001,
        seasonNumber: 1,
        name: 'Season 1',
        episodes: theBearS1Episodes,
      ),
      2: SeasonDetail(
        id: 136283002,
        seasonNumber: 2,
        name: 'Season 2',
        episodes: theBearS2Episodes,
      ),
      3: SeasonDetail(
        id: 136283003,
        seasonNumber: 3,
        name: 'Season 3',
        episodes: theBearS3Episodes,
      ),
    };

    final theBear = TvShow(
      id: 136283,
      name: 'The Bear',
      overview:
          'A young chef from the fine dining world comes home to Chicago to run his family Italian beef sandwich shop.',
      firstAirDate: DateTime(2022, 6, 23),
      posterPath: '/the_bear.jpg',
      voteAverage: 8.6,
      numberOfSeasons: 3,
      numberOfEpisodes: 28,
      isFavorite: true,
      userRating: 9,
      status: 'Returning Series',
      seasons: theBearSeasons,
      watchedWhere: const ['Disney+', 'Hulu'],
    );

    // 3. Ted Lasso (ID: 97546)
    final tedLasso = TvShow(
      id: 97546,
      name: 'Ted Lasso',
      overview:
          'An American college football coach heads to the UK to manage a struggling British football club.',
      firstAirDate: DateTime(2020, 8, 14),
      posterPath: '/ted_lasso.jpg',
      voteAverage: 8.5,
      numberOfSeasons: 3,
      numberOfEpisodes: 34,
      isFavorite: true,
      userRating: 9,
      status: 'Ended',
      watchedWhere: const ['Apple TV+'],
    );

    // 4. Succession (ID: 76331)
    final succession = TvShow(
      id: 76331,
      name: 'Succession',
      overview:
          'The Roy family is known for controlling the biggest media and entertainment company in the world.',
      firstAirDate: DateTime(2018, 6, 3),
      posterPath: '/succession.jpg',
      voteAverage: 8.9,
      numberOfSeasons: 4,
      numberOfEpisodes: 39,
      isFavorite: true,
      userRating: 10,
      status: 'Ended',
      watchedWhere: const ['Max'],
    );

    _tvShows = [severance, theBear, tedLasso, succession];

    // Ensure all shows with seasons are populated in _seasonDetails
    for (final show in _tvShows) {
      if (show.seasons.isNotEmpty && !_seasonDetails.containsKey(show.id)) {
        _seasonDetails[show.id] = {
          for (final s in show.seasons)
            s.seasonNumber: SeasonDetail(
              id: s.id,
              seasonNumber: s.seasonNumber,
              name: s.name,
              episodes: s.episodes,
            ),
        };
      }
    }
  }

  void _initDashboard() {
    final severance = _tvShows.firstWhere((s) => s.id == 110492);
    final s2e1 = _seasonDetails[110492]?[2]?.episodes.first;

    final currentlyWatching = CurrentlyWatching(
      show: severance,
      progress: ShowProgress(
        watchedEpisodesCount: 9,
        totalEpisodesCount: 19,
        lastWatched: LastWatchedEpisode(
          seasonNumber: 1,
          episodeNumber: 9,
          watchedDate: DateTime(2026, 9, 12),
        ),
      ),
      nextEpisode: s2e1,
      isCompleted: false,
      otherActiveShows: [
        const TvShowSummary(
          id: 136283,
          name: 'The Bear',
          posterPath: '/the_bear.jpg',
        ),
        const TvShowSummary(
          id: 97546,
          name: 'Ted Lasso',
          posterPath: '/ted_lasso.jpg',
        ),
      ],
    );

    _dashboard = DashboardData(
      currentlyWatching: currentlyWatching,
      lastWatchedMovies: _movies.where((m) => m.isWatched).take(3).toList(),
    );
  }

  void _initStats() {
    // 365-day activity heatmap
    final now = DateTime(2026, 9, 14);
    final heatmap = List.generate(365, (i) {
      final date = now.subtract(Duration(days: 364 - i));
      final dateStr = SerializationHelpers.formatDateOnly(date)!;
      // Active streak in latest 14 days
      final isRecent = i >= 351;
      final count = isRecent ? ((i % 4) + 1) : ((i % 7 == 0) ? (i % 3) : 0);
      final level = count > 3 ? 4 : (count > 2 ? 3 : (count > 1 ? 2 : (count > 0 ? 1 : 0)));
      return HeatmapDay(date: dateStr, count: count, level: level);
    });

    // 7x24 habit matrix (168 cells)
    final habitMatrix = <HabitMatrixCell>[];
    for (int day = 0; day < 7; day++) {
      for (int hour = 0; hour < 24; hour++) {
        // Higher intensity on evenings 19:00 - 23:00
        int level = 0;
        int count = 0;
        if (hour >= 19 && hour <= 23) {
          level = day == 5 || day == 6 ? 4 : 3;
          count = level * 3;
        } else if (hour >= 13 && hour <= 17 && day == 6) {
          level = 2;
          count = 4;
        }
        habitMatrix.add(HabitMatrixCell(day: day, hour: hour, count: count, level: level));
      }
    }

    _stats = UserStats(
      totalHours: 142.0,
      totalDays: 5.9,
      moviesCount: 48,
      episodesCount: 112,
      showsCount: 5,
      totalReviews: 24,
      averageRating: 8.4,
      currentStreak: 14,
      longestStreak: 28,
      ratingDistribution: const [
        RatingDistributionItem(rating: 1, count: 0),
        RatingDistributionItem(rating: 2, count: 0),
        RatingDistributionItem(rating: 3, count: 0),
        RatingDistributionItem(rating: 4, count: 0),
        RatingDistributionItem(rating: 5, count: 2),
        RatingDistributionItem(rating: 6, count: 2),
        RatingDistributionItem(rating: 7, count: 7),
        RatingDistributionItem(rating: 8, count: 21), // Mode tier (highest frequency)
        RatingDistributionItem(rating: 9, count: 15),
        RatingDistributionItem(rating: 10, count: 13),
      ],
      platformBreakdown: const [
        PlatformBreakdownItem(name: 'Netflix', count: 45, percentage: 40.0),
        PlatformBreakdownItem(name: 'Apple TV+', count: 34, percentage: 30.0),
        PlatformBreakdownItem(name: 'Prime Video', count: 17, percentage: 15.0),
        PlatformBreakdownItem(name: 'Cinema', count: 16, percentage: 15.0),
      ],
      activityHeatmap: heatmap,
      hourlyHabitMatrix: habitMatrix,
      topGenres: const [
        GenreItem(name: 'Sci-Fi', count: 32, percentage: 28.0),
        GenreItem(name: 'Drama', count: 48, percentage: 42.0),
        GenreItem(name: 'Thriller', count: 20, percentage: 17.5),
        GenreItem(name: 'Comedy', count: 14, percentage: 12.5),
      ],
      availableYears: const [2026, 2025, 2024],
    );
  }

  void _initDiary() {
    _diary = [
      DiaryEntry(
        id: 1,
        mediaType: 'movie',
        mediaId: 693134,
        title: 'Dune: Part Two',
        watchedDate: DateTime(2026, 9, 8),
        rating: 10,
        review:
            'Denis Villeneuve delivers an absolute cinematic masterwork. Visuals, sound design, and pacing are unmatched.',
        posterPath: '/1pdfLvkZt9T9SDA52d5q5.jpg',
      ),
      DiaryEntry(
        id: 2,
        mediaType: 'movie',
        mediaId: 872585,
        title: 'Oppenheimer',
        watchedDate: DateTime(2026, 8, 14),
        rating: 9,
        review:
            'A breathless technical marvel anchored by Cillian Murphy’s career-best performance.',
        posterPath: '/8Gxv8gSFCU0XGDykEGv7z.jpg',
      ),
      DiaryEntry(
        id: 3,
        mediaType: 'movie',
        mediaId: 666277,
        title: 'Past Lives',
        watchedDate: DateTime(2026, 7, 20),
        rating: 9,
        posterPath: '/k3waqVXSnvCZWfJYNtdam.jpg',
      ),
      DiaryEntry(
        id: 4,
        mediaType: 'tv',
        mediaId: 110492,
        title: 'Severance',
        watchedDate: DateTime(2026, 9, 12),
        rating: 10,
        seasonEpisodeCode: 'S1 E9',
        posterPath: '/severance.jpg',
      ),
    ];
  }

  void _initApiKeys() {
    _apiKeys = [
      ApiKey(
        id: 1,
        name: 'MacBook Pro CLI',
        keyPrefix: 'cin_live_7f8a9b...',
        createdAt: DateTime(2026, 9, 1),
        requestCount: 128,
        isActive: true,
      ),
    ];
  }

  // --- Implementations of CineTrackerApiInterface ---

  @override
  Future<User?> checkSession() async => _currentUser;

  @override
  Future<AuthResult> login(
      {required String email, required String password}) async {
    return AuthResult(
      user: _currentUser,
      token: 'mock_jwt_token_alex_2026',
      message: 'Login successful!',
    );
  }

  @override
  Future<AuthResult> signup({
    required String username,
    required String email,
    required String password,
  }) async {
    _currentUser = User(
      id: 2,
      username: username,
      email: email,
      displayName: username,
      createdAt: DateTime.now(),
    );
    return AuthResult(
      user: _currentUser,
      token: 'mock_jwt_token_new_user',
      message: 'Signup successful!',
    );
  }

  @override
  Future<void> logout() async {
    // In-memory logout
  }

  void _ensureSeasonDetails(int showId) {
    if (_seasonDetails.containsKey(showId)) return;
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    if (showIdx != -1) {
      final show = _tvShows[showIdx];
      if (show.seasons.isNotEmpty) {
        _seasonDetails[showId] = {
          for (final s in show.seasons)
            s.seasonNumber: SeasonDetail(
              id: s.id,
              seasonNumber: s.seasonNumber,
              name: s.name,
              episodes: s.episodes,
            ),
        };
        return;
      }
    }
    _seasonDetails[showId] = {};
  }

  Episode? _resolveNextEpisode(int showId) {
    final seasonsMap = _seasonDetails[showId];
    if (seasonsMap == null || seasonsMap.isEmpty) return null;

    final sortedSeasonNumbers = seasonsMap.keys.toList()..sort();
    for (final sNum in sortedSeasonNumbers) {
      final seasonDetail = seasonsMap[sNum]!;
      final sortedEpisodes = List<Episode>.from(seasonDetail.episodes)
        ..sort((a, b) => a.episodeNumber.compareTo(b.episodeNumber));
      for (final ep in sortedEpisodes) {
        if (!ep.isWatched) {
          return ep;
        }
      }
    }
    return null;
  }

  @override
  Future<DashboardData> getDashboard(
      {int? tvShowId, bool refresh = false}) async {
    return _dashboard;
  }

  @override
  Future<List<SearchResult>> search(String query, {String type = 'all'}) async {
    final lower = query.toLowerCase();
    final results = <SearchResult>[];

    if (type == 'all' || type == 'movie') {
      for (final m in _movies) {
        if (m.title.toLowerCase().contains(lower)) {
          results.add(SearchResult(
            id: m.id,
            mediaType: 'movie',
            title: m.title,
            releaseDate: m.releaseDate,
            posterPath: m.posterPath,
            voteAverage: m.voteAverage,
            inDb: true,
          ));
        }
      }
    }

    if (type == 'all' || type == 'tv') {
      for (final s in _tvShows) {
        if (s.name.toLowerCase().contains(lower)) {
          results.add(SearchResult(
            id: s.id,
            mediaType: 'tv',
            title: s.name,
            releaseDate: s.firstAirDate,
            posterPath: s.posterPath,
            voteAverage: s.voteAverage,
            inDb: true,
          ));
        }
      }
    }

    return results;
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
    return _stats;
  }

  @override
  Future<List<Movie>> getMovies({bool? watchlist, bool? favorite}) async {
    return _movies.where((m) {
      if (watchlist != null && m.inWatchlist != watchlist) return false;
      if (favorite != null && m.isFavorite != favorite) return false;
      return true;
    }).toList();
  }

  @override
  Future<MovieDetail> getMovieDetail(int movieId) async {
    final movie = _movies.firstWhere(
      (m) => m.id == movieId,
      orElse: () => Movie(id: movieId, title: 'Unknown Movie'),
    );
    return MovieDetail(movie: movie);
  }

  @override
  Future<void> logMovie(
    int movieId, {
    required double rating,
    String? review,
    String? watchedWhere,
    DateTime? watchedDate,
  }) async {
    final date = watchedDate ?? DateTime.now();
    final idx = _movies.indexWhere((m) => m.id == movieId);
    final whereList = SerializationHelpers.parseWatchedWhere(watchedWhere);

    if (idx != -1) {
      final m = _movies[idx];
      final bool wasWatched = m.isWatched;
      final int? oldRating = m.userRating;
      final int targetRating = rating.round().clamp(1, 10);

      final updated = m.copyWith(
        userRating: targetRating,
        review: review,
        watchedDate: date,
        watchedWhere: whereList.isNotEmpty ? whereList : m.watchedWhere,
        inWatchlist: false, // Logging clears from watchlist
      );
      _movies[idx] = updated;

      _diary.insert(
        0,
        DiaryEntry(
          id: DateTime.now().millisecondsSinceEpoch,
          mediaType: 'movie',
          mediaId: movieId,
          title: updated.title,
          watchedDate: date,
          rating: targetRating,
          review: review,
          posterPath: updated.posterPath,
        ),
      );

      // Challenge 3: Update _dashboard.lastWatchedMovies with newly logged movie
      final updatedLastWatched = [
        updated,
        ..._dashboard.lastWatchedMovies.where((mov) => mov.id != movieId),
      ];
      _dashboard = _dashboard.copyWith(
        lastWatchedMovies: updatedLastWatched.take(5).toList(),
      );

      // Challenge 9: Update rating distribution and recompute averageRating
      final updatedDist = _stats.ratingDistribution.map((item) {
        if (oldRating != null && item.rating == oldRating && oldRating != targetRating) {
          final newCount = item.count - 1;
          return RatingDistributionItem(
            rating: item.rating,
            count: newCount < 0 ? 0 : newCount,
          );
        }
        if (item.rating == targetRating && oldRating != targetRating) {
          return RatingDistributionItem(
            rating: item.rating,
            count: item.count + 1,
          );
        }
        return item;
      }).toList();

      int totalRatings = 0;
      int totalScore = 0;
      for (final item in updatedDist) {
        totalRatings += item.count;
        totalScore += item.rating * item.count;
      }
      final double newAvg = totalRatings > 0
          ? double.parse((totalScore / totalRatings).toStringAsFixed(1))
          : _stats.averageRating;

      // Challenge 4: Idempotent stats updates (only increment moviesCount & totalHours if !wasWatched)
      final int newMoviesCount = wasWatched ? _stats.moviesCount : _stats.moviesCount + 1;
      final double newTotalHours = wasWatched
          ? _stats.totalHours
          : _stats.totalHours + (updated.runtime / 60.0);
      final int newReviews = (review != null && review.isNotEmpty && (m.review == null || m.review!.isEmpty))
          ? _stats.totalReviews + 1
          : _stats.totalReviews;

      _stats = _stats.copyWith(
        moviesCount: newMoviesCount,
        totalHours: newTotalHours,
        totalReviews: newReviews,
        ratingDistribution: updatedDist,
        averageRating: newAvg,
      );
    }
  }

  @override
  Future<bool> toggleMovieWatchlist(int movieId) async {
    final idx = _movies.indexWhere((m) => m.id == movieId);
    if (idx != -1) {
      final m = _movies[idx];
      final newStatus = !m.inWatchlist;
      _movies[idx] = m.copyWith(inWatchlist: newStatus);
      return newStatus;
    }
    return false;
  }

  @override
  Future<void> setMovieWatchlist(int movieId, bool inWatchlist) async {
    final idx = _movies.indexWhere((m) => m.id == movieId);
    if (idx != -1) {
      _movies[idx] = _movies[idx].copyWith(inWatchlist: inWatchlist);
    }
  }

  @override
  Future<void> setMovieFavorite(int movieId, bool isFavorite) async {
    final idx = _movies.indexWhere((m) => m.id == movieId);
    if (idx != -1) {
      _movies[idx] = _movies[idx].copyWith(isFavorite: isFavorite);
    }
  }

  @override
  Future<List<TvShow>> getTvShows({bool? watchlist, bool? favorite}) async {
    return _tvShows.where((s) {
      if (watchlist != null && s.inWatchlist != watchlist) return false;
      if (favorite != null && s.isFavorite != favorite) return false;
      return true;
    }).toList();
  }

  @override
  Future<TvShowDetail> getTvShowDetail(int showId) async {
    _ensureSeasonDetails(showId);
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    final show = showIdx != -1 ? _tvShows[showIdx] : TvShow(id: showId, name: 'Unknown TV Show');

    final seasonsMap = _seasonDetails[showId];
    List<Season> syncedSeasons;
    if (seasonsMap != null && seasonsMap.isNotEmpty) {
      if (show.seasons.isNotEmpty) {
        syncedSeasons = show.seasons.map((s) {
          final detail = seasonsMap[s.seasonNumber];
          if (detail != null) {
            return s.copyWith(
              episodes: detail.episodes,
              episodeCount: detail.episodes.length,
            );
          }
          return s;
        }).toList();
      } else {
        final sortedKeys = seasonsMap.keys.toList()..sort();
        syncedSeasons = sortedKeys.map((k) {
          final sd = seasonsMap[k]!;
          return Season(
            id: sd.id,
            seasonNumber: sd.seasonNumber,
            name: sd.name,
            episodeCount: sd.episodes.length,
            posterPath: sd.posterPath,
            episodes: sd.episodes,
          );
        }).toList();
      }
    } else {
      syncedSeasons = show.seasons;
    }

    final updatedShow = show.copyWith(seasons: syncedSeasons);
    if (showIdx != -1) {
      _tvShows[showIdx] = updatedShow;
    }

    return TvShowDetail(
      show: updatedShow,
      seasons: syncedSeasons,
    );
  }

  @override
  Future<SeasonDetail> getSeasonDetail(int showId, int seasonNumber) async {
    final seasonsMap = _seasonDetails[showId];
    if (seasonsMap != null && seasonsMap.containsKey(seasonNumber)) {
      return seasonsMap[seasonNumber]!;
    }
    return SeasonDetail(
      id: showId * 1000 + seasonNumber,
      seasonNumber: seasonNumber,
      name: 'Season $seasonNumber',
    );
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
    _ensureSeasonDetails(showId);
    final seasonsMap = _seasonDetails[showId];
    if (seasonsMap == null || !seasonsMap.containsKey(seasonNumber)) return;

    final date = watchedDate != null
        ? (SerializationHelpers.parseDate(watchedDate) ?? DateTime.now())
        : DateTime.now();

    // 1. Update season detail in memory and capture previous state
    bool wasWatched = false;
    Episode? targetEp;
    final seasonDetail = seasonsMap[seasonNumber]!;
    final epIdx = seasonDetail.episodes
        .indexWhere((e) => e.episodeNumber == episodeNumber);
    if (epIdx != -1) {
      targetEp = seasonDetail.episodes[epIdx];
      wasWatched = targetEp.isWatched;

      final updatedEp = targetEp.copyWith(
        isWatched: watched,
        userRating: rating?.round().clamp(1, 10) ?? targetEp.userRating,
        watchedDate: watched ? date : null,
      );
      final updatedList = List<Episode>.from(seasonDetail.episodes);
      updatedList[epIdx] = updatedEp;
      seasonsMap[seasonNumber] = SeasonDetail(
        id: seasonDetail.id,
        seasonNumber: seasonDetail.seasonNumber,
        name: seasonDetail.name,
        overview: seasonDetail.overview,
        posterPath: seasonDetail.posterPath,
        episodes: updatedList,
      );
    }

    final bool stateChanged = (wasWatched != watched);

    // 2. Challenge 7: TV DiaryEntry generation
    final show = _tvShows.firstWhere(
      (s) => s.id == showId,
      orElse: () => TvShow(id: showId, name: 'TV Show'),
    );
    final seasonEpisodeCode = 'S$seasonNumber E$episodeNumber';

    if (watched && !wasWatched) {
      _diary.insert(
        0,
        DiaryEntry(
          id: DateTime.now().millisecondsSinceEpoch,
          mediaType: 'tv',
          mediaId: showId,
          title: show.name,
          watchedDate: date,
          rating: rating?.round().clamp(1, 10) ?? targetEp?.userRating,
          seasonEpisodeCode: seasonEpisodeCode,
          posterPath: show.posterPath,
        ),
      );
    } else if (!watched && wasWatched) {
      _diary.removeWhere((d) =>
          d.mediaType == 'tv' &&
          d.mediaId == showId &&
          d.seasonEpisodeCode == seasonEpisodeCode);
    } else if (watched && wasWatched && rating != null) {
      final dIdx = _diary.indexWhere((d) =>
          d.mediaType == 'tv' &&
          d.mediaId == showId &&
          d.seasonEpisodeCode == seasonEpisodeCode);
      if (dIdx != -1) {
        _diary[dIdx] =
            _diary[dIdx].copyWith(rating: rating.round().clamp(1, 10));
      }
    }

    // 3. Challenge 4 & 5: Update UserStats idempotently for ANY showId
    if (stateChanged) {
      final double epHours =
          ((targetEp?.runtime ?? 0) > 0 ? targetEp!.runtime : 50) / 60.0;
      _stats = _stats.copyWith(
        episodesCount:
            watched ? _stats.episodesCount + 1 : _stats.episodesCount - 1,
        totalHours:
            watched ? _stats.totalHours + epHours : _stats.totalHours - epHours,
      );
    }

    // 4. Challenge 8: Synchronize _tvShows representation
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    if (showIdx != -1 && seasonsMap.isNotEmpty) {
      final curShow = _tvShows[showIdx];
      final updatedSeasons = curShow.seasons.map((s) {
        final d = seasonsMap[s.seasonNumber];
        return d != null
            ? s.copyWith(episodes: d.episodes, episodeCount: d.episodes.length)
            : s;
      }).toList();
      _tvShows[showIdx] = curShow.copyWith(seasons: updatedSeasons);
    }

    // 5. Challenge 1: General next unwatched episode resolution for dashboard
    if (_dashboard.currentlyWatching?.show.id == showId) {
      int totalEpisodes = 0;
      int totalWatched = 0;
      for (final s in seasonsMap.values) {
        for (final ep in s.episodes) {
          totalEpisodes++;
          if (ep.isWatched) totalWatched++;
        }
      }

      final nextEp = _resolveNextEpisode(showId);
      final isCompleted = nextEp == null && totalEpisodes > 0;
      final currentCW = _dashboard.currentlyWatching!;

      _dashboard = _dashboard.copyWith(
        currentlyWatching: CurrentlyWatching(
          show: _tvShows.firstWhere((s) => s.id == showId,
              orElse: () => currentCW.show),
          progress: ShowProgress(
            watchedEpisodesCount: totalWatched,
            totalEpisodesCount: totalEpisodes > 0
                ? totalEpisodes
                : currentCW.progress.totalEpisodesCount,
            lastWatched: watched
                ? LastWatchedEpisode(
                    seasonNumber: seasonNumber,
                    episodeNumber: episodeNumber,
                    watchedDate: date,
                  )
                : currentCW.progress.lastWatched,
          ),
          nextEpisode: nextEp,
          isCompleted: isCompleted,
          otherActiveShows: currentCW.otherActiveShows,
        ),
      );
    }
  }

  @override
  Future<void> markSeasonWatched(int showId, int seasonNumber,
      {String? watchedDate}) async {
    _ensureSeasonDetails(showId);
    final seasonsMap = _seasonDetails[showId];
    if (seasonsMap == null || !seasonsMap.containsKey(seasonNumber)) return;

    final season = seasonsMap[seasonNumber]!;
    final date = watchedDate != null
        ? (SerializationHelpers.parseDate(watchedDate) ?? DateTime.now())
        : DateTime.now();

    int newlyWatchedCount = 0;
    double addedHours = 0.0;
    final updatedEps = <Episode>[];

    for (final ep in season.episodes) {
      if (!ep.isWatched) {
        newlyWatchedCount++;
        addedHours += ((ep.runtime > 0 ? ep.runtime : 50) / 60.0);
        updatedEps.add(ep.copyWith(isWatched: true, watchedDate: date));
      } else {
        updatedEps.add(ep);
      }
    }

    seasonsMap[seasonNumber] = SeasonDetail(
      id: season.id,
      seasonNumber: season.seasonNumber,
      name: season.name,
      overview: season.overview,
      posterPath: season.posterPath,
      episodes: updatedEps,
    );

    // Synchronize _tvShows
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    if (showIdx != -1) {
      final show = _tvShows[showIdx];
      final updatedShowSeasons = show.seasons.map((s) {
        if (s.seasonNumber == seasonNumber) {
          return s.copyWith(
              episodes: updatedEps, episodeCount: updatedEps.length);
        }
        return s;
      }).toList();
      _tvShows[showIdx] = show.copyWith(seasons: updatedShowSeasons);
    }

    // Update UserStats
    if (newlyWatchedCount > 0) {
      _stats = _stats.copyWith(
        episodesCount: _stats.episodesCount + newlyWatchedCount,
        totalHours: _stats.totalHours + addedHours,
      );
    }

    // Update Dashboard if currently watching show
    if (_dashboard.currentlyWatching?.show.id == showId) {
      int totalWatched = 0;
      int totalEps = 0;
      LastWatchedEpisode? lastWatched;

      final sortedSeasonNums = seasonsMap.keys.toList()..sort();
      for (final sNum in sortedSeasonNums) {
        final sDetail = seasonsMap[sNum]!;
        for (final ep in sDetail.episodes) {
          totalEps++;
          if (ep.isWatched) {
            totalWatched++;
            lastWatched = LastWatchedEpisode(
              seasonNumber: ep.seasonNumber,
              episodeNumber: ep.episodeNumber,
              watchedDate: ep.watchedDate ?? date,
            );
          }
        }
      }

      final nextEp = _resolveNextEpisode(showId);
      final isCompleted = nextEp == null && totalEps > 0;
      final currentCW = _dashboard.currentlyWatching!;

      _dashboard = _dashboard.copyWith(
        currentlyWatching: CurrentlyWatching(
          show: _tvShows.firstWhere((s) => s.id == showId,
              orElse: () => currentCW.show),
          progress: ShowProgress(
            watchedEpisodesCount: totalWatched,
            totalEpisodesCount: totalEps > 0
                ? totalEps
                : currentCW.progress.totalEpisodesCount,
            lastWatched: lastWatched ?? currentCW.progress.lastWatched,
          ),
          nextEpisode: nextEp,
          isCompleted: isCompleted,
          otherActiveShows: currentCW.otherActiveShows,
        ),
      );
    }
  }

  @override
  Future<void> markShowWatched(int showId, {String? watchedDate}) async {
    _ensureSeasonDetails(showId);
    final seasonsMap = _seasonDetails[showId];
    if (seasonsMap == null) return;

    final date = watchedDate != null
        ? (SerializationHelpers.parseDate(watchedDate) ?? DateTime.now())
        : DateTime.now();

    int newlyWatchedCount = 0;
    double addedHours = 0.0;
    int totalWatched = 0;
    int totalEps = 0;
    LastWatchedEpisode? lastWatched;

    final sortedSeasonNums = seasonsMap.keys.toList()..sort();
    for (final seasonNum in sortedSeasonNums) {
      final season = seasonsMap[seasonNum]!;
      final updatedEps = <Episode>[];
      for (final ep in season.episodes) {
        totalEps++;
        totalWatched++;
        if (!ep.isWatched) {
          newlyWatchedCount++;
          addedHours += ((ep.runtime > 0 ? ep.runtime : 50) / 60.0);
          updatedEps.add(ep.copyWith(isWatched: true, watchedDate: date));
        } else {
          updatedEps.add(ep);
        }
        lastWatched = LastWatchedEpisode(
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          watchedDate: ep.watchedDate ?? date,
        );
      }
      seasonsMap[seasonNum] = SeasonDetail(
        id: season.id,
        seasonNumber: season.seasonNumber,
        name: season.name,
        overview: season.overview,
        posterPath: season.posterPath,
        episodes: updatedEps,
      );
    }

    // Synchronize _tvShows
    final showIdx = _tvShows.indexWhere((s) => s.id == showId);
    if (showIdx != -1) {
      final show = _tvShows[showIdx];
      final updatedShowSeasons = show.seasons.map((s) {
        final updatedDetail = seasonsMap[s.seasonNumber];
        if (updatedDetail != null) {
          return s.copyWith(
              episodes: updatedDetail.episodes,
              episodeCount: updatedDetail.episodes.length);
        }
        return s;
      }).toList();
      _tvShows[showIdx] = show.copyWith(seasons: updatedShowSeasons);
    }

    // Update UserStats
    if (newlyWatchedCount > 0) {
      _stats = _stats.copyWith(
        episodesCount: _stats.episodesCount + newlyWatchedCount,
        totalHours: _stats.totalHours + addedHours,
      );
    }

    // Update Dashboard if currently watching show
    if (_dashboard.currentlyWatching?.show.id == showId) {
      final currentCW = _dashboard.currentlyWatching!;
      _dashboard = _dashboard.copyWith(
        currentlyWatching: CurrentlyWatching(
          show: _tvShows.firstWhere((s) => s.id == showId,
              orElse: () => currentCW.show),
          progress: ShowProgress(
            watchedEpisodesCount: totalWatched,
            totalEpisodesCount: totalEps > 0
                ? totalEps
                : currentCW.progress.totalEpisodesCount,
            lastWatched: lastWatched ?? currentCW.progress.lastWatched,
          ),
          nextEpisode: null,
          isCompleted: true,
          otherActiveShows: currentCW.otherActiveShows,
        ),
      );
    }
  }

  @override
  Future<bool> toggleTvFavorite(int showId, {bool? isFavorite}) async {
    final idx = _tvShows.indexWhere((s) => s.id == showId);
    if (idx != -1) {
      final s = _tvShows[idx];
      final newFav = isFavorite ?? !s.isFavorite;
      _tvShows[idx] = s.copyWith(isFavorite: newFav);
      return newFav;
    }
    return false;
  }

  @override
  Future<bool> toggleTvWatchlist(int showId) async {
    final idx = _tvShows.indexWhere((s) => s.id == showId);
    if (idx != -1) {
      final s = _tvShows[idx];
      final newWatchlist = !s.inWatchlist;
      _tvShows[idx] = s.copyWith(inWatchlist: newWatchlist);
      return newWatchlist;
    }
    return false;
  }

  @override
  Future<List<DiaryEntry>> getDiary() async => _diary;

  @override
  Future<UserProfile> getUserProfile(String username) async {
    final favMovies = _movies.where((m) => m.isFavorite).toList();
    final top4 = favMovies.take(4).map((m) => Top4Item(
      id: m.id,
      title: m.title,
      posterPath: m.posterPath,
      rating: m.userRating?.toDouble(),
      type: 'movie',
    )).toList();

    return UserProfile(
      user: _currentUser,
      followersCount: 142,
      followingCount: 89,
      isFollowing: false,
      favoriteMovies: favMovies,
      favoriteShows: _tvShows.where((s) => s.isFavorite).toList(),
      moviesCount: _movies.length,
      tvShowsCount: _tvShows.length,
      hoursWatched: 187,
      top4: top4,
    );
  }

  @override
  Future<List<ApiKey>> getApiKeys() async => _apiKeys;

  @override
  Future<ApiKeyCreateResult> createApiKey({String? name}) async {
    final newId = _apiKeys.length + 1;
    final keyName = name ?? 'New API Key';
    final rawKey = 'cin_live_key_${DateTime.now().millisecondsSinceEpoch}';
    final newKey = ApiKey(
      id: newId,
      name: keyName,
      keyPrefix: 'cin_live_${newId}a...',
      createdAt: DateTime.now(),
      requestCount: 0,
      isActive: true,
    );
    _apiKeys.add(newKey);
    return ApiKeyCreateResult(key: newKey, rawKey: rawKey);
  }

  @override
  Future<void> revokeApiKey(int keyId) async {
    _apiKeys.removeWhere((k) => k.id == keyId);
  }

  @override
  Future<BatchImportResult> importLetterboxdCsv(String csvContent) async {
    final items = LetterboxdCsvParser.parse(csvContent);
    int imported = 0;
    for (final item in items) {
      final idx = _movies.indexWhere((m) =>
          m.title.toLowerCase() == item.name.toLowerCase() ||
          (item.year != null && m.releaseDate?.year == item.year));
      if (idx != -1) {
        _movies[idx] = _movies[idx].copyWith(
          userRating: item.rating ?? _movies[idx].userRating,
          review: item.review ?? _movies[idx].review,
          watchedDate: item.watchedDate ?? _movies[idx].watchedDate,
        );
        imported++;
      } else {
        final newMovie = Movie(
          id: 100000 + _movies.length,
          title: item.name,
          releaseDate: item.year != null ? DateTime(item.year!) : null,
          userRating: item.rating,
          review: item.review,
          watchedDate: item.watchedDate,
        );
        _movies.add(newMovie);
        imported++;
      }
    }
    return BatchImportResult(
      importedCount: imported,
      skippedCount: 0,
      errorCount: 0,
      errors: const [],
    );
  }

  @override
  Future<DataExportResult> exportData({String? include, String? since}) async {
    return DataExportResult(
      format: 'json',
      data: {
        'exportedAt': DateTime.now().toIso8601String(),
        'movies': _movies.map((m) => m.toJson()).toList(),
        'tvShows': _tvShows.map((s) => s.toJson()).toList(),
        'stats': _stats.toJson(),
      },
    );
  }
}
