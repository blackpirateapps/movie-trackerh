import 'package:flutter/cupertino.dart';
import '../../core/theme/colors.dart';

/// Reusable cinematic poster widget preserving a strict 2:3 aspect ratio,
/// with rounded corners (12-16pt), graceful loading/error states, and optional badge overlays.
class MediaPoster extends StatelessWidget {
  final String? posterPath;
  final String title;
  final double? width;
  final double? height;
  final double borderRadius;
  final double? rating;
  final bool inLibrary;
  final bool inWatchlist;
  final VoidCallback? onTap;

  const MediaPoster({
    super.key,
    this.posterPath,
    required this.title,
    this.width,
    this.height,
    this.borderRadius = 14.0,
    this.rating,
    this.inLibrary = false,
    this.inWatchlist = false,
    this.onTap,
  });

  String _formatImageUrl(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return 'https://image.tmdb.org/t/p/w342$cleanPath';
  }

  @override
  Widget build(BuildContext context) {
    Widget imageContent;

    if (posterPath != null && posterPath!.trim().isNotEmpty) {
      final url = _formatImageUrl(posterPath!.trim());
      imageContent = Image.network(
        url,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return _buildPlaceholder(isLoading: true);
        },
      );
    } else {
      imageContent = _buildPlaceholder();
    }

    Widget poster = AspectRatio(
      aspectRatio: 2 / 3,
      child: Stack(
        fit: StackFit.expand,
        children: [
          imageContent,
          // Bottom subtle gradient overlay for text readability if needed
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    CupertinoColors.transparent,
                    CupertinoColors.black.withOpacity(0.3),
                  ],
                  stops: const [0.7, 1.0],
                ),
              ),
            ),
          ),
          // Rating Badge Overlay
          if (rating != null && rating! > 0)
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: CupertinoColors.black.withOpacity(0.75),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      CupertinoIcons.star_fill,
                      color: CineColors.neonGreen,
                      size: 11,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      rating! % 1 == 0
                          ? '${rating!.toInt()}'
                          : rating!.toStringAsFixed(1),
                      style: const TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          // Library / Watchlist Indicator Badge
          if (inLibrary || inWatchlist)
            Positioned(
              top: 8,
              left: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: inLibrary
                      ? CineColors.neonGreen.withOpacity(0.2)
                      : CupertinoColors.black.withOpacity(0.75),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: inLibrary ? CineColors.neonGreen : CineColors.borderSubtle,
                    width: 0.5,
                  ),
                ),
                child: Text(
                  inLibrary ? 'IN LIBRARY' : 'WATCHLIST',
                  style: TextStyle(
                    color: inLibrary ? CineColors.neonGreen : CineColors.textSecondary,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
            ),
        ],
      ),
    );

    poster = ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(borderRadius),
          border: Border.all(color: CineColors.borderSubtle, width: 0.5),
        ),
        child: poster,
      ),
    );

    if (width != null || height != null) {
      poster = SizedBox(
        width: width,
        height: height,
        child: poster,
      );
    }

    if (onTap != null) {
      poster = GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: poster,
      );
    }

    final ratingString = rating != null && rating! > 0
        ? ', rated ${rating!.toInt()} out of 10'
        : '';
    final statusString = inLibrary
        ? ', in your library'
        : inWatchlist
            ? ', in your watchlist'
            : '';

    return Semantics(
      label: '$title poster$ratingString$statusString',
      button: onTap != null,
      child: poster,
    );
  }

  Widget _buildPlaceholder({bool isLoading = false}) {
    return Container(
      color: CineColors.surfaceGraphite,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isLoading
                  ? CupertinoIcons.film
                  : CupertinoIcons.photo,
              color: CineColors.textTertiary,
              size: 28,
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                title,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: CineColors.textTertiary,
                  fontSize: 11,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
