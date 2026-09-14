import 'package:flutter/cupertino.dart';
import 'colors.dart';

/// iOS SF Pro typographic hierarchy for CineTracker.
abstract final class CineTypography {
  /// iOS Large Title (34pt, Bold).
  static const TextStyle largeTitle = TextStyle(
    fontSize: 34,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.37,
    color: CineColors.textPrimary,
  );

  /// iOS Title 1 (28pt, Bold).
  static const TextStyle title1 = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.36,
    color: CineColors.textPrimary,
  );

  /// iOS Title 2 (22pt, Bold).
  static const TextStyle title2 = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.35,
    color: CineColors.textPrimary,
  );

  /// iOS Title 3 (20pt, Semibold).
  static const TextStyle title3 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.38,
    color: CineColors.textPrimary,
  );

  /// iOS Headline (17pt, Semibold).
  static const TextStyle headline = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.41,
    color: CineColors.textPrimary,
  );

  /// iOS Body (17pt, Regular).
  static const TextStyle body = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.41,
    color: CineColors.textPrimary,
  );

  /// iOS Callout (16pt, Regular).
  static const TextStyle callout = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.32,
    color: CineColors.textPrimary,
  );

  /// iOS Subheadline (15pt, Regular).
  static const TextStyle subheadline = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.24,
    color: CineColors.textSecondary,
  );

  /// iOS Footnote (13pt, Regular).
  static const TextStyle footnote = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.08,
    color: CineColors.textTertiary,
  );

  /// iOS Caption 1 (12pt, Regular).
  static const TextStyle caption1 = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.0,
    color: CineColors.textSecondary,
  );

  /// iOS Caption 2 (11pt, Regular).
  static const TextStyle caption2 = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.07,
    color: CineColors.textTertiary,
  );

  // --- Apple Health KPI Visualizations ---
  /// Large KPI display numbers (40pt, Extra Bold).
  static const TextStyle kpiNumber = TextStyle(
    fontSize: 40,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.5,
    color: CineColors.textPrimary,
  );

  /// KPI metric unit label (12pt, Semibold, Uppercase).
  static const TextStyle kpiLabel = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.5,
    color: CineColors.textSecondary,
  );

  // --- Cupertino Navigation Bar Styles ---
  /// Navigation bar large title.
  static const TextStyle navLargeTitle = TextStyle(
    fontSize: 34,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.37,
    color: CineColors.textPrimary,
  );

  /// Navigation bar inline title.
  static const TextStyle navTitle = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.41,
    color: CineColors.textPrimary,
  );

  /// Navigation bar action button text.
  static const TextStyle navAction = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.41,
    color: CineColors.neonGreen,
  );

  /// Tab bar label text.
  static const TextStyle tabLabel = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w500,
    letterSpacing: -0.24,
  );
}
