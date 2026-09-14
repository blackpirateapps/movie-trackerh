import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';

class Movie {
  final int id;
  final String title;
  final String? overview;
  final DateTime? releaseDate;
  final String? posterPath;
  final String? backdropPath;
  final double? voteAverage;
  final int runtime; // defaults to 105 min if null/0
  final bool isFavorite;
  final bool inWatchlist;
  final int? userRating; // 1-10
  final String? review;
  final List<String> watchedWhere;
  final DateTime? watchedDate;

  const Movie({
    required this.id,
    required this.title,
    this.overview,
    this.releaseDate,
    this.posterPath,
    this.backdropPath,
    this.voteAverage,
    this.runtime = 105,
    this.isFavorite = false,
    this.inWatchlist = false,
    this.userRating,
    this.review,
    this.watchedWhere = const [],
    this.watchedDate,
  });

  bool get isWatched =>
      userRating != null ||
      watchedDate != null ||
      (review != null && review!.isNotEmpty);
  String get releaseYear =>
      releaseDate != null ? releaseDate!.year.toString() : '';

  factory Movie.fromJson(Map<String, dynamic> json) {
    // Nested user review data if coming from GET /api/movies?id=...
    final userReview = json['currentUserReview'] as Map<String, dynamic>?;

    final id = SerializationHelpers.parseInt(json['id'] ?? json['movieId']);
    final title = json['title']?.toString() ?? 'Untitled Movie';
    final overview = json['overview']?.toString();
    final releaseDate = SerializationHelpers.parseDate(
        json['release_date'] ?? json['releaseDate']);
    final posterPath =
        json['poster_path']?.toString() ?? json['posterPath']?.toString();
    final backdropPath =
        json['backdrop_path']?.toString() ?? json['backdropPath']?.toString();
    final voteAverage = SerializationHelpers.parseDouble(
        json['vote_average'] ?? json['voteAverage']);
    final runtime = SerializationHelpers.parseMovieRuntime(json['runtime']);

    // Flags
    final isFavorite = SerializationHelpers.parseBool(
        json['is_favorite'] ?? json['isFavorite']);
    final inWatchlist = SerializationHelpers.parseBool(
      json['isInWatchlist'] ??
          json['in_watchlist'] ??
          json['inWatchlist'] ??
          json['watchlist'],
    );

    // User ratings & reviews (check both root and nested currentUserReview)
    final userRating = SerializationHelpers.parseUserRating(
      userReview != null
          ? userReview['rating']
          : json['rating'] ?? json['userRating'],
    );
    final review =
        (userReview != null ? userReview['review'] : json['review'])?.toString();
    final watchedDate = SerializationHelpers.parseDate(
      userReview != null
          ? userReview['watched_date']
          : json['watched_date'] ?? json['watchedDate'],
    );

    final watchedWhere = SerializationHelpers.parseWatchedWhere(
      userReview != null
          ? userReview['watched_where']
          : json['watched_where'] ?? json['watchedWhere'],
    );

    return Movie(
      id: id,
      title: title,
      overview: overview,
      releaseDate: releaseDate,
      posterPath: posterPath,
      backdropPath: backdropPath,
      voteAverage: voteAverage,
      runtime: runtime,
      isFavorite: isFavorite,
      inWatchlist: inWatchlist,
      userRating: userRating,
      review: review,
      watchedWhere: watchedWhere,
      watchedDate: watchedDate,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'overview': overview,
      'release_date': SerializationHelpers.formatDateOnly(releaseDate),
      'poster_path': posterPath,
      'backdrop_path': backdropPath,
      'vote_average': voteAverage,
      'runtime': runtime,
      'is_favorite': isFavorite,
      'in_watchlist': inWatchlist,
      'rating': userRating,
      'review': review,
      'watched_where': watchedWhere,
      'watched_date': SerializationHelpers.formatDateOnly(watchedDate),
    };
  }

  Movie copyWith({
    int? id,
    String? title,
    String? overview,
    DateTime? releaseDate,
    String? posterPath,
    String? backdropPath,
    double? voteAverage,
    int? runtime,
    bool? isFavorite,
    bool? inWatchlist,
    int? userRating,
    String? review,
    List<String>? watchedWhere,
    DateTime? watchedDate,
  }) {
    return Movie(
      id: id ?? this.id,
      title: title ?? this.title,
      overview: overview ?? this.overview,
      releaseDate: releaseDate ?? this.releaseDate,
      posterPath: posterPath ?? this.posterPath,
      backdropPath: backdropPath ?? this.backdropPath,
      voteAverage: voteAverage ?? this.voteAverage,
      runtime: runtime ?? this.runtime,
      isFavorite: isFavorite ?? this.isFavorite,
      inWatchlist: inWatchlist ?? this.inWatchlist,
      userRating: userRating ?? this.userRating,
      review: review ?? this.review,
      watchedWhere: watchedWhere ?? this.watchedWhere,
      watchedDate: watchedDate ?? this.watchedDate,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Movie &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          userRating == other.userRating &&
          inWatchlist == other.inWatchlist &&
          isFavorite == other.isFavorite &&
          watchedDate == other.watchedDate;

  @override
  int get hashCode =>
      id.hashCode ^
      userRating.hashCode ^
      inWatchlist.hashCode ^
      isFavorite.hashCode;
}
