import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/colors.dart';
import '../../../models/diary_entry.dart';
import '../../../state/media_tracking_provider.dart';
import '../../shared/media_poster.dart';

/// Chronological personal media diary screen.
/// Groups watch events by calendar date with ratings and reviews.
class DiaryScreen extends StatelessWidget {
  const DiaryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tracking = context.watch<MediaTrackingProvider>();
    final diary = tracking.diary;

    // Group entries by formatted date
    final Map<String, List<DiaryEntry>> grouped = {};
    for (final entry in diary) {
      final dateKey = DateFormat('MMMM d, yyyy').format(entry.watchedDate);
      grouped.putIfAbsent(dateKey, () => []).add(entry);
    }

    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      navigationBar: const CupertinoNavigationBar(
        backgroundColor: CineColors.surfaceTranslucent,
        border: Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
        previousPageTitle: 'Back',
        middle: Text(
          'Viewing Diary',
          style: TextStyle(color: CineColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      child: SafeArea(
        child: diary.isEmpty
            ? const Center(
                child: Text(
                  'Your diary is empty.\nWatch movies and TV shows to build your history.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: CineColors.textSecondary, height: 1.4),
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                itemCount: grouped.keys.length,
                itemBuilder: (context, index) {
                  final dateKey = grouped.keys.elementAt(index);
                  final entries = grouped[dateKey]!;

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Date Header
                      Padding(
                        padding: const EdgeInsets.only(top: 12, bottom: 8),
                        child: Text(
                          dateKey.toUpperCase(),
                          style: const TextStyle(
                            color: CineColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),

                      // Entries for this date
                      ...entries.map((entry) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: CineColors.surfaceGraphite,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              MediaPoster(
                                title: entry.title,
                                posterPath: entry.posterPath,
                                width: 44,
                                borderRadius: 8,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          entry.isMovie ? '🎬 ' : '📺 ',
                                          style: const TextStyle(fontSize: 12),
                                        ),
                                        Expanded(
                                          child: Text(
                                            entry.title,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              color: CineColors.textPrimary,
                                              fontSize: 15,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (entry.isTv && entry.seasonEpisodeCode != null) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        entry.seasonEpisodeCode!,
                                        style: const TextStyle(
                                          color: CineColors.textSecondary,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                    if (entry.rating != null) ...[
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const Icon(CupertinoIcons.star_fill,
                                              size: 11, color: CineColors.neonGreen),
                                          const SizedBox(width: 3),
                                          Text(
                                            '${entry.rating} / 10',
                                            style: const TextStyle(
                                              color: CineColors.neonGreen,
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                    if (entry.review != null && entry.review!.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        '“${entry.review}”',
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: CineColors.textTertiary,
                                          fontSize: 12,
                                          fontStyle: FontStyle.italic,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  );
                },
              ),
      ),
    );
  }
}
