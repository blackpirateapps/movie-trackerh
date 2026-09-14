import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../models/movie.dart';
import '../../../models/tv_show.dart';
import '../../../state/media_tracking_provider.dart';
import '../../shared/media_poster.dart';
import '../../shared/progress_bar.dart';
import '../../sheets/global_search_sheet.dart';
import '../movies/movie_detail_screen.dart';
import '../tv/tv_detail_screen.dart';
import '../diary/diary_screen.dart';

/// Library Screen: user's personal media collection.
/// Features Movies | TV Shows segmented control, Grid vs. List view toggle for movies,
/// progress-oriented TV tracking rows, and quick access to Diary.
class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  String _mediaType = 'movies'; // 'movies' or 'tv'
  String _movieFilter = 'all'; // 'all', 'watched', 'favorites', 'unrated'
  String _tvFilter = 'in_progress'; // 'in_progress', 'completed', 'favorites', 'all'
  bool _isGridView = true;

  @override
  Widget build(BuildContext context) {
    final tracking = context.watch<MediaTrackingProvider>();

    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      child: CustomScrollView(
        slivers: [
          // Cupertino Large Navigation Bar
          CupertinoSliverNavigationBar(
            backgroundColor: CineColors.surfaceTranslucent,
            border: const Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
            largeTitle: const Text('Library', style: TextStyle(color: CineColors.textPrimary)),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                CupertinoButton(
                  padding: EdgeInsets.zero,
                  onPressed: () {
                    Navigator.of(context).push<void>(
                      CupertinoPageRoute<void>(builder: (ctx) => const DiaryScreen()),
                    );
                  },
                  child: const Icon(CupertinoIcons.calendar, color: CineColors.textPrimary, size: 22),
                ),
                const SizedBox(width: 8),
                CupertinoButton(
                  padding: EdgeInsets.zero,
                  onPressed: () => GlobalSearchSheet.show(context),
                  child: const Icon(CupertinoIcons.search, color: CineColors.textPrimary, size: 22),
                ),
              ],
            ),
          ),

          CupertinoSliverRefreshControl(
            onRefresh: () async {
              await tracking.refreshMovies();
              await tracking.refreshTvShows();
            },
          ),

          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Segmented Control: Movies | TV Shows
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                  child: SizedBox(
                    width: double.infinity,
                    child: CupertinoSlidingSegmentedControl<String>(
                      groupValue: _mediaType,
                      backgroundColor: CineColors.surfaceGraphite,
                      thumbColor: CineColors.surfaceElevated,
                      children: {
                        'movies': Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: Text(
                            'Movies',
                            style: TextStyle(
                              color: _mediaType == 'movies'
                                  ? CineColors.neonGreen
                                  : CineColors.textSecondary,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        'tv': Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: Text(
                            'TV Shows',
                            style: TextStyle(
                              color: _mediaType == 'tv'
                                  ? CineColors.neonGreen
                                  : CineColors.textSecondary,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      },
                      onValueChanged: (val) {
                        if (val != null) {
                          HapticFeedback.selectionClick();
                          setState(() => _mediaType = val);
                        }
                      },
                    ),
                  ),
                ),

                // Sub-filter Row & Grid/List toggle for movies
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Filter Pills
                      Expanded(
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: _mediaType == 'movies'
                                ? [
                                    _buildFilterChip('all', 'All'),
                                    _buildFilterChip('watched', 'Watched'),
                                    _buildFilterChip('favorites', 'Favorites'),
                                    _buildFilterChip('unrated', 'Unrated'),
                                  ]
                                : [
                                    _buildTvFilterChip('in_progress', 'In Progress'),
                                    _buildTvFilterChip('completed', 'Completed'),
                                    _buildTvFilterChip('favorites', 'Favorites'),
                                    _buildTvFilterChip('all', 'All'),
                                  ],
                          ),
                        ),
                      ),

                      // Grid vs List mode toggle (movies only)
                      if (_mediaType == 'movies')
                        CupertinoButton(
                          padding: const EdgeInsets.only(left: 10),
                          onPressed: () {
                            HapticFeedback.selectionClick();
                            setState(() => _isGridView = !_isGridView);
                          },
                          child: Icon(
                            _isGridView
                                ? CupertinoIcons.list_bullet
                                : CupertinoIcons.square_grid_2x2,
                            color: CineColors.textPrimary,
                            size: 20,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Main Media Grid / List
          _mediaType == 'movies'
              ? _buildMoviesSection(tracking)
              : _buildTvSection(tracking),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _movieFilter == key;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _movieFilter = key);
      },
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? CineColors.neonGreen.withOpacity(0.18)
              : CineColors.surfaceGraphite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? CineColors.neonGreen : CineColors.borderSubtle,
            width: 0.5,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? CineColors.neonGreen : CineColors.textSecondary,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildTvFilterChip(String key, String label) {
    final isSelected = _tvFilter == key;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _tvFilter = key);
      },
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? CineColors.neonGreen.withOpacity(0.18)
              : CineColors.surfaceGraphite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? CineColors.neonGreen : CineColors.borderSubtle,
            width: 0.5,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? CineColors.neonGreen : CineColors.textSecondary,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildMoviesSection(MediaTrackingProvider tracking) {
    List<Movie> list = tracking.movies;
    if (_movieFilter == 'watched') {
      list = tracking.watchedMovies;
    } else if (_movieFilter == 'favorites') {
      list = tracking.favoriteMovies;
    } else if (_movieFilter == 'unrated') {
      list = tracking.unratedMovies;
    }

    if (list.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(CupertinoIcons.film, size: 48, color: CineColors.textTertiary),
              const SizedBox(height: 12),
              const Text(
                'No movies found in this view',
                style: TextStyle(color: CineColors.textSecondary, fontSize: 16),
              ),
              const SizedBox(height: 16),
              CupertinoButton(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                color: CineColors.neonGreen,
                borderRadius: BorderRadius.circular(10),
                onPressed: () => GlobalSearchSheet.show(context),
                child: const Text(
                  'Log a Movie',
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

    if (_isGridView) {
      return SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.58,
            crossAxisSpacing: 14,
            mainAxisSpacing: 16,
          ),
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final movie = list[index];
              return GestureDetector(
                onTap: () {
                  Navigator.of(context).push<void>(
                    CupertinoPageRoute<void>(
                      builder: (ctx) => MovieDetailScreen(movieId: movie.id),
                    ),
                  );
                },
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    MediaPoster(
                      title: movie.title,
                      posterPath: movie.posterPath,
                      borderRadius: 14,
                      rating: movie.userRating?.toDouble(),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      movie.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      [
                        if (movie.releaseYear.isNotEmpty) movie.releaseYear,
                        '${movie.runtime}m',
                      ].join(' · '),
                      style: const TextStyle(
                        color: CineColors.textTertiary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              );
            },
            childCount: list.length,
          ),
        ),
      );
    }

    // List View Mode
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final movie = list[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
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
                        width: 52,
                        borderRadius: 8,
                      ),
                      const SizedBox(width: 14),
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
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              [
                                if (movie.releaseYear.isNotEmpty) movie.releaseYear,
                                '${movie.runtime}m',
                              ].join(' · '),
                              style: const TextStyle(
                                color: CineColors.textSecondary,
                                fontSize: 13,
                              ),
                            ),
                            if (movie.userRating != null) ...[
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(CupertinoIcons.star_fill,
                                      size: 11, color: CineColors.neonGreen),
                                  const SizedBox(width: 4),
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
          },
          childCount: list.length,
        ),
      ),
    );
  }

  Widget _buildTvSection(MediaTrackingProvider tracking) {
    List<TvShow> list = tracking.tvShows;
    if (_tvFilter == 'in_progress') {
      list = tracking.inProgressTvShows;
    } else if (_tvFilter == 'completed') {
      list = tracking.completedTvShows;
    } else if (_tvFilter == 'favorites') {
      list = tracking.favoriteTvShows;
    }

    if (list.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(CupertinoIcons.tv, size: 48, color: CineColors.textTertiary),
              const SizedBox(height: 12),
              const Text(
                'No TV series in this view',
                style: TextStyle(color: CineColors.textSecondary, fontSize: 16),
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

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final show = list[index];
            final totalWatched = show.seasons.fold<int>(
                0, (sum, sea) => sum + sea.episodes.where((e) => e.isWatched).length);
            final totalEpisodes = show.numberOfEpisodes > 0
                ? show.numberOfEpisodes
                : show.seasons.fold<int>(
                    0, (sum, sea) => sum + (sea.episodes.isNotEmpty ? sea.episodes.length : sea.episodeCount));
            final fraction = totalEpisodes > 0
                ? (totalWatched / totalEpisodes).clamp(0.0, 1.0)
                : 0.0;
            final remaining = (totalEpisodes - totalWatched).clamp(0, 9999);

            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: GestureDetector(
                onTap: () {
                  Navigator.of(context).push<void>(
                    CupertinoPageRoute<void>(
                      builder: (ctx) => TvDetailScreen(showId: show.id),
                    ),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: CineColors.surfaceGraphite,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      MediaPoster(
                        title: show.name,
                        posterPath: show.posterPath,
                        width: 60,
                        borderRadius: 10,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              show.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: CineColors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              '${show.numberOfSeasons} seasons · $totalWatched of $totalEpisodes eps',
                              style: const TextStyle(
                                color: CineColors.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 8),
                            CineProgressBar(
                              progress: fraction,
                              height: 5,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              remaining == 0 ? 'Completed ✓' : '$remaining episodes remaining',
                              style: TextStyle(
                                color: remaining == 0
                                    ? CineColors.neonGreen
                                    : CineColors.textTertiary,
                                fontSize: 11,
                                fontWeight: remaining == 0 ? FontWeight.bold : FontWeight.normal,
                              ),
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
          },
          childCount: list.length,
        ),
      ),
    );
  }
}
