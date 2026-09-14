import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cinetracker_flutter/models/user.dart';
import 'package:cinetracker_flutter/models/api_models.dart';
import 'package:cinetracker_flutter/services/api/api_client.dart';
import 'package:cinetracker_flutter/services/api/mock_cinetracker_service.dart';
import 'package:cinetracker_flutter/models/dashboard_data.dart';
import 'package:cinetracker_flutter/state/auth_provider.dart';
import 'package:cinetracker_flutter/state/media_tracking_provider.dart';

class FailingMockService extends MockCineTrackerService {
  final bool returnNullSession;
  final bool throwOnCheckSession;
  final bool throwOnLogin;
  final bool throwOnSignup;
  final bool throwOnDashboard;

  FailingMockService({
    this.returnNullSession = false,
    this.throwOnCheckSession = false,
    this.throwOnLogin = false,
    this.throwOnSignup = false,
    this.throwOnDashboard = false,
  });

  @override
  Future<DashboardData> getDashboard({int? tvShowId, bool refresh = false}) async {
    if (throwOnDashboard) {
      throw const UnauthorizedException('Unauthorized');
    }
    return super.getDashboard(tvShowId: tvShowId, refresh: refresh);
  }

  @override
  Future<User?> checkSession() async {
    if (throwOnCheckSession) {
      throw const UnauthorizedException('Session expired');
    }
    if (returnNullSession) {
      return null;
    }
    return super.checkSession();
  }

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

  @override
  Future<AuthResult> signup({
    required String username,
    required String email,
    required String password,
  }) async {
    if (throwOnSignup) {
      throw const ConflictException('Email already in use');
    }
    return super.signup(username: username, email: email, password: password);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AuthProvider State Transitions & Contract Fidelity', () {
    late MockCineTrackerService mockApi;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      mockApi = MockCineTrackerService();
    });

    test('initial state is AuthState.initial before initialize() is invoked', () async {
      final prefs = await SharedPreferences.getInstance();
      final provider = AuthProvider(api: mockApi, prefs: prefs);

      expect(provider.state, AuthState.initial);
      expect(provider.currentUser, isNull);
      expect(provider.token, isNull);
      expect(provider.errorMessage, isNull);
      expect(provider.isAuthenticated, false);
      expect(provider.isGuest, false);
      expect(provider.isLoading, false);
    });

    test('initialize() without saved credentials transitions to unauthenticated', () async {
      final prefs = await SharedPreferences.getInstance();
      final provider = AuthProvider(api: mockApi, prefs: prefs);

      final stateNotifications = <AuthState>[];
      provider.addListener(() {
        stateNotifications.add(provider.state);
      });

      await provider.initialize();

      expect(provider.state, AuthState.unauthenticated);
      expect(provider.isAuthenticated, false);
      expect(provider.isGuest, false);
      expect(provider.currentUser, isNull);
      expect(stateNotifications, [AuthState.unauthenticated]);
    });

    test('initialize() with valid saved token transitions authenticating -> authenticated', () async {
      SharedPreferences.setMockInitialValues({
        'cinetracker_session_token': 'persisted_jwt_token_999',
      });
      final prefs = await SharedPreferences.getInstance();
      final apiClient = ApiClient();
      final provider = AuthProvider(api: mockApi, prefs: prefs, apiClient: apiClient);

      final stateNotifications = <AuthState>[];
      provider.addListener(() {
        stateNotifications.add(provider.state);
      });

      await provider.initialize();

      expect(stateNotifications, [AuthState.authenticating, AuthState.authenticated]);
      expect(provider.state, AuthState.authenticated);
      expect(provider.isAuthenticated, true);
      expect(provider.isGuest, false);
      expect(provider.currentUser?.username, 'alex_cinephile');
      expect(provider.token, 'persisted_jwt_token_999');
      // ApiClient sessionToken was synchronized on startup
      expect(apiClient.sessionToken, 'persisted_jwt_token_999');
    });

    test('initialize() with invalid token transitions authenticating -> unauthenticated and clears prefs', () async {
      SharedPreferences.setMockInitialValues({
        'cinetracker_session_token': 'expired_jwt_token',
      });
      final prefs = await SharedPreferences.getInstance();
      final failingApi = FailingMockService(returnNullSession: true);
      final apiClient = ApiClient();
      final provider = AuthProvider(api: failingApi, prefs: prefs, apiClient: apiClient);

      final stateNotifications = <AuthState>[];
      provider.addListener(() {
        stateNotifications.add(provider.state);
      });

      await provider.initialize();

      expect(stateNotifications, [AuthState.authenticating, AuthState.unauthenticated]);
      expect(provider.state, AuthState.unauthenticated);
      expect(provider.isAuthenticated, false);
      expect(provider.currentUser, isNull);
      expect(provider.token, isNull);
      expect(prefs.getString('cinetracker_session_token'), isNull);
      expect(apiClient.sessionToken, isNull);
    });

    test('initialize() with throwing checkSession transitions authenticating -> unauthenticated and clears prefs', () async {
      SharedPreferences.setMockInitialValues({
        'cinetracker_session_token': 'corrupt_token',
      });
      final prefs = await SharedPreferences.getInstance();
      final failingApi = FailingMockService(throwOnCheckSession: true);
      final provider = AuthProvider(api: failingApi, prefs: prefs);

      final stateNotifications = <AuthState>[];
      provider.addListener(() {
        stateNotifications.add(provider.state);
      });

      await provider.initialize();

      expect(stateNotifications, [AuthState.authenticating, AuthState.unauthenticated]);
      expect(provider.state, AuthState.unauthenticated);
      expect(provider.isAuthenticated, false);
      expect(prefs.getString('cinetracker_session_token'), isNull);
    });

    test('initialize() with stored guest mode flag transitions to guest', () async {
      SharedPreferences.setMockInitialValues({
        'cinetracker_is_guest': true,
      });
      final prefs = await SharedPreferences.getInstance();
      final provider = AuthProvider(api: mockApi, prefs: prefs);

      await provider.initialize();

      expect(provider.state, AuthState.guest);
      expect(provider.isGuest, true);
      expect(provider.isAuthenticated, false);
      expect(provider.currentUser?.username, 'guest_cinephile');
      expect(provider.currentUser?.id, 0);
    });

    test('login() success transitions authenticating -> authenticated and clears guest flag', () async {
      SharedPreferences.setMockInitialValues({
        'cinetracker_is_guest': true,
      });
      final prefs = await SharedPreferences.getInstance();
      final provider = AuthProvider(api: mockApi, prefs: prefs);

      await provider.initialize();
      expect(provider.isGuest, true);

      final stateNotifications = <AuthState>[];
      provider.addListener(() {
        stateNotifications.add(provider.state);
      });

      final success = await provider.login(
        email: 'alex@cinetracker.app',
        password: 'valid_password',
      );

      expect(success, true);
      expect(stateNotifications, [AuthState.authenticating, AuthState.authenticated]);
      expect(provider.state, AuthState.authenticated);
      expect(provider.isAuthenticated, true);
      expect(provider.isGuest, false);
      expect(provider.currentUser?.username, 'alex_cinephile');
      expect(prefs.getString('cinetracker_session_token'), isNotNull);
      expect(prefs.getBool('cinetracker_is_guest'), isNull);
    });

    test('login() failure with ApiException transitions authenticating -> error and records message', () async {
      final prefs = await SharedPreferences.getInstance();
      final failingApi = FailingMockService(throwOnLogin: true);
      final provider = AuthProvider(api: failingApi, prefs: prefs);

      final stateNotifications = <AuthState>[];
      provider.addListener(() {
        stateNotifications.add(provider.state);
      });

      final success = await provider.login(
        email: 'wrong@cinetracker.app',
        password: 'bad_password',
      );

      expect(success, false);
      expect(stateNotifications, [AuthState.authenticating, AuthState.error]);
      expect(provider.state, AuthState.error);
      expect(provider.isAuthenticated, false);
      expect(provider.errorMessage, 'Invalid email or password');
      expect(prefs.getString('cinetracker_session_token'), isNull);
    });

    test('signup() creates new user, sets token, and transitions to authenticated', () async {
      final prefs = await SharedPreferences.getInstance();
      final provider = AuthProvider(api: mockApi, prefs: prefs);

      final stateNotifications = <AuthState>[];
      provider.addListener(() {
        stateNotifications.add(provider.state);
      });

      final success = await provider.signup(
        username: 'sara_critic',
        email: 'sara@cinetracker.app',
        password: 'secure_password_123',
      );

      expect(success, true);
      expect(stateNotifications, [AuthState.authenticating, AuthState.authenticated]);
      expect(provider.state, AuthState.authenticated);
      expect(provider.isAuthenticated, true);
      expect(provider.currentUser?.username, 'sara_critic');
      expect(prefs.getString('cinetracker_session_token'), 'mock_jwt_token_new_user');
    });

    test('continueAsGuest() sets guest state and persists to SharedPreferences', () async {
      final prefs = await SharedPreferences.getInstance();
      final provider = AuthProvider(api: mockApi, prefs: prefs);

      expect(provider.state, AuthState.initial);
      provider.continueAsGuest();

      expect(provider.state, AuthState.guest);
      expect(provider.isGuest, true);
      expect(provider.isAuthenticated, false);
      expect(provider.currentUser?.username, 'guest_cinephile');
      expect(prefs.getBool('cinetracker_is_guest'), true);
    });

    test('logout() clears user, token, SharedPreferences keys, and transitions to unauthenticated', () async {
      SharedPreferences.setMockInitialValues({
        'cinetracker_session_token': 'active_token',
        'cinetracker_is_guest': false,
      });
      final prefs = await SharedPreferences.getInstance();
      final apiClient = ApiClient();
      apiClient.setSessionToken('active_token');

      final provider = AuthProvider(api: mockApi, prefs: prefs, apiClient: apiClient);
      await provider.initialize();
      expect(provider.isAuthenticated, true);

      await provider.logout();

      expect(provider.state, AuthState.unauthenticated);
      expect(provider.isAuthenticated, false);
      expect(provider.currentUser, isNull);
      expect(provider.token, isNull);
      expect(apiClient.sessionToken, isNull);
      expect(prefs.getString('cinetracker_session_token'), isNull);
      expect(prefs.getBool('cinetracker_is_guest'), isNull);
    });

    test('login() synchronizes sessionToken to ApiClient when apiClient is provided', () async {
      final prefs = await SharedPreferences.getInstance();
      final apiClient = ApiClient();
      final provider = AuthProvider(api: mockApi, prefs: prefs, apiClient: apiClient);

      expect(apiClient.sessionToken, isNull);

      final success = await provider.login(
        email: 'alex@cinetracker.app',
        password: 'valid_password',
      );

      expect(success, true);
      expect(provider.isAuthenticated, true);
      expect(provider.token, 'mock_jwt_token_alex_2026');
      expect(apiClient.sessionToken, 'mock_jwt_token_alex_2026');
    });

    test('signup() synchronizes sessionToken to ApiClient when apiClient is provided', () async {
      final prefs = await SharedPreferences.getInstance();
      final apiClient = ApiClient();
      final provider = AuthProvider(api: mockApi, prefs: prefs, apiClient: apiClient);

      expect(apiClient.sessionToken, isNull);

      final success = await provider.signup(
        username: 'sara_critic',
        email: 'sara@cinetracker.app',
        password: 'secure_password_123',
      );

      expect(success, true);
      expect(provider.isAuthenticated, true);
      expect(provider.token, 'mock_jwt_token_new_user');
      expect(apiClient.sessionToken, 'mock_jwt_token_new_user');
    });

    test('login() failure from guest mode cleanly isolates state and nullifies currentUser', () async {
      final prefs = await SharedPreferences.getInstance();
      final failingApi = FailingMockService(throwOnLogin: true);
      final apiClient = ApiClient();
      final provider = AuthProvider(api: failingApi, prefs: prefs, apiClient: apiClient);

      provider.continueAsGuest();
      expect(provider.isGuest, true);
      expect(provider.currentUser?.username, 'guest_cinephile');
      expect(prefs.getBool('cinetracker_is_guest'), true);

      final success = await provider.login(
        email: 'bad@cinetracker.app',
        password: 'wrong_password',
      );

      expect(success, false);
      expect(provider.state, AuthState.error);
      expect(provider.currentUser, isNull);
      expect(provider.isGuest, false);
      expect(provider.isAuthenticated, false);
      expect(provider.errorMessage, 'Invalid email or password');
      expect(provider.token, isNull);
      expect(apiClient.sessionToken, isNull);
      expect(prefs.getBool('cinetracker_is_guest'), isNull);
      expect(prefs.getString('cinetracker_session_token'), isNull);
    });

    test('signup() failure from guest mode cleanly isolates state and nullifies currentUser', () async {
      final prefs = await SharedPreferences.getInstance();
      final failingApi = FailingMockService(throwOnSignup: true);
      final apiClient = ApiClient();
      final provider = AuthProvider(api: failingApi, prefs: prefs, apiClient: apiClient);

      provider.continueAsGuest();
      expect(provider.isGuest, true);
      expect(provider.currentUser?.username, 'guest_cinephile');

      final success = await provider.signup(
        username: 'new_user',
        email: 'new@cinetracker.app',
        password: 'password',
      );

      expect(success, false);
      expect(provider.state, AuthState.error);
      expect(provider.currentUser, isNull);
      expect(provider.isGuest, false);
      expect(provider.isAuthenticated, false);
      expect(apiClient.sessionToken, isNull);
      expect(prefs.getBool('cinetracker_is_guest'), isNull);
    });
  });

    group('MediaTrackingProvider Watchlist, Profile & Mock Isolation Tests', () {
      late MockCineTrackerService mockApi;

      setUp(() {
        mockApi = MockCineTrackerService();
      });

      test('loadInitialData(isGuest: false) fails on unauthenticated 401 without loading mock data', () async {
        final failingApi = FailingMockService(throwOnDashboard: true);
        final provider = MediaTrackingProvider(
          api: failingApi,
          fallbackMockApi: mockApi,
        );

        expect(provider.movies, isEmpty);
        expect(provider.dashboard, isNull);
        expect(provider.watchlistMovies, isEmpty);

        await provider.loadInitialData(isGuest: false);

        // Verify it did NOT silently fall back to mock data
        expect(provider.movies, isEmpty);
        expect(provider.dashboard, isNull);
        expect(provider.watchlistMovies, isEmpty);
        expect(provider.errorMessage, isNotNull);
      });

      test('loadInitialData(isGuest: true) loads mock data for guest mode', () async {
        final failingApi = FailingMockService(throwOnDashboard: true);
        final provider = MediaTrackingProvider(
          api: failingApi,
          fallbackMockApi: mockApi,
        );

        await provider.loadInitialData(isGuest: true);

        expect(provider.movies, isNotEmpty);
        expect(provider.dashboard, isNotNull);
        expect(provider.watchlistMovies, isNotEmpty);
        expect(provider.top4Favorites, isNotEmpty);
      });

      test('loadInitialData populates dedicated watchlistMovies from getMovies(watchlist: true)', () async {
        final provider = MediaTrackingProvider(api: mockApi);

        await provider.loadInitialData();

        expect(provider.watchlistMovies, isNotEmpty);
        expect(provider.userProfile?.top4, isNotEmpty);
        expect(provider.top4Favorites, isNotEmpty);
        expect(provider.userProfile?.hoursWatched, 187);
      });

      test('toggleMovieWatchlist optimistically adds and removes from watchlistMovies', () async {
        final provider = MediaTrackingProvider(api: mockApi);
        await provider.loadInitialData();

        final initialWatchlistCount = provider.watchlistMovies.length;
        final movieToToggle = provider.watchlistMovies.first;

        await provider.toggleMovieWatchlist(movieToToggle.id);
        expect(provider.watchlistMovies.any((m) => m.id == movieToToggle.id), false);
        expect(provider.watchlistMovies.length, initialWatchlistCount - 1);

        await provider.toggleMovieWatchlist(movieToToggle.id);
        expect(provider.watchlistMovies.any((m) => m.id == movieToToggle.id), true);
        expect(provider.watchlistMovies.length, initialWatchlistCount);
      });

      test('clearData() completely flushes all cached tracking and profile state', () async {
        final provider = MediaTrackingProvider(api: mockApi);
        await provider.loadInitialData();
        expect(provider.watchlistMovies, isNotEmpty);
        expect(provider.dashboard, isNotNull);

        provider.clearData();

        expect(provider.movies, isEmpty);
        expect(provider.watchlistMovies, isEmpty);
        expect(provider.dashboard, isNull);
        expect(provider.userProfile, isNull);
        expect(provider.top4Favorites, isEmpty);
      });
    });
  }
