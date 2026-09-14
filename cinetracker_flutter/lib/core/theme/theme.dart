import 'package:flutter/cupertino.dart';
import 'colors.dart';
import 'typography.dart';

/// Central theme configuration for CineTracker.
abstract final class CineTheme {
  /// Dark-mode first CupertinoThemeData for CineTracker.
  static const CupertinoThemeData darkTheme = CupertinoThemeData(
    brightness: Brightness.dark,
    primaryColor: CineColors.neonGreen,
    primaryContrastingColor: CineColors.background,
    barBackgroundColor: CineColors.surfaceTranslucent,
    scaffoldBackgroundColor: CineColors.background,
    textTheme: CupertinoTextThemeData(
      primaryColor: CineColors.neonGreen,
      textStyle: CineTypography.body,
      navActionTextStyle: CineTypography.navAction,
      navTitleTextStyle: CineTypography.navTitle,
      navLargeTitleTextStyle: CineTypography.navLargeTitle,
      pickerTextStyle: CineTypography.body,
      dateTimePickerTextStyle: CineTypography.body,
      tabLabelTextStyle: CineTypography.tabLabel,
    ),
  );
}
