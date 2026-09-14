import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/theme/colors.dart';
import '../../../models/user_stats.dart';
import '../../../state/stats_provider.dart';
import '../../shared/media_poster.dart';
import '../../shared/cine_divider.dart';

/// Flagship Media Statistics & Health Visualizations: "Apple Health for Movies & TV".
/// Features large KPI metrics, fl_chart watch-time area chart, 1-10 rating histogram with mode tier,
/// 365-day activity heatmap, top genres, creators & stars, hall of fame, and 7x24 habits matrix.
class StatsScreen extends StatefulWidget {
  const StatsScreen({super.key});

  @override
  State<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends State<StatsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StatsProvider>().loadStats();
    });
  }

  String _formatWatchTime(double totalHours) {
    final hours = totalHours.toInt();
    final minutes = ((totalHours - hours) * 60).toInt();
    if (hours > 0 && minutes > 0) {
      return '${hours}h ${minutes}m';
    } else if (hours > 0) {
      return '${hours}h';
    } else {
      return '${minutes}m';
    }
  }

  @override
  Widget build(BuildContext context) {
    final statsProvider = context.watch<StatsProvider>();
    final stats = statsProvider.stats;

    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      child: CustomScrollView(
        slivers: [
          // Cupertino Large Navigation Bar
          CupertinoSliverNavigationBar(
            backgroundColor: CineColors.surfaceTranslucent,
            border: const Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
            largeTitle: const Text('Stats', style: TextStyle(color: CineColors.textPrimary)),
            trailing: CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                HapticFeedback.selectionClick();
                statsProvider.refresh();
              },
              child: const Icon(CupertinoIcons.refresh, color: CineColors.textPrimary, size: 20),
            ),
          ),

          CupertinoSliverRefreshControl(
            onRefresh: () => statsProvider.refresh(),
          ),

          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Timeframe Filter Segmented Control
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 10),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildTimeframeChip(statsProvider, 'all', 'All Time'),
                        _buildTimeframeChip(statsProvider, 'year', 'Year'),
                        _buildTimeframeChip(statsProvider, 'month', 'Month'),
                        _buildTimeframeChip(statsProvider, 'week', 'Week'),
                      ],
                    ),
                  ),
                ),

                // Year Selector if timeframe == 'year'
                if (statsProvider.timeframe == 'year' && statsProvider.availableYears.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: statsProvider.availableYears.map((y) {
                          final isSelected = statsProvider.selectedYear == y;
                          return GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              statsProvider.setSelectedYear(y);
                            },
                            child: Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? CineColors.neonGreen.withOpacity(0.2)
                                    : CineColors.surfaceGraphite,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isSelected ? CineColors.neonGreen : CineColors.borderSubtle,
                                  width: 0.5,
                                ),
                              ),
                              child: Text(
                                '$y',
                                style: TextStyle(
                                  color: isSelected ? CineColors.neonGreen : CineColors.textSecondary,
                                  fontSize: 12,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),

                // Media Filter (All | Movies | TV)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                  child: SizedBox(
                    width: double.infinity,
                    child: CupertinoSlidingSegmentedControl<String>(
                      groupValue: statsProvider.media,
                      backgroundColor: CineColors.surfaceGraphite,
                      thumbColor: CineColors.surfaceElevated,
                      children: {
                        'all': _buildMediaSegmentText('All Media', statsProvider.media == 'all'),
                        'movies': _buildMediaSegmentText('Films', statsProvider.media == 'movies'),
                        'tv': _buildMediaSegmentText('TV Series', statsProvider.media == 'tv'),
                      },
                      onValueChanged: (val) {
                        if (val != null) {
                          HapticFeedback.selectionClick();
                          statsProvider.setMedia(val);
                        }
                      },
                    ),
                  ),
                ),

                if (statsProvider.isLoading && stats == null)
                  const SizedBox(
                    height: 300,
                    child: Center(child: CupertinoActivityIndicator(radius: 14)),
                  )
                else if (stats != null) ...[
                  // 1. PRIMARY KPI CARD ("Apple Health")
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: _buildPrimaryKpiCard(stats),
                  ),
                  const SizedBox(height: 20),

                  // 2. WATCH TIME AREA CHART
                  if (stats.timeSeries.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _buildWatchTimeChart(stats),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 3. RATING DISTRIBUTION HISTOGRAM (1-10)
                  if (stats.ratingDistribution.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _buildRatingDistributionCard(stats),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 4. 365-DAY ACTIVITY HEATMAP
                  if (stats.activityHeatmap.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _buildHeatmapCard(stats),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 5. TOP GENRES BREAKDOWN
                  if (stats.topGenres.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _buildTopGenresCard(stats),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 6. CREATORS & STARS
                  if (stats.topCreators.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _buildCreatorsCard(stats),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 7. HALL OF FAME
                  if (stats.hallOfFame.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _buildHallOfFameCard(stats),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 8. 7x24 WATCHING HABITS MATRIX
                  if (stats.hourlyHabitMatrix.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _buildHabitsMatrixCard(stats),
                    ),
                    const SizedBox(height: 20),
                  ],
                ],

                const SizedBox(height: 40),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeframeChip(StatsProvider provider, String key, String label) {
    final isSelected = provider.timeframe == key;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        provider.setTimeframe(key);
      },
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? CineColors.neonGreen.withOpacity(0.18) : CineColors.surfaceGraphite,
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
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildMediaSegmentText(String label, bool isSelected) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? CineColors.neonGreen : CineColors.textSecondary,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildPrimaryKpiCard(UserStats stats) {
    return Container(
      padding: const EdgeInsets.all(22),
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
                'LIFETIME PROGRESS',
                style: TextStyle(
                  color: CineColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                ),
              ),
              if (stats.cached)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: CineColors.surfaceElevated,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'Cached (24h)',
                    style: TextStyle(color: CineColors.textTertiary, fontSize: 10),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _formatWatchTime(stats.totalHours),
            style: const TextStyle(
              color: CineColors.textPrimary,
              fontSize: 40,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.5,
            ),
          ),
          const Text(
            'total watched',
            style: TextStyle(color: CineColors.textSecondary, fontSize: 14),
          ),
          const SizedBox(height: 18),
          const CineDivider(),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${stats.moviesCount}',
                      style: const TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Text(
                      'Films',
                      style: TextStyle(color: CineColors.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${stats.episodesCount}',
                      style: const TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Text(
                      'Episodes',
                      style: TextStyle(color: CineColors.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(CupertinoIcons.star_fill,
                            size: 14, color: CineColors.neonGreen),
                        const SizedBox(width: 4),
                        Text(
                          stats.averageRating > 0
                              ? stats.averageRating.toStringAsFixed(1)
                              : '—',
                          style: const TextStyle(
                            color: CineColors.textPrimary,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const Text(
                      'Avg Rating',
                      style: TextStyle(color: CineColors.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Text(
                '🔥 Current Streak: ${stats.currentStreak} days',
                style: const TextStyle(
                  color: CineColors.neonGreen,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Text(
                'Longest: ${stats.longestStreak} days',
                style: const TextStyle(
                  color: CineColors.textSecondary,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWatchTimeChart(UserStats stats) {
    final spots = <FlSpot>[];
    for (int i = 0; i < stats.timeSeries.length; i++) {
      spots.add(FlSpot(i.toDouble(), stats.timeSeries[i].totalHours));
    }

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
          const Text(
            'WATCH TIME & VELOCITY',
            style: TextStyle(
              color: CineColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => const FlLine(
                    color: CineColors.divider,
                    strokeWidth: 0.5,
                  ),
                ),
                titlesData: const FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: CineColors.neonGreen,
                    barWidth: 2.5,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          CineColors.neonGreen.withOpacity(0.28),
                          CineColors.neonGreen.withOpacity(0.0),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingDistributionCard(UserStats stats) {
    final mode = stats.modeRating;
    final maxCount = stats.ratingDistribution.fold<int>(
        1, (max, item) => item.count > max ? item.count : max);

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
                'RATING SPECTRUM (1-10)',
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
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Mode: ★ $mode/10',
                  style: const TextStyle(
                    color: CineColors.neonGreen,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Column(
            children: stats.ratingDistribution.map((item) {
              final isMode = item.rating == mode;
              final fraction = maxCount > 0 ? (item.count / maxCount).clamp(0.0, 1.0) : 0.0;

              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    SizedBox(
                      width: 24,
                      child: Text(
                        '★ ${item.rating}',
                        style: TextStyle(
                          color: isMode ? CineColors.neonGreen : CineColors.textSecondary,
                          fontSize: 11,
                          fontWeight: isMode ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        height: 12,
                        decoration: BoxDecoration(
                          color: CineColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: fraction,
                          child: Container(
                            decoration: BoxDecoration(
                              color: isMode ? CineColors.neonGreen : CineColors.textSecondary,
                              borderRadius: BorderRadius.circular(6),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 24,
                      child: Text(
                        '${item.count}',
                        textAlign: TextAlign.end,
                        style: TextStyle(
                          color: isMode ? CineColors.neonGreen : CineColors.textTertiary,
                          fontSize: 11,
                          fontWeight: isMode ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildHeatmapCard(UserStats stats) {
    Color getColorForLevel(int level) {
      switch (level) {
        case 1:
          return CineColors.neonGreen.withOpacity(0.3);
        case 2:
          return CineColors.neonGreen.withOpacity(0.55);
        case 3:
          return CineColors.neonGreen.withOpacity(0.8);
        case 4:
          return CineColors.neonGreen;
        default:
          return CineColors.surfaceElevated;
      }
    }

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
          const Text(
            '365-DAY ACTIVITY HEATMAP',
            style: TextStyle(
              color: CineColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 14),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: List.generate((stats.activityHeatmap.length / 7).ceil(), (colIndex) {
                return Column(
                  children: List.generate(7, (rowIndex) {
                    final index = colIndex * 7 + rowIndex;
                    if (index >= stats.activityHeatmap.length) {
                      return const SizedBox(width: 10, height: 10);
                    }
                    final day = stats.activityHeatmap[index];
                    return Container(
                      width: 10,
                      height: 10,
                      margin: const EdgeInsets.all(1.5),
                      decoration: BoxDecoration(
                        color: getColorForLevel(day.level),
                        borderRadius: BorderRadius.circular(2.5),
                      ),
                    );
                  }),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopGenresCard(UserStats stats) {
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
          const Text(
            'TOP GENRES',
            style: TextStyle(
              color: CineColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 14),
          Column(
            children: stats.topGenres.take(5).map((g) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          g.name,
                          style: const TextStyle(
                            color: CineColors.textPrimary,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '${g.percentage.toStringAsFixed(0)}% (${g.count})',
                          style: const TextStyle(
                            color: CineColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 6,
                        color: CineColors.surfaceElevated,
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: (g.percentage / 100.0).clamp(0.0, 1.0),
                          child: Container(color: CineColors.neonGreen),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildCreatorsCard(UserStats stats) {
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
          const Text(
            'MOST WATCHED CREATORS & STARS',
            style: TextStyle(
              color: CineColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 12),
          Column(
            children: stats.topCreators.take(5).map((c) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: CineColors.surfaceElevated,
                      ),
                      child: Center(
                        child: Text(
                          c.name.isNotEmpty ? c.name[0] : '?',
                          style: const TextStyle(
                            color: CineColors.neonGreen,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            c.name,
                            style: const TextStyle(
                              color: CineColors.textPrimary,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            c.role,
                            style: const TextStyle(
                              color: CineColors.textTertiary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '${c.count} titles',
                      style: const TextStyle(
                        color: CineColors.textSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildHallOfFameCard(UserStats stats) {
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
          const Text(
            'HALL OF FAME',
            style: TextStyle(
              color: CineColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 150,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: stats.hallOfFame.length,
              separatorBuilder: (context, index) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final item = stats.hallOfFame[index];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    MediaPoster(
                      title: item.title,
                      posterPath: item.posterPath,
                      width: 80,
                      borderRadius: 10,
                      rating: item.rating.toDouble(),
                    ),
                    const SizedBox(height: 4),
                    SizedBox(
                      width: 80,
                      child: Text(
                        item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: CineColors.textPrimary,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHabitsMatrixCard(UserStats stats) {
    final dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    Color getMatrixColor(int level) {
      switch (level) {
        case 1:
          return CineColors.neonGreen.withOpacity(0.25);
        case 2:
          return CineColors.neonGreen.withOpacity(0.5);
        case 3:
          return CineColors.neonGreen.withOpacity(0.75);
        case 4:
          return CineColors.neonGreen;
        default:
          return CineColors.surfaceElevated;
      }
    }

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
          const Text(
            'WATCHING HABITS (7x24 MATRIX)',
            style: TextStyle(
              color: CineColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 14),
          Column(
            children: List.generate(7, (day) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  children: [
                    SizedBox(
                      width: 16,
                      child: Text(
                        dayLabels[day],
                        style: const TextStyle(
                          color: CineColors.textTertiary,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Row(
                        children: List.generate(24, (hour) {
                          final cell = stats.hourlyHabitMatrix.firstWhere(
                            (c) => c.day == day && c.hour == hour,
                            orElse: () => HabitMatrixCell(day: day, hour: hour, count: 0, level: 0),
                          );
                          return Expanded(
                            child: Container(
                              height: 12,
                              margin: const EdgeInsets.symmetric(horizontal: 1),
                              decoration: BoxDecoration(
                                color: getMatrixColor(cell.level),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
