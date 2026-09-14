import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';

class UserStats {
  final double totalHours;
  final double totalDays;
  final int moviesCount;
  final int episodesCount;
  final int showsCount;
  final int totalReviews;
  final double averageRating;
  final int currentStreak;
  final int longestStreak;
  final List<TimeSeriesPoint> timeSeries;
  final List<RatingDistributionItem> ratingDistribution;
  final List<PlatformBreakdownItem> platformBreakdown;
  final List<HeatmapDay> activityHeatmap;
  final List<HabitMatrixCell> hourlyHabitMatrix;
  final List<GenreItem> topGenres;
  final List<CreatorItem> topCreators;
  final List<HallOfFameItem> hallOfFame;
  final List<int> availableYears;
  final bool cached;

  const UserStats({
    required this.totalHours,
    required this.totalDays,
    required this.moviesCount,
    required this.episodesCount,
    this.showsCount = 0,
    this.totalReviews = 0,
    required this.averageRating,
    required this.currentStreak,
    required this.longestStreak,
    this.timeSeries = const [],
    this.ratingDistribution = const [],
    this.platformBreakdown = const [],
    this.activityHeatmap = const [],
    this.hourlyHabitMatrix = const [],
    this.topGenres = const [],
    this.topCreators = const [],
    this.hallOfFame = const [],
    this.availableYears = const [],
    this.cached = false,
  });

  /// Calculates the mode (most common rating tier 1-10) for highlight pills.
  int get modeRating {
    if (ratingDistribution.isEmpty) return 8; // Sensible default
    RatingDistributionItem highest = ratingDistribution.first;
    for (final item in ratingDistribution) {
      if (item.count > highest.count) {
        highest = item;
      }
    }
    return highest.rating;
  }

  factory UserStats.fromJson(Map<String, dynamic> json) {
    final kpis = json['kpis'] as Map<String, dynamic>? ?? {};

    final totalHours = SerializationHelpers.parseDouble(
            kpis['total_hours'] ?? kpis['totalHours']) ??
        0.0;
    final totalDays = SerializationHelpers.parseDouble(
            kpis['total_days'] ?? kpis['totalDays']) ??
        (totalHours / 24.0);
    final moviesCount = SerializationHelpers.parseInt(
        kpis['movies_count'] ?? kpis['moviesCount']);
    final episodesCount = SerializationHelpers.parseInt(
        kpis['episodes_count'] ?? kpis['episodesCount']);
    final showsCount = SerializationHelpers.parseInt(
        kpis['shows_count'] ?? kpis['showsCount']);
    final totalReviews = SerializationHelpers.parseInt(
        kpis['total_reviews'] ?? kpis['totalReviews']);
    final averageRating = SerializationHelpers.parseDouble(
            kpis['average_rating'] ?? kpis['averageRating']) ??
        0.0;
    final currentStreak = SerializationHelpers.parseInt(
        kpis['current_streak'] ?? kpis['currentStreak']);
    final longestStreak = SerializationHelpers.parseInt(
        kpis['longest_streak'] ?? kpis['longestStreak']);

    // Parse time series
    List<TimeSeriesPoint> timeSeries = [];
    if (json['time_series'] is List) {
      timeSeries = (json['time_series'] as List)
          .map((e) => TimeSeriesPoint.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    // Parse rating distribution (10 tiers)
    List<RatingDistributionItem> ratingDist = [];
    if (json['rating_distribution'] is List) {
      ratingDist = (json['rating_distribution'] as List)
          .map((e) => RatingDistributionItem.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    // Parse platform breakdown
    List<PlatformBreakdownItem> platforms = [];
    if (json['platform_breakdown'] is List) {
      platforms = (json['platform_breakdown'] as List)
          .map((e) => PlatformBreakdownItem.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    // Parse 365-day activity heatmap
    List<HeatmapDay> heatmap = [];
    if (json['activity_heatmap'] is List) {
      heatmap = (json['activity_heatmap'] as List)
          .map((e) => HeatmapDay.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    // Parse 7x24 habit matrix
    List<HabitMatrixCell> habitMatrix = [];
    if (json['hourly_habit_matrix'] is List) {
      habitMatrix = (json['hourly_habit_matrix'] as List)
          .map((e) => HabitMatrixCell.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    // Parse top genres
    List<GenreItem> genres = [];
    if (json['top_genres'] is List) {
      genres = (json['top_genres'] as List)
          .map((e) => GenreItem.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    // Parse creators
    List<CreatorItem> creators = [];
    if (json['top_creators'] is List) {
      creators = (json['top_creators'] as List)
          .map((e) => CreatorItem.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    // Parse hall of fame
    List<HallOfFameItem> hallOfFame = [];
    if (json['hall_of_fame'] is List) {
      hallOfFame = (json['hall_of_fame'] as List)
          .map((e) => HallOfFameItem.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    // Available years
    List<int> years = [];
    if (json['available_years'] is List) {
      years = (json['available_years'] as List)
          .map((y) => SerializationHelpers.parseInt(y))
          .where((y) => y > 1900)
          .toList();
    }

    return UserStats(
      totalHours: totalHours,
      totalDays: totalDays,
      moviesCount: moviesCount,
      episodesCount: episodesCount,
      showsCount: showsCount,
      totalReviews: totalReviews,
      averageRating: averageRating,
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      timeSeries: timeSeries,
      ratingDistribution: ratingDist,
      platformBreakdown: platforms,
      activityHeatmap: heatmap,
      hourlyHabitMatrix: habitMatrix,
      topGenres: genres,
      topCreators: creators,
      hallOfFame: hallOfFame,
      availableYears: years,
      cached: SerializationHelpers.parseBool(json['cached']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'cached': cached,
      'kpis': {
        'total_hours': totalHours,
        'total_days': totalDays,
        'movies_count': moviesCount,
        'episodes_count': episodesCount,
        'shows_count': showsCount,
        'total_reviews': totalReviews,
        'average_rating': averageRating,
        'current_streak': currentStreak,
        'longest_streak': longestStreak,
      },
      'time_series': timeSeries.map((e) => e.toJson()).toList(),
      'rating_distribution': ratingDistribution.map((e) => e.toJson()).toList(),
      'platform_breakdown': platformBreakdown.map((e) => e.toJson()).toList(),
      'activity_heatmap': activityHeatmap.map((e) => e.toJson()).toList(),
      'hourly_habit_matrix':
          hourlyHabitMatrix.map((e) => e.toJson()).toList(),
      'top_genres': topGenres.map((e) => e.toJson()).toList(),
      'top_creators': topCreators.map((e) => e.toJson()).toList(),
      'hall_of_fame': hallOfFame.map((e) => e.toJson()).toList(),
      'available_years': availableYears,
    };
  }

  UserStats copyWith({
    double? totalHours,
    double? totalDays,
    int? moviesCount,
    int? episodesCount,
    int? showsCount,
    int? totalReviews,
    double? averageRating,
    int? currentStreak,
    int? longestStreak,
    List<TimeSeriesPoint>? timeSeries,
    List<RatingDistributionItem>? ratingDistribution,
    List<PlatformBreakdownItem>? platformBreakdown,
    List<HeatmapDay>? activityHeatmap,
    List<HabitMatrixCell>? hourlyHabitMatrix,
    List<GenreItem>? topGenres,
    List<CreatorItem>? topCreators,
    List<HallOfFameItem>? hallOfFame,
    List<int>? availableYears,
    bool? cached,
  }) {
    return UserStats(
      totalHours: totalHours ?? this.totalHours,
      totalDays: totalDays ?? this.totalDays,
      moviesCount: moviesCount ?? this.moviesCount,
      episodesCount: episodesCount ?? this.episodesCount,
      showsCount: showsCount ?? this.showsCount,
      totalReviews: totalReviews ?? this.totalReviews,
      averageRating: averageRating ?? this.averageRating,
      currentStreak: currentStreak ?? this.currentStreak,
      longestStreak: longestStreak ?? this.longestStreak,
      timeSeries: timeSeries ?? this.timeSeries,
      ratingDistribution: ratingDistribution ?? this.ratingDistribution,
      platformBreakdown: platformBreakdown ?? this.platformBreakdown,
      activityHeatmap: activityHeatmap ?? this.activityHeatmap,
      hourlyHabitMatrix: hourlyHabitMatrix ?? this.hourlyHabitMatrix,
      topGenres: topGenres ?? this.topGenres,
      topCreators: topCreators ?? this.topCreators,
      hallOfFame: hallOfFame ?? this.hallOfFame,
      availableYears: availableYears ?? this.availableYears,
      cached: cached ?? this.cached,
    );
  }
}

class RatingDistributionItem {
  final int rating; // 1 to 10
  final int count;

  const RatingDistributionItem({required this.rating, required this.count});

  factory RatingDistributionItem.fromJson(Map<String, dynamic> json) {
    return RatingDistributionItem(
      rating: SerializationHelpers.parseInt(json['rating'], 1).clamp(1, 10),
      count: SerializationHelpers.parseInt(json['count'], 0),
    );
  }

  Map<String, dynamic> toJson() => {'rating': rating, 'count': count};
}

class PlatformBreakdownItem {
  final String name;
  final int count;
  final double percentage;

  const PlatformBreakdownItem(
      {required this.name, required this.count, required this.percentage});

  factory PlatformBreakdownItem.fromJson(Map<String, dynamic> json) {
    return PlatformBreakdownItem(
      name: json['name']?.toString() ?? 'Other',
      count: SerializationHelpers.parseInt(json['count']),
      percentage: SerializationHelpers.parseDouble(json['percentage']) ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() =>
      {'name': name, 'count': count, 'percentage': percentage};
}

class HeatmapDay {
  final String date; // YYYY-MM-DD
  final int count;
  final int level; // 0 to 4

  const HeatmapDay(
      {required this.date, required this.count, required this.level});

  factory HeatmapDay.fromJson(Map<String, dynamic> json) {
    return HeatmapDay(
      date: json['date']?.toString() ?? '',
      count: SerializationHelpers.parseInt(json['count']),
      level: SerializationHelpers.parseInt(json['level']).clamp(0, 4),
    );
  }

  Map<String, dynamic> toJson() =>
      {'date': date, 'count': count, 'level': level};
}

class HabitMatrixCell {
  final int day; // 0 (Mon) to 6 (Sun)
  final int hour; // 0 to 23
  final int count;
  final int level; // 0 to 4

  const HabitMatrixCell(
      {required this.day,
      required this.hour,
      required this.count,
      required this.level});

  factory HabitMatrixCell.fromJson(Map<String, dynamic> json) {
    return HabitMatrixCell(
      day: SerializationHelpers.parseInt(json['day']).clamp(0, 6),
      hour: SerializationHelpers.parseInt(json['hour']).clamp(0, 23),
      count: SerializationHelpers.parseInt(json['count']),
      level: SerializationHelpers.parseInt(json['level']).clamp(0, 4),
    );
  }

  Map<String, dynamic> toJson() =>
      {'day': day, 'hour': hour, 'count': count, 'level': level};
}

class GenreItem {
  final String name;
  final int count;
  final double percentage;

  const GenreItem(
      {required this.name, required this.count, required this.percentage});

  factory GenreItem.fromJson(Map<String, dynamic> json) {
    return GenreItem(
      name: json['name']?.toString() ?? 'Unknown',
      count: SerializationHelpers.parseInt(json['count']),
      percentage: SerializationHelpers.parseDouble(json['percentage']) ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() =>
      {'name': name, 'count': count, 'percentage': percentage};
}

class CreatorItem {
  final String name;
  final String role; // 'Director' or 'Actor'
  final int count;
  final String? avatarUrl;

  const CreatorItem(
      {required this.name,
      required this.role,
      required this.count,
      this.avatarUrl});

  factory CreatorItem.fromJson(Map<String, dynamic> json) {
    return CreatorItem(
      name: json['name']?.toString() ?? 'Unknown',
      role: json['role']?.toString() ?? 'Creator',
      count: SerializationHelpers.parseInt(json['count']),
      avatarUrl: json['avatar_url']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'role': role,
        'count': count,
        'avatar_url': avatarUrl,
      };
}

class HallOfFameItem {
  final int id;
  final String title;
  final String type; // 'movie' or 'tv'
  final String? posterPath;
  final int rating; // 7-10
  final double? voteAverage;
  final String? releaseDate;

  const HallOfFameItem({
    required this.id,
    required this.title,
    required this.type,
    this.posterPath,
    required this.rating,
    this.voteAverage,
    this.releaseDate,
  });

  factory HallOfFameItem.fromJson(Map<String, dynamic> json) {
    return HallOfFameItem(
      id: SerializationHelpers.parseInt(json['id']),
      title: json['title']?.toString() ?? 'Untitled',
      type: json['type']?.toString() ?? 'movie',
      posterPath: json['poster_path']?.toString(),
      rating: SerializationHelpers.parseInt(json['rating'], 8).clamp(1, 10),
      voteAverage: SerializationHelpers.parseDouble(json['vote_average']),
      releaseDate: json['release_date']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'type': type,
        'poster_path': posterPath,
        'rating': rating,
        'vote_average': voteAverage,
        'release_date': releaseDate,
      };
}

class TimeSeriesPoint {
  final String date;
  final double totalHours;
  final double tvHours;
  final double movieHours;
  final int moviesCount;
  final int episodesCount;

  const TimeSeriesPoint({
    required this.date,
    required this.totalHours,
    this.tvHours = 0.0,
    this.movieHours = 0.0,
    this.moviesCount = 0,
    this.episodesCount = 0,
  });

  factory TimeSeriesPoint.fromJson(Map<String, dynamic> json) {
    return TimeSeriesPoint(
      date: json['date']?.toString() ?? '',
      totalHours: SerializationHelpers.parseDouble(
              json['total_hours'] ?? json['totalHours']) ??
          0.0,
      tvHours: SerializationHelpers.parseDouble(
              json['tv_hours'] ?? json['tvHours']) ??
          0.0,
      movieHours: SerializationHelpers.parseDouble(
              json['movie_hours'] ?? json['movieHours']) ??
          0.0,
      moviesCount: SerializationHelpers.parseInt(json['movies_count']),
      episodesCount: SerializationHelpers.parseInt(json['episodes_count']),
    );
  }

  Map<String, dynamic> toJson() => {
        'date': date,
        'total_hours': totalHours,
        'tv_hours': tvHours,
        'movie_hours': movieHours,
        'movies_count': moviesCount,
        'episodes_count': episodesCount,
      };
}
