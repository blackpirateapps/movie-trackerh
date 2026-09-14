import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';

class Episode {
  final int id;
  final int seasonNumber;
  final int episodeNumber;
  final String name;
  final String? overview;
  final DateTime? airDate;
  final String? stillPath;
  final bool isWatched;
  final int? userRating; // 1-10
  final int runtime; // defaults to 45 min
  final double? voteAverage;
  final DateTime? watchedDate;

  const Episode({
    required this.id,
    required this.seasonNumber,
    required this.episodeNumber,
    required this.name,
    this.overview,
    this.airDate,
    this.stillPath,
    this.isWatched = false,
    this.userRating,
    this.runtime = 45,
    this.voteAverage,
    this.watchedDate,
  });

  String get episodeCode =>
      'S${seasonNumber.toString().padLeft(2, '0')}E${episodeNumber.toString().padLeft(2, '0')}';
  String get shortCode => 'S$seasonNumber E$episodeNumber';

  factory Episode.fromJson(Map<String, dynamic> json,
      {int defaultSeasonNumber = 1, int showId = 0}) {
    final seasonNum = SerializationHelpers.parseInt(
        json['season_number'] ?? json['seasonNumber'], defaultSeasonNumber);
    final epNum = SerializationHelpers.parseInt(
        json['episode_number'] ?? json['episodeNumber'], 1);
    final id = SerializationHelpers.parseInt(
        json['id'], showId * 10000 + seasonNum * 100 + epNum);
    final name = json['name']?.toString() ?? 'Episode $epNum';
    final overview = json['overview']?.toString();
    final airDate = SerializationHelpers.parseDate(
        json['air_date'] ?? json['airDate']);
    final stillPath =
        json['still_path']?.toString() ?? json['stillPath']?.toString();
    final isWatched = SerializationHelpers.parseBool(
        json['watched'] ?? json['isWatched'] ?? json['is_watched']);
    final userRating = SerializationHelpers.parseUserRating(
        json['rating'] ?? json['userRating'] ?? json['user_rating']);
    final runtime = SerializationHelpers.parseEpisodeRuntime(json['runtime']);
    final voteAverage = SerializationHelpers.parseDouble(
        json['vote_average'] ?? json['voteAverage']);
    final watchedDate = SerializationHelpers.parseDate(
        json['watched_date'] ?? json['watchedDate']);

    return Episode(
      id: id,
      seasonNumber: seasonNum,
      episodeNumber: epNum,
      name: name,
      overview: overview,
      airDate: airDate,
      stillPath: stillPath,
      isWatched: isWatched,
      userRating: userRating,
      runtime: runtime,
      voteAverage: voteAverage,
      watchedDate: watchedDate,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'season_number': seasonNumber,
      'episode_number': episodeNumber,
      'name': name,
      'overview': overview,
      'air_date': SerializationHelpers.formatDateOnly(airDate),
      'still_path': stillPath,
      'watched': isWatched,
      'rating': userRating,
      'runtime': runtime,
      'vote_average': voteAverage,
      'watched_date': SerializationHelpers.formatDateOnly(watchedDate),
    };
  }

  Episode copyWith({
    int? id,
    int? seasonNumber,
    int? episodeNumber,
    String? name,
    String? overview,
    DateTime? airDate,
    String? stillPath,
    bool? isWatched,
    int? userRating,
    int? runtime,
    double? voteAverage,
    DateTime? watchedDate,
  }) {
    return Episode(
      id: id ?? this.id,
      seasonNumber: seasonNumber ?? this.seasonNumber,
      episodeNumber: episodeNumber ?? this.episodeNumber,
      name: name ?? this.name,
      overview: overview ?? this.overview,
      airDate: airDate ?? this.airDate,
      stillPath: stillPath ?? this.stillPath,
      isWatched: isWatched ?? this.isWatched,
      userRating: userRating ?? this.userRating,
      runtime: runtime ?? this.runtime,
      voteAverage: voteAverage ?? this.voteAverage,
      watchedDate: watchedDate ?? this.watchedDate,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Episode &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          seasonNumber == other.seasonNumber &&
          episodeNumber == other.episodeNumber &&
          isWatched == other.isWatched &&
          userRating == other.userRating;

  @override
  int get hashCode => id.hashCode ^ isWatched.hashCode ^ userRating.hashCode;
}
