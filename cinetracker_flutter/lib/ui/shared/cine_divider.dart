import 'package:flutter/cupertino.dart';
import '../../core/theme/colors.dart';

/// Hairline divider for Cupertino lists and sections.
class CineDivider extends StatelessWidget {
  final double height;
  final double thickness;
  final Color color;
  final EdgeInsetsGeometry? padding;

  const CineDivider({
    super.key,
    this.height = 0.5,
    this.thickness = 0.5,
    this.color = CineColors.divider,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    Widget line = Container(
      height: thickness,
      color: color,
    );
    if (padding != null) {
      line = Padding(padding: padding!, child: line);
    }
    return line;
  }
}
