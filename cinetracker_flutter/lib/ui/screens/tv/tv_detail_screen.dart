import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../models/tv_show.dart';
import '../../../models/season.dart';
import '../../../models/episode.dart';
import '../../../models/api_models.dart';
import '../../../state/media_tracking_provider.dart';
import '../../shared/hero_backdrop.dart';
import '../../shared/progress_bar.dart';
import '../../shared/star_rating.dart';
import '../../shared/cine_divider.dart';
import '../../sheets/bulk_action_sheet.dart';

/// Flagship TV Show & Episode Tracking Screen.
/// Includes cinematic backdrop hero with overall show progress,
/// Continue Watching card for the next unwatched episode,
/// Cupertino season selector, and episode rows with tap/swipe toggles.
class TvDetailScreen extends StatefulWidget {
  final int showId;

  const TvDetailScreen({super.key, required this.showId});

  @override
  State<TvDetailScreen> createState() => _TvDetailScreenState();
}

class _TvDetailScreenState extends State<TvDetailScreen> {
  TvShowDetail? _showDetail;
  int _selectedSeasonNumber = 1;
  bool _isLoading = true;
  bool _isSeasonLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadTvShow();
  }

  Future<void> _loadSeasonEpisodes(int seasonNumber) async {
    if (!mounted) return;
    setState(() {
      _isSeasonLoading = true;
    });
    try {
      final tracking = context.read<MediaTrackingProvider>();
      await tracking.getSeasonDetail(widget.showId, seasonNumber);
    } catch (_) {
    } finally {
      if (mounted) {
        setState(() {
          _isSeasonLoading = false;
        });
      }
    }
  }

  Future<void> _loadTvShow() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final tracking = context.read<MediaTrackingProvider>();
      final detail = await tracking.getTvShowDetail(widget.showId);
      int initialSeason = 1;
      if (detail.seasons.isNotEmpty) {
        final s = detail.seasons.firstWhere(
          (s) => s.seasonNumber >= 1,
          orElse: () => detail.seasons.first,
        );
        initialSeason = s.seasonNumber;
      }

      if (mounted) {
        setState(() {
          _showDetail = detail;
          _selectedSeasonNumber = initialSeason;
          _isLoading = false;
        });
      }

      await _loadSeasonEpisodes(initialSeason);
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load TV show: $e';
          _isLoading = false;
        });
      }
    }
  }

  TvShow _resolveShow(MediaTrackingProvider tracking) {
    final tracked = tracking.tvShows.where((s) => s.id == widget.showId).firstOrNull;
    if (tracked != null) return tracked;
    return _showDetail?.show ?? TvShow(id: widget.showId, name: 'Loading...');
  }

  List<Season> _resolveSeasons(MediaTrackingProvider tracking) {
    final tracked = tracking.tvShows.where((s) => s.id == widget.showId).firstOrNull;
    final baseSeasons = (tracked != null && tracked.seasons.isNotEmpty)
        ? tracked.seasons
        : (_showDetail?.seasons ?? const []);

    return baseSeasons.map((s) {
      if (s.episodes.isNotEmpty) return s;
      final cached = tracking.getCachedSeason(widget.showId, s.seasonNumber);
      if (cached != null && cached.episodes.isNotEmpty) {
        return s.copyWith(
          episodes: cached.episodes,
          episodeCount: cached.episodes.length,
        );
      }
      return s;
    }).toList();
  }

  Episode? _resolveNextEpisode(List<Season> seasons) {
    for (final season in seasons) {
      for (final ep in season.episodes) {
        if (!ep.isWatched) {
          return ep;
        }
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final tracking = context.watch<MediaTrackingProvider>();
    final show = _resolveShow(tracking);
    final seasons = _resolveSeasons(tracking);
    final nextEp = _resolveNextEpisode(seasons);

    final totalEpisodes = seasons.fold<int>(
        0, (sum, s) => sum + (s.episodes.isNotEmpty ? s.episodes.length : s.episodeCount));
    final watchedEpisodes = seasons.fold<int>(
        0, (sum, s) => sum + s.episodes.where((e) => e.isWatched).length);
    final progressFraction =
        totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes).clamp(0.0, 1.0) : 0.0;

    final currentSeason = seasons.firstWhere(
      (s) => s.seasonNumber == _selectedSeasonNumber,
      orElse: () => seasons.isNotEmpty ? seasons.first : const Season(id: 0, seasonNumber: 1, name: 'Season 1'),
    );

    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: CineColors.surfaceTranslucent,
        border: const Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
        previousPageTitle: 'Shows',
        middle: Text(
          show.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: CineColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                HapticFeedback.selectionClick();
                tracking.toggleTvFavorite(show.id);
              },
              child: Icon(
                show.isFavorite ? CupertinoIcons.heart_fill : CupertinoIcons.heart,
                color: show.isFavorite ? CineColors.destructive : CineColors.textSecondary,
                size: 22,
              ),
            ),
            CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () => _showActionSheet(context, show, seasons, tracking),
              child: const Icon(
                CupertinoIcons.ellipsis_circle,
                color: CineColors.textSecondary,
                size: 22,
              ),
            ),
          ],
        ),
      ),
      child: _isLoading
          ? const Center(child: CupertinoActivityIndicator(radius: 14))
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_errorMessage!, style: const TextStyle(color: CineColors.textSecondary)),
                      const SizedBox(height: 12),
                      CupertinoButton(onPressed: _loadTvShow, child: const Text('Try Again')),
                    ],
                  ),
                )
              : SafeArea(
                  child: ListView(
                    padding: EdgeInsets.zero,
                    children: [
                      // Hero Backdrop with Overall Progress
                      HeroBackdrop(
                        height: 240,
                        backdropPath: show.backdropPath ?? show.posterPath,
                        borderRadius: 0,
                        overlayChild: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                show.name,
                                style: const TextStyle(
                                  color: CineColors.textPrimary,
                                  fontSize: 26,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  if (show.userRating != null) ...[
                                    const Icon(CupertinoIcons.star_fill,
                                        color: CineColors.neonGreen, size: 14),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${show.userRating} / 10',
                                      style: const TextStyle(
                                        color: CineColors.neonGreen,
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                  ],
                                  Text(
                                    '$watchedEpisodes / $totalEpisodes episodes',
                                    style: const TextStyle(
                                      color: CineColors.textSecondary,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              CineProgressBar(
                                progress: progressFraction,
                                height: 7,
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Continue Watching Next Episode Card
                      if (nextEp != null)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: CineColors.surfaceGraphite,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: CineColors.neonGreen.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    CupertinoIcons.play_fill,
                                    color: CineColors.neonGreen,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'NEXT EPISODE',
                                        style: TextStyle(
                                          color: CineColors.neonGreen,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 0.8,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${nextEp.episodeCode} · ${nextEp.name}',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: CineColors.textPrimary,
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        '${nextEp.runtime} min',
                                        style: const TextStyle(
                                          color: CineColors.textSecondary,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                CupertinoButton(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  color: CineColors.neonGreen,
                                  borderRadius: BorderRadius.circular(10),
                                  onPressed: () {
                                    HapticFeedback.mediumImpact();
                                    tracking.toggleEpisodeWatched(
                                      show.id,
                                      nextEp.seasonNumber,
                                      nextEp.episodeNumber,
                                      true,
                                      watchedDate: DateTime.now().toIso8601String(),
                                    );
                                  },
                                  child: const Text(
                                    'Watched',
                                    style: TextStyle(
                                      color: CupertinoColors.black,
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                      // Season Selector
                      if (seasons.length > 1)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: seasons.map((season) {
                                final isSelected = season.seasonNumber == _selectedSeasonNumber;
                                final watchedCount =
                                    season.episodes.where((e) => e.isWatched).length;
                                final totalCount = season.episodes.isNotEmpty
                                    ? season.episodes.length
                                    : season.episodeCount;

                                return GestureDetector(
                                  onTap: () {
                                    HapticFeedback.selectionClick();
                                    if (_selectedSeasonNumber != season.seasonNumber) {
                                      setState(() => _selectedSeasonNumber = season.seasonNumber);
                                      _loadSeasonEpisodes(season.seasonNumber);
                                    }
                                  },
                                  child: Container(
                                    margin: const EdgeInsets.only(right: 8),
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 14, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? CineColors.neonGreen.withOpacity(0.18)
                                          : CineColors.surfaceGraphite,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isSelected
                                            ? CineColors.neonGreen
                                            : CineColors.borderSubtle,
                                        width: 0.5,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'Season ${season.seasonNumber}',
                                          style: TextStyle(
                                            color: isSelected
                                                ? CineColors.neonGreen
                                                : CineColors.textPrimary,
                                            fontSize: 13,
                                            fontWeight: isSelected
                                                ? FontWeight.bold
                                                : FontWeight.w500,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          '$watchedCount/$totalCount',
                                          style: TextStyle(
                                            color: isSelected
                                                ? CineColors.neonGreen
                                                : CineColors.textSecondary,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ),

                      // Season Header & Bulk Mark Season Watched
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              currentSeason.name.toUpperCase(),
                              style: const TextStyle(
                                color: CineColors.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.8,
                              ),
                            ),
                            CupertinoButton(
                              padding: EdgeInsets.zero,
                              onPressed: () async {
                                final confirmed = await BulkActionSheet.confirmSeasonWatched(
                                  context,
                                  showTitle: show.name,
                                  seasonNumber: currentSeason.seasonNumber,
                                  episodeCount: currentSeason.episodes.length,
                                );
                                if (confirmed) {
                                  await HapticFeedback.heavyImpact();
                                  await tracking.markSeasonWatched(show.id, currentSeason.seasonNumber);
                                }
                              },
                              child: const Text(
                                'Mark Season Watched',
                                style: TextStyle(
                                  color: CineColors.neonGreen,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Episodes List
                      if (_isSeasonLoading && currentSeason.episodes.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(32),
                          child: Center(
                            child: CupertinoActivityIndicator(radius: 12),
                          ),
                        )
                      else if (currentSeason.episodes.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(24),
                          child: Center(
                            child: Text(
                              'No episodes available for this season',
                              style: TextStyle(color: CineColors.textTertiary),
                            ),
                          ),
                        )
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: currentSeason.episodes.length,
                          separatorBuilder: (context, index) => const CineDivider(),
                          itemBuilder: (context, index) {
                            final episode = currentSeason.episodes[index];
                            return Dismissible(
                              key: ValueKey('ep_${episode.id}_${episode.seasonNumber}_${episode.episodeNumber}'),
                              direction: DismissDirection.startToEnd,
                              confirmDismiss: (direction) async {
                                await HapticFeedback.selectionClick();
                                await tracking.toggleEpisodeWatched(
                                  show.id,
                                  episode.seasonNumber,
                                  episode.episodeNumber,
                                  !episode.isWatched,
                                );
                                return false; // Non-destructive toggle
                              },
                              background: Container(
                                color: CineColors.neonGreen.withOpacity(0.2),
                                alignment: Alignment.centerLeft,
                                padding: const EdgeInsets.only(left: 16),
                                child: Icon(
                                  episode.isWatched
                                      ? CupertinoIcons.clear
                                      : CupertinoIcons.check_mark,
                                  color: CineColors.neonGreen,
                                ),
                              ),
                              child: CupertinoListTile(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                leading: GestureDetector(
                                  onTap: () {
                                    HapticFeedback.selectionClick();
                                    tracking.toggleEpisodeWatched(
                                      show.id,
                                      episode.seasonNumber,
                                      episode.episodeNumber,
                                      !episode.isWatched,
                                      watchedDate: DateTime.now().toIso8601String(),
                                    );
                                  },
                                  child: Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: episode.isWatched
                                          ? CineColors.neonGreen
                                          : CineColors.surfaceElevated,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: episode.isWatched
                                            ? CineColors.neonGreen
                                            : CineColors.divider,
                                        width: 1,
                                      ),
                                    ),
                                    child: Icon(
                                      episode.isWatched
                                          ? CupertinoIcons.check_mark
                                          : CupertinoIcons.circle,
                                      size: 16,
                                      color: episode.isWatched
                                          ? CupertinoColors.black
                                          : CineColors.textTertiary,
                                    ),
                                  ),
                                ),
                                title: Text(
                                  'E${episode.episodeNumber} · ${episode.name}',
                                  style: TextStyle(
                                    color: episode.isWatched
                                        ? CineColors.textSecondary
                                        : CineColors.textPrimary,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                subtitle: Text(
                                  '${episode.runtime} min${episode.airDate != null ? ' · ${episode.airDate!.year}' : ''}',
                                  style: const TextStyle(
                                    color: CineColors.textTertiary,
                                    fontSize: 12,
                                  ),
                                ),
                                trailing: episode.userRating != null
                                    ? Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(CupertinoIcons.star_fill,
                                              size: 12, color: CineColors.neonGreen),
                                          const SizedBox(width: 3),
                                          Text(
                                            '${episode.userRating}',
                                            style: const TextStyle(
                                              color: CineColors.neonGreen,
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      )
                                    : null,
                              ),
                            );
                          },
                        ),

                      const SizedBox(height: 24),

                      // Show Rating & Review section
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: CineColors.surfaceGraphite,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Your Show Rating',
                                    style: TextStyle(
                                      color: CineColors.textPrimary,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    show.userRating != null
                                        ? '${show.userRating} / 10'
                                        : 'Not Rated',
                                    style: TextStyle(
                                      color: show.userRating != null
                                          ? CineColors.neonGreen
                                          : CineColors.textSecondary,
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              StarRating(
                                rating: (show.userRating ?? 0).toDouble(),
                                starSize: 26,
                                spacing: 5,
                                onRatingChanged: (newRating) {
                                  // Update TV show rating
                                },
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
    );
  }

  void _showActionSheet(
    BuildContext context,
    TvShow show,
    List<Season> seasons,
    MediaTrackingProvider tracking,
  ) {
    showCupertinoModalPopup<void>(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text(show.name),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.of(ctx).pop();
              tracking.toggleTvWatchlist(show.id);
            },
            child: Text(
              show.inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist',
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () async {
              Navigator.of(ctx).pop();
              final totalCount = seasons.fold<int>(
                  0, (sum, s) => sum + (s.episodes.isNotEmpty ? s.episodes.length : s.episodeCount));
              final confirmed = await BulkActionSheet.confirmShowWatched(
                context,
                showTitle: show.name,
                totalEpisodes: totalCount,
              );
              if (confirmed) {
                await HapticFeedback.heavyImpact();
                await tracking.markShowWatched(show.id);
              }
            },
            child: const Text(
              'Mark Entire Show as Watched',
              style: TextStyle(color: CineColors.neonGreen, fontWeight: FontWeight.bold),
            ),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.of(ctx).pop(),
          child: const Text('Cancel'),
        ),
      ),
    );
  }
}
