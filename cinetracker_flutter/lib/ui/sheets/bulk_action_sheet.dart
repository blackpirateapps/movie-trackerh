import 'package:flutter/cupertino.dart';
import '../../core/theme/colors.dart';

/// Cupertino confirmation action sheet for bulk TV show and season marking.
class BulkActionSheet {
  static Future<bool> confirmSeasonWatched(
    BuildContext context, {
    required String showTitle,
    required int seasonNumber,
    required int episodeCount,
  }) async {
    final result = await showCupertinoModalPopup<bool>(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text(
          showTitle,
          style: const TextStyle(
            color: CineColors.textPrimary,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        message: Text(
          'Mark all $episodeCount episodes in Season $seasonNumber as watched?',
          style: const TextStyle(color: CineColors.textSecondary, fontSize: 13),
        ),
        actions: [
          CupertinoActionSheetAction(
            isDefaultAction: true,
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text(
              'Mark Season Watched',
              style: TextStyle(
                color: CineColors.neonGreen,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          isDestructiveAction: true,
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text('Cancel'),
        ),
      ),
    );
    return result ?? false;
  }

  static Future<bool> confirmShowWatched(
    BuildContext context, {
    required String showTitle,
    required int totalEpisodes,
  }) async {
    final result = await showCupertinoModalPopup<bool>(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text(
          showTitle,
          style: const TextStyle(
            color: CineColors.textPrimary,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        message: Text(
          'Mark all $totalEpisodes episodes across all seasons as watched?',
          style: const TextStyle(color: CineColors.textSecondary, fontSize: 13),
        ),
        actions: [
          CupertinoActionSheetAction(
            isDefaultAction: true,
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text(
              'Mark Entire Show Watched',
              style: TextStyle(
                color: CineColors.neonGreen,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          isDestructiveAction: true,
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text('Cancel'),
        ),
      ),
    );
    return result ?? false;
  }
}
