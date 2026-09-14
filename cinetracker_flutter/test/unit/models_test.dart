import 'package:flutter_test/flutter_test.dart';
import 'package:cinetracker_flutter/models/movie.dart';
import 'package:cinetracker_flutter/models/tv_show.dart';
import 'package:cinetracker_flutter/models/season.dart';
import 'package:cinetracker_flutter/models/episode.dart';
import 'package:cinetracker_flutter/models/search_result.dart';
import 'package:cinetracker_flutter/models/user_stats.dart';
import 'package:cinetracker_flutter/models/dashboard_data.dart';
import 'package:cinetracker_flutter/models/api_key.dart';
import 'package:cinetracker_flutter/models/diary_entry.dart';

void main() {
  group('Movie Model Tests', () {
    test('parses standard TMDB movie JSON correctly', () {
      final json = {
        'id': 693134,
        'title': 'Dune: Part Two',
        'overview': 'Paul Atreides unites with Chani...',
        'release_date': '2024-02-27',
        'poster_path': '/1pdfLvkZt9T9S.jpg',
        'backdrop_path': '/xOMo8BRK7P.jpg',
        'vote_average': 8.2,
        'runtime': 166,
        'rating': 9,
        'review': 'Epic sci-fi masterpiece',
        'isInWatchlist': false,
        'watched_where': ['Cinema', 'Apple TV'],
        'watched_date': '2026-03-01',
      };

      final movie = Movie.fromJson(json);

      expect(movie.id, 693134);
      expect(movie.title, 'Dune: Part Two');
      expect(movie.releaseDate?.year, 2024);
      expect(movie.runtime, 166);
      expect(movie.userRating, 9);
      expect(movie.review, 'Epic sci-fi masterpiece');
      expect(movie.inWatchlist, false);
      expect(movie.watchedWhere, ['Cinema', 'Apple TV']);
      expect(movie.watchedDate, DateTime(2026, 3, 1));
      expect(movie.isWatched, true);
    });

    test('applies safe 105 minute fallback when runtime is null or 0', () {
      final jsonNull = {'id': 1, 'title': 'Indie Film', 'runtime': null};
      final jsonZero = {'id': 2, 'title': 'Short Film', 'runtime': 0};
      final jsonNegative = {'id': 3, 'title': 'Bad Data', 'runtime': -10};

      expect(Movie.fromJson(jsonNull).runtime, 105);
      expect(Movie.fromJson(jsonZero).runtime, 105);
      expect(Movie.fromJson(jsonNegative).runtime, 105);
    });

    test('safely parses user rating from double, string, or clamped int', () {
      final jsonDouble = {'id': 1, 'title': 'Film A', 'rating': 8.7};
      final jsonString = {'id': 2, 'title': 'Film B', 'rating': '10'};
      final jsonOver = {'id': 3, 'title': 'Film C', 'rating': 15};
      final jsonZero = {'id': 4, 'title': 'Film D', 'rating': 0};

      expect(Movie.fromJson(jsonDouble).userRating, 9);
      expect(Movie.fromJson(jsonString).userRating, 10);
      expect(Movie.fromJson(jsonOver).userRating, 10);
      expect(Movie.fromJson(jsonZero).userRating, null);
    });

    test('parses nested currentUserReview from /api/movies?id=...', () {
      final json = {
        'id': 100,
        'title': 'Test Movie',
        'currentUserReview': {
          'rating': 7,
          'review': 'Great soundtrack',
          'watched_date': '2026-08-15',
          'watched_where': '["Netflix", "Prime Video"]',
        },
        'isInWatchlist': true,
      };

      final movie = Movie.fromJson(json);
      expect(movie.userRating, 7);
      expect(movie.review, 'Great soundtrack');
      expect(movie.watchedWhere, ['Netflix', 'Prime Video']);
      expect(movie.inWatchlist, true);
    });

    test('copyWith creates cloned instance with updated fields', () {
      const movie = Movie(id: 1, title: 'Original', userRating: 5);
      final updated = movie.copyWith(userRating: 8, isFavorite: true);

      expect(updated.id, 1);
      expect(updated.title, 'Original');
      expect(updated.userRating, 8);
      expect(updated.isFavorite, true);
    });
  });

  group('TvShow, Season, Episode Model Tests', () {
    test('parses TV Show with seasons and safe defaults', () {
      final json = {
        'id': 110492,
        'name': 'Severance',
        'overview': 'Mark leads a team...',
        'first_air_date': '2022-02-18',
        'poster_path': '/severance.jpg',
        'number_of_seasons': 2,
        'number_of_episodes': 20,
        'vote_average': 8.4,
        'currentUserTrack': {
          'rating': 10,
          'is_favorite': 1,
          'watched_where': 'Apple TV+',
        },
      };

      final show = TvShow.fromJson(json);
      expect(show.id, 110492);
      expect(show.name, 'Severance');
      expect(show.firstAirYear, '2022');
      expect(show.numberOfSeasons, 2);
      expect(show.userRating, 10);
      expect(show.isFavorite, true);
      expect(show.watchedWhere, ['Apple TV+']);
    });

    test('Episode applies 45 minute fallback when runtime is null or 0', () {
      final epNull =
          Episode.fromJson({'id': 1, 'episode_number': 1, 'runtime': null});
      final epZero =
          Episode.fromJson({'id': 2, 'episode_number': 2, 'runtime': 0});

      expect(epNull.runtime, 45);
      expect(epZero.runtime, 45);
    });

    test('Season computes progress fraction and completion state accurately', () {
      const season = Season(
        id: 1,
        seasonNumber: 1,
        name: 'Season 1',
        episodeCount: 3,
        episodes: [
          Episode(
              id: 1,
              seasonNumber: 1,
              episodeNumber: 1,
              name: 'Ep 1',
              isWatched: true),
          Episode(
              id: 2,
              seasonNumber: 1,
              episodeNumber: 2,
              name: 'Ep 2',
              isWatched: true),
          Episode(
              id: 3,
              seasonNumber: 1,
              episodeNumber: 3,
              name: 'Ep 3',
              isWatched: false),
        ],
      );

      expect(season.watchedEpisodesCount, 2);
      expect(season.progressFraction, closeTo(0.666, 0.01));
      expect(season.isCompleted, false);

      final completedSeason = season.copyWith(
        episodes: [
          ...season.episodes.sublist(0, 2),
          season.episodes[2].copyWith(isWatched: true),
        ],
      );
      expect(completedSeason.watchedEpisodesCount, 3);
      expect(completedSeason.progressFraction, 1.0);
      expect(completedSeason.isCompleted, true);
    });
  });

  group('SearchResult Model Tests', () {
    test('handles TMDB movie search item (title & release_date)', () {
      final json = {
        'id': 123,
        'media_type': 'movie',
        'title': 'Inception',
        'release_date': '2010-07-16',
        'vote_average': 8.8,
        'in_db': true,
      };

      final res = SearchResult.fromJson(json);
      expect(res.id, 123);
      expect(res.mediaType, 'movie');
      expect(res.isMovie, true);
      expect(res.title, 'Inception');
      expect(res.yearString, '2010');
      expect(res.inDb, true);
    });

    test('handles TMDB TV search item (name & first_air_date)', () {
      final json = {
        'id': 456,
        'media_type': 'tv',
        'name': 'The Bear',
        'first_air_date': '2022-06-23',
        'vote_average': 8.6,
        'in_db': false,
      };

      final res = SearchResult.fromJson(json);
      expect(res.id, 456);
      expect(res.mediaType, 'tv');
      expect(res.isTv, true);
      expect(res.title, 'The Bear');
      expect(res.yearString, '2022');
      expect(res.inDb, false);
    });
  });

  group('UserStats Model Tests', () {
    test('parses KPIs, mode rating calculation, and heatmap', () {
      final json = {
        'cached': true,
        'kpis': {
          'total_hours': 187.4,
          'total_days': 7.8,
          'movies_count': 84,
          'episodes_count': 213,
          'average_rating': 8.1,
          'current_streak': 14,
          'longest_streak': 31,
        },
        'rating_distribution': [
          {'rating': 6, 'count': 5},
          {'rating': 7, 'count': 18},
          {'rating': 8, 'count': 42}, // Mode
          {'rating': 9, 'count': 30},
          {'rating': 10, 'count': 12},
        ],
        'activity_heatmap': [
          {'date': '2026-09-14', 'count': 3, 'level': 2},
          {'date': '2026-09-13', 'count': 7, 'level': 4},
        ],
        'hourly_habit_matrix': [
          {'day': 0, 'hour': 21, 'count': 12, 'level': 3},
        ],
        'available_years': [2026, 2025, 2024],
      };

      final stats = UserStats.fromJson(json);
      expect(stats.totalHours, 187.4);
      expect(stats.moviesCount, 84);
      expect(stats.episodesCount, 213);
      expect(stats.currentStreak, 14);
      expect(stats.modeRating, 8);
      expect(stats.activityHeatmap.length, 2);
      expect(stats.activityHeatmap[1].level, 4);
      expect(stats.availableYears, [2026, 2025, 2024]);
      expect(stats.cached, true);
    });
  });

  group('DashboardData Model Tests', () {
    test('parses currently watching show, progress and next episode', () {
      final json = {
        'currentlyWatching': {
          'show': {
            'id': 110492,
            'name': 'Severance',
            'number_of_episodes': 20,
          },
          'progress': {
            'watchedEpisodesCount': 14,
            'totalEpisodesCount': 20,
            'lastWatched': {
              'season_number': 2,
              'episode_number': 4,
              'watched_date': '2026-09-12',
            },
          },
          'nextEpisode': {
            'season_number': 2,
            'episode_number': 5,
            'name': 'The Aftermath',
            'runtime': 48,
          },
          'isCompleted': false,
          'otherActiveShows': [
            {'id': 1399, 'name': 'Game of Thrones'},
          ],
        },
        'lastWatchedMovies': [
          {'id': 1, 'movieId': 693134, 'title': 'Dune: Part Two'},
        ],
      };

      final dashboard = DashboardData.fromJson(json);
      expect(dashboard.featuredShow?.name, 'Severance');
      expect(dashboard.currentlyWatching?.progress.watchedEpisodesCount, 14);
      expect(dashboard.nextEpisode?.name, 'The Aftermath');
      expect(dashboard.nextEpisode?.shortCode, 'S2 E5');
      expect(dashboard.otherActiveShows.length, 1);
      expect(dashboard.lastWatchedMovies.length, 1);
    });
  });

  group('ApiKey and DiaryEntry Tests', () {
    test('ApiKey parses creation date and masked prefix', () {
      final json = {
        'id': 4,
        'name': 'MacBook Pro CLI',
        'key_prefix': 'cin_live_7f8a9b...',
        'created_at': '2026-09-10T14:30:00Z',
        'request_count': 128,
        'is_active': 1,
      };

      final key = ApiKey.fromJson(json);
      expect(key.id, 4);
      expect(key.keyPrefix, 'cin_live_7f8a9b...');
      expect(key.requestCount, 128);
      expect(key.isActive, true);
    });

    test('DiaryEntry parses movie and tv log items with formatted dates', () {
      final jsonMovie = {
        'id': 10,
        'type': 'movie',
        'movieId': 693134,
        'title': 'Dune: Part Two',
        'watched_date': '2026-09-08',
        'rating': 10,
      };

      final entry = DiaryEntry.fromJson(jsonMovie);
      expect(entry.isMovie, true);
      expect(entry.rating, 10);
      expect(entry.title, 'Dune: Part Two');
      expect(entry.watchedDate, DateTime(2026, 9, 8));
    });
  });
}
