import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app.dart';
import 'services/api/api_client.dart';
import 'services/api/mock_cinetracker_service.dart';
import 'state/auth_provider.dart';
import 'state/media_tracking_provider.dart';
import 'state/stats_provider.dart';
import 'state/search_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final apiClient = ApiClient();
  final mockService = MockCineTrackerService();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider(
            api: mockService,
            prefs: prefs,
            apiClient: apiClient,
          )..initialize(),
        ),
        ChangeNotifierProvider<MediaTrackingProvider>(
          create: (_) => MediaTrackingProvider(api: mockService)..loadInitialData(),
        ),
        ChangeNotifierProvider<StatsProvider>(
          create: (_) => StatsProvider(api: mockService)..loadStats(),
        ),
        ChangeNotifierProvider<SearchProvider>(
          create: (_) => SearchProvider(api: mockService),
        ),
      ],
      child: const CineTrackerApp(),
    ),
  );
}
