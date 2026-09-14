import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/api/api_client.dart';
import '../services/api/api_interface.dart';

enum AuthState {
  initial,
  authenticating,
  authenticated,
  guest,
  unauthenticated,
  error,
}

class AuthProvider extends ChangeNotifier {
  static const String _prefTokenKey = 'cinetracker_session_token';
  static const String _prefIsGuestKey = 'cinetracker_is_guest';

  final CineTrackerApiInterface api;
  final SharedPreferences prefs;
  final ApiClient? apiClient;

  AuthState _state = AuthState.initial;
  User? _currentUser;
  String? _token;
  String? _errorMessage;

  AuthProvider({
    required this.api,
    required this.prefs,
    this.apiClient,
  });

  // Getters
  AuthState get state => _state;
  User? get currentUser => _currentUser;
  String? get token => _token;
  String? get errorMessage => _errorMessage;

  bool get isAuthenticated => _state == AuthState.authenticated;
  bool get isGuest => _state == AuthState.guest;
  bool get isLoading => _state == AuthState.authenticating;

  // App Startup Session Initialization
  Future<void> initialize() async {
    final savedToken = prefs.getString(_prefTokenKey);
    final isGuestMode = prefs.getBool(_prefIsGuestKey) ?? false;

    if (savedToken != null && savedToken.isNotEmpty) {
      _token = savedToken;
      apiClient?.setSessionToken(savedToken);
      _state = AuthState.authenticating;
      notifyListeners();

      try {
        final user = await api.checkSession();
        if (user != null) {
          _currentUser = user;
          _state = AuthState.authenticated;
        } else {
          await _clearLocalSession();
          _state = AuthState.unauthenticated;
        }
      } catch (_) {
        await _clearLocalSession();
        _state = AuthState.unauthenticated;
      }
    } else if (isGuestMode) {
      _enterGuestModeLocally();
    } else {
      _state = AuthState.unauthenticated;
    }
    notifyListeners();
  }

  // User Login
  Future<bool> login({required String email, required String password}) async {
    _currentUser = null;
    _state = AuthState.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await api.login(email: email, password: password);
      _currentUser = result.user;
      _token = result.token ?? apiClient?.sessionToken;
      apiClient?.setSessionToken(_token);

      if (_token != null) {
        await prefs.setString(_prefTokenKey, _token!);
      } else {
        await prefs.remove(_prefTokenKey);
      }
      await prefs.remove(_prefIsGuestKey);

      _state = AuthState.authenticated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      await _clearLocalSession();
      _errorMessage = e.message;
      _state = AuthState.error;
      notifyListeners();
      return false;
    } catch (_) {
      await _clearLocalSession();
      _errorMessage = 'An unexpected error occurred during login.';
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  // User Signup
  Future<bool> signup({
    required String username,
    required String email,
    required String password,
  }) async {
    _currentUser = null;
    _state = AuthState.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await api.signup(
          username: username, email: email, password: password);
      _currentUser = result.user;
      _token = result.token ?? apiClient?.sessionToken;
      apiClient?.setSessionToken(_token);

      if (_token != null) {
        await prefs.setString(_prefTokenKey, _token!);
      } else {
        await prefs.remove(_prefTokenKey);
      }
      await prefs.remove(_prefIsGuestKey);

      _state = AuthState.authenticated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      await _clearLocalSession();
      _errorMessage = e.message;
      _state = AuthState.error;
      notifyListeners();
      return false;
    } catch (_) {
      await _clearLocalSession();
      _errorMessage = 'An unexpected error occurred during signup.';
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  // Guest Mode Activation
  void continueAsGuest() {
    _enterGuestModeLocally();
    prefs.setBool(_prefIsGuestKey, true);
    notifyListeners();
  }

  void _enterGuestModeLocally() {
    _state = AuthState.guest;
    _currentUser = const User(
      id: 0,
      username: 'guest_cinephile',
      email: 'guest@cinetracker.local',
      displayName: 'Guest Explorer',
      avatarUrl: null,
    );
  }

  // User Logout
  Future<void> logout() async {
    try {
      await api.logout();
    } catch (_) {}

    await _clearLocalSession();
    _state = AuthState.unauthenticated;
    notifyListeners();
  }

  Future<void> _clearLocalSession() async {
    _token = null;
    _currentUser = null;
    apiClient?.setSessionToken(null);
    await prefs.remove(_prefTokenKey);
    await prefs.remove(_prefIsGuestKey);
  }
}
