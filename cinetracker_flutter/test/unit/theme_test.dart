import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:cinetracker_flutter/core/theme/colors.dart';
import 'package:cinetracker_flutter/core/theme/typography.dart';
import 'package:cinetracker_flutter/core/theme/theme.dart';

void main() {
  group('CineColors Tokens', () {
    test('verifies graphite surface hex values', () {
      expect(CineColors.background, const Color(0xFF121212));
      expect(CineColors.surfaceGraphite, const Color(0xFF1E1E1E));
      expect(CineColors.surfaceElevated, const Color(0xFF2A2A2A));
      expect(CineColors.surfaceTranslucent, const Color(0xCC1E1E1E));
    });

    test('verifies neon green brand accent', () {
      expect(CineColors.neonGreen, const Color(0xFF00FF66));
      expect(CineColors.starActive, CineColors.neonGreen);
    });

    test('verifies hairline divider and border colors', () {
      expect(CineColors.divider, const Color(0xFF333333));
      expect(CineColors.starInactive, CineColors.divider);
    });

    test('verifies text hierarchy colors', () {
      expect(CineColors.textPrimary, CupertinoColors.white);
      expect(CineColors.textSecondary, const Color(0xFF8E8E93));
      expect(CineColors.textTertiary, const Color(0xFF636366));
    });
  });

  group('CineTypography Hierarchy', () {
    test('verifies SF Pro font sizes and weights', () {
      expect(CineTypography.largeTitle.fontSize, 34);
      expect(CineTypography.largeTitle.fontWeight, FontWeight.w700);

      expect(CineTypography.title1.fontSize, 28);
      expect(CineTypography.title2.fontSize, 22);
      expect(CineTypography.title3.fontSize, 20);

      expect(CineTypography.headline.fontSize, 17);
      expect(CineTypography.headline.fontWeight, FontWeight.w600);

      expect(CineTypography.body.fontSize, 17);
      expect(CineTypography.body.fontWeight, FontWeight.w400);

      expect(CineTypography.kpiNumber.fontSize, 40);
      expect(CineTypography.kpiNumber.fontWeight, FontWeight.w800);
    });
  });

  group('CineTheme Configuration', () {
    test('verifies dark Cupertino theme configuration', () {
      const theme = CineTheme.darkTheme;
      expect(theme.brightness, Brightness.dark);
      expect(theme.primaryColor, CineColors.neonGreen);
      expect(theme.scaffoldBackgroundColor, CineColors.background);
      expect(theme.barBackgroundColor, CineColors.surfaceTranslucent);
    });
  });
}
