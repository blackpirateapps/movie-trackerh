import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../models/user.dart';
import '../../../state/auth_provider.dart';
import '../../../state/media_tracking_provider.dart';
import '../../shared/media_poster.dart';
import '../../shared/cine_divider.dart';
import '../movies/movie_detail_screen.dart';
import '../tv/tv_detail_screen.dart';
import '../diary/diary_screen.dart';
import '../settings/settings_screen.dart';

/// Profile Tab Screen: Personal CineTracker Identity.
/// Displays Avatar, Display Name, Bio, Lifetime Stats, Top 4 Favorites showcase,
/// Recent Activity list, and navigation links into Diary and Settings.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final tracking = context.watch<MediaTrackingProvider>();
    final user = auth.currentUser ??
        const User(
          id: 1,
          username: 'cinephile',
          email: 'alex@cinetracker.app',
          displayName: 'Alex Rivers',
          bio: 'Film enthusiast & TV critic. Chasing 500 films this year.',
        );

    final profile = tracking.userProfile;
    final top4 = tracking.top4Favorites;
    final favoriteMovies = tracking.favoriteMovies;
    final lastWatched = tracking.lastWatchedMovies;

    final totalFilms = profile != null && profile.moviesCount > 0
        ? profile.moviesCount
        : tracking.watchedMovies.length;
    final totalTv = profile != null && profile.tvShowsCount > 0
        ? profile.tvShowsCount
        : tracking.tvShows.length;
    final totalHours = profile != null && profile.hoursWatched > 0
        ? '${profile.hoursWatched}h'
        : '${(totalFilms * 2) + (totalTv * 10)}h';

    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: [
          // Cupertino Large Navigation Bar
          CupertinoSliverNavigationBar(
            backgroundColor: CineColors.surfaceTranslucent,
            border: const Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
            largeTitle: const Text('Profile', style: TextStyle(color: CineColors.textPrimary)),
            trailing: CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                Navigator.of(context).push<void>(
                  CupertinoPageRoute<void>(builder: (ctx) => const SettingsScreen()),
                );
              },
              child: const Icon(CupertinoIcons.gear, color: CineColors.textPrimary, size: 22),
            ),
          ),

          CupertinoSliverRefreshControl(
            onRefresh: () async {
              await Future.wait([
                tracking.refreshUserProfile(),
                tracking.refreshMovies(),
                tracking.refreshTvShows(),
                tracking.refreshDashboard(silent: true),
              ]);
            },
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User Header Card
                  Row(
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: CineColors.surfaceElevated,
                          border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                        ),
                        child: Center(
                          child: Text(
                            user.initials,
                            style: const TextStyle(
                              color: CineColors.neonGreen,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.safeDisplayName,
                              style: const TextStyle(
                                color: CineColors.textPrimary,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '@${user.username}',
                              style: const TextStyle(
                                color: CineColors.textSecondary,
                                fontSize: 14,
                              ),
                            ),
                            if (auth.isGuest)
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: CineColors.surfaceElevated,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'Guest Mode',
                                  style: TextStyle(color: CineColors.neonGreen, fontSize: 10),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Bio
                  if (user.bio != null && user.bio!.isNotEmpty) ...[
                    Text(
                      user.bio!,
                      style: const TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Lifetime Stats Ribbon
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                    decoration: BoxDecoration(
                      color: CineColors.surfaceGraphite,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: _buildStatItem('FILMS', '$totalFilms'),
                        ),
                        Container(width: 0.5, height: 28, color: CineColors.divider),
                        Expanded(
                          child: _buildStatItem('TV SHOWS', '$totalTv'),
                        ),
                        Container(width: 0.5, height: 28, color: CineColors.divider),
                        Expanded(
                          child: _buildStatItem('HOURS', totalHours),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // TOP 4 FAVORITES SHOWCASE
                  const Text(
                    'FAVORITES',
                    style: TextStyle(
                      color: CineColors.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (top4.isNotEmpty)
                    Row(
                      children: top4.take(4).map((item) {
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: GestureDetector(
                              onTap: () {
                                if (item.type == 'tv') {
                                  Navigator.of(context).push<void>(
                                    CupertinoPageRoute<void>(
                                      builder: (ctx) =>
                                          TvDetailScreen(showId: item.id),
                                    ),
                                  );
                                } else {
                                  Navigator.of(context).push<void>(
                                    CupertinoPageRoute<void>(
                                      builder: (ctx) =>
                                          MovieDetailScreen(movieId: item.id),
                                    ),
                                  );
                                }
                              },
                              child: Column(
                                children: [
                                  MediaPoster(
                                    title: item.title,
                                    posterPath: item.posterPath,
                                    borderRadius: 10,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      color: CineColors.textPrimary,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    )
                  else if (favoriteMovies.isNotEmpty)
                    Row(
                      children: favoriteMovies.take(4).map((movie) {
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: GestureDetector(
                              onTap: () {
                                Navigator.of(context).push<void>(
                                  CupertinoPageRoute<void>(
                                    builder: (ctx) =>
                                        MovieDetailScreen(movieId: movie.id),
                                  ),
                                );
                              },
                              child: MediaPoster(
                                title: movie.title,
                                posterPath: movie.posterPath,
                                borderRadius: 10,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    )
                  else
                    Container(
                      height: 110,
                      decoration: BoxDecoration(
                        color: CineColors.surfaceGraphite,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                      ),
                      child: const Center(
                        child: Text(
                          'Favorite titles will appear here',
                          style: TextStyle(color: CineColors.textTertiary, fontSize: 13),
                        ),
                      ),
                    ),
                  const SizedBox(height: 28),

                  // RECENT ACTIVITY
                  if (lastWatched.isNotEmpty) ...[
                    const Text(
                      'RECENT ACTIVITY',
                      style: TextStyle(
                        color: CineColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Column(
                      children: lastWatched.take(5).map((movie) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: GestureDetector(
                            onTap: () {
                              Navigator.of(context).push<void>(
                                CupertinoPageRoute<void>(
                                  builder: (ctx) => MovieDetailScreen(movieId: movie.id),
                                ),
                              );
                            },
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: CineColors.surfaceGraphite,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                              ),
                              child: Row(
                                children: [
                                  MediaPoster(
                                    title: movie.title,
                                    posterPath: movie.posterPath,
                                    width: 44,
                                    borderRadius: 8,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          movie.title,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            color: CineColors.textPrimary,
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        if (movie.userRating != null)
                                          Row(
                                            children: [
                                              const Icon(CupertinoIcons.star_fill,
                                                  size: 11, color: CineColors.neonGreen),
                                              const SizedBox(width: 3),
                                              Text(
                                                '${movie.userRating} / 10',
                                                style: const TextStyle(
                                                  color: CineColors.neonGreen,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ],
                                          ),
                                      ],
                                    ),
                                  ),
                                  const Icon(CupertinoIcons.chevron_right,
                                      size: 14, color: CineColors.textTertiary),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // QUICK NAVIGATION TILES
                  Container(
                    decoration: BoxDecoration(
                      color: CineColors.surfaceGraphite,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                    ),
                    child: Column(
                      children: [
                        CupertinoListTile(
                          leading: const Icon(CupertinoIcons.calendar, color: CineColors.neonGreen),
                          title: const Text('Viewing Diary',
                              style: TextStyle(color: CineColors.textPrimary)),
                          trailing: const Icon(CupertinoIcons.chevron_right,
                              size: 14, color: CineColors.textTertiary),
                          onTap: () {
                            Navigator.of(context).push<void>(
                              CupertinoPageRoute<void>(builder: (ctx) => const DiaryScreen()),
                            );
                          },
                        ),
                        const CineDivider(padding: EdgeInsets.only(left: 54)),
                        CupertinoListTile(
                          leading: const Icon(CupertinoIcons.gear, color: CineColors.textSecondary),
                          title: const Text('Settings & Preferences',
                              style: TextStyle(color: CineColors.textPrimary)),
                          trailing: const Icon(CupertinoIcons.chevron_right,
                              size: 14, color: CineColors.textTertiary),
                          onTap: () {
                            Navigator.of(context).push<void>(
                              CupertinoPageRoute<void>(builder: (ctx) => const SettingsScreen()),
                            );
                          },
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: CineColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: CineColors.textTertiary,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }
}
