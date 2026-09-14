import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cinetracker_flutter/services/api/api_client.dart';
import 'package:cinetracker_flutter/services/api/cinetracker_api.dart';
import 'package:cinetracker_flutter/services/api/mock_cinetracker_service.dart';
import 'package:cinetracker_flutter/state/auth_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ApiClient Networking & Cookies', () {
    test('resolves headers with session cookie and API key', () async {
      String? sentCookie;
      String? sentAuth;

      final mockClient = MockClient((request) async {
        sentCookie = request.headers['Cookie'];
        sentAuth = request.headers['Authorization'];
        return http.Response('{"status": "ok"}', 200,
            headers: {'content-type': 'application/json'});
      });

      final client = ApiClient(client: mockClient);
      client.setSessionToken('jwt_token_123');
      client.setApiKey('test_key_456');

      final res = await client.get('/test');
      expect(res['status'], 'ok');
      expect(sentCookie, 'token=jwt_token_123');
      expect(sentAuth, 'Bearer test_key_456');
    });

    test('extracts session token from Set-Cookie header', () async {
      final mockClient = MockClient((request) async {
        return http.Response('{"user": {"id": 1}}', 200, headers: {
          'content-type': 'application/json',
          'set-cookie': 'token=new_session_token_xyz; Path=/; HttpOnly',
        });
      });

      final client = ApiClient(client: mockClient);
      await client.get('/auth/callback');
      expect(client.sessionToken, 'new_session_token_xyz');
    });

    test('maps HTTP 400 to BadRequestException', () async {
      final mockClient = MockClient((request) async {
        return http.Response('{"error": "Invalid input"}', 400);
      });
      final client = ApiClient(client: mockClient);

      expect(() => client.get('/bad'), throwsA(isA<BadRequestException>()));
    });

    test('maps HTTP 401 to UnauthorizedException', () async {
      final mockClient = MockClient((request) async {
        return http.Response('{"message": "Unauthorized"}', 401);
      });
      final client = ApiClient(client: mockClient);

      expect(() => client.get('/auth'), throwsA(isA<UnauthorizedException>()));
    });

    test('maps HTTP 403 to ForbiddenException', () async {
      final mockClient = MockClient((request) async {
        return http.Response('{"message": "Forbidden"}', 403);
      });
      final client = ApiClient(client: mockClient);

      expect(() => client.get('/admin'), throwsA(isA<ForbiddenException>()));
    });

    test('maps HTTP 404 to NotFoundException', () async {
      final mockClient = MockClient((request) async {
        return http.Response('{"message": "Not found"}', 404);
      });
      final client = ApiClient(client: mockClient);

      expect(() => client.get('/missing'), throwsA(isA<NotFoundException>()));
    });

    test('maps HTTP 409 to ConflictException', () async {
      final mockClient = MockClient((request) async {
        return http.Response('{"message": "Already exists"}', 409);
      });
      final client = ApiClient(client: mockClient);

      expect(() => client.get('/conflict'), throwsA(isA<ConflictException>()));
    });

    test('maps HTTP 429 to RateLimitException with retry-after', () async {
      final mockClient = MockClient((request) async {
        return http.Response('{"message": "Too Many Requests"}', 429,
            headers: {'retry-after': '30'});
      });
      final client = ApiClient(client: mockClient);

      expect(
        () => client.get('/ratelimited'),
        throwsA(predicate<RateLimitException>((e) => e.retryAfterSeconds == 30)),
      );
    });

    test('maps HTTP 500 to ServerException', () async {
      final mockClient = MockClient((request) async {
        return http.Response('{"message": "Internal error"}', 500);
      });
      final client = ApiClient(client: mockClient);

      expect(() => client.get('/server-error'), throwsA(isA<ServerException>()));
    });
  });

  group('CineTrackerApi Live Client with MockClient', () {
    test('checkSession returns user on 200 and null on 401', () async {
      final mockClient200 = MockClient((req) async {
        return http.Response(
            jsonEncode({
              'user': {'id': 1, 'username': 'testuser', 'email': 't@test.com'}
            }),
            200);
      });
      final api200 = CineTrackerApi(ApiClient(client: mockClient200));
      final user = await api200.checkSession();
      expect(user?.username, 'testuser');

      final mockClient401 = MockClient((req) async {
        return http.Response('{"message": "Unauthorized"}', 401);
      });
      final api401 = CineTrackerApi(ApiClient(client: mockClient401));
      final nullUser = await api401.checkSession();
      expect(nullUser, isNull);
    });

    test('login sends login action and parses AuthResult', () async {
      final mockClient = MockClient((req) async {
        final body = jsonDecode(req.body) as Map;
        expect(body['action'], 'login');
        expect(body['email'], 'alex@test.com');
        return http.Response(
          jsonEncode({
            'user': {'id': 1, 'username': 'alex', 'email': 'alex@test.com'},
            'message': 'Welcome back!',
          }),
          200,
          headers: {'set-cookie': 'token=new_token_789; Path=/'},
        );
      });

      final api = CineTrackerApi(ApiClient(client: mockClient));
      final result = await api.login(email: 'alex@test.com', password: 'password123');

      expect(result.user.username, 'alex');
      expect(result.token, 'new_token_789');
    });

    test('getDashboard parses hero and next episode', () async {
      final mockClient = MockClient((req) async {
        expect(req.url.path, '/api/user/dashboard');
        return http.Response(
          jsonEncode({
            'currentlyWatching': {
              'show': {'id': 110492, 'name': 'Severance'},
              'progress': {'watchedEpisodesCount': 9, 'totalEpisodesCount': 19},
              'nextEpisode': {
                'id': 201,
                'season_number': 2,
                'episode_number': 1,
                'name': 'The Aftermath'
              },
            },
            'lastWatchedMovies': [
              {'id': 1, 'title': 'Dune: Part Two'}
            ]
          }),
          200,
        );
      });

      final api = CineTrackerApi(ApiClient(client: mockClient));
      final dashboard = await api.getDashboard();

      expect(dashboard.featuredShow?.name, 'Severance');
      expect(dashboard.nextEpisode?.name, 'The Aftermath');
      expect(dashboard.lastWatchedMovies.length, 1);
    });
  });

  group('MockCineTrackerService In-Memory State & Mutations', () {
    late MockCineTrackerService service;

    setUp(() {
      service = MockCineTrackerService();
    });

    test('seeds Severance with S1 9 eps watched and S2 E1 unwatched', () async {
      final dashboard = await service.getDashboard();
      expect(dashboard.featuredShow?.name, 'Severance');
      expect(dashboard.currentlyWatching?.progress.watchedEpisodesCount, 9);
      expect(dashboard.currentlyWatching?.progress.totalEpisodesCount, 19);
      expect(dashboard.nextEpisode?.seasonNumber, 2);
      expect(dashboard.nextEpisode?.episodeNumber, 1);
      expect(dashboard.nextEpisode?.name, 'The Aftermath');
    });

    test('seeds Dune 2 and Oppenheimer in library movies', () async {
      final movies = await service.getMovies();
      final dune = movies.firstWhere((m) => m.title == 'Dune: Part Two');
      final oppenheimer = movies.firstWhere((m) => m.title == 'Oppenheimer');

      expect(dune.userRating, 10);
      expect(dune.isFavorite, true);
      expect(oppenheimer.userRating, 9);
    });

    test('seeds user stats: 142h, 48 movies, 112 eps, mode rating 8', () async {
      final stats = await service.getStats();
      expect(stats.totalHours, 142.0);
      expect(stats.moviesCount, 48);
      expect(stats.episodesCount, 112);
      expect(stats.averageRating, 8.4);
      expect(stats.currentStreak, 14);
      expect(stats.modeRating, 8);
      expect(stats.activityHeatmap.length, 365);
      expect(stats.hourlyHabitMatrix.length, 168);
    });

    test('toggleEpisodeWatched advances progress and next episode', () async {
      // Toggle S2 E1 as watched
      await service.toggleEpisodeWatched(110492, 2, 1, true, rating: 10);

      final dashboard = await service.getDashboard();
      expect(dashboard.currentlyWatching?.progress.watchedEpisodesCount, 10);
      expect(dashboard.nextEpisode?.seasonNumber, 2);
      expect(dashboard.nextEpisode?.episodeNumber, 2);
      expect(dashboard.nextEpisode?.name, 'Goodbye Mrs. Selvig');

      final stats = await service.getStats();
      expect(stats.episodesCount, 113);

      // Untoggle S2 E1
      await service.toggleEpisodeWatched(110492, 2, 1, false);
      final reverted = await service.getDashboard();
      expect(reverted.currentlyWatching?.progress.watchedEpisodesCount, 9);
      expect(reverted.nextEpisode?.episodeNumber, 1);
    });

    test('logMovie updates rating, clears watchlist, and appends to diary', () async {
      // Log Challengers (initially in watchlist, unrated)
      final initialMovies = await service.getMovies();
      final challengers = initialMovies.firstWhere((m) => m.title == 'Challengers');
      expect(challengers.inWatchlist, true);
      expect(challengers.userRating, isNull);

      await service.logMovie(937287, rating: 8, review: 'Intense drama');

      final updatedMovies = await service.getMovies();
      final updated = updatedMovies.firstWhere((m) => m.title == 'Challengers');
      expect(updated.userRating, 8);
      expect(updated.inWatchlist, false);
      expect(updated.review, 'Intense drama');

      final diary = await service.getDiary();
      expect(diary.first.title, 'Challengers');
      expect(diary.first.rating, 8);
    });

    test('toggleMovieWatchlist flips watchlist status', () async {
      final dune = (await service.getMovies()).firstWhere((m) => m.id == 693134);
      expect(dune.inWatchlist, false);

      final newStatus = await service.toggleMovieWatchlist(693134);
      expect(newStatus, true);

      final updated = (await service.getMovies()).firstWhere((m) => m.id == 693134);
      expect(updated.inWatchlist, true);
    });

    test('resetToSeedData restores pristine baseline', () async {
      await service.logMovie(937287, rating: 10);
      service.resetToSeedData();

      final movies = await service.getMovies();
      final challengers = movies.firstWhere((m) => m.title == 'Challengers');
      expect(challengers.inWatchlist, true);
      expect(challengers.userRating, isNull);
    });
  });

  group('AuthProvider State & Persistence', () {
    late MockCineTrackerService service;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      service = MockCineTrackerService();
    });

    test('initializes as unauthenticated when no stored token', () async {
      final prefs = await SharedPreferences.getInstance();
      final provider = AuthProvider(api: service, prefs: prefs);

      await provider.initialize();
      expect(provider.state, AuthState.unauthenticated);
      expect(provider.isAuthenticated, false);
      expect(provider.isGuest, false);
    });

    test('initializes as authenticated when stored token exists and session valid', () async {
      SharedPreferences.setMockInitialValues({
        'cinetracker_session_token': 'saved_token_123',
      });
      final prefs = await SharedPreferences.getInstance();
      final provider = AuthProvider(api: service, prefs: prefs);

      await provider.initialize();
      expect(provider.state, AuthState.authenticated);
      expect(provider.currentUser?.username, 'alex_cinephile');
      expect(provider.isAuthenticated, true);
    });

    test('login persists token and updates state', () async {
      final prefs = await SharedPreferences.getInstance();
      final provider = AuthProvider(api: service, prefs: prefs);

      final ok = await provider.login(email: 'alex@test.com', password: 'secret');
      expect(ok, true);
      expect(provider.state, AuthState.authenticated);
      expect(prefs.getString('cinetracker_session_token'), isNotNull);
    });

    test('continueAsGuest sets guest state and guest user', () async {
      final prefs = await SharedPreferences.getInstance();
      final provider = AuthProvider(api: service, prefs: prefs);

      provider.continueAsGuest();
      expect(provider.state, AuthState.guest);
      expect(provider.isGuest, true);
      expect(provider.currentUser?.username, 'guest_cinephile');
      expect(prefs.getBool('cinetracker_is_guest'), true);
    });

    test('logout clears token and sets unauthenticated', () async {
      SharedPreferences.setMockInitialValues({
        'cinetracker_session_token': 'saved_token_123',
      });
      final prefs = await SharedPreferences.getInstance();
      final provider = AuthProvider(api: service, prefs: prefs);
      await provider.initialize();
      expect(provider.isAuthenticated, true);

      await provider.logout();
      expect(provider.state, AuthState.unauthenticated);
      expect(provider.isAuthenticated, false);
      expect(prefs.getString('cinetracker_session_token'), isNull);
    });
  });
}
