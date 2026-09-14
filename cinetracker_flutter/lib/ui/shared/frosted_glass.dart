import 'dart:ui';
import 'package:flutter/cupertino.dart';
import '../../core/theme/colors.dart';

/// A reusable Cupertino frosted glass container widget utilizing [BackdropFilter]
/// and [ImageFilter.blur] to create native iOS translucent materials.
class FrostedGlass extends StatelessWidget {
  /// Child widget displayed inside the frosted glass container.
  final Widget child;

  /// Corner radius of the container (default: 16.0).
  final double borderRadius;

  /// Horizontal blur sigma (default: 20.0).
  final double blurX;

  /// Vertical blur sigma (default: 20.0).
  final double blurY;

  /// Background color fill with opacity (default: [CineColors.surfaceTranslucent]).
  final Color backgroundColor;

  /// Optional border color (default: [CineColors.borderSubtle]).
  final Color? borderColor;

  /// Border width (default: 0.5 for iOS hairline).
  final double borderWidth;

  /// Internal content padding.
  final EdgeInsetsGeometry? padding;

  /// Container width.
  final double? width;

  /// Container height.
  final double? height;

  const FrostedGlass({
    super.key,
    required this.child,
    this.borderRadius = 16.0,
    this.blurX = 20.0,
    this.blurY = 20.0,
    this.backgroundColor = CineColors.surfaceTranslucent,
    this.borderColor = CineColors.borderSubtle,
    this.borderWidth = 0.5,
    this.padding,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    final border = borderColor != null
        ? Border.all(color: borderColor!, width: borderWidth)
        : null;

    final radius = BorderRadius.circular(borderRadius);

    return ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blurX, sigmaY: blurY),
        child: Container(
          width: width,
          height: height,
          padding: padding,
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: radius,
            border: border,
          ),
          child: child,
        ),
      ),
    );
  }
}
