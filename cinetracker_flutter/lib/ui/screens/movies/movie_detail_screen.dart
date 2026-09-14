import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../models/movie.dart';
import '../../../models/api_models.dart';
import '../../../state/media_tracking_provider.dart';
import '../../shared/star_rating.dart';
import '../../shared/media_poster.dart';
import '../../sheets/movie_log_sheet.dart';

/// Cinematic Cupertino Movie Detail Screen.
/// Emphasizes clear media information, 10-star interactive rating,
/// fast logging bottom sheet, and watchlist/favorite toggles.
class MovieDetailScreen extends StatefulWidget {
  final int movieId;

  const MovieDetailScreen({super.key, required this.movieId});

  @override
  State<MovieDetailScreen> createState() => _MovieDetailScreenState();
}

class _MovieDetailScreenState extends State<MovieDetailScreen> {
  MovieDetail? _movieDetail;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadMovie();
  }

  Future<void> _loadMovie() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final tracking = context.read<MediaTrackingProvider>();
      final detail = await tracking.getMovieDetail(widget.movieId);
      if (mounted) {
        setState(() {
          _movieDetail = detail;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load movie details: $e';
          _isLoading = false;
        });
      }
    }
  }

  Movie _resolveMovie(MediaTrackingProvider tracking) {
    // Check if tracking provider has optimistic updates for this movie
    final trackedMovie = tracking.movies.where((m) => m.id == widget.movieId).firstOrNull;
    if (trackedMovie != null) {
      return trackedMovie;
    }
    return _movieDetail?.movie ?? Movie(id: widget.movieId, title: 'Loading...');
  }

  @override
  Widget build(BuildContext context) {
    final tracking = context.watch<MediaTrackingProvider>();
    final movie = _resolveMovie(tracking);

    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: CineColors.surfaceTranslucent,
        border: const Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
        previousPageTitle: 'Movies',
        middle: Text(
          movie.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: CineColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () {
            HapticFeedback.selectionClick();
            tracking.toggleMovieFavorite(movie.id);
          },
          child: Icon(
            movie.isFavorite ? CupertinoIcons.heart_fill : CupertinoIcons.heart,
            color: movie.isFavorite ? CineColors.destructive : CineColors.textSecondary,
            size: 22,
          ),
        ),
      ),
      child: _isLoading
          ? const Center(child: CupertinoActivityIndicator(radius: 14))
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _errorMessage!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: CineColors.textSecondary),
                      ),
                      const SizedBox(height: 12),
                      CupertinoButton(
                        onPressed: _loadMovie,
                        child: const Text('Try Again'),
                      ),
                    ],
                  ),
                )
              : SafeArea(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Media Header: Poster + Title + Meta
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            MediaPoster(
                              title: movie.title,
                              posterPath: movie.posterPath,
                              width: 120,
                              borderRadius: 14,
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    movie.title,
                                    style: const TextStyle(
                                      color: CineColors.textPrimary,
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                      height: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    [
                                      if (movie.releaseYear.isNotEmpty) movie.releaseYear,
                                      '${movie.runtime} min',
                                      if (_movieDetail != null && _movieDetail!.genres.isNotEmpty)
                                        _movieDetail!.genres.take(2).join(', '),
                                    ].join(' · '),
                                    style: const TextStyle(
                                      color: CineColors.textSecondary,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  if (movie.voteAverage != null && movie.voteAverage! > 0) ...[
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        const Icon(
                                          CupertinoIcons.star_fill,
                                          color: CineColors.neonGreen,
                                          size: 14,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${movie.voteAverage!.toStringAsFixed(1)} TMDB',
                                          style: const TextStyle(
                                            color: CineColors.textSecondary,
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                  if (_movieDetail?.director != null) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      'Directed by ${_movieDetail!.director}',
                                      style: const TextStyle(
                                        color: CineColors.textTertiary,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Action Buttons: Watched & Watchlist
                        Row(
                          children: [
                            Expanded(
                              child: CupertinoButton(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                color: movie.isWatched
                                    ? CineColors.surfaceElevated
                                    : CineColors.neonGreen,
                                borderRadius: BorderRadius.circular(12),
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
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      movie.isWatched
                                          ? CupertinoIcons.checkmark_circle_fill
                                          : CupertinoIcons.eye_fill,
                                      size: 18,
                                      color: movie.isWatched
                                          ? CineColors.neonGreen
                                          : CupertinoColors.black,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      movie.isWatched ? 'Watched' : 'Mark Watched',
                                      style: TextStyle(
                                        color: movie.isWatched
                                            ? CineColors.textPrimary
                                            : CupertinoColors.black,
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: CupertinoButton(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                color: CineColors.surfaceElevated,
                                borderRadius: BorderRadius.circular(12),
                                onPressed: () {
                                  HapticFeedback.selectionClick();
                                  tracking.toggleMovieWatchlist(movie.id);
                                },
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      movie.inWatchlist
                                          ? CupertinoIcons.bookmark_fill
                                          : CupertinoIcons.bookmark,
                                      size: 18,
                                      color: movie.inWatchlist
                                          ? CineColors.neonGreen
                                          : CineColors.textPrimary,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      movie.inWatchlist ? 'In Watchlist' : 'Watchlist',
                                      style: TextStyle(
                                        color: movie.inWatchlist
                                            ? CineColors.neonGreen
                                            : CineColors.textPrimary,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // User Rating Section
                        Container(
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
                                    'Your Rating',
                                    style: TextStyle(
                                      color: CineColors.textPrimary,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    movie.userRating != null
                                        ? '${movie.userRating} / 10'
                                        : 'Not Rated',
                                    style: TextStyle(
                                      color: movie.userRating != null
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
                                rating: (movie.userRating ?? 0).toDouble(),
                                starSize: 26,
                                spacing: 5,
                                onRatingChanged: (newRating) {
                                  tracking.logMovie(
                                    movie.id,
                                    rating: newRating,
                                    review: movie.review,
                                    watchedWhere: movie.watchedWhere.firstOrNull,
                                    watchedDate: movie.watchedDate ?? DateTime.now(),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // User Review Note if present
                        if (movie.review != null && movie.review!.isNotEmpty) ...[
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: CineColors.surfaceGraphite,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'Your Review',
                                      style: TextStyle(
                                        color: CineColors.textSecondary,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.5,
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
                                      child: const Text(
                                        'Edit',
                                        style: TextStyle(
                                          color: CineColors.neonGreen,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '“${movie.review}”',
                                  style: const TextStyle(
                                    color: CineColors.textPrimary,
                                    fontSize: 14,
                                    fontStyle: FontStyle.italic,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],

                        // Overview Section
                        if (movie.overview != null && movie.overview!.isNotEmpty) ...[
                          const Text(
                            'OVERVIEW',
                            style: TextStyle(
                              color: CineColors.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            movie.overview!,
                            style: const TextStyle(
                              color: CineColors.textPrimary,
                              fontSize: 15,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],

                        // Cast Section
                        if (_movieDetail != null && _movieDetail!.cast.isNotEmpty) ...[
                          const Text(
                            'CAST',
                            style: TextStyle(
                              color: CineColors.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _movieDetail!.cast.take(8).map((actor) {
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: CineColors.surfaceGraphite,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                                ),
                                child: Text(
                                  actor,
                                  style: const TextStyle(
                                    color: CineColors.textPrimary,
                                    fontSize: 13,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ],
                    ),
                  ),
                ),
    );
  }
}
