// ignore_for_file: avoid_print

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cinetracker_flutter/models/api_models.dart';
import 'package:cinetracker_flutter/services/api/api_client.dart';
import 'package:cinetracker_flutter/services/api/mock_cinetracker_service.dart';
import 'package:cinetracker_flutter/state/auth_provider.dart';

class FailingMockService extends MockCineTrackerService {
  final bool throwOnLogin;

  FailingMockService({this.throwOnLogin = false});

  @override
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    if (throwOnLogin) {
      throw const UnauthorizedException('Invalid email or password');
    }
    return super.login(email: email, password: password);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Empirical Challenge: MockCineTrackerService State Mutations & Fidelity', () {
    late MockCineTrackerService service;

    setUp(() {
      service = MockCineTrackerService();
    });

    test('CHALLENGE 1: toggleEpisodeWatched advances nextEpisode beyond S2E1', () async {
      // Seed state: S1 9 eps watched. Next episode is S2E1.
      final d0 = await service.getDashboard();
      expect(d0.nextEpisode?.seasonNumber, 2);
      expect(d0.nextEpisode?.episodeNumber, 1);

      // Advance to S2E2
      await service.toggleEpisodeWatched(110492, 2, 1, true);
      final d1 = await service.getDashboard();
      expect(d1.nextEpisode?.seasonNumber, 2);
      expect(d1.nextEpisode?.episodeNumber, 2); // Correctly moves to E2

      // Now watch S2E2: Expected next episode is S2E3 ("Season 2 Episode 3")
      await service.toggleEpisodeWatched(110492, 2, 2, true);
      final d2 = await service.getDashboard();

      final actualNextEpNumber = d2.nextEpisode?.episodeNumber;
      print('[CHALLENGE 1] After watching S2E2, actual nextEpisode: $actualNextEpNumber');
      expect(actualNextEpNumber, 3, reason: 'nextEpisode should advance to episode 3');
      expect(d2.nextEpisode?.seasonNumber, 2);
    });

    test('CHALLENGE 2: toggleEpisodeWatched is idempotent on progress count and stats', () async {
      final initialDashboard = await service.getDashboard();
      final initialWatchedCount = initialDashboard.currentlyWatching!.progress.watchedEpisodesCount;
      final initialStats = await service.getStats();
      final initialEpisodesCount = initialStats.episodesCount;

      // S2E1 is currently unwatched. Mark it watched once:
      await service.toggleEpisodeWatched(110492, 2, 1, true);
      final d1 = await service.getDashboard();
      final s1 = await service.getStats();
      expect(d1.currentlyWatching!.progress.watchedEpisodesCount, initialWatchedCount + 1);
      expect(s1.episodesCount, initialEpisodesCount + 1);

      // Call toggleEpisodeWatched with watched: true AGAIN (already watched)
      await service.toggleEpisodeWatched(110492, 2, 1, true);
      final d2 = await service.getDashboard();
      final s2 = await service.getStats();

      print('[CHALLENGE 2] Watched count after duplicate watch: ${d2.currentlyWatching!.progress.watchedEpisodesCount}');
      expect(d2.currentlyWatching!.progress.watchedEpisodesCount, initialWatchedCount + 1,
          reason: 'Duplicate toggleEpisodeWatched(true) must be idempotent on watchedEpisodesCount');
      expect(s2.episodesCount, initialEpisodesCount + 1,
          reason: 'Duplicate toggleEpisodeWatched(true) must be idempotent on stats.episodesCount');
    });

    test('CHALLENGE 3: toggleEpisodeWatched with watched:false on unwatched episode is idempotent', () async {
      final initialDashboard = await service.getDashboard();
      final initialWatchedCount = initialDashboard.currentlyWatching!.progress.watchedEpisodesCount;
      final initialStats = await service.getStats();
      final initialEpisodesCount = initialStats.episodesCount;

      // S2E5 is unwatched. Untoggling an unwatched episode:
      await service.toggleEpisodeWatched(110492, 2, 5, false);
      final d1 = await service.getDashboard();
      final s1 = await service.getStats();

      print('[CHALLENGE 3] Watched count after untoggling unwatched episode: ${d1.currentlyWatching!.progress.watchedEpisodesCount}');
      expect(d1.currentlyWatching!.progress.watchedEpisodesCount, initialWatchedCount,
          reason: 'Untoggling an unwatched episode must not decrement watched count');
      expect(s1.episodesCount, initialEpisodesCount,
          reason: 'Untoggling an unwatched episode must not decrement stats.episodesCount');
    });

    test('CHALLENGE 4: toggleEpisodeWatched on non-Severance shows updates stats', () async {
      final initialStats = await service.getStats();
      final initialEpisodesCount = initialStats.episodesCount;

      // The Bear is showId 136283. Toggle S3E1 watched:
      await service.toggleEpisodeWatched(136283, 3, 1, true);
      final statsAfter = await service.getStats();

      print('[CHALLENGE 4] Stats episodesCount after watching The Bear: ${statsAfter.episodesCount}');
      expect(statsAfter.episodesCount, initialEpisodesCount + 1,
          reason: 'toggleEpisodeWatched on non-Severance show must update user stats');
    });

    test('CHALLENGE 5: toggleEpisodeWatched creates a diary entry for watched episodes', () async {
      final initialDiary = await service.getDiary();
      final initialDiaryCount = initialDiary.length;

      // Watch S2E1 with rating 10
      await service.toggleEpisodeWatched(110492, 2, 1, true, rating: 10);
      final diaryAfter = await service.getDiary();

      print('[CHALLENGE 5] Diary length after watching episode: ${diaryAfter.length} (was $initialDiaryCount)');
      expect(diaryAfter.length, initialDiaryCount + 1,
          reason: 'toggleEpisodeWatched must create a DiaryEntry in _diary');
      expect(diaryAfter.first.mediaType, 'tv');
      expect(diaryAfter.first.mediaId, 110492);
      expect(diaryAfter.first.title, 'Severance');
      expect(diaryAfter.first.seasonEpisodeCode, 'S2 E1');
      expect(diaryAfter.first.rating, 10);
    });

    test('CHALLENGE 6: markSeasonWatched updates dashboard progress, nextEpisode, and stats', () async {
      final initialStats = await service.getStats();

      // Mark Severance Season 2 (10 episodes) as watched
      await service.markSeasonWatched(110492, 2);

      final d1 = await service.getDashboard();
      final stats1 = await service.getStats();

      print('[CHALLENGE 6] Watched count after markSeasonWatched: ${d1.currentlyWatching!.progress.watchedEpisodesCount}');
      print('[CHALLENGE 6] Stats episodes count after markSeasonWatched: ${stats1.episodesCount}');
      expect(d1.currentlyWatching!.progress.watchedEpisodesCount, 19,
          reason: 'markSeasonWatched must update dashboard progress');
      expect(stats1.episodesCount, initialStats.episodesCount + 10,
          reason: 'markSeasonWatched must update stats.episodesCount');
      expect(d1.nextEpisode, isNull,
          reason: 'markSeasonWatched must clear nextEpisode when all episodes watched');
      expect(d1.currentlyWatching!.isCompleted, true,
          reason: 'markSeasonWatched must set isCompleted to true when all episodes watched');
    });

    test('CHALLENGE 7: markShowWatched updates dashboard progress, isCompleted, and stats', () async {
      final initialStats = await service.getStats();

      // Mark Severance entire show as watched
      await service.markShowWatched(110492);

      final d1 = await service.getDashboard();
      final stats1 = await service.getStats();

      print('[CHALLENGE 7] Watched count after markShowWatched: ${d1.currentlyWatching!.progress.watchedEpisodesCount}');
      print('[CHALLENGE 7] isCompleted after markShowWatched: ${d1.currentlyWatching!.isCompleted}');
      expect(d1.currentlyWatching!.progress.watchedEpisodesCount, 19,
          reason: 'markShowWatched must update dashboard watched count');
      expect(d1.currentlyWatching!.isCompleted, true,
          reason: 'markShowWatched must mark dashboard show as completed');
      expect(d1.nextEpisode, isNull,
          reason: 'markShowWatched must clear nextEpisode');
      expect(stats1.episodesCount, initialStats.episodesCount + 10,
          reason: 'markShowWatched must update stats.episodesCount');
    });

    test('CHALLENGE 8: logMovie updates dashboard.lastWatchedMovies', () async {
      final d0 = await service.getDashboard();
      final initialFirstTitle = d0.lastWatchedMovies.first.title;
      expect(initialFirstTitle, 'Dune: Part Two');

      // Log Challengers (id: 937287)
      await service.logMovie(937287, rating: 9, review: 'Superb tennis drama');

      final d1 = await service.getDashboard();

      print('[CHALLENGE 8] First movie in dashboard after logging Challengers: ${d1.lastWatchedMovies.first.title}');
      expect(d1.lastWatchedMovies.first.title, 'Challengers',
          reason: 'logMovie must update dashboard.lastWatchedMovies');
      expect(d1.lastWatchedMovies.any((m) => m.title == 'Challengers'), true,
          reason: 'newly logged movie must be present in dashboard.lastWatchedMovies');
    });

    test('CHALLENGE 9: logMovie on already watched movie is idempotent on stats.moviesCount', () async {
      final s0 = await service.getStats();
      final initialMoviesCount = s0.moviesCount; // 48
      final initialTotalHours = s0.totalHours;   // 142.0

      // Re-log Dune: Part Two (already watched in seed data) with an updated review
      await service.logMovie(693134, rating: 10, review: 'Second viewing was even better');

      final s1 = await service.getStats();

      print('[CHALLENGE 9] Movies count after re-logging Dune 2: ${s1.moviesCount} (initial was $initialMoviesCount)');
      expect(s1.moviesCount, initialMoviesCount,
          reason: 'Re-logging an existing movie must not re-increment moviesCount');
      expect(s1.totalHours, closeTo(initialTotalHours, 0.01),
          reason: 'Re-logging an existing movie must not re-increment totalHours');
    });

    test('CHALLENGE 10: logMovie recomputes rating distribution and average rating in stats', () async {
      final s0 = await service.getStats();
      final initialAvg = s0.averageRating;
      final initialDistItem = s0.ratingDistribution.firstWhere((r) => r.rating == 1);
      expect(initialDistItem.count, 0);

      // Log a movie with a 1-star rating
      await service.logMovie(915935, rating: 1, review: 'Disliked');

      final s1 = await service.getStats();
      final updatedDistItem = s1.ratingDistribution.firstWhere((r) => r.rating == 1);

      print('[CHALLENGE 10] 1-star count after logging 1-star movie: ${updatedDistItem.count}');
      expect(updatedDistItem.count, 1,
          reason: 'logMovie must update ratingDistribution in UserStats');
      expect(s1.averageRating, isNot(equals(initialAvg)),
          reason: 'logMovie must recompute averageRating in UserStats');
      expect(s1.averageRating, lessThan(initialAvg));
    });

    test('CHALLENGE 11: getTvShowDetail reflects episode watched status mutations from toggleEpisodeWatched', () async {
      // Mark S2E1 watched via toggleEpisodeWatched
      await service.toggleEpisodeWatched(110492, 2, 1, true);

      // Verify season detail is updated
      final seasonDetail = await service.getSeasonDetail(110492, 2);
      expect(seasonDetail.episodes[0].isWatched, true);

      // Check getTvShowDetail(110492)
      final showDetail = await service.getTvShowDetail(110492);
      final s2 = showDetail.seasons.firstWhere((s) => s.seasonNumber == 2);

      print('[CHALLENGE 11] getTvShowDetail S2E1 isWatched: ${s2.episodes[0].isWatched}');
      expect(s2.episodes[0].isWatched, true,
          reason: 'getTvShowDetail seasons must reflect episode watched status mutations');
    });
  });

  group('Empirical Challenge: AuthProvider State & Contract Fidelity', () {
    late MockCineTrackerService mockApi;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      mockApi = MockCineTrackerService();
    });

    test('CHALLENGE 12: AuthProvider.login synchronizes sessionToken to ApiClient', () async {
      final prefs = await SharedPreferences.getInstance();
      final apiClient = ApiClient();
      final provider = AuthProvider(api: mockApi, prefs: prefs, apiClient: apiClient);

      expect(apiClient.sessionToken, isNull);

      final success = await provider.login(
        email: 'alex@cinetracker.app',
        password: 'password',
      );
      expect(success, true);
      expect(provider.isAuthenticated, true);
      expect(provider.token, 'mock_jwt_token_alex_2026');

      print('[CHALLENGE 12] ApiClient sessionToken after login(): ${apiClient.sessionToken}');
      expect(apiClient.sessionToken, 'mock_jwt_token_alex_2026',
          reason: 'AuthProvider.login() must synchronize token to ApiClient.sessionToken');
    });

    test('CHALLENGE 13: AuthProvider.signup synchronizes sessionToken to ApiClient', () async {
      final prefs = await SharedPreferences.getInstance();
      final apiClient = ApiClient();
      final provider = AuthProvider(api: mockApi, prefs: prefs, apiClient: apiClient);

      final success = await provider.signup(
        username: 'john',
        email: 'john@cinetracker.app',
        password: 'password',
      );
      expect(success, true);
      expect(provider.isAuthenticated, true);
      expect(provider.token, 'mock_jwt_token_new_user');

      print('[CHALLENGE 13] ApiClient sessionToken after signup(): ${apiClient.sessionToken}');
      expect(apiClient.sessionToken, 'mock_jwt_token_new_user',
          reason: 'AuthProvider.signup() must synchronize token to ApiClient.sessionToken');
    });

    test('CHALLENGE 14: Failed login from guest mode cleanly isolates error state and clears user', () async {
      final prefs = await SharedPreferences.getInstance();
      final failingApi = FailingMockService(throwOnLogin: true);
      final provider = AuthProvider(api: failingApi, prefs: prefs);

      // Start as guest
      provider.continueAsGuest();
      expect(provider.isGuest, true);
      expect(provider.currentUser?.username, 'guest_cinephile');

      // Attempt login with invalid credentials
      final success = await provider.login(
        email: 'alex@cinetracker.app',
        password: 'wrong',
      );
      expect(success, false);
      expect(provider.state, AuthState.error);

      print('[CHALLENGE 14] State after failed login from guest: ${provider.state}, currentUser: ${provider.currentUser?.username}, isGuest: ${provider.isGuest}');
      expect(provider.currentUser, isNull,
          reason: 'currentUser must be nullified on failed login attempt');
      expect(provider.isGuest, false,
          reason: 'isGuest must be false on failed login attempt');
      expect(prefs.getBool('cinetracker_is_guest'), isNull,
          reason: 'cinetracker_is_guest preference must be cleared on failed login attempt');
    });
  });
}
