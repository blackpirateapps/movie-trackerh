import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app.dart';
import 'core/constants/api_constants.dart';
import 'services/api/api_client.dart';
import 'services/api/cinetracker_api.dart';
import 'services/api/mock_cinetracker_service.dart';
import 'state/auth_provider.dart';
import 'state/media_tracking_provider.dart';
import 'state/stats_provider.dart';
import 'state/search_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final apiClient = ApiClient(baseUrl: ApiConstants.defaultBaseUrl);
  final liveApi = CineTrackerApi(apiClient);
  final mockService = MockCineTrackerService();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider(
            api: liveApi,
            prefs: prefs,
            apiClient: apiClient,
          )..initialize(),
        ),
        ChangeNotifierProvider<MediaTrackingProvider>(
          create: (_) => MediaTrackingProvider(
            api: liveApi,
            fallbackMockApi: mockService,
          )..loadInitialData(),
        ),
        ChangeNotifierProvider<StatsProvider>(
          create: (_) => StatsProvider(
            api: liveApi,
            fallbackMockApi: mockService,
          )..loadStats(),
        ),
        ChangeNotifierProvider<SearchProvider>(
          create: (_) => SearchProvider(
            api: liveApi,
            fallbackMockApi: mockService,
          ),
        ),
      ],
      child: const CineTrackerApp(),
    ),
  );
}
