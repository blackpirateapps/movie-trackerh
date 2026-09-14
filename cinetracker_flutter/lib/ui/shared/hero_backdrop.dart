import 'package:flutter/cupertino.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/cache/cine_image_cache_manager.dart';
import '../../core/theme/colors.dart';

/// Full-bleed or grouped hero backdrop artwork widget with a dark bottom gradient overlay
/// designed for Continue Watching and Media Detail headers.
class HeroBackdrop extends StatelessWidget {
  final String? backdropPath;
  final Widget? overlayChild;
  final double height;
  final double borderRadius;
  final VoidCallback? onTap;

  const HeroBackdrop({
    super.key,
    this.backdropPath,
    this.overlayChild,
    required this.height,
    this.borderRadius = 18.0,
    this.onTap,
  });

  String _formatBackdropUrl(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return 'https://image.tmdb.org/t/p/w780$cleanPath';
  }

  @override
  Widget build(BuildContext context) {
    Widget imageContent;

    if (backdropPath != null && backdropPath!.trim().isNotEmpty) {
      final url = _formatBackdropUrl(backdropPath!.trim());
      imageContent = CachedNetworkImage(
        imageUrl: url,
        cacheManager: CineImageCacheManager.instance,
        fit: BoxFit.cover,
        fadeInDuration: const Duration(milliseconds: 150),
        placeholder: (context, url) => _buildPlaceholder(),
        errorWidget: (context, url, error) => _buildPlaceholder(),
      );
    } else {
      imageContent = _buildPlaceholder();
    }

    Widget content = SizedBox(
      height: height,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          imageContent,
          // Dark gradient darkening hero artwork toward text at the bottom
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    CupertinoColors.transparent,
                    CupertinoColors.black.withOpacity(0.2),
                    CupertinoColors.black.withOpacity(0.7),
                    CineColors.surfaceGraphite.withOpacity(0.95),
                  ],
                  stops: const [0.0, 0.4, 0.75, 1.0],
                ),
              ),
            ),
          ),
          if (overlayChild != null)
            Positioned.fill(
              child: overlayChild!,
            ),
        ],
      ),
    );

    if (borderRadius > 0) {
      content = ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(color: CineColors.borderSubtle, width: 0.5),
          ),
          child: content,
        ),
      );
    }

    if (onTap != null) {
      content = GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: content,
      );
    }

    return content;
  }

  Widget _buildPlaceholder() {
    return Container(
      color: CineColors.surfaceGraphite,
      child: const Center(
        child: Icon(
          CupertinoIcons.film,
          color: CineColors.textTertiary,
          size: 48,
        ),
      ),
    );
  }
}
