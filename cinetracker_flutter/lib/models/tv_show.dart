import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';
import 'package:cinetracker_flutter/models/season.dart';

class TvShow {
  final int id;
  final String name;
  final String? overview;
  final DateTime? firstAirDate;
  final String? posterPath;
  final String? backdropPath;
  final double? voteAverage;
  final int numberOfSeasons;
  final int numberOfEpisodes;
  final bool isFavorite;
  final bool inWatchlist;
  final int? userRating; // 1-10
  final String? status;
  final List<Season> seasons;
  final List<String> watchedWhere;
  final String? review;

  const TvShow({
    required this.id,
    required this.name,
    this.overview,
    this.firstAirDate,
    this.posterPath,
    this.backdropPath,
    this.voteAverage,
    this.numberOfSeasons = 1,
    this.numberOfEpisodes = 0,
    this.isFavorite = false,
    this.inWatchlist = false,
    this.userRating,
    this.status,
    this.seasons = const [],
    this.watchedWhere = const [],
    this.review,
  });

  String get firstAirYear =>
      firstAirDate != null ? firstAirDate!.year.toString() : '';

  factory TvShow.fromJson(Map<String, dynamic> json) {
    final userTrack = json['currentUserTrack'] as Map<String, dynamic>?;

    final id = SerializationHelpers.parseInt(json['id'] ?? json['tvShowId']);
    final name = json['name']?.toString() ?? 'Untitled TV Show';
    final overview = json['overview']?.toString();
    final firstAirDate = SerializationHelpers.parseDate(
        json['first_air_date'] ?? json['firstAirDate']);
    final posterPath =
        json['poster_path']?.toString() ?? json['posterPath']?.toString();
    final backdropPath =
        json['backdrop_path']?.toString() ?? json['backdropPath']?.toString();
    final voteAverage = SerializationHelpers.parseDouble(
        json['vote_average'] ?? json['voteAverage']);
    final numberOfSeasons = SerializationHelpers.parseInt(
        json['number_of_seasons'] ?? json['numberOfSeasons'], 1);
    final numberOfEpisodes = SerializationHelpers.parseInt(
        json['number_of_episodes'] ?? json['numberOfEpisodes'], 0);
    final status = json['status']?.toString();

    final isFavorite = SerializationHelpers.parseBool(
      userTrack != null
          ? userTrack['is_favorite']
          : json['is_favorite'] ?? json['isFavorite'],
    );
    final inWatchlist = SerializationHelpers.parseBool(
      json['isInWatchlist'] ?? json['in_watchlist'] ?? json['inWatchlist'],
    );
    final userRating = SerializationHelpers.parseUserRating(
      userTrack != null
          ? userTrack['rating']
          : json['rating'] ?? json['userRating'],
    );
    final review =
        (userTrack != null ? userTrack['review'] : json['review'])?.toString();

    final watchedWhere = SerializationHelpers.parseWatchedWhere(
      userTrack != null
          ? userTrack['watched_where']
          : json['watched_where'] ?? json['watchedWhere'],
    );

    // Parse seasons if present
    List<Season> parsedSeasons = [];
    if (json['seasons'] is List) {
      parsedSeasons = (json['seasons'] as List)
          .map((s) => Season.fromJson(s as Map<String, dynamic>, showId: id))
          .toList();
    }

    return TvShow(
      id: id,
      name: name,
      overview: overview,
      firstAirDate: firstAirDate,
      posterPath: posterPath,
      backdropPath: backdropPath,
      voteAverage: voteAverage,
      numberOfSeasons: numberOfSeasons,
      numberOfEpisodes: numberOfEpisodes,
      isFavorite: isFavorite,
      inWatchlist: inWatchlist,
      userRating: userRating,
      status: status,
      seasons: parsedSeasons,
      watchedWhere: watchedWhere,
      review: review,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'overview': overview,
      'first_air_date': SerializationHelpers.formatDateOnly(firstAirDate),
      'poster_path': posterPath,
      'backdrop_path': backdropPath,
      'vote_average': voteAverage,
      'number_of_seasons': numberOfSeasons,
      'number_of_episodes': numberOfEpisodes,
      'is_favorite': isFavorite,
      'in_watchlist': inWatchlist,
      'rating': userRating,
      'status': status,
      'seasons': seasons.map((s) => s.toJson()).toList(),
      'watched_where': watchedWhere,
      'review': review,
    };
  }

  TvShow copyWith({
    int? id,
    String? name,
    String? overview,
    DateTime? firstAirDate,
    String? posterPath,
    String? backdropPath,
    double? voteAverage,
    int? numberOfSeasons,
    int? numberOfEpisodes,
    bool? isFavorite,
    bool? inWatchlist,
    int? userRating,
    String? status,
    List<Season>? seasons,
    List<String>? watchedWhere,
    String? review,
  }) {
    return TvShow(
      id: id ?? this.id,
      name: name ?? this.name,
      overview: overview ?? this.overview,
      firstAirDate: firstAirDate ?? this.firstAirDate,
      posterPath: posterPath ?? this.posterPath,
      backdropPath: backdropPath ?? this.backdropPath,
      voteAverage: voteAverage ?? this.voteAverage,
      numberOfSeasons: numberOfSeasons ?? this.numberOfSeasons,
      numberOfEpisodes: numberOfEpisodes ?? this.numberOfEpisodes,
      isFavorite: isFavorite ?? this.isFavorite,
      inWatchlist: inWatchlist ?? this.inWatchlist,
      userRating: userRating ?? this.userRating,
      status: status ?? this.status,
      seasons: seasons ?? this.seasons,
      watchedWhere: watchedWhere ?? this.watchedWhere,
      review: review ?? this.review,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TvShow &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          isFavorite == other.isFavorite &&
          userRating == other.userRating;

  @override
  int get hashCode => id.hashCode ^ isFavorite.hashCode ^ userRating.hashCode;
}
