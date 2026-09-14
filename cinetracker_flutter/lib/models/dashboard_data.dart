import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';
import 'package:cinetracker_flutter/models/movie.dart';
import 'package:cinetracker_flutter/models/tv_show.dart';
import 'package:cinetracker_flutter/models/episode.dart';

class DashboardData {
  final CurrentlyWatching? currentlyWatching;
  final List<Movie> lastWatchedMovies;

  const DashboardData({
    this.currentlyWatching,
    this.lastWatchedMovies = const [],
  });

  TvShow? get featuredShow => currentlyWatching?.show;
  Episode? get nextEpisode => currentlyWatching?.nextEpisode;
  List<TvShowSummary> get otherActiveShows =>
      currentlyWatching?.otherActiveShows ?? const [];

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    CurrentlyWatching? currentlyWatching;
    if (json['currentlyWatching'] is Map<String, dynamic>) {
      currentlyWatching = CurrentlyWatching.fromJson(
          json['currentlyWatching'] as Map<String, dynamic>);
    }

    List<Movie> lastWatchedMovies = [];
    if (json['lastWatchedMovies'] is List) {
      lastWatchedMovies = (json['lastWatchedMovies'] as List)
          .map((m) => Movie.fromJson(m as Map<String, dynamic>))
          .toList();
    }

    return DashboardData(
      currentlyWatching: currentlyWatching,
      lastWatchedMovies: lastWatchedMovies,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'currentlyWatching': currentlyWatching?.toJson(),
      'lastWatchedMovies': lastWatchedMovies.map((m) => m.toJson()).toList(),
    };
  }

  DashboardData copyWith({
    CurrentlyWatching? currentlyWatching,
    List<Movie>? lastWatchedMovies,
  }) {
    return DashboardData(
      currentlyWatching: currentlyWatching ?? this.currentlyWatching,
      lastWatchedMovies: lastWatchedMovies ?? this.lastWatchedMovies,
    );
  }
}

class CurrentlyWatching {
  final TvShow show;
  final ShowProgress progress;
  final Episode? nextEpisode;
  final bool isCompleted;
  final List<TvShowSummary> otherActiveShows;

  const CurrentlyWatching({
    required this.show,
    required this.progress,
    this.nextEpisode,
    this.isCompleted = false,
    this.otherActiveShows = const [],
  });

  factory CurrentlyWatching.fromJson(Map<String, dynamic> json) {
    final show =
        TvShow.fromJson(json['show'] as Map<String, dynamic>? ?? {});
    final progress = ShowProgress.fromJson(
        json['progress'] as Map<String, dynamic>? ?? {});

    Episode? nextEpisode;
    if (json['nextEpisode'] is Map<String, dynamic>) {
      nextEpisode = Episode.fromJson(
        json['nextEpisode'] as Map<String, dynamic>,
        showId: show.id,
      );
    }

    final isCompleted = SerializationHelpers.parseBool(json['isCompleted']);

    List<TvShowSummary> otherShows = [];
    if (json['otherActiveShows'] is List) {
      otherShows = (json['otherActiveShows'] as List)
          .map((s) => TvShowSummary.fromJson(s as Map<String, dynamic>))
          .toList();
    }

    return CurrentlyWatching(
      show: show,
      progress: progress,
      nextEpisode: nextEpisode,
      isCompleted: isCompleted,
      otherActiveShows: otherShows,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'show': show.toJson(),
      'progress': progress.toJson(),
      'nextEpisode': nextEpisode?.toJson(),
      'isCompleted': isCompleted,
      'otherActiveShows': otherActiveShows.map((s) => s.toJson()).toList(),
    };
  }

  CurrentlyWatching copyWith({
    TvShow? show,
    ShowProgress? progress,
    Episode? nextEpisode,
    bool? isCompleted,
    List<TvShowSummary>? otherActiveShows,
  }) {
    return CurrentlyWatching(
      show: show ?? this.show,
      progress: progress ?? this.progress,
      nextEpisode: nextEpisode ?? this.nextEpisode,
      isCompleted: isCompleted ?? this.isCompleted,
      otherActiveShows: otherActiveShows ?? this.otherActiveShows,
    );
  }
}

class ShowProgress {
  final int watchedEpisodesCount;
  final int totalEpisodesCount;
  final LastWatchedEpisode? lastWatched;

  const ShowProgress({
    required this.watchedEpisodesCount,
    required this.totalEpisodesCount,
    this.lastWatched,
  });

  double get fraction => totalEpisodesCount > 0
      ? (watchedEpisodesCount / totalEpisodesCount).clamp(0.0, 1.0)
      : 0.0;

  factory ShowProgress.fromJson(Map<String, dynamic> json) {
    return ShowProgress(
      watchedEpisodesCount:
          SerializationHelpers.parseInt(json['watchedEpisodesCount']),
      totalEpisodesCount:
          SerializationHelpers.parseInt(json['totalEpisodesCount']),
      lastWatched: json['lastWatched'] is Map<String, dynamic>
          ? LastWatchedEpisode.fromJson(
              json['lastWatched'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'watchedEpisodesCount': watchedEpisodesCount,
      'totalEpisodesCount': totalEpisodesCount,
      'lastWatched': lastWatched?.toJson(),
    };
  }

  ShowProgress copyWith({
    int? watchedEpisodesCount,
    int? totalEpisodesCount,
    LastWatchedEpisode? lastWatched,
  }) {
    return ShowProgress(
      watchedEpisodesCount:
          watchedEpisodesCount ?? this.watchedEpisodesCount,
      totalEpisodesCount: totalEpisodesCount ?? this.totalEpisodesCount,
      lastWatched: lastWatched ?? this.lastWatched,
    );
  }
}

class LastWatchedEpisode {
  final int seasonNumber;
  final int episodeNumber;
  final DateTime? watchedDate;

  const LastWatchedEpisode({
    required this.seasonNumber,
    required this.episodeNumber,
    this.watchedDate,
  });

  factory LastWatchedEpisode.fromJson(Map<String, dynamic> json) {
    return LastWatchedEpisode(
      seasonNumber: SerializationHelpers.parseInt(json['season_number'], 1),
      episodeNumber:
          SerializationHelpers.parseInt(json['episode_number'], 1),
      watchedDate: SerializationHelpers.parseDate(json['watched_date']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'season_number': seasonNumber,
      'episode_number': episodeNumber,
      'watched_date': SerializationHelpers.formatDateOnly(watchedDate),
    };
  }
}

class TvShowSummary {
  final int id;
  final String name;
  final String? posterPath;
  final String? backdropPath;

  const TvShowSummary({
    required this.id,
    required this.name,
    this.posterPath,
    this.backdropPath,
  });

  factory TvShowSummary.fromJson(Map<String, dynamic> json) {
    return TvShowSummary(
      id: SerializationHelpers.parseInt(json['id']),
      name: json['name']?.toString() ?? 'Untitled',
      posterPath: json['poster_path']?.toString(),
      backdropPath: json['backdrop_path']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'poster_path': posterPath,
      'backdrop_path': backdropPath,
    };
  }
}
