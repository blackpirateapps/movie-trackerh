import 'package:flutter_test/flutter_test.dart';
import 'package:cinetracker_flutter/core/utils/csv_parser.dart';

void main() {
  group('Pure Dart RFC-4180 CSV Tokenizer', () {
    test('parses simple comma separated values', () {
      const csv =
          'Date,Name,Year\n2026-01-01,Inception,2010\n2026-02-01,Interstellar,2014';
      final rows = LetterboxdCsvParser.parseRawCsv(csv);

      expect(rows.length, 3);
      expect(rows[0], ['Date', 'Name', 'Year']);
      expect(rows[1], ['2026-01-01', 'Inception', '2010']);
      expect(rows[2], ['2026-02-01', 'Interstellar', '2014']);
    });

    test('handles quoted fields with internal commas', () {
      const csv =
          'Name,Year\n"Everything, Everywhere, All at Once",2022\n"Mission: Impossible - Fallout",2018';
      final rows = LetterboxdCsvParser.parseRawCsv(csv);

      expect(rows.length, 3);
      expect(rows[1][0], 'Everything, Everywhere, All at Once');
      expect(rows[1][1], '2022');
      expect(rows[2][0], 'Mission: Impossible - Fallout');
    });

    test('handles escaped double quotes ("")', () {
      const csv = 'Title,Review\nAlien,"A masterpiece with ""Jonesy"" the cat"';
      final rows = LetterboxdCsvParser.parseRawCsv(csv);

      expect(rows.length, 2);
      expect(rows[1][0], 'Alien');
      expect(rows[1][1], 'A masterpiece with "Jonesy" the cat');
    });

    test('handles CRLF line breaks and BOM header', () {
      const csv =
          '\uFEFFDate,Name\r\n2026-03-01,Dune\r\n2026-03-02,Blade Runner';
      final rows = LetterboxdCsvParser.parseRawCsv(csv);

      expect(rows.length, 3);
      expect(rows[0][0], 'Date');
      expect(rows[1][1], 'Dune');
      expect(rows[2][1], 'Blade Runner');
    });
  });

  group('Letterboxd Domain Parser', () {
    test('parses Letterboxd watched.csv with flexible headers', () {
      const csv = '''
Date,Name,Year,Letterboxd URI
2026-03-01,Dune: Part Two,2024,https://boxd.it/iWiq
2026-02-14,Past Lives,2023,https://boxd.it/w9v2
''';
      final items = LetterboxdCsvParser.parse(csv);

      expect(items.length, 2);
      expect(items[0].name, 'Dune: Part Two');
      expect(items[0].year, 2024);
      expect(items[0].watchedDate, DateTime(2026, 3, 1));
      expect(items[0].letterboxdUri, 'https://boxd.it/iWiq');

      expect(items[1].name, 'Past Lives');
      expect(items[1].year, 2023);
      expect(items[1].watchedDate, DateTime(2026, 2, 14));
    });

    test('converts Letterboxd 0.5-5.0 star rating to CineTracker 1-10 scale', () {
      const csv = '''
Name,Year,Rating,Date
Film A,2024,5,2026-01-01
Film B,2024,4.5,2026-01-02
Film C,2024,3.5,2026-01-03
Film D,2024,0.5,2026-01-04
Film E,2024,,2026-01-05
''';
      final items = LetterboxdCsvParser.parse(csv);

      expect(items[0].rating, 10); // 5.0 * 2 = 10
      expect(items[1].rating, 9); // 4.5 * 2 = 9
      expect(items[2].rating, 7); // 3.5 * 2 = 7
      expect(items[3].rating, 1); // 0.5 * 2 = 1
      expect(items[4].rating, null); // unrated
    });

    test('parses Letterboxd watchlist.csv format', () {
      const csv = '''
Date,Name,Year,Letterboxd URI
2026-01-10,Challengers,2024,https://boxd.it/challengers
''';
      final items = LetterboxdCsvParser.parse(csv);

      expect(items.length, 1);
      expect(items[0].name, 'Challengers');
      expect(items[0].year, 2024);
      expect(items[0].watchedDate, DateTime(2026, 1, 10));
    });

    test('ignores empty rows and gracefully handles missing year/date', () {
      const csv = '''
Name,Year,Date
Mystery Title,,

Another Title,2020,
''';
      final items = LetterboxdCsvParser.parse(csv);

      expect(items.length, 2);
      expect(items[0].name, 'Mystery Title');
      expect(items[0].year, null);
      expect(items[0].watchedDate, null);

      expect(items[1].name, 'Another Title');
      expect(items[1].year, 2020);
    });
  });
}
