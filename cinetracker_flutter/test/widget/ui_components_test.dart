import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:cinetracker_flutter/core/theme/theme.dart';
import 'package:cinetracker_flutter/ui/shared/star_rating.dart';
import 'package:cinetracker_flutter/ui/shared/progress_bar.dart';
import 'package:cinetracker_flutter/ui/shared/cupertino_card.dart';
import 'package:cinetracker_flutter/ui/shared/cine_divider.dart';
import 'package:cinetracker_flutter/ui/shared/media_poster.dart';

void main() {
  group('UI Components Widget Tests', () {
    testWidgets('StarRating renders 10 stars and fires onRatingChanged on tap',
        (tester) async {
      double selectedRating = 0;

      await tester.pumpWidget(
        CupertinoApp(
          theme: CineTheme.darkTheme,
          home: CupertinoPageScaffold(
            child: Center(
              child: StarRating(
                rating: 6.0,
                showLabel: true,
                onRatingChanged: (newRating) {
                  selectedRating = newRating;
                },
              ),
            ),
          ),
        ),
      );

      // Verify label is rendered
      expect(find.text('6 / 10'), findsOneWidget);

      // Verify star icons are present (10 stars total)
      final starIcons = find.byType(Icon);
      expect(starIcons, findsNWidgets(10));

      // Tap on the 8th star (index 7)
      await tester.tap(starIcons.at(7));
      await tester.pumpAndSettle();

      // Expect selected rating to be 8.0
      expect(selectedRating, 8.0);
    });

    testWidgets('CineProgressBar renders clamped progress and semantics',
        (tester) async {
      await tester.pumpWidget(
        const CupertinoApp(
          theme: CineTheme.darkTheme,
          home: CupertinoPageScaffold(
            child: CineProgressBar(
              progress: 0.75,
              height: 8.0,
            ),
          ),
        ),
      );

      expect(find.byType(CineProgressBar), findsOneWidget);
      expect(find.byType(AnimatedContainer), findsOneWidget);

      // Find semantics
      final semanticsFinder = find.byWidgetPredicate(
        (widget) =>
            widget is Semantics && widget.properties.value == '75%',
      );
      expect(semanticsFinder, findsOneWidget);
    });

    testWidgets('CineCard renders child and triggers onTap callback',
        (tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        CupertinoApp(
          theme: CineTheme.darkTheme,
          home: CupertinoPageScaffold(
            child: CineCard(
              onTap: () => tapped = true,
              child: const Text('Tappable Card'),
            ),
          ),
        ),
      );

      expect(find.text('Tappable Card'), findsOneWidget);

      await tester.tap(find.text('Tappable Card'));
      await tester.pumpAndSettle();

      expect(tapped, isTrue);
    });

    testWidgets('CineDivider renders with correct thickness and padding',
        (tester) async {
      await tester.pumpWidget(
        const CupertinoApp(
          theme: CineTheme.darkTheme,
          home: CupertinoPageScaffold(
            child: CineDivider(
              thickness: 1.0,
              padding: EdgeInsets.only(left: 20),
            ),
          ),
        ),
      );

      expect(find.byType(CineDivider), findsOneWidget);
      expect(find.byType(Padding), findsWidgets);
    });

    testWidgets('MediaPoster renders placeholder fallback when posterPath is null',
        (tester) async {
      await tester.pumpWidget(
        const CupertinoApp(
          theme: CineTheme.darkTheme,
          home: CupertinoPageScaffold(
            child: MediaPoster(
              title: 'Oppenheimer',
              posterPath: null,
              rating: 9.0,
            ),
          ),
        ),
      );

      expect(find.text('Oppenheimer'), findsOneWidget);
      expect(find.text('9'), findsOneWidget);
      expect(find.byIcon(CupertinoIcons.photo), findsOneWidget);
    });
  });
}
