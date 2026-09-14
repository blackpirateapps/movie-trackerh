import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../core/theme/colors.dart';
import '../../models/search_result.dart';
import '../../state/search_provider.dart';
import '../../state/media_tracking_provider.dart';
import '../screens/movies/movie_detail_screen.dart';
import '../screens/tv/tv_detail_screen.dart';
import '../shared/media_poster.dart';
import '../shared/cine_divider.dart';

/// Full-screen Cupertino search sheet providing unified movie & TV discovery,
/// filter segments, recent searches history, and library status indicators.
class GlobalSearchSheet extends StatefulWidget {
  const GlobalSearchSheet({super.key});

  static Future<void> show(BuildContext context) {
    return Navigator.of(context, rootNavigator: true).push<void>(
      CupertinoPageRoute(
        fullscreenDialog: true,
        builder: (ctx) => const GlobalSearchSheet(),
      ),
    );
  }

  @override
  State<GlobalSearchSheet> createState() => _GlobalSearchSheetState();
}

class _GlobalSearchSheetState extends State<GlobalSearchSheet> {
  final TextEditingController _textController = TextEditingController();

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _onItemTapped(SearchResult item) {
    if (item.isMovie) {
      Navigator.of(context).push<void>(
        CupertinoPageRoute<void>(
          builder: (ctx) => MovieDetailScreen(movieId: item.id),
        ),
      );
    } else {
      Navigator.of(context).push<void>(
        CupertinoPageRoute<void>(
          builder: (ctx) => TvDetailScreen(showId: item.id),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final searchProvider = context.watch<SearchProvider>();
    final trackingProvider = context.watch<MediaTrackingProvider>();

    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: CineColors.surfaceTranslucent,
        border: const Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () {
            searchProvider.clearSearch();
            Navigator.of(context).pop();
          },
          child: const Text('Cancel', style: TextStyle(color: CineColors.textSecondary)),
        ),
        middle: const Text(
          'Search',
          style: TextStyle(color: CineColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Search Input Field
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: CupertinoSearchTextField(
                controller: _textController,
                placeholder: 'Search movies & shows',
                placeholderStyle: const TextStyle(color: CineColors.textTertiary, fontSize: 15),
                style: const TextStyle(color: CineColors.textPrimary, fontSize: 15),
                backgroundColor: CineColors.surfaceGraphite,
                itemColor: CineColors.textSecondary,
                prefixInsets: const EdgeInsetsDirectional.fromSTEB(10, 0, 0, 0),
                onChanged: (val) => searchProvider.onQueryChanged(val),
                onSubmitted: (val) => searchProvider.executeSearch(val),
              ),
            ),

            // Segment Filter: All | Movies | TV Shows
            if (searchProvider.query.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: SizedBox(
                  width: double.infinity,
                  child: CupertinoSlidingSegmentedControl<String>(
                    groupValue: searchProvider.typeFilter,
                    backgroundColor: CineColors.surfaceGraphite,
                    thumbColor: CineColors.surfaceElevated,
                    children: {
                      'all': Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        child: Text(
                          'All Results',
                          style: TextStyle(
                            color: searchProvider.typeFilter == 'all'
                                ? CineColors.neonGreen
                                : CineColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      'movie': Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        child: Text(
                          'Movies',
                          style: TextStyle(
                            color: searchProvider.typeFilter == 'movie'
                                ? CineColors.neonGreen
                                : CineColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      'tv': Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        child: Text(
                          'TV Shows',
                          style: TextStyle(
                            color: searchProvider.typeFilter == 'tv'
                                ? CineColors.neonGreen
                                : CineColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    },
                    onValueChanged: (val) {
                      if (val != null) searchProvider.setTypeFilter(val);
                    },
                  ),
                ),
              ),

            // Main Content Area (Loading, Results, Recents, or Empty)
            Expanded(
              child: _buildBody(searchProvider, trackingProvider),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(SearchProvider search, MediaTrackingProvider tracking) {
    if (search.isSearching) {
      return const Center(
        child: CupertinoActivityIndicator(radius: 14),
      );
    }

    if (search.query.trim().isEmpty) {
      return _buildRecentSearches(search);
    }

    final results = search.filteredResults;

    if (results.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(CupertinoIcons.search, size: 48, color: CineColors.textTertiary),
            const SizedBox(height: 12),
            Text(
              'No results for "${search.query}"',
              style: const TextStyle(color: CineColors.textSecondary, fontSize: 16),
            ),
            const SizedBox(height: 4),
            const Text(
              'Try searching with a different title',
              style: TextStyle(color: CineColors.textTertiary, fontSize: 13),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: results.length,
      separatorBuilder: (context, index) => const CineDivider(),
      itemBuilder: (context, index) {
        final item = results[index];
        final isInLibrary = item.isMovie
            ? tracking.movies.any((m) => m.id == item.id && m.isWatched)
            : tracking.tvShows.any((s) => s.id == item.id);
        final isInWatchlist = item.isMovie
            ? tracking.watchlistMovies.any((m) => m.id == item.id)
            : tracking.watchlistTvShows.any((s) => s.id == item.id);

        return CupertinoButton(
          padding: const EdgeInsets.symmetric(vertical: 10),
          onPressed: () => _onItemTapped(item),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              MediaPoster(
                title: item.title,
                posterPath: item.posterPath,
                width: 48,
                borderRadius: 8,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        // Media Type Badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: CineColors.surfaceElevated,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                          ),
                          child: Text(
                            item.isMovie ? 'FILM' : 'TV SHOW',
                            style: const TextStyle(
                              color: CineColors.textSecondary,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                        if (item.yearString.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Text(
                            item.yearString,
                            style: const TextStyle(
                              color: CineColors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                        if (item.voteAverage != null && item.voteAverage! > 0) ...[
                          const SizedBox(width: 8),
                          const Icon(CupertinoIcons.star_fill,
                              color: CineColors.neonGreen, size: 10),
                          const SizedBox(width: 3),
                          Text(
                            item.voteAverage!.toStringAsFixed(1),
                            style: const TextStyle(
                              color: CineColors.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              if (isInLibrary)
                Container(
                  margin: const EdgeInsets.only(left: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: CineColors.neonGreen.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: CineColors.neonGreen, width: 0.5),
                  ),
                  child: const Text(
                    'IN LIBRARY',
                    style: TextStyle(
                      color: CineColors.neonGreen,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.3,
                    ),
                  ),
                )
              else if (isInWatchlist)
                Container(
                  margin: const EdgeInsets.only(left: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: CineColors.surfaceElevated,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                  ),
                  child: const Text(
                    'WATCHLIST',
                    style: TextStyle(
                      color: CineColors.textSecondary,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
              const SizedBox(width: 4),
              const Icon(CupertinoIcons.chevron_right, size: 14, color: CineColors.textTertiary),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRecentSearches(SearchProvider search) {
    if (search.recentSearches.isEmpty) {
      return const Center(
        child: Text(
          'Search for movies and TV series',
          style: TextStyle(color: CineColors.textTertiary, fontSize: 14),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text(
            'RECENT SEARCHES',
            style: TextStyle(
              color: CineColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: search.recentSearches.length,
            itemBuilder: (context, index) {
              final term = search.recentSearches[index];
              return CupertinoListTile(
                leading: const Icon(CupertinoIcons.clock, size: 18, color: CineColors.textTertiary),
                title: Text(
                  term,
                  style: const TextStyle(color: CineColors.textPrimary, fontSize: 15),
                ),
                trailing: CupertinoButton(
                  padding: EdgeInsets.zero,
                  onPressed: () => search.removeRecentSearch(term),
                  child: const Icon(CupertinoIcons.clear_circled_solid,
                      size: 16, color: CineColors.textTertiary),
                ),
                onTap: () {
                  _textController.text = term;
                  search.executeSearch(term);
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
