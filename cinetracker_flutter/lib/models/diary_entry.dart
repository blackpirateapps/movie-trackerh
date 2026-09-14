import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';

class DiaryEntry {
  final int id;
  final String mediaType; // 'movie' or 'tv'
  final int mediaId;
  final String title;
  final DateTime watchedDate;
  final int? rating; // 1-10
  final String? review;
  final String? posterPath;
  final String? seasonEpisodeCode; // E.g. 'S2 E4'

  const DiaryEntry({
    required this.id,
    required this.mediaType,
    required this.mediaId,
    required this.title,
    required this.watchedDate,
    this.rating,
    this.review,
    this.posterPath,
    this.seasonEpisodeCode,
  });

  bool get isMovie => mediaType == 'movie';
  bool get isTv => mediaType == 'tv';

  factory DiaryEntry.fromJson(Map<String, dynamic> json) {
    final id = SerializationHelpers.parseInt(json['id']);
    final mediaType = (json['type'] ??
            json['mediaType'] ??
            (json['tvShowId'] != null ? 'tv' : 'movie'))
        .toString();
    final mediaId = SerializationHelpers.parseInt(
        json['movieId'] ?? json['tvShowId'] ?? json['mediaId']);
    final title = json['movieTitle']?.toString() ??
        json['tvShowName']?.toString() ??
        json['title']?.toString() ??
        'Untitled';
    final watchedDate = SerializationHelpers.parseDate(json['watched_date'] ??
            json['watchedDate'] ??
            json['updated_at'] ??
            json['created_at']) ??
        DateTime.now();
    final rating = SerializationHelpers.parseUserRating(json['rating']);
    final review = json['review']?.toString();
    final posterPath =
        json['poster_path']?.toString() ?? json['posterPath']?.toString();
    final seasonEpisodeCode = json['seasonEpisodeCode']?.toString();

    return DiaryEntry(
      id: id,
      mediaType: mediaType,
      mediaId: mediaId,
      title: title,
      watchedDate: watchedDate,
      rating: rating,
      review: review,
      posterPath: posterPath,
      seasonEpisodeCode: seasonEpisodeCode,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'mediaType': mediaType,
      'mediaId': mediaId,
      'title': title,
      'watchedDate': SerializationHelpers.formatDateOnly(watchedDate),
      'rating': rating,
      'review': review,
      'posterPath': posterPath,
      'seasonEpisodeCode': seasonEpisodeCode,
    };
  }

  DiaryEntry copyWith({
    int? id,
    String? mediaType,
    int? mediaId,
    String? title,
    DateTime? watchedDate,
    int? rating,
    String? review,
    String? posterPath,
    String? seasonEpisodeCode,
  }) {
    return DiaryEntry(
      id: id ?? this.id,
      mediaType: mediaType ?? this.mediaType,
      mediaId: mediaId ?? this.mediaId,
      title: title ?? this.title,
      watchedDate: watchedDate ?? this.watchedDate,
      rating: rating ?? this.rating,
      review: review ?? this.review,
      posterPath: posterPath ?? this.posterPath,
      seasonEpisodeCode: seasonEpisodeCode ?? this.seasonEpisodeCode,
    );
  }
}
