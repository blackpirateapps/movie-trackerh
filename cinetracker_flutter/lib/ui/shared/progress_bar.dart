import 'package:flutter/cupertino.dart';
import '../../core/theme/colors.dart';

/// An animated iOS-native progress bar with rounded ends, dark track,
/// and CineTracker neon green progress fill.
class CineProgressBar extends StatelessWidget {
  /// Progress value between 0.0 and 1.0.
  final double progress;

  /// Bar height (default: 6.0).
  final double height;

  /// Corner radius of the progress bar (default: 3.0).
  final double? borderRadius;

  /// Active fill color (defaults to [CineColors.neonGreen]).
  final Color activeColor;

  /// Inactive background track color (defaults to [CineColors.divider]).
  final Color backgroundColor;

  /// Animation duration when progress changes.
  final Duration animationDuration;

  const CineProgressBar({
    super.key,
    required this.progress,
    this.height = 6.0,
    this.borderRadius,
    this.activeColor = CineColors.neonGreen,
    this.backgroundColor = CineColors.divider,
    this.animationDuration = const Duration(milliseconds: 400),
  });

  @override
  Widget build(BuildContext context) {
    final effectiveRadius = BorderRadius.circular(borderRadius ?? (height / 2));
    final clampedProgress = progress.clamp(0.0, 1.0);

    return Semantics(
      label: 'Progress',
      value: '${(clampedProgress * 100).toInt()}%',
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: effectiveRadius,
        ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Align(
              alignment: Alignment.centerLeft,
              child: AnimatedContainer(
                duration: animationDuration,
                curve: Curves.easeOutCubic,
                width: constraints.maxWidth * clampedProgress,
                height: height,
                decoration: BoxDecoration(
                  color: activeColor,
                  borderRadius: effectiveRadius,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
