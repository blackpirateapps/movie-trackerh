import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cinetracker_flutter/core/theme/theme.dart';
import 'package:cinetracker_flutter/models/movie.dart';
import 'package:cinetracker_flutter/services/api/mock_cinetracker_service.dart';
import 'package:cinetracker_flutter/state/auth_provider.dart';
import 'package:cinetracker_flutter/state/media_tracking_provider.dart';
import 'package:cinetracker_flutter/state/stats_provider.dart';
import 'package:cinetracker_flutter/state/search_provider.dart';
import 'package:cinetracker_flutter/ui/navigation/tab_scaffold.dart';
import 'package:cinetracker_flutter/ui/sheets/movie_log_sheet.dart';

Widget createTestApp({
  required Widget child,
  required SharedPreferences prefs,
  MockCineTrackerService? mockService,
}) {
  final service = mockService ?? MockCineTrackerService();
  final authProvider = AuthProvider(api: service, prefs: prefs);
  authProvider.continueAsGuest();

  final mediaProvider = MediaTrackingProvider(api: service);
  final statsProvider = StatsProvider(api: service);
  final searchProvider = SearchProvider(api: service);

  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
      ChangeNotifierProvider<MediaTrackingProvider>.value(value: mediaProvider),
      ChangeNotifierProvider<StatsProvider>.value(value: statsProvider),
      ChangeNotifierProvider<SearchProvider>.value(value: searchProvider),
    ],
    child: CupertinoApp(
      theme: CineTheme.darkTheme,
      home: child,
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(SystemChannels.platform, (MethodCall methodCall) async {
      return null;
    });
  });

  group('Screens and Navigation Widget Tests', () {
    testWidgets('CineTrackerTabScaffold displays 5 tabs and switches correctly',
        (tester) async {
      final prefs = await SharedPreferences.getInstance();

      await tester.pumpWidget(
        createTestApp(
          prefs: prefs,
          child: const CineTrackerTabScaffold(),
        ),
      );
      await tester.pumpAndSettle();

      // Check tab bar icons/labels
      expect(find.text('Home'), findsWidgets);
      expect(find.text('Library'), findsWidgets);
      expect(find.text('Watchlist'), findsWidgets);
      expect(find.text('Stats'), findsWidgets);
      expect(find.text('Profile'), findsWidgets);

      // Tap on the Library tab
      await tester.tap(find.text('Library').first);
      await tester.pumpAndSettle();

      // Tap on the Stats tab
      await tester.tap(find.text('Stats').first);
      await tester.pumpAndSettle();

      // Tap on the Profile tab
      await tester.tap(find.text('Profile').first);
      await tester.pumpAndSettle();
      expect(find.text('Viewing Diary'), findsOneWidget);
    });

    testWidgets('MovieLogSheet renders logging UI and triggers onSave callback',
        (tester) async {
      tester.view.physicalSize = const Size(1000, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final prefs = await SharedPreferences.getInstance();
      double savedRating = 0;
      String? savedReview;
      String? savedWhere;

      const testMovie = Movie(
        id: 42,
        title: 'Dune: Part Two',
        runtime: 166,
      );

      await tester.pumpWidget(
        createTestApp(
          prefs: prefs,
          child: CupertinoPageScaffold(
            child: Center(
              child: Builder(
                builder: (context) {
                  return CupertinoButton(
                    onPressed: () {
                      MovieLogSheet.show(
                        context,
                        movie: testMovie,
                        onSave: ({
                          required double rating,
                          String? review,
                          String? watchedWhere,
                          DateTime? watchedDate,
                        }) async {
                          savedRating = rating;
                          savedReview = review;
                          savedWhere = watchedWhere;
                        },
                      );
                    },
                    child: const Text('Open Log Sheet'),
                  );
                },
              ),
            ),
          ),
        ),
      );

      // Open the sheet
      await tester.tap(find.text('Open Log Sheet'));
      await tester.pumpAndSettle();

      // Check sheet elements
      expect(find.text('Log Movie'), findsOneWidget);
      expect(find.text('Dune: Part Two'), findsWidgets);
      expect(find.text('Rating'), findsOneWidget);
      expect(find.text('Save to Watched'), findsOneWidget);

      // Enter a review note
      final reviewField = find.byType(CupertinoTextField);
      expect(reviewField, findsOneWidget);
      await tester.enterText(reviewField, 'Masterpiece of modern sci-fi.');

      // Tap platform tag: 'Theater'
      final theaterTag = find.text('Theater');
      expect(theaterTag, findsOneWidget);
      await tester.tap(theaterTag);
      await tester.pumpAndSettle();

      // Scroll to and tap Save button
      final saveBtn = find.widgetWithText(CupertinoButton, 'Save to Watched');
      await tester.ensureVisible(saveBtn);
      await tester.pumpAndSettle();
      await tester.tap(saveBtn);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(savedReview, 'Masterpiece of modern sci-fi.');
      expect(savedWhere, 'Theater');
      expect(savedRating, isNonNegative);
    });
  });
}
