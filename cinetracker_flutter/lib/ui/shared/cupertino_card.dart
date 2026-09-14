import 'package:flutter/cupertino.dart';
import '../../core/theme/colors.dart';

/// Cupertino grouped surface card widget with rounded corners (16-20pt),
/// subtle border contrast, and dark graphite styling without heavy drop shadows.
class CineCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final Color backgroundColor;
  final Color borderColor;
  final double borderWidth;
  final VoidCallback? onTap;
  final double? width;
  final double? height;

  const CineCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16.0),
    this.borderRadius = 18.0,
    this.backgroundColor = CineColors.surfaceGraphite,
    this.borderColor = CineColors.borderSubtle,
    this.borderWidth = 0.5,
    this.onTap,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    Widget card = Container(
      width: width,
      height: height,
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: borderColor, width: borderWidth),
      ),
      child: child,
    );

    if (onTap != null) {
      card = CupertinoButton(
        padding: EdgeInsets.zero,
        onPressed: onTap,
        pressedOpacity: 0.85,
        child: card,
      );
    }

    return card;
  }
}
