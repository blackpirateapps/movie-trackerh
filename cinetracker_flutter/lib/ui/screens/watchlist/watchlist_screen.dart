import 'dart:math';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../models/movie.dart';
import '../../../models/tv_show.dart';
import '../../../state/media_tracking_provider.dart';
import '../../shared/media_poster.dart';
import '../../sheets/global_search_sheet.dart';
import '../../sheets/movie_log_sheet.dart';
import '../movies/movie_detail_screen.dart';
import '../tv/tv_detail_screen.dart';

/// Watchlist Tab Screen: organizes user's pending queue.
/// Features "Pick Something For Me" random selection card,
/// Quick Watches filter (< 100m), and Movies | TV segmentation.
class WatchlistScreen extends StatefulWidget {
  const WatchlistScreen({super.key});

  @override
  State<WatchlistScreen> createState() => _WatchlistScreenState();
}

class _WatchlistScreenState extends State<WatchlistScreen> {
  String _segment = 'movies'; // 'movies' or 'tv'
  Movie? _pickedMovie;
  TvShow? _pickedTvShow;
  final Random _random = Random();

  void _pickRandom(List<Movie> movies, List<TvShow> tvShows) {
    HapticFeedback.mediumImpact();
    setState(() {
      if (_segment == 'movies' && movies.isNotEmpty) {
        _pickedMovie = movies[_random.nextInt(movies.length)];
      } else if (_segment == 'tv' && tvShows.isNotEmpty) {
        _pickedTvShow = tvShows[_random.nextInt(tvShows.length)];
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final tracking = context.watch<MediaTrackingProvider>();
    final watchlistMovies = tracking.watchlistMovies;
    final watchlistTvShows = tracking.watchlistTvShows;

    final isEmpty = _segment == 'movies'
        ? watchlistMovies.isEmpty
        : watchlistTvShows.isEmpty;

    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      child: CustomScrollView(
        slivers: [
          CupertinoSliverNavigationBar(
            backgroundColor: CineColors.surfaceTranslucent,
            border: const Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
            largeTitle: const Text('Watchlist', style: TextStyle(color: CineColors.textPrimary)),
            trailing: CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () => GlobalSearchSheet.show(context),
              child: const Icon(CupertinoIcons.search, color: CineColors.textPrimary, size: 22),
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
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                  child: SizedBox(
                    width: double.infinity,
                    child: CupertinoSlidingSegmentedControl<String>(
                      groupValue: _segment,
                      backgroundColor: CineColors.surfaceGraphite,
                      thumbColor: CineColors.surfaceElevated,
                      children: {
                        'movies': Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: Text(
                            'Movies (${watchlistMovies.length})',
                            style: TextStyle(
                              color: _segment == 'movies'
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
                            'TV Shows (${watchlistTvShows.length})',
                            style: TextStyle(
                              color: _segment == 'tv'
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
                          setState(() {
                            _segment = val;
                            _pickedMovie = null;
                            _pickedTvShow = null;
                          });
                        }
                      },
                    ),
                  ),
                ),

                // "Pick Something For Me" Cinematic Feature Card
                if (!isEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    child: _buildPickForMeCard(
                      context,
                      watchlistMovies: watchlistMovies,
                      watchlistTvShows: watchlistTvShows,
                      tracking: tracking,
                    ),
                  ),
                ],

                // Section Header
                if (!isEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                    child: Text(
                      _segment == 'movies' ? 'ALL MOVIES IN QUEUE' : 'ALL TV SHOWS IN QUEUE',
                      style: const TextStyle(
                        color: CineColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Content List
          if (isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(CupertinoIcons.bookmark, size: 48, color: CineColors.textTertiary),
                    const SizedBox(height: 14),
                    const Text(
                      'Your watchlist is empty.',
                      style: TextStyle(color: CineColors.textSecondary, fontSize: 16),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Search for titles to save them for later.',
                      style: TextStyle(color: CineColors.textTertiary, fontSize: 13),
                    ),
                    const SizedBox(height: 16),
                    CupertinoButton(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      color: CineColors.neonGreen,
                      borderRadius: BorderRadius.circular(10),
                      onPressed: () => GlobalSearchSheet.show(context),
                      child: const Text(
                        'Find Something to Watch',
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
            )
          else
            _segment == 'movies'
                ? _buildMoviesList(watchlistMovies, tracking)
                : _buildTvList(watchlistTvShows, tracking),

          const SliverToBoxAdapter(child: SizedBox(height: 36)),
        ],
      ),
    );
  }

  Widget _buildPickForMeCard(
    BuildContext context, {
    required List<Movie> watchlistMovies,
    required List<TvShow> watchlistTvShows,
    required MediaTrackingProvider tracking,
  }) {
    final hasPick = _segment == 'movies' ? _pickedMovie != null : _pickedTvShow != null;

    return Container(
      padding: const EdgeInsets.all(18),
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
              Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: CineColors.neonGreen.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: CineColors.neonGreen, size: 16),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    "TONIGHT'S PICK",
                    style: TextStyle(
                      color: CineColors.neonGreen,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: () => _pickRandom(watchlistMovies, watchlistTvShows),
                child: Row(
                  children: [
                    const Icon(CupertinoIcons.shuffle, size: 14, color: CineColors.neonGreen),
                    const SizedBox(width: 4),
                    Text(
                      hasPick ? 'Shuffle' : 'Pick For Me',
                      style: const TextStyle(
                        color: CineColors.neonGreen,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (hasPick) ...[
            if (_segment == 'movies' && _pickedMovie != null) ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  MediaPoster(
                    title: _pickedMovie!.title,
                    posterPath: _pickedMovie!.posterPath,
                    width: 64,
                    borderRadius: 10,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _pickedMovie!.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: CineColors.textPrimary,
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_pickedMovie!.releaseYear} · ${_pickedMovie!.runtime} min',
                          style: const TextStyle(color: CineColors.textSecondary, fontSize: 13),
                        ),
                        const SizedBox(height: 10),
                        CupertinoButton(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          color: CineColors.neonGreen,
                          borderRadius: BorderRadius.circular(8),
                          onPressed: () {
                            MovieLogSheet.show(
                              context,
                              movie: _pickedMovie!,
                              onSave: ({
                                required double rating,
                                String? review,
                                String? watchedWhere,
                                DateTime? watchedDate,
                              }) async {
                                await tracking.logMovie(
                                  _pickedMovie!.id,
                                  rating: rating,
                                  review: review,
                                  watchedWhere: watchedWhere,
                                  watchedDate: watchedDate,
                                );
                              },
                            );
                          },
                          child: const Text(
                            'Mark as Watched',
                            style: TextStyle(
                              color: CupertinoColors.black,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ] else if (_segment == 'tv' && _pickedTvShow != null) ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  MediaPoster(
                    title: _pickedTvShow!.name,
                    posterPath: _pickedTvShow!.posterPath,
                    width: 64,
                    borderRadius: 10,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _pickedTvShow!.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: CineColors.textPrimary,
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_pickedTvShow!.firstAirYear} · ${_pickedTvShow!.numberOfSeasons} Seasons',
                          style: const TextStyle(color: CineColors.textSecondary, fontSize: 13),
                        ),
                        const SizedBox(height: 10),
                        CupertinoButton(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          color: CineColors.neonGreen,
                          borderRadius: BorderRadius.circular(8),
                          onPressed: () {
                            Navigator.of(context).push<void>(
                              CupertinoPageRoute<void>(
                                builder: (ctx) => TvDetailScreen(showId: _pickedTvShow!.id),
                              ),
                            );
                          },
                          child: const Text(
                            'Start Watching',
                            style: TextStyle(
                              color: CupertinoColors.black,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ] else ...[
            const Text(
              "Can't decide what to watch? Let CineTracker pick a random title from your queue.",
              style: TextStyle(color: CineColors.textSecondary, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 12),
            CupertinoButton(
              padding: const EdgeInsets.symmetric(vertical: 10),
              color: CineColors.surfaceElevated,
              borderRadius: BorderRadius.circular(10),
              onPressed: () => _pickRandom(watchlistMovies, watchlistTvShows),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(CupertinoIcons.sparkles, color: CineColors.neonGreen, size: 16),
                  SizedBox(width: 8),
                  Text(
                    'Pick something for me',
                    style: TextStyle(
                      color: CineColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMoviesList(List<Movie> movies, MediaTrackingProvider tracking) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final movie = movies[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Dismissible(
                key: ValueKey('watchlist_movie_${movie.id}'),
                direction: DismissDirection.endToStart,
                background: Container(
                  color: CineColors.destructive,
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 20),
                  child: const Icon(CupertinoIcons.trash, color: CupertinoColors.white),
                ),
                onDismissed: (direction) {
                  HapticFeedback.mediumImpact();
                  tracking.toggleMovieWatchlist(movie.id);
                },
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
                          width: 50,
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
                                  '${movie.runtime} min',
                                ].join(' · '),
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
                          onPressed: () {
                            MovieLogSheet.show(
                              context,
                              movie: movie,
                              onSave: ({
                                required double rating,
                                String? review,
                                String? watchedWhere,
                                DateTime? watchedDate,
                              }) async {
                                await tracking.logMovie(
                                  movie.id,
                                  rating: rating,
                                  review: review,
                                  watchedWhere: watchedWhere,
                                  watchedDate: watchedDate,
                                );
                              },
                            );
                          },
                          child: const Icon(
                            CupertinoIcons.check_mark_circled,
                            color: CineColors.neonGreen,
                            size: 26,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
          childCount: movies.length,
        ),
      ),
    );
  }

  Widget _buildTvList(List<TvShow> shows, MediaTrackingProvider tracking) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final show = shows[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Dismissible(
                key: ValueKey('watchlist_tv_${show.id}'),
                direction: DismissDirection.endToStart,
                background: Container(
                  color: CineColors.destructive,
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 20),
                  child: const Icon(CupertinoIcons.trash, color: CupertinoColors.white),
                ),
                onDismissed: (direction) {
                  HapticFeedback.mediumImpact();
                  tracking.toggleTvWatchlist(show.id);
                },
                child: GestureDetector(
                  onTap: () {
                    Navigator.of(context).push<void>(
                      CupertinoPageRoute<void>(
                        builder: (ctx) => TvDetailScreen(showId: show.id),
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
                          title: show.name,
                          posterPath: show.posterPath,
                          width: 50,
                          borderRadius: 8,
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
                              const SizedBox(height: 2),
                              Text(
                                '${show.firstAirYear} · ${show.numberOfSeasons} Seasons',
                                style: const TextStyle(
                                  color: CineColors.textSecondary,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(CupertinoIcons.chevron_right, size: 14, color: CineColors.textTertiary),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
          childCount: shows.length,
        ),
      ),
    );
  }
}
