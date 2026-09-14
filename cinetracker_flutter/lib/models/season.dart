import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';
import 'package:cinetracker_flutter/models/episode.dart';

class Season {
  final int id;
  final int seasonNumber;
  final String name;
  final int episodeCount;
  final String? posterPath;
  final List<Episode> episodes;

  const Season({
    required this.id,
    required this.seasonNumber,
    required this.name,
    this.episodeCount = 0,
    this.posterPath,
    this.episodes = const [],
  });

  int get watchedEpisodesCount => episodes.where((e) => e.isWatched).length;
  double get progressFraction =>
      episodeCount > 0 ? (watchedEpisodesCount / episodeCount).clamp(0.0, 1.0) : 0.0;
  bool get isCompleted =>
      episodeCount > 0 && watchedEpisodesCount >= episodeCount;

  factory Season.fromJson(Map<String, dynamic> json,
      {int showId = 0, Map<dynamic, dynamic>? userEpisodes}) {
    final seasonNumber = SerializationHelpers.parseInt(
        json['season_number'] ?? json['seasonNumber'], 1);
    final id = SerializationHelpers.parseInt(
        json['id'], showId * 1000 + seasonNumber);
    final name = json['name']?.toString() ?? 'Season $seasonNumber';
    final episodeCount = SerializationHelpers.parseInt(
        json['episode_count'] ?? json['episodeCount'], 0);
    final posterPath =
        json['poster_path']?.toString() ?? json['posterPath']?.toString();

    final uEpisodes = userEpisodes ??
        (json['userEpisodes'] is Map ? json['userEpisodes'] as Map : null) ??
        (json['user_episodes'] is Map ? json['user_episodes'] as Map : null);

    List<Episode> episodes = [];
    if (json['episodes'] is List) {
      episodes = (json['episodes'] as List).map((e) {
        final epMap = Map<String, dynamic>.from(e as Map);
        final epNum = SerializationHelpers.parseInt(
            epMap['episode_number'] ?? epMap['episodeNumber'], 1);
        final epKey = '${seasonNumber}_$epNum';
        if (uEpisodes != null) {
          final uEp = uEpisodes[epKey] ?? uEpisodes[epNum.toString()];
          if (uEp is Map) {
            if (uEp.containsKey('watched')) epMap['watched'] = uEp['watched'];
            if (uEp.containsKey('isWatched')) epMap['watched'] = uEp['isWatched'];
            if (uEp.containsKey('rating')) epMap['rating'] = uEp['rating'];
            if (uEp.containsKey('watched_date')) {
              epMap['watched_date'] = uEp['watched_date'];
            }
          } else if (uEp == true) {
            epMap['watched'] = true;
          }
        }
        return Episode.fromJson(epMap,
            defaultSeasonNumber: seasonNumber, showId: showId);
      }).toList();
    }

    return Season(
      id: id,
      seasonNumber: seasonNumber,
      name: name,
      episodeCount: episodeCount > 0 ? episodeCount : episodes.length,
      posterPath: posterPath,
      episodes: episodes,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'season_number': seasonNumber,
      'name': name,
      'episode_count': episodeCount,
      'poster_path': posterPath,
      'episodes': episodes.map((e) => e.toJson()).toList(),
    };
  }

  Season copyWith({
    int? id,
    int? seasonNumber,
    String? name,
    int? episodeCount,
    String? posterPath,
    List<Episode>? episodes,
  }) {
    return Season(
      id: id ?? this.id,
      seasonNumber: seasonNumber ?? this.seasonNumber,
      name: name ?? this.name,
      episodeCount: episodeCount ?? this.episodeCount,
      posterPath: posterPath ?? this.posterPath,
      episodes: episodes ?? this.episodes,
    );
  }
}
