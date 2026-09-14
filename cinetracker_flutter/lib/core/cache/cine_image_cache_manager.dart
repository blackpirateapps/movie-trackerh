import 'package:flutter_cache_manager/flutter_cache_manager.dart';

/// Long-term persistent disk cache manager for CineTracker media assets (posters, backdrops, episode stills).
/// Images are fetched once and cached to disk with a 365-day (1 year) retention period,
/// ensuring zero network requests on repeat views and full offline availability.
class CineImageCacheManager {
  static const String key = 'cinetracker_longterm_image_cache';

  static CacheManager? _customInstance;

  /// Visible for testing to inject mock or custom cache managers
  static set customInstance(CacheManager? manager) {
    _customInstance = manager;
  }

  /// Returns active cache manager instance
  static CacheManager get instance =>
      _customInstance ?? _defaultInstance;

  static final CacheManager _defaultInstance = CacheManager(
    Config(
      key,
      stalePeriod: const Duration(days: 365), // Saved to disk for a long time (1 year)
      maxNrOfCacheObjects: 2000,
      repo: JsonCacheInfoRepository(databaseName: key),
      fileService: HttpFileService(),
    ),
  );
}
