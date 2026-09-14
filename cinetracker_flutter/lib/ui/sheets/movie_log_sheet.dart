import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../../core/theme/colors.dart';
import '../../models/movie.dart';
import '../shared/star_rating.dart';
import '../shared/media_poster.dart';

/// Cupertino bottom modal sheet for logging and reviewing movies.
/// Prompts for watched date, 1-10 star rating, optional review notes, and platform tags.
class MovieLogSheet extends StatefulWidget {
  final Movie movie;
  final Future<void> Function({
    required double rating,
    String? review,
    String? watchedWhere,
    DateTime? watchedDate,
  }) onSave;

  const MovieLogSheet({
    super.key,
    required this.movie,
    required this.onSave,
  });

  static Future<void> show(
    BuildContext context, {
    required Movie movie,
    required Future<void> Function({
      required double rating,
      String? review,
      String? watchedWhere,
      DateTime? watchedDate,
    }) onSave,
  }) {
    return showCupertinoModalPopup<void>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => MovieLogSheet(movie: movie, onSave: onSave),
    );
  }

  @override
  State<MovieLogSheet> createState() => _MovieLogSheetState();
}

class _MovieLogSheetState extends State<MovieLogSheet> {
  late DateTime _watchedDate;
  late double _rating;
  late TextEditingController _reviewController;
  String? _selectedPlatform;
  bool _isSaving = false;
  bool _showDatePicker = false;

  final List<String> _platforms = const [
    'Netflix',
    'Prime Video',
    'Hotstar',
    'Apple TV',
    'Pirated',
    'Theater',
    'Physical Disc',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _watchedDate = widget.movie.watchedDate ?? DateTime.now();
    _rating = (widget.movie.userRating ?? 8).toDouble();
    _reviewController = TextEditingController(text: widget.movie.review ?? '');
    if (widget.movie.watchedWhere.isNotEmpty) {
      _selectedPlatform = widget.movie.watchedWhere.first;
    }
  }

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (_isSaving) return;
    setState(() => _isSaving = true);
    await HapticFeedback.mediumImpact();

    try {
      await widget.onSave(
        rating: _rating,
        review: _reviewController.text.trim().isNotEmpty
            ? _reviewController.text.trim()
            : null,
        watchedWhere: _selectedPlatform,
        watchedDate: _watchedDate,
      );
      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final formattedDate = DateFormat('MMMM d, yyyy').format(_watchedDate);

    return Container(
      decoration: const BoxDecoration(
        color: CineColors.surfaceElevated,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        bottom: bottomInset + 20,
        left: 20,
        right: 20,
        top: 12,
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top drag grabber
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: CineColors.textTertiary,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Header: Poster thumbnail + Movie Title + Cancel button
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MediaPoster(
                    title: widget.movie.title,
                    posterPath: widget.movie.posterPath,
                    width: 50,
                    borderRadius: 8,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Log Movie',
                          style: TextStyle(
                            color: CineColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.movie.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: CineColors.textPrimary,
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (widget.movie.releaseYear.isNotEmpty)
                          Text(
                            widget.movie.releaseYear,
                            style: const TextStyle(
                              color: CineColors.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                      ],
                    ),
                  ),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(color: CineColors.textSecondary, fontSize: 16),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Rating Selector (1-10 stars)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                decoration: BoxDecoration(
                  color: CineColors.surfaceGraphite,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Rating',
                          style: TextStyle(
                            color: CineColors.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '★ ${_rating.toInt()} / 10',
                          style: const TextStyle(
                            color: CineColors.neonGreen,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    StarRating(
                      rating: _rating,
                      starSize: 26,
                      spacing: 5,
                      onRatingChanged: (newVal) => setState(() => _rating = newVal),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Watched Date Row with expandable CupertinoDatePicker
              Container(
                decoration: BoxDecoration(
                  color: CineColors.surfaceGraphite,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                ),
                child: Column(
                  children: [
                    CupertinoButton(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      onPressed: () =>
                          setState(() => _showDatePicker = !_showDatePicker),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Watched Date',
                            style: TextStyle(
                              color: CineColors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Row(
                            children: [
                              Text(
                                formattedDate,
                                style: const TextStyle(
                                  color: CineColors.neonGreen,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Icon(
                                _showDatePicker
                                    ? CupertinoIcons.chevron_up
                                    : CupertinoIcons.chevron_down,
                                size: 14,
                                color: CineColors.textSecondary,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (_showDatePicker)
                      SizedBox(
                        height: 180,
                        child: CupertinoDatePicker(
                          mode: CupertinoDatePickerMode.date,
                          initialDateTime: _watchedDate,
                          maximumDate: DateTime.now().add(const Duration(days: 1)),
                          minimumYear: 1950,
                          onDateTimeChanged: (date) =>
                              setState(() => _watchedDate = date),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Watched Where / Platform Tags
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: CineColors.surfaceGraphite,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Watched Where',
                      style: TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _platforms.map((platform) {
                        final isSelected = _selectedPlatform == platform;
                        return GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() {
                              _selectedPlatform = isSelected ? null : platform;
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 7),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? CineColors.neonGreen.withOpacity(0.2)
                                  : CineColors.surfaceElevated,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isSelected
                                    ? CineColors.neonGreen
                                    : CineColors.borderSubtle,
                                width: 0.5,
                              ),
                            ),
                            child: Text(
                              platform,
                              style: TextStyle(
                                color: isSelected
                                    ? CineColors.neonGreen
                                    : CineColors.textSecondary,
                                fontSize: 12,
                                fontWeight: isSelected
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Review Text Field
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: CineColors.surfaceGraphite,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Review (Optional)',
                      style: TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    CupertinoTextField(
                      controller: _reviewController,
                      placeholder: 'Share your thoughts on the movie...',
                      placeholderStyle: const TextStyle(
                        color: CineColors.textTertiary,
                        fontSize: 14,
                      ),
                      style: const TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 14,
                      ),
                      maxLines: 4,
                      minLines: 2,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: CineColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: CineColors.borderSubtle, width: 0.5),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Primary Save Button
              CupertinoButton(
                padding: const EdgeInsets.symmetric(vertical: 14),
                color: CineColors.neonGreen,
                borderRadius: BorderRadius.circular(14),
                onPressed: _isSaving ? null : _handleSave,
                child: _isSaving
                    ? const CupertinoActivityIndicator(color: CupertinoColors.black)
                    : const Text(
                        'Save to Watched',
                        style: TextStyle(
                          color: CupertinoColors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
