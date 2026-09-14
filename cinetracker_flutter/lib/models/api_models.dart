import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';
import 'package:cinetracker_flutter/models/movie.dart';
import 'package:cinetracker_flutter/models/tv_show.dart';
import 'package:cinetracker_flutter/models/season.dart';
import 'package:cinetracker_flutter/models/episode.dart';
import 'package:cinetracker_flutter/models/user.dart';
import 'package:cinetracker_flutter/models/api_key.dart';
import 'package:cinetracker_flutter/core/utils/csv_parser.dart';

/// Detailed view model for Movie screen.
class MovieDetail {
  final Movie movie;
  final List<String> genres;
  final String? director;
  final List<String> cast;
  final String? tagline;

  const MovieDetail({
    required this.movie,
    this.genres = const [],
    this.director,
    this.cast = const [],
    this.tagline,
  });

  factory MovieDetail.fromJson(Map<String, dynamic> json) {
    final movie = Movie.fromJson(json);
    final genres = (json['genres'] as List?)
            ?.map((g) => (g is Map ? g['name'] : g).toString())
            .toList() ??
        [];
    final cast = (json['cast'] as List?)
            ?.map((c) => (c is Map ? c['name'] : c).toString())
            .toList() ??
        [];
    final director = json['director']?.toString();
    final tagline = json['tagline']?.toString();

    return MovieDetail(
      movie: movie,
      genres: genres,
      director: director,
      cast: cast,
      tagline: tagline,
    );
  }

  Map<String, dynamic> toJson() => {
        ...movie.toJson(),
        'genres': genres,
        if (director != null) 'director': director,
        'cast': cast,
        if (tagline != null) 'tagline': tagline,
      };
}

/// Detailed view model for TV show screen.
class TvShowDetail {
  final TvShow show;
  final List<Season> seasons;
  final List<String> genres;
  final List<String> networks;

  const TvShowDetail({
    required this.show,
    this.seasons = const [],
    this.genres = const [],
    this.networks = const [],
  });

  factory TvShowDetail.fromJson(Map<String, dynamic> json) {
    final show = TvShow.fromJson(json);
    List<Season> seasons = [];
    if (json['seasons'] is List) {
      seasons = (json['seasons'] as List)
          .map((s) => Season.fromJson(s as Map<String, dynamic>, showId: show.id))
          .toList();
    }
    final genres = (json['genres'] as List?)
            ?.map((g) => (g is Map ? g['name'] : g).toString())
            .toList() ??
        [];
    final networks = (json['networks'] as List?)
            ?.map((n) => (n is Map ? n['name'] : n).toString())
            .toList() ??
        [];

    return TvShowDetail(
      show: show,
      seasons: seasons,
      genres: genres,
      networks: networks,
    );
  }

  Map<String, dynamic> toJson() => {
        ...show.toJson(),
        'seasons': seasons.map((s) => s.toJson()).toList(),
        'genres': genres,
        'networks': networks,
      };
}

/// Detailed season with all episodes.
class SeasonDetail {
  final int id;
  final int seasonNumber;
  final String name;
  final String? overview;
  final String? posterPath;
  final List<Episode> episodes;

  const SeasonDetail({
    required this.id,
    required this.seasonNumber,
    required this.name,
    this.overview,
    this.posterPath,
    this.episodes = const [],
  });

  factory SeasonDetail.fromJson(Map<String, dynamic> json, {int showId = 0}) {
    final seasonNumber = SerializationHelpers.parseInt(
        json['season_number'] ?? json['seasonNumber'], 1);
    final id = SerializationHelpers.parseInt(
        json['id'], showId * 1000 + seasonNumber);
    final name = json['name']?.toString() ?? 'Season $seasonNumber';
    final overview = json['overview']?.toString();
    final posterPath =
        json['poster_path']?.toString() ?? json['posterPath']?.toString();

    List<Episode> episodes = [];
    if (json['episodes'] is List) {
      episodes = (json['episodes'] as List)
          .map((e) => Episode.fromJson(e as Map<String, dynamic>,
              defaultSeasonNumber: seasonNumber, showId: showId))
          .toList();
    }

    return SeasonDetail(
      id: id,
      seasonNumber: seasonNumber,
      name: name,
      overview: overview,
      posterPath: posterPath,
      episodes: episodes,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'season_number': seasonNumber,
        'name': name,
        'overview': overview,
        'poster_path': posterPath,
        'episodes': episodes.map((e) => e.toJson()).toList(),
      };
}

/// Authentication result payload.
class AuthResult {
  final User user;
  final String? token;
  final String message;

  const AuthResult({
    required this.user,
    this.token,
    required this.message,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json, {String? token}) {
    final userMap = json['user'] as Map<String, dynamic>? ?? json;
    return AuthResult(
      user: User.fromJson(userMap),
      token: token ?? json['token']?.toString(),
      message: json['message']?.toString() ?? 'Success',
    );
  }
}

/// ApiKey creation result with unmasked raw key.
class ApiKeyCreateResult {
  final ApiKey key;
  final String rawKey;

  const ApiKeyCreateResult({
    required this.key,
    required this.rawKey,
  });

  factory ApiKeyCreateResult.fromJson(Map<String, dynamic> json) {
    final keyMap = json['key'] as Map<String, dynamic>? ?? json;
    final rawKey = json['rawKey']?.toString() ??
        json['apiKey']?.toString() ??
        keyMap['rawKey']?.toString() ??
        '';
    return ApiKeyCreateResult(
      key: ApiKey.fromJson(keyMap),
      rawKey: rawKey,
    );
  }
}

/// User profile and social stats.
class UserProfile {
  final User user;
  final int followersCount;
  final int followingCount;
  final bool isFollowing;
  final List<Movie> favoriteMovies;
  final List<TvShow> favoriteShows;

  const UserProfile({
    required this.user,
    this.followersCount = 0,
    this.followingCount = 0,
    this.isFollowing = false,
    this.favoriteMovies = const [],
    this.favoriteShows = const [],
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final user = User.fromJson(json['user'] as Map<String, dynamic>? ?? json);
    final followers =
        SerializationHelpers.parseInt(json['followersCount'] ?? json['followers_count']);
    final following =
        SerializationHelpers.parseInt(json['followingCount'] ?? json['following_count']);
    final isFollowing = SerializationHelpers.parseBool(
        json['isFollowing'] ?? json['is_following']);

    List<Movie> favMovies = [];
    if (json['favoriteMovies'] is List) {
      favMovies = (json['favoriteMovies'] as List)
          .map((m) => Movie.fromJson(m as Map<String, dynamic>))
          .toList();
    }

    List<TvShow> favShows = [];
    if (json['favoriteShows'] is List) {
      favShows = (json['favoriteShows'] as List)
          .map((s) => TvShow.fromJson(s as Map<String, dynamic>))
          .toList();
    }

    return UserProfile(
      user: user,
      followersCount: followers,
      followingCount: following,
      isFollowing: isFollowing,
      favoriteMovies: favMovies,
      favoriteShows: favShows,
    );
  }
}

/// Social activity feed entry.
class ActivityFeedItem {
  final int id;
  final String username;
  final String? userAvatarUrl;
  final String action; // 'logged_movie', 'rated_show', etc.
  final String mediaTitle;
  final int? rating;
  final String? review;
  final DateTime timestamp;
  final String? posterPath;

  const ActivityFeedItem({
    required this.id,
    required this.username,
    this.userAvatarUrl,
    required this.action,
    required this.mediaTitle,
    this.rating,
    this.review,
    required this.timestamp,
    this.posterPath,
  });

  factory ActivityFeedItem.fromJson(Map<String, dynamic> json) {
    return ActivityFeedItem(
      id: SerializationHelpers.parseInt(json['id']),
      username: json['username']?.toString() ?? 'User',
      userAvatarUrl: json['userAvatarUrl']?.toString() ?? json['avatarUrl']?.toString(),
      action: json['action']?.toString() ?? 'updated',
      mediaTitle: json['mediaTitle']?.toString() ?? 'Title',
      rating: SerializationHelpers.parseUserRating(json['rating']),
      review: json['review']?.toString(),
      timestamp: SerializationHelpers.parseDate(json['timestamp'] ?? json['created_at']) ??
          DateTime.now(),
      posterPath: json['poster_path']?.toString() ?? json['posterPath']?.toString(),
    );
  }
}

/// User directory pagination result.
class UserDirectoryResult {
  final List<User> users;
  final int total;
  final int page;
  final int limit;

  const UserDirectoryResult({
    required this.users,
    this.total = 0,
    this.page = 1,
    this.limit = 20,
  });

  factory UserDirectoryResult.fromJson(Map<String, dynamic> json) {
    List<User> users = [];
    if (json['users'] is List) {
      users = (json['users'] as List)
          .map((u) => User.fromJson(u as Map<String, dynamic>))
          .toList();
    }
    return UserDirectoryResult(
      users: users,
      total: SerializationHelpers.parseInt(json['total'], users.length),
      page: SerializationHelpers.parseInt(json['page'], 1),
      limit: SerializationHelpers.parseInt(json['limit'], 20),
    );
  }
}

/// Letterboxd item to import.
typedef ImportItem = LetterboxdImportItem;

/// CSV parse result preview.
class CsvParseResult {
  final List<LetterboxdImportItem> items;
  final int totalCount;
  final int validCount;

  const CsvParseResult({
    required this.items,
    required this.totalCount,
    required this.validCount,
  });
}

/// Letterboxd batch import outcome.
class BatchImportResult {
  final int importedCount;
  final int skippedCount;
  final int errorCount;
  final List<String> errors;

  const BatchImportResult({
    this.importedCount = 0,
    this.skippedCount = 0,
    this.errorCount = 0,
    this.errors = const [],
  });

  factory BatchImportResult.fromJson(Map<String, dynamic> json) {
    return BatchImportResult(
      importedCount: SerializationHelpers.parseInt(json['importedCount'] ?? json['imported']),
      skippedCount: SerializationHelpers.parseInt(json['skippedCount'] ?? json['skipped']),
      errorCount: SerializationHelpers.parseInt(json['errorCount'] ?? json['errors_count']),
      errors: (json['errors'] as List?)?.map((e) => e.toString()).toList() ?? const [],
    );
  }
}

/// Full data export result.
class DataExportResult {
  final String format; // 'json' or 'csv'
  final dynamic data;

  const DataExportResult({
    required this.format,
    required this.data,
  });
}
