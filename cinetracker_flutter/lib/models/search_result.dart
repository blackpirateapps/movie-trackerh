import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';

class SearchResult {
  final int id;
  final String mediaType; // 'movie' or 'tv'
  final String title;
  final DateTime? releaseDate;
  final String? posterPath;
  final String? backdropPath;
  final double? voteAverage;
  final bool inDb;

  const SearchResult({
    required this.id,
    required this.mediaType,
    required this.title,
    this.releaseDate,
    this.posterPath,
    this.backdropPath,
    this.voteAverage,
    this.inDb = false,
  });

  bool get isMovie => mediaType == 'movie';
  bool get isTv => mediaType == 'tv';
  String get yearString =>
      releaseDate != null ? releaseDate!.year.toString() : '';

  factory SearchResult.fromJson(Map<String, dynamic> json) {
    final id = SerializationHelpers.parseInt(json['id']);
    final mediaType =
        (json['media_type'] ?? json['mediaType'] ?? json['type'] ?? 'movie')
            .toString()
            .toLowerCase();

    // TMDB uses 'title' for movies, 'name' for TV
    final title =
        json['title']?.toString() ?? json['name']?.toString() ?? 'Untitled';

    // TMDB uses 'release_date' for movies, 'first_air_date' for TV
    final releaseDate = SerializationHelpers.parseDate(
      json['release_date'] ??
          json['releaseDate'] ??
          json['first_air_date'] ??
          json['firstAirDate'],
    );

    final posterPath =
        json['poster_path']?.toString() ?? json['posterPath']?.toString();
    final backdropPath =
        json['backdrop_path']?.toString() ?? json['backdropPath']?.toString();
    final voteAverage = SerializationHelpers.parseDouble(
        json['vote_average'] ?? json['voteAverage']);
    final inDb = SerializationHelpers.parseBool(json['in_db'] ?? json['inDb']);

    return SearchResult(
      id: id,
      mediaType: mediaType,
      title: title,
      releaseDate: releaseDate,
      posterPath: posterPath,
      backdropPath: backdropPath,
      voteAverage: voteAverage,
      inDb: inDb,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'media_type': mediaType,
      'title': title,
      'release_date': SerializationHelpers.formatDateOnly(releaseDate),
      'poster_path': posterPath,
      'backdrop_path': backdropPath,
      'vote_average': voteAverage,
      'in_db': inDb,
    };
  }

  SearchResult copyWith({
    int? id,
    String? mediaType,
    String? title,
    DateTime? releaseDate,
    String? posterPath,
    String? backdropPath,
    double? voteAverage,
    bool? inDb,
  }) {
    return SearchResult(
      id: id ?? this.id,
      mediaType: mediaType ?? this.mediaType,
      title: title ?? this.title,
      releaseDate: releaseDate ?? this.releaseDate,
      posterPath: posterPath ?? this.posterPath,
      backdropPath: backdropPath ?? this.backdropPath,
      voteAverage: voteAverage ?? this.voteAverage,
      inDb: inDb ?? this.inDb,
    );
  }
}
