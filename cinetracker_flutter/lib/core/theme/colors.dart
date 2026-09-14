import 'package:flutter/cupertino.dart';

/// Design tokens for the CineTracker Cupertino theme.
/// Adheres to Apple Health × Apple TV design principles:
/// Dark graphite surfaces with deliberate neon green accents.
abstract final class CineColors {
  // --- Graphite Backgrounds & Surfaces ---
  /// Deep graphite base background (#121212).
  static const Color background = Color(0xFF121212);

  /// Grouped card surface (#1E1E1E).
  static const Color surfaceGraphite = Color(0xFF1E1E1E);

  /// Elevated surface for dialogs, modals, and sheets (#2A2A2A).
  static const Color surfaceElevated = Color(0xFF2A2A2A);

  /// Translucent graphite surface for frosted glass bar backgrounds (~80% opacity).
  static const Color surfaceTranslucent = Color(0xCC1E1E1E);

  /// Secondary translucent surface for floating chip and pill backgrounds (~60% opacity).
  static const Color surfaceTranslucentSubtle = Color(0x992A2A2A);

  // --- Brand Accent ---
  /// Signature CineTracker neon green (#00FF66).
  /// Used for active tabs, ratings, streaks, and primary CTAs.
  static const Color neonGreen = Color(0xFF00FF66);

  /// Subtle neon green tint for active badges and selection pills (~15% opacity).
  static const Color neonGreenSubtle = Color(0x2600FF66);

  // --- Dividers & Borders ---
  /// Hairline divider separating content sections (#333333).
  static const Color divider = Color(0xFF333333);

  /// Subtle white hairline border for cards and frosted surfaces (~12% opacity).
  static const Color borderSubtle = Color(0x1FFFFFFF);

  // --- Typography & Icons ---
  /// Primary text color: crisp white.
  static const Color textPrimary = CupertinoColors.white;

  /// Secondary muted text color: Apple iOS system gray (#8E8E93).
  static const Color textSecondary = Color(0xFF8E8E93);

  /// Tertiary subdued metadata color (#636366).
  static const Color textTertiary = Color(0xFF636366);

  /// Quaternary disabled/inactive label color (#48484A).
  static const Color textSubdued = Color(0xFF48484A);

  // --- Semantic & Status ---
  /// Cupertino destructive action color (#FF453A).
  static const Color destructive = Color(0xFFFF453A);

  /// Cupertino warning / alert color (#FFD60A).
  static const Color warning = Color(0xFFFFD60A);

  /// Star rating active fill color (#00FF66).
  static const Color starActive = neonGreen;

  /// Star rating inactive track color (#333333).
  static const Color starInactive = divider;
}
