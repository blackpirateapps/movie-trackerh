import 'package:flutter_test/flutter_test.dart';
import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';

void main() {
  group('Adversarial & Stress Tests: SerializationHelpers', () {
    group('parseDate robustness', () {
      test('handles null, empty strings, and malformed inputs gracefully', () {
        expect(SerializationHelpers.parseDate(null), isNull);
        expect(SerializationHelpers.parseDate(''), isNull);
        expect(SerializationHelpers.parseDate('   '), isNull);
        expect(SerializationHelpers.parseDate('not-a-real-date'), isNull);
        expect(SerializationHelpers.parseDate('undefined'), isNull);
        expect(SerializationHelpers.parseDate('null'), isNull);
        expect(SerializationHelpers.parseDate(true), isNull);
        expect(SerializationHelpers.parseDate(<dynamic>[]), isNull);
        expect(SerializationHelpers.parseDate(<String, dynamic>{}), isNull);
      });

      test('EMPIRICAL ANOMALY: invalid calendar dates with YYYY-MM-DD pattern roll over via DateTime constructor', () {
        // '2026-99-99' matches RegExp(r'^(\d{4})-(\d{2})-(\d{2})$') and is passed to DateTime(2026, 99, 99).
        // Dart DateTime does not throw on month/day overflow, instead rolling over:
        final date = SerializationHelpers.parseDate('2026-99-99');
        expect(date, isNotNull);
        expect(
          date,
          DateTime(2034, 6, 7),
          reason: 'ANOMALY DETECTED: Dart DateTime constructor arithmetic rolls over out-of-range months/days',
        );
      });

      test('handles standard ISO-8601 strings and variations', () {
        final iso = SerializationHelpers.parseDate('2026-03-01T15:30:00.000Z');
        expect(iso, isNotNull);
        expect(iso!.year, 2026);
        expect(iso.month, 3);
        expect(iso.day, 1);

        final withOffset = SerializationHelpers.parseDate('2026-03-01T17:30:00+02:00');
        expect(withOffset, isNotNull);
        expect(withOffset!.year, 2026);
      });

      test('handles SQLite DATE and TIMESTAMP string formats', () {
        final dateOnly = SerializationHelpers.parseDate('2026-03-01');
        expect(dateOnly, isNotNull);
        expect(dateOnly!.year, 2026);
        expect(dateOnly.month, 3);
        expect(dateOnly.day, 1);

        final timestamp = SerializationHelpers.parseDate('2026-03-01 14:20:00');
        expect(timestamp, isNotNull);
        expect(timestamp!.year, 2026);
        expect(timestamp.hour, 14);
        expect(timestamp.minute, 20);

        final paddedWithSpaces = SerializationHelpers.parseDate('   2026-05-20   ');
        expect(paddedWithSpaces, isNotNull);
        expect(paddedWithSpaces!.month, 5);
      });

      test('handles epoch timestamps (seconds vs milliseconds)', () {
        // Epoch seconds (< 10000000000)
        final seconds = SerializationHelpers.parseDate(1709307000);
        expect(seconds, isNotNull);
        expect(seconds!.year, 2024);

        // Epoch milliseconds (>= 10000000000)
        final millis = SerializationHelpers.parseDate(1709307000000);
        expect(millis, isNotNull);
        expect(millis!.year, 2024);

        // Non-positive epoch
        expect(SerializationHelpers.parseDate(0), isNull);
        expect(SerializationHelpers.parseDate(-10000), isNull);
      });
    });

    group('formatDateOnly format precision', () {
      test('formats valid date into YYYY-MM-DD and handles null', () {
        expect(SerializationHelpers.formatDateOnly(null), isNull);
        expect(
          SerializationHelpers.formatDateOnly(DateTime(2026, 3, 1)),
          '2026-03-01',
        );
        expect(
          SerializationHelpers.formatDateOnly(DateTime(2026, 12, 25)),
          '2026-12-25',
        );
        expect(
          SerializationHelpers.formatDateOnly(DateTime(999, 5, 4)),
          '0999-05-04',
        );
      });
    });

    group('parseUserRating scale compliance', () {
      test('returns null for null, 0, negative or invalid inputs', () {
        expect(SerializationHelpers.parseUserRating(null), isNull);
        expect(SerializationHelpers.parseUserRating(0), isNull);
        expect(SerializationHelpers.parseUserRating(0.0), isNull);
        expect(SerializationHelpers.parseUserRating(-1), isNull);
        expect(SerializationHelpers.parseUserRating(-10), isNull);
        expect(SerializationHelpers.parseUserRating(''), isNull);
        expect(SerializationHelpers.parseUserRating('   '), isNull);
        expect(SerializationHelpers.parseUserRating('invalid'), isNull);
        expect(SerializationHelpers.parseUserRating(true), isNull);
        expect(SerializationHelpers.parseUserRating(<dynamic>[]), isNull);
      });

      test('clamps ratings to 1-10 range and rounds floats', () {
        expect(SerializationHelpers.parseUserRating(1), 1);
        expect(SerializationHelpers.parseUserRating(10), 10);
        expect(SerializationHelpers.parseUserRating(15), 10);
        expect(SerializationHelpers.parseUserRating(100), 10);

        // Floating point round
        expect(SerializationHelpers.parseUserRating(7.4), 7);
        expect(SerializationHelpers.parseUserRating(7.6), 8);
        expect(SerializationHelpers.parseUserRating(0.4), isNull); // 0.4 rounds to 0 <= 0 -> null
        expect(SerializationHelpers.parseUserRating(0.6), 1); // 0.6 rounds to 1

        // String conversions
        expect(SerializationHelpers.parseUserRating('8'), 8);
        expect(SerializationHelpers.parseUserRating('8.6'), 9);
        expect(SerializationHelpers.parseUserRating('  9  '), 9);
        expect(SerializationHelpers.parseUserRating('15'), 10);
      });
    });

    group('parseDouble and parseInt conversions', () {
      test('parseDouble converts ints, doubles, strings, and handles null', () {
        expect(SerializationHelpers.parseDouble(null), isNull);
        expect(SerializationHelpers.parseDouble(8), 8.0);
        expect(SerializationHelpers.parseDouble(8.35), 8.35);
        expect(SerializationHelpers.parseDouble('8.35'), 8.35);
        expect(SerializationHelpers.parseDouble('  7.0  '), 7.0);
        expect(SerializationHelpers.parseDouble('invalid'), isNull);
        expect(SerializationHelpers.parseDouble(''), isNull);
      });

      test('parseInt supports fallback values and type casting', () {
        expect(SerializationHelpers.parseInt(null), 0);
        expect(SerializationHelpers.parseInt(null, 105), 105);
        expect(SerializationHelpers.parseInt(42), 42);
        expect(SerializationHelpers.parseInt(42.9), 42);
        expect(SerializationHelpers.parseInt('42'), 42);
        expect(SerializationHelpers.parseInt('not a number', 5), 5);
        expect(SerializationHelpers.parseInt('', 99), 99);
      });
    });

    group('parseBool permutations', () {
      test('parses booleans, numbers, and strings with fallback', () {
        expect(SerializationHelpers.parseBool(null), isFalse);
        expect(SerializationHelpers.parseBool(null, true), isTrue);

        expect(SerializationHelpers.parseBool(true), isTrue);
        expect(SerializationHelpers.parseBool(false), isFalse);

        expect(SerializationHelpers.parseBool(1), isTrue);
        expect(SerializationHelpers.parseBool(0), isFalse);
        expect(SerializationHelpers.parseBool(-1), isTrue);

        expect(SerializationHelpers.parseBool('true'), isTrue);
        expect(SerializationHelpers.parseBool('TRUE'), isTrue);
        expect(SerializationHelpers.parseBool('1'), isTrue);
        expect(SerializationHelpers.parseBool('false'), isFalse);
        expect(SerializationHelpers.parseBool('0'), isFalse);

        expect(SerializationHelpers.parseBool('unknown', true), isTrue);
        expect(SerializationHelpers.parseBool('unknown', false), isFalse);
      });
    });

    group('Runtime fallbacks', () {
      test('parseMovieRuntime defaults to 105 min when null, 0, or negative', () {
        expect(SerializationHelpers.parseMovieRuntime(null), 105);
        expect(SerializationHelpers.parseMovieRuntime(0), 105);
        expect(SerializationHelpers.parseMovieRuntime(-10), 105);
        expect(SerializationHelpers.parseMovieRuntime(''), 105);
        expect(SerializationHelpers.parseMovieRuntime('invalid'), 105);
        expect(SerializationHelpers.parseMovieRuntime(148), 148);
        expect(SerializationHelpers.parseMovieRuntime('166'), 166);
      });

      test('parseEpisodeRuntime defaults to 45 min when null, 0, or negative', () {
        expect(SerializationHelpers.parseEpisodeRuntime(null), 45);
        expect(SerializationHelpers.parseEpisodeRuntime(0), 45);
        expect(SerializationHelpers.parseEpisodeRuntime(-5), 45);
        expect(SerializationHelpers.parseEpisodeRuntime(''), 45);
        expect(SerializationHelpers.parseEpisodeRuntime('invalid'), 45);
        expect(SerializationHelpers.parseEpisodeRuntime(58), 58);
        expect(SerializationHelpers.parseEpisodeRuntime('60'), 60);
      });
    });

    group('parseWatchedWhere platform tags', () {
      test('parses List of platforms and filters empty/null entries', () {
        expect(SerializationHelpers.parseWatchedWhere(null), isEmpty);
        expect(
          SerializationHelpers.parseWatchedWhere(['Netflix', 'Cinema']),
          ['Netflix', 'Cinema'],
        );
        expect(
          SerializationHelpers.parseWatchedWhere([null, ' Netflix ', '', '  ', 'Apple TV+']),
          ['Netflix', 'Apple TV+'],
        );
      });

      test('parses JSON string array format', () {
        expect(
          SerializationHelpers.parseWatchedWhere('["Netflix", "Apple TV+", "Cinema"]'),
          ['Netflix', 'Apple TV+', 'Cinema'],
        );
      });

      test('parses comma-separated string format', () {
        expect(
          SerializationHelpers.parseWatchedWhere('Netflix, Apple TV+, Cinema'),
          ['Netflix', 'Apple TV+', 'Cinema'],
        );
      });

      test('handles corrupted string falling back gracefully', () {
        expect(SerializationHelpers.parseWatchedWhere(''), isEmpty);
        expect(SerializationHelpers.parseWatchedWhere('   '), isEmpty);
        expect(
          SerializationHelpers.parseWatchedWhere('Corrupted [Array, Netflix'),
          ['Corrupted [Array', 'Netflix'],
        );
      });
    });
  });
}
