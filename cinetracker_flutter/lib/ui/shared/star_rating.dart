import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import '../../core/theme/colors.dart';

/// Reusable 10-star rating component adhering to CineTracker's 1-10 rating scale.
/// Supports direct tapping, horizontal dragging, haptic feedback, and read-only display.
class StarRating extends StatefulWidget {
  /// Current rating from 0 to 10 (0 means unrated).
  final double rating;

  /// Callback triggered when user updates the rating.
  final ValueChanged<double>? onRatingChanged;

  /// Size of individual star icons.
  final double starSize;

  /// Spacing between star icons.
  final double spacing;

  /// Whether the rating is interactive or display-only.
  final bool isInteractive;

  /// Whether to show the numerical score (e.g. "9 / 10") beside or below the stars.
  final bool showLabel;

  /// Active star color (defaults to [CineColors.neonGreen]).
  final Color activeColor;

  /// Inactive star color (defaults to [CineColors.starInactive]).
  final Color inactiveColor;

  const StarRating({
    super.key,
    required this.rating,
    this.onRatingChanged,
    this.starSize = 22.0,
    this.spacing = 3.0,
    this.isInteractive = true,
    this.showLabel = false,
    this.activeColor = CineColors.neonGreen,
    this.inactiveColor = CineColors.starInactive,
  });

  @override
  State<StarRating> createState() => _StarRatingState();
}

class _StarRatingState extends State<StarRating> {
  late double _currentRating;

  @override
  void initState() {
    super.initState();
    _currentRating = widget.rating;
  }

  @override
  void didUpdateWidget(StarRating oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.rating != widget.rating) {
      _currentRating = widget.rating;
    }
  }

  void _handleTouch(Offset localPosition, double totalWidth) {
    if (!widget.isInteractive || widget.onRatingChanged == null) return;

    final starPlusSpacing = widget.starSize + widget.spacing;
    final clampedX = localPosition.dx.clamp(0.0, totalWidth);
    final rawVal = (clampedX / starPlusSpacing).ceilToDouble();
    final newRating = rawVal.clamp(1.0, 10.0);

    if (newRating != _currentRating) {
      HapticFeedback.selectionClick();
      setState(() {
        _currentRating = newRating;
      });
      widget.onRatingChanged!(newRating);
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalWidth = 10 * widget.starSize + 9 * widget.spacing;

    Widget starsRow = Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(10, (index) {
        final starNumber = index + 1;
        final isFilled = starNumber <= _currentRating;

        return Padding(
          padding: EdgeInsets.only(right: index < 9 ? widget.spacing : 0),
          child: Icon(
            isFilled ? CupertinoIcons.star_fill : CupertinoIcons.star,
            color: isFilled ? widget.activeColor : widget.inactiveColor,
            size: widget.starSize,
          ),
        );
      }),
    );

    if (widget.isInteractive && widget.onRatingChanged != null) {
      starsRow = GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (details) => _handleTouch(details.localPosition, totalWidth),
        onHorizontalDragUpdate: (details) =>
            _handleTouch(details.localPosition, totalWidth),
        child: starsRow,
      );
    }

    if (!widget.showLabel) {
      return Semantics(
        label: 'Rating: ${_currentRating.toInt()} out of 10 stars',
        value: '${_currentRating.toInt()}',
        child: starsRow,
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        starsRow,
        const SizedBox(height: 6),
        Text(
          _currentRating > 0
              ? '${_currentRating.toInt()} / 10'
              : 'Tap to Rate',
          style: TextStyle(
            color: _currentRating > 0 ? widget.activeColor : CineColors.textSecondary,
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
        ),
      ],
    );
  }
}
