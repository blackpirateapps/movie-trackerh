import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:cinetracker_flutter/core/theme/theme.dart';
import 'package:cinetracker_flutter/ui/shared/frosted_glass.dart';

void main() {
  testWidgets('FrostedGlass renders child and backdrop filter',
      (tester) async {
    await tester.pumpWidget(
      const CupertinoApp(
        theme: CineTheme.darkTheme,
        home: CupertinoPageScaffold(
          child: FrostedGlass(
            borderRadius: 16.0,
            blurX: 25.0,
            blurY: 25.0,
            child: Text('Glass Content'),
          ),
        ),
      ),
    );

    expect(find.text('Glass Content'), findsOneWidget);
    expect(find.byType(BackdropFilter), findsOneWidget);
    expect(find.byType(ClipRRect), findsOneWidget);

    final clipRRect = tester.widget<ClipRRect>(find.byType(ClipRRect));
    expect(clipRRect.borderRadius, BorderRadius.circular(16.0));
  });
}
