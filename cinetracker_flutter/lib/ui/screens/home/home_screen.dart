import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../models/tv_show.dart';
import '../../../models/episode.dart';
import '../../../models/dashboard_data.dart';
import '../../../state/media_tracking_provider.dart';
import '../../../state/auth_provider.dart';
import '../../shared/hero_backdrop.dart';
import '../../shared/progress_bar.dart';
import '../../shared/media_poster.dart';
import '../../sheets/global_search_sheet.dart';
import '../tv/tv_detail_screen.dart';
import '../movies/movie_detail_screen.dart';

/// Flagship Home Screen: "Apple Health × Apple TV × CineTracker".
/// Dominated by Continue Watching Hero card, followed by Other Shows,
/// Recently Watched carousel, Watchlist Preview, and This Week Health summary.
class HomeScreen extends StatelessWidget {
  final VoidCallback? onNavigateToWatchlist;
  final VoidCallback? onNavigateToProfile;

  const HomeScreen({
    super.key,
    this.onNavigateToWatchlist,
    this.onNavigateToProfile,
  });

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final tracking = context.watch<MediaTrackingProvider>();
    final auth = context.watch<AuthProvider>();
    final user = auth.currentUser;
    final displayName = user?.displayName ?? user?.username ?? 'Cinephile';

    final featuredShow = tracking.featuredShow;
    final progress = tracking.dashboard?.currentlyWatching?.progress;
    final nextEp = tracking.nextEpisode;
    final otherShows = tracking.otherActiveShows;
    final lastWatchedMovies = tracking.lastWatchedMovies;
    final watchlistMovies = tracking.watchlistMovies;

    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      child: CustomScrollView(
        slivers: [
          // Cupertino Navigation Bar with Profile Avatar and Search Button
          CupertinoSliverNavigationBar(
            backgroundColor: CineColors.surfaceTranslucent,
            border: const Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
            largeTitle: Text(
              _getGreeting(),
              style: const TextStyle(color: CineColors.textPrimary),
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                CupertinoButton(
                  padding: EdgeInsets.zero,
                  onPressed: () => GlobalSearchSheet.show(context),
                  child: const Icon(
                    CupertinoIcons.search,
                    color: CineColors.textPrimary,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 8),
                CupertinoButton(
                  padding: EdgeInsets.zero,
                  onPressed: onNavigateToProfile,
                  child: Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: CineColors.surfaceElevated,
                      border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                    ),
                    child: Center(
                      child: Text(
                        displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U',
                        style: const TextStyle(
                          color: CineColors.neonGreen,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Pull to refresh
          CupertinoSliverRefreshControl(
            onRefresh: () => tracking.refreshDashboard(),
          ),

          SliverToBoxAdapter(
            child: tracking.isLoading && tracking.dashboard == null
                ? const SizedBox(
                    height: 350,
                    child: Center(child: CupertinoActivityIndicator(radius: 14)),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // User First Name Subheading
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
                        child: Text(
                          displayName,
                          style: const TextStyle(
                            color: CineColors.textSecondary,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),

                      // 1. CONTINUE WATCHING HERO (~50-60% screen height)
                      if (featuredShow != null)
                        _buildContinueWatchingHero(
                          context,
                          featuredShow: featuredShow,
                          progress: progress,
                          nextEpisode: nextEp,
                          tracking: tracking,
                        )
                      else
                        _buildEmptyHero(context),

                      const SizedBox(height: 24),

                      // 2. OTHER ACTIVE SHOWS CAROUSEL
                      if (otherShows.isNotEmpty) ...[
                        _buildSectionHeader(title: 'OTHER SHOWS'),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 150,
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            scrollDirection: Axis.horizontal,
                            itemCount: otherShows.length,
                            separatorBuilder: (context, index) => const SizedBox(width: 14),
                            itemBuilder: (context, index) {
                              final item = otherShows[index];
                              return GestureDetector(
                                onTap: () {
                                  Navigator.of(context).push<void>(
                                    CupertinoPageRoute<void>(
                                      builder: (ctx) => TvDetailScreen(showId: item.id),
                                    ),
                                  );
                                },
                                child: SizedBox(
                                  width: 90,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      MediaPoster(
                                        title: item.name,
                                        posterPath: item.posterPath,
                                        width: 90,
                                        borderRadius: 12,
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        item.name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: CineColors.textPrimary,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // 3. RECENTLY WATCHED CAROUSEL
                      if (lastWatchedMovies.isNotEmpty) ...[
                        _buildSectionHeader(title: 'RECENTLY WATCHED'),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 180,
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            scrollDirection: Axis.horizontal,
                            itemCount: lastWatchedMovies.length,
                            separatorBuilder: (context, index) => const SizedBox(width: 14),
                            itemBuilder: (context, index) {
                              final movie = lastWatchedMovies[index];
                              return GestureDetector(
                                onTap: () {
                                  Navigator.of(context).push<void>(
                                    CupertinoPageRoute<void>(
                                      builder: (ctx) => MovieDetailScreen(movieId: movie.id),
                                    ),
                                  );
                                },
                                child: SizedBox(
                                  width: 100,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      MediaPoster(
                                        title: movie.title,
                                        posterPath: movie.posterPath,
                                        width: 100,
                                        borderRadius: 12,
                                        rating: movie.userRating?.toDouble(),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        movie.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: CineColors.textPrimary,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      if (movie.userRating != null)
                                        Row(
                                          children: [
                                            const Icon(CupertinoIcons.star_fill,
                                                color: CineColors.neonGreen, size: 10),
                                            const SizedBox(width: 3),
                                            Text(
                                              '${movie.userRating}/10',
                                              style: const TextStyle(
                                                color: CineColors.neonGreen,
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ],
                                        ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // 4. WATCHLIST PREVIEW CAROUSEL
                      if (watchlistMovies.isNotEmpty) ...[
                        _buildSectionHeader(
                          title: 'FROM YOUR WATCHLIST',
                          actionText: 'See All',
                          onActionTap: onNavigateToWatchlist,
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 180,
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            scrollDirection: Axis.horizontal,
                            itemCount: watchlistMovies.take(6).length,
                            separatorBuilder: (context, index) => const SizedBox(width: 14),
                            itemBuilder: (context, index) {
                              final movie = watchlistMovies[index];
                              return GestureDetector(
                                onTap: () {
                                  Navigator.of(context).push<void>(
                                    CupertinoPageRoute<void>(
                                      builder: (ctx) => MovieDetailScreen(movieId: movie.id),
                                    ),
                                  );
                                },
                                child: SizedBox(
                                  width: 100,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      MediaPoster(
                                        title: movie.title,
                                        posterPath: movie.posterPath,
                                        width: 100,
                                        borderRadius: 12,
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        movie.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: CineColors.textPrimary,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text(
                                        '${movie.runtime} min',
                                        style: const TextStyle(
                                          color: CineColors.textTertiary,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // 5. THIS WEEK SUMMARY CARD ("Apple Health for Movies & TV")
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                        child: _buildWeeklyHealthSummary(),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildContinueWatchingHero(
    BuildContext context, {
    required TvShow featuredShow,
    ShowProgress? progress,
    Episode? nextEpisode,
    required MediaTrackingProvider tracking,
  }) {
    final screenHeight = MediaQuery.of(context).size.height;
    final heroHeight = (screenHeight * 0.48).clamp(340.0, 480.0);

    final watchedCount = progress?.watchedEpisodesCount ?? 0;
    final totalCount = progress?.totalEpisodesCount ?? featuredShow.numberOfEpisodes;
    final fraction = totalCount > 0 ? (watchedCount / totalCount).clamp(0.0, 1.0) : 0.0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GestureDetector(
        onTap: () {
          Navigator.of(context).push<void>(
            CupertinoPageRoute<void>(
              builder: (ctx) => TvDetailScreen(showId: featuredShow.id),
            ),
          );
        },
        child: HeroBackdrop(
          height: heroHeight,
          backdropPath: featuredShow.backdropPath ?? featuredShow.posterPath,
          borderRadius: 20,
          overlayChild: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Tag
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: CupertinoColors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                  ),
                  child: const Text(
                    'CONTINUE WATCHING',
                    style: TextStyle(
                      color: CineColors.neonGreen,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Show Title
                Text(
                  featuredShow.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: CineColors.textPrimary,
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 6),

                // Episode Progress Label
                Text(
                  nextEpisode != null
                      ? 'Season ${nextEpisode.seasonNumber} · Episode ${nextEpisode.episodeNumber}'
                      : 'Completed',
                  style: const TextStyle(
                    color: CineColors.textSecondary,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),

                // Progress Bar
                CineProgressBar(
                  progress: fraction,
                  height: 6,
                ),
                const SizedBox(height: 6),
                Text(
                  '$watchedCount of $totalCount episodes',
                  style: const TextStyle(
                    color: CineColors.textTertiary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 14),

                // Primary Continue Action CTA Button
                CupertinoButton(
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  color: CineColors.neonGreen,
                  borderRadius: BorderRadius.circular(12),
                  onPressed: () async {
                    await HapticFeedback.mediumImpact();
                    if (nextEpisode != null) {
                      await tracking.toggleEpisodeWatched(
                        featuredShow.id,
                        nextEpisode.seasonNumber,
                        nextEpisode.episodeNumber,
                        true,
                        watchedDate: DateTime.now().toIso8601String(),
                      );
                    } else {
                      if (context.mounted) {
                        await Navigator.of(context).push<void>(
                          CupertinoPageRoute<void>(
                            builder: (ctx) => TvDetailScreen(showId: featuredShow.id),
                          ),
                        );
                      }
                    }
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        CupertinoIcons.play_arrow_solid,
                        color: CupertinoColors.black,
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        nextEpisode != null
                            ? 'Continue · S${nextEpisode.seasonNumber} E${nextEpisode.episodeNumber}'
                            : 'View Show',
                        style: const TextStyle(
                          color: CupertinoColors.black,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyHero(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        height: 220,
        decoration: BoxDecoration(
          color: CineColors.surfaceGraphite,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: CineColors.borderSubtle, width: 0.5),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(CupertinoIcons.tv, size: 40, color: CineColors.textTertiary),
            const SizedBox(height: 12),
            const Text(
              "You're not currently following a show.",
              textAlign: TextAlign.center,
              style: TextStyle(
                color: CineColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Search and track TV series to see your progress here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: CineColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 16),
            CupertinoButton(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              color: CineColors.neonGreen,
              borderRadius: BorderRadius.circular(10),
              onPressed: () => GlobalSearchSheet.show(context),
              child: const Text(
                'Find a Show',
                style: TextStyle(
                  color: CupertinoColors.black,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWeeklyHealthSummary() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: CineColors.surfaceGraphite,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: CineColors.borderSubtle, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'THIS WEEK',
                style: TextStyle(
                  color: CineColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: CineColors.neonGreen.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Text('🔥 ', style: TextStyle(fontSize: 11)),
                    Text(
                      '5 day streak',
                      style: TextStyle(
                        color: CineColors.neonGreen,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            '12h 42m',
            style: TextStyle(
              color: CineColors.textPrimary,
              fontSize: 34,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.5,
            ),
          ),
          const Text(
            'watched',
            style: TextStyle(
              color: CineColors.textSecondary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          const Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '6',
                      style: TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'films watched',
                      style: TextStyle(color: CineColors.textSecondary, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '18',
                      style: TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'episodes watched',
                      style: TextStyle(color: CineColors.textSecondary, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader({
    required String title,
    String? actionText,
    VoidCallback? onActionTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: CineColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
          if (actionText != null)
            CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: onActionTap,
              child: Text(
                actionText,
                style: const TextStyle(
                  color: CineColors.neonGreen,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
