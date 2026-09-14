import 'package:flutter_test/flutter_test.dart';
import 'package:cinetracker_flutter/models/movie.dart';
import 'package:cinetracker_flutter/models/tv_show.dart';
import 'package:cinetracker_flutter/models/season.dart';
import 'package:cinetracker_flutter/models/episode.dart';
import 'package:cinetracker_flutter/models/user_stats.dart';
import 'package:cinetracker_flutter/models/dashboard_data.dart';
import 'package:cinetracker_flutter/models/search_result.dart';
import 'package:cinetracker_flutter/models/api_key.dart';
import 'package:cinetracker_flutter/models/diary_entry.dart';
import 'package:cinetracker_flutter/models/user.dart';
import 'package:cinetracker_flutter/models/api_models.dart';

void main() {
  group('Adversarial & Stress Tests: Domain Models Resilience', () {
    group('Movie model stress-testing', () {
      test('survives empty JSON map with safe defaults', () {
        final movie = Movie.fromJson({});
        expect(movie.id, 0);
        expect(movie.title, 'Untitled Movie');
        expect(movie.overview, isNull);
        expect(movie.releaseDate, isNull);
        expect(movie.releaseYear, '');
        expect(movie.posterPath, isNull);
        expect(movie.backdropPath, isNull);
        expect(movie.voteAverage, isNull);
        expect(movie.runtime, 105); // Default fallback
        expect(movie.isFavorite, isFalse);
        expect(movie.inWatchlist, isFalse);
        expect(movie.userRating, isNull);
        expect(movie.review, isNull);
        expect(movie.watchedWhere, isEmpty);
        expect(movie.watchedDate, isNull);
        expect(movie.isWatched, isFalse);
      });

      test('resilient to null runtimes, 0 runtime, and negative runtime', () {
        expect(Movie.fromJson({'runtime': null}).runtime, 105);
        expect(Movie.fromJson({'runtime': 0}).runtime, 105);
        expect(Movie.fromJson({'runtime': -120}).runtime, 105);
        expect(Movie.fromJson({'runtime': '90'}).runtime, 90);
        expect(Movie.fromJson({'runtime': 166}).runtime, 166);
      });

      test('mixed-type ratings and clamping behavior', () {
        // Int rating
        expect(Movie.fromJson({'rating': 9}).userRating, 9);
        // Double rating rounding
        expect(Movie.fromJson({'rating': 8.6}).userRating, 9);
        expect(Movie.fromJson({'rating': 8.2}).userRating, 8);
        // 0-star rating should be null (unrated)
        expect(Movie.fromJson({'rating': 0}).userRating, isNull);
        expect(Movie.fromJson({'rating': 0.0}).userRating, isNull);
        // Negative rating should be null
        expect(Movie.fromJson({'rating': -5}).userRating, isNull);
        // Overflow clamped to 10
        expect(Movie.fromJson({'rating': 25}).userRating, 10);
        // String rating
        expect(Movie.fromJson({'rating': '7'}).userRating, 7);
      });

      test('extreme strings: long descriptions, XSS, and SQL injection payloads', () {
        final hugeString = 'A' * 10000;
        const xssPayload = '<script>alert("pwned")</script>';
        const sqlPayload = "'; DROP TABLE movies; --";

        final movie = Movie.fromJson({
          'id': 99999,
          'title': xssPayload,
          'overview': hugeString,
          'review': sqlPayload,
        });

        expect(movie.title, xssPayload);
        expect(movie.overview?.length, 10000);
        expect(movie.review, sqlPayload);
        expect(movie.isWatched, isTrue); // Review is present
      });

      test('nested currentUserReview overrides and priority', () {
        final json = {
          'id': 101,
          'title': 'Dune: Part Two',
          'rating': 5, // root rating
          'currentUserReview': {
            'rating': 10, // nested rating should take precedence
            'review': 'Phenomenal IMAX experience',
            'watched_date': '2026-03-01',
            'watched_where': ['IMAX', 'Cinema'],
          }
        };
        final movie = Movie.fromJson(json);
        expect(movie.userRating, 10);
        expect(movie.review, 'Phenomenal IMAX experience');
        expect(movie.watchedDate, DateTime(2026, 3, 1));
        expect(movie.watchedWhere, ['IMAX', 'Cinema']);
        expect(movie.isWatched, isTrue);
      });

      test('toJson and copyWith round-trip consistency', () {
        final movie = Movie(
          id: 42,
          title: 'Arrival',
          overview: 'Linguistic sci-fi masterpiece',
          releaseDate: DateTime(2016, 11, 11),
          posterPath: '/arrival.jpg',
          runtime: 116,
          userRating: 10,
          isFavorite: true,
          inWatchlist: false,
          watchedWhere: const ['Blu-ray', 'Apple TV+'],
          watchedDate: DateTime(2026, 1, 1),
        );

        final json = movie.toJson();
        final reconstructed = Movie.fromJson(json);

        expect(reconstructed.id, movie.id);
        expect(reconstructed.title, movie.title);
        expect(reconstructed.runtime, movie.runtime);
        expect(reconstructed.userRating, movie.userRating);
        expect(reconstructed.isFavorite, movie.isFavorite);
        expect(reconstructed.watchedWhere, movie.watchedWhere);
        expect(reconstructed, equals(movie));

        final copied = movie.copyWith(userRating: 9, isFavorite: false);
        expect(copied.userRating, 9);
        expect(copied.isFavorite, isFalse);
        expect(copied.id, 42);
      });
    });

    group('TvShow, Season, Episode model stress-testing', () {
      test('TvShow handles empty JSON with safe defaults', () {
        final show = TvShow.fromJson({});
        expect(show.id, 0);
        expect(show.name, 'Untitled TV Show');
        expect(show.numberOfSeasons, 1);
        expect(show.numberOfEpisodes, 0);
        expect(show.seasons, isEmpty);
        expect(show.firstAirYear, '');
        expect(show.inWatchlist, isFalse);
        expect(show.isFavorite, isFalse);
      });

      test('TvShow handles corrupted seasons array without crashing', () {
        final corrupted1 = TvShow.fromJson({'seasons': 'not a list'});
        expect(corrupted1.seasons, isEmpty);

        final corrupted2 = TvShow.fromJson({
          'seasons': [
            {'id': 1, 'season_number': 1, 'name': 'Season 1'}
          ]
        });
        expect(corrupted2.seasons.length, 1);
        expect(corrupted2.seasons.first.name, 'Season 1');
      });

      test('Season progressFraction avoids division by zero on 0 episodes', () {
        final seasonZero = Season.fromJson({'id': 1, 'season_number': 1, 'episode_count': 0});
        expect(seasonZero.episodeCount, 0);
        expect(seasonZero.progressFraction, 0.0);
        expect(seasonZero.isCompleted, isFalse);

        const seasonWithEpisodes = Season(
          id: 10,
          seasonNumber: 1,
          name: 'Season 1',
          episodeCount: 3,
          episodes: [
            Episode(id: 1, seasonNumber: 1, episodeNumber: 1, name: 'Ep 1', isWatched: true),
            Episode(id: 2, seasonNumber: 1, episodeNumber: 2, name: 'Ep 2', isWatched: true),
            Episode(id: 3, seasonNumber: 1, episodeNumber: 3, name: 'Ep 3', isWatched: false),
          ],
        );
        expect(seasonWithEpisodes.watchedEpisodesCount, 2);
        expect(seasonWithEpisodes.progressFraction, closeTo(2 / 3, 0.001));
        expect(seasonWithEpisodes.isCompleted, isFalse);
      });

      test('Episode runtime fallbacks and code formatting', () {
        final episode = Episode.fromJson({
          'season_number': 2,
          'episode_number': 5,
          'runtime': null, // Should default to 45
        });
        expect(episode.runtime, 45);
        expect(episode.episodeCode, 'S02E05');
        expect(episode.shortCode, 'S2 E5');

        final episodeCustom = Episode.fromJson({
          'seasonNumber': 10,
          'episodeNumber': 22,
          'runtime': 0, // Should default to 45
        });
        expect(episodeCustom.runtime, 45);
        expect(episodeCustom.episodeCode, 'S10E22');
        expect(episodeCustom.shortCode, 'S10 E22');
      });
    });

    group('UserStats model stress-testing', () {
      test('UserStats handles completely empty JSON', () {
        final stats = UserStats.fromJson({});
        expect(stats.totalHours, 0.0);
        expect(stats.totalDays, 0.0);
        expect(stats.moviesCount, 0);
        expect(stats.episodesCount, 0);
        expect(stats.showsCount, 0);
        expect(stats.totalReviews, 0);
        expect(stats.averageRating, 0.0);
        expect(stats.currentStreak, 0);
        expect(stats.longestStreak, 0);
        expect(stats.modeRating, 8); // Default fallback when rating distribution empty
        expect(stats.timeSeries, isEmpty);
        expect(stats.ratingDistribution, isEmpty);
        expect(stats.activityHeatmap, isEmpty);
        expect(stats.hourlyHabitMatrix, isEmpty);
        expect(stats.cached, isFalse);
      });

      test('UserStats modeRating correctly identifies the highest frequency rating tier', () {
        const stats = UserStats(
          totalHours: 100.0,
          totalDays: 4.16,
          moviesCount: 50,
          episodesCount: 80,
          averageRating: 7.8,
          currentStreak: 5,
          longestStreak: 12,
          ratingDistribution: [
            RatingDistributionItem(rating: 7, count: 15),
            RatingDistributionItem(rating: 8, count: 32),
            RatingDistributionItem(rating: 9, count: 28),
            RatingDistributionItem(rating: 10, count: 10),
          ],
        );
        expect(stats.modeRating, 8);
      });

      test('HeatmapDay and HabitMatrixCell boundary clamping', () {
        final heatmap = HeatmapDay.fromJson({
          'date': '2026-03-01',
          'count': 5,
          'level': 99, // Should clamp to 4
        });
        expect(heatmap.level, 4);

        final habitCell = HabitMatrixCell.fromJson({
          'day': 10, // Should clamp to 6
          'hour': 28, // Should clamp to 23
          'count': 3,
          'level': -2, // Should clamp to 0
        });
        expect(habitCell.day, 6);
        expect(habitCell.hour, 23);
        expect(habitCell.level, 0);
      });

      test('Available years ignores pre-1900 corrupted values', () {
        final stats = UserStats.fromJson({
          'available_years': [2026, 2025, 2024, 1850, 0, -10],
        });
        expect(stats.availableYears, [2026, 2025, 2024]);
      });
    });

    group('DashboardData model stress-testing', () {
      test('handles empty JSON and null currentlyWatching', () {
        final data = DashboardData.fromJson({});
        expect(data.currentlyWatching, isNull);
        expect(data.featuredShow, isNull);
        expect(data.nextEpisode, isNull);
        expect(data.otherActiveShows, isEmpty);
        expect(data.lastWatchedMovies, isEmpty);
      });

      test('ShowProgress fraction handles zero total episodes', () {
        final progressZero = ShowProgress.fromJson({
          'watchedEpisodesCount': 0,
          'totalEpisodesCount': 0,
        });
        expect(progressZero.fraction, 0.0);

        final progressFull = ShowProgress.fromJson({
          'watchedEpisodesCount': 9,
          'totalEpisodesCount': 9,
        });
        expect(progressFull.fraction, 1.0);
      });
    });

    group('SearchResult, ApiKey, DiaryEntry, and User models stress-testing', () {
      test('SearchResult resolves movie vs TV keys seamlessly', () {
        final movieResult = SearchResult.fromJson({
          'id': 100,
          'type': 'movie',
          'title': 'Dune',
          'release_date': '2021-10-22',
        });
        expect(movieResult.isMovie, isTrue);
        expect(movieResult.title, 'Dune');
        expect(movieResult.yearString, '2021');

        final tvResult = SearchResult.fromJson({
          'id': 200,
          'mediaType': 'tv',
          'name': 'Severance',
          'first_air_date': '2022-02-18',
        });
        expect(tvResult.isTv, isTrue);
        expect(tvResult.title, 'Severance');
        expect(tvResult.yearString, '2022');
      });

      test('ApiKey handles missing fields and masked prefix', () {
        final key = ApiKey.fromJson({});
        expect(key.id, 0);
        expect(key.name, 'Personal Key');
        expect(key.keyPrefix, 'cin_live_...');
        expect(key.rawKey, isNull);
        expect(key.isActive, isTrue);
        expect(key.requestCount, 0);
        expect(key.createdAt, isA<DateTime>());
      });

      test('DiaryEntry resolves media type and title from various backends', () {
        final entryMovie = DiaryEntry.fromJson({
          'id': 1,
          'movieId': 500,
          'movieTitle': 'Challengers',
          'rating': 8,
        });
        expect(entryMovie.isMovie, isTrue);
        expect(entryMovie.mediaId, 500);
        expect(entryMovie.title, 'Challengers');
        expect(entryMovie.rating, 8);

        final entryTv = DiaryEntry.fromJson({
          'id': 2,
          'tvShowId': 600,
          'tvShowName': 'The Bear',
          'seasonEpisodeCode': 'S03E01',
        });
        expect(entryTv.isTv, isTrue);
        expect(entryTv.mediaId, 600);
        expect(entryTv.title, 'The Bear');
        expect(entryTv.seasonEpisodeCode, 'S03E01');
      });

      test('User fallback chain for display name', () {
        expect(User.fromJson({}).displayName, 'User');
        expect(User.fromJson({'username': 'cinephile'}).displayName, 'cinephile');
        expect(User.fromJson({'username': 'cinephile', 'display_name': 'Cinema Lover'}).displayName, 'Cinema Lover');
        expect(User.fromJson({'displayName': 'Top Critic'}).displayName, 'Top Critic');
      });
    });

    group('api_models.dart view models stress-testing', () {
      test('MovieDetail, TvShowDetail, SeasonDetail survive empty JSON', () {
        expect(() => MovieDetail.fromJson({}), returnsNormally);
        expect(() => TvShowDetail.fromJson({}), returnsNormally);
        expect(() => SeasonDetail.fromJson({}), returnsNormally);

        final movieDetail = MovieDetail.fromJson({
          'title': 'Inception',
          'genres': [{'name': 'Sci-Fi'}, 'Action'],
          'cast': [{'name': 'Leonardo DiCaprio'}, 'Joseph Gordon-Levitt'],
          'director': 'Christopher Nolan',
        });
        expect(movieDetail.genres, ['Sci-Fi', 'Action']);
        expect(movieDetail.cast, ['Leonardo DiCaprio', 'Joseph Gordon-Levitt']);
        expect(movieDetail.director, 'Christopher Nolan');
      });

      test('AuthResult, ApiKeyCreateResult, UserProfile survive empty JSON', () {
        expect(() => AuthResult.fromJson({}), returnsNormally);
        expect(() => ApiKeyCreateResult.fromJson({}), returnsNormally);
        expect(() => UserProfile.fromJson({}), returnsNormally);
        expect(() => ActivityFeedItem.fromJson({}), returnsNormally);
        expect(() => UserDirectoryResult.fromJson({}), returnsNormally);
        expect(() => BatchImportResult.fromJson({}), returnsNormally);
      });
    });
  });
}
