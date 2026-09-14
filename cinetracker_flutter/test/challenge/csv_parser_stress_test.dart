import 'package:flutter_test/flutter_test.dart';
import 'package:cinetracker_flutter/core/utils/csv_parser.dart';

void main() {
  group('Adversarial & Stress Tests: LetterboxdCsvParser', () {
    test('Boundary: empty string and whitespace-only inputs', () {
      expect(LetterboxdCsvParser.parseRawCsv(''), isEmpty);
      expect(LetterboxdCsvParser.parse(''), isEmpty);

      expect(LetterboxdCsvParser.parse('   '), isEmpty);
      expect(LetterboxdCsvParser.parse('\n\n\n'), isEmpty);
      expect(LetterboxdCsvParser.parse('\r\n\r\n'), isEmpty);
      expect(LetterboxdCsvParser.parse('   \n  \r\n   \t  \n'), isEmpty);
    });

    test('Boundary: header only without data rows', () {
      const singleHeader = 'Date,Name,Year,Letterboxd URI,Rating';
      expect(LetterboxdCsvParser.parse(singleHeader), isEmpty);
      expect(LetterboxdCsvParser.parse('$singleHeader\n'), isEmpty);
      expect(LetterboxdCsvParser.parse('$singleHeader\r\n'), isEmpty);
      expect(LetterboxdCsvParser.parse('$singleHeader\n\n\n'), isEmpty);
    });

    test('Stress: unclosed and unmatched quotes at various positions', () {
      // Unclosed quote spanning line end
      const unclosedCsv = 'Name,Year\n"Unclosed Dune: Part Two,2024';
      final items = LetterboxdCsvParser.parse(unclosedCsv);
      expect(items.length, 1);
      // Parser doesn't throw, gracefully surfaces raw content in field
      expect(items.first.name, contains('Unclosed Dune: Part Two'));

      // Lone quote
      const loneQuoteCsv = 'Name,Year\n"\nAnother Film,2021';
      expect(() => LetterboxdCsvParser.parse(loneQuoteCsv), returnsNormally);

      // Quote in the middle of an unquoted field
      const midQuoteCsv = 'Name,Year\nDie "Hard" Movie,1988';
      final midItems = LetterboxdCsvParser.parse(midQuoteCsv);
      expect(midItems.length, 1);
      // Mid-field double quotes in an unquoted field toggle inQuotes, stripping the quotes:
      expect(midItems.first.name, 'Die Hard Movie',
          reason: 'EMPIRICAL BEHAVIOR: mid-cell quotes in unquoted field are stripped as quote delimiters');
    });

    test('Stress: complex escaped quotes and repeated double quotes', () {
      const escapedCsv = '''
Title,Review
Alien,"A masterpiece with ""Jonesy"" the cat"
"The ""Matrix"" Reloaded","Multiple ""nested"" quotes inside ""quotes"""
"Solo Quotes: """"","Empty escaped: """""""
''';
      final raw = LetterboxdCsvParser.parseRawCsv(escapedCsv);
      expect(raw.length, 4);
      expect(raw[1][1], 'A masterpiece with "Jonesy" the cat');
      expect(raw[2][0], 'The "Matrix" Reloaded');
      expect(raw[2][1], 'Multiple "nested" quotes inside "quotes"');
      expect(raw[3][0], 'Solo Quotes: ""');
      expect(raw[3][1], 'Empty escaped: """');

      final items = LetterboxdCsvParser.parse(escapedCsv);
      expect(items.length, 3);
      expect(items[0].review, 'A masterpiece with "Jonesy" the cat');
      expect(items[1].name, 'The "Matrix" Reloaded');
    });

    test('Stress: multiline cells with embedded newlines, commas, and CRLF', () {
      const multilineCsv = '''
Name,Year,Review
"Severance",2022,"Line 1: Please try to enjoy each fact equally.
Line 2: A handshake is available upon request.

Line 3: Praise Kier."
"Dune: Part Two",2024,"Line with \r\n CRLF breaks \r\n inside quotes"
''';
      final items = LetterboxdCsvParser.parse(multilineCsv);
      expect(items.length, 2);
      expect(items[0].name, 'Severance');
      expect(items[0].year, 2022);
      expect(items[0].review, contains('Line 1: Please try to enjoy each fact equally.'));
      expect(items[0].review, contains('Line 2: A handshake is available upon request.'));
      expect(items[0].review, contains('Line 3: Praise Kier.'));

      expect(items[1].name, 'Dune: Part Two');
      expect(items[1].review, contains('Line with \r\n CRLF breaks'));
    });

    test('Stress: missing columns, ragged rows, and excessive commas', () {
      const raggedCsv = '''
Name,Year,Rating,Date,Letterboxd URI,Rewatch,Review
"Sparse Item"
"Second Item",2024
"Third Item",2023,4.5
"Fourth Item",2022,5,2026-03-01,https://boxd.it/test,yes,Great!,extra_col_1,extra_col_2,extra_col_3
,,,,,,
''';
      final items = LetterboxdCsvParser.parse(raggedCsv);
      expect(items.length, 4);

      expect(items[0].name, 'Sparse Item');
      expect(items[0].year, isNull);
      expect(items[0].rating, isNull);
      expect(items[0].watchedDate, isNull);

      expect(items[1].name, 'Second Item');
      expect(items[1].year, 2024);

      expect(items[2].name, 'Third Item');
      expect(items[2].rating, 9); // 4.5 * 2

      expect(items[3].name, 'Fourth Item');
      expect(items[3].year, 2022);
      expect(items[3].rating, 10);
      expect(items[3].isRewatch, isTrue);
      expect(items[3].review, 'Great!');
    });

    test('Stress: whitespace permutations around delimiters and quotes', () {
      const whitespaceCsv = '''
   Name   ,   Year   ,   Rating   ,   Watched Date   
   "Blade Runner 2049"   ,   2017   ,   4.5   ,   2026-01-15   
      Interstellar       ,   2014   ,   5.0   ,   2026-02-20   
''';
      final items = LetterboxdCsvParser.parse(whitespaceCsv);
      expect(items.length, 2);

      expect(items[0].name, 'Blade Runner 2049');
      expect(items[0].year, 2017);
      expect(items[0].rating, 9);
      expect(items[0].watchedDate, DateTime(2026, 1, 15));

      expect(items[1].name, 'Interstellar');
      expect(items[1].year, 2014);
      expect(items[1].rating, 10);
      expect(items[1].watchedDate, DateTime(2026, 2, 20));
    });

    test('Stress: 0-star, negative, boundary, and non-numeric ratings', () {
      const ratingsCsv = '''
Name,Rating
Zero Rating,0
Zero Float,0.0
Half Star,0.5
One Star,1
Four and Half,4.5
Five Star,5
Ten Direct,10
Negative Rating,-1
Fractional Weird,3.7
Invalid Text,Masterpiece
Empty Rating,
''';
      final items = LetterboxdCsvParser.parse(ratingsCsv);
      expect(items.length, 11);

      // 0 and 0.0 should be null (unrated)
      expect(items[0].rating, isNull);
      expect(items[1].rating, isNull);

      // 0.5 * 2 = 1
      expect(items[2].rating, 1);

      // 1.0 * 2 = 2
      expect(items[3].rating, 2);

      // 4.5 * 2 = 9
      expect(items[4].rating, 9);

      // 5.0 * 2 = 10
      expect(items[5].rating, 10);

      // 10 * 2 = 20 -> clamped to 10
      expect(items[6].rating, 10);

      // Negative should be null
      expect(items[7].rating, isNull);

      // 3.7 * 2.0 = 7.4 -> round() = 7
      expect(items[8].rating, 7);

      // Invalid string and empty rating should be null
      expect(items[9].rating, isNull);
      expect(items[10].rating, isNull);
    });

    test('Stress: header aliases and case insensitivity', () {
      const aliasCsv = '''
FILM,RELEASE YEAR,STARS,ADDED,URL,IS REWATCH,NOTES
"Oppenheimer",2023,4.5,2026-04-10,https://boxd.it/opp,TRUE,"Explosive cinema"
''';
      final items = LetterboxdCsvParser.parse(aliasCsv);
      expect(items.length, 1);
      expect(items[0].name, 'Oppenheimer');
      expect(items[0].year, 2023);
      expect(items[0].rating, 9);
      expect(items[0].watchedDate, DateTime(2026, 4, 10));
      expect(items[0].letterboxdUri, 'https://boxd.it/opp');
      expect(items[0].isRewatch, isTrue);
      expect(items[0].review, 'Explosive cinema');
    });

    test('Stress: UTF-8 characters, emojis, accents, and international titles', () {
      const unicodeCsv = '''
Name,Year,Review
"千と千尋の神隠し (Spirited Away 🐉)",2001,"アニメーションの傑作 🌸"
"Amélie (Le Fabuleux Destin d'Amélie Poulain)",2001,"Magnifique film français avec café ☕ et cuillère !"
"Зеркало (The Mirror)",1975,"Поэтический шедевр Тарковского"
"Spider-Man: Across the Spider-Verse 🕷️🕸️",2023,"Visual overdrive! ⚡🎨"
''';
      final items = LetterboxdCsvParser.parse(unicodeCsv);
      expect(items.length, 4);

      expect(items[0].name, '千と千尋の神隠し (Spirited Away 🐉)');
      expect(items[0].review, 'アニメーションの傑作 🌸');

      expect(items[1].name, "Amélie (Le Fabuleux Destin d'Amélie Poulain)");
      expect(items[1].review, "Magnifique film français avec café ☕ et cuillère !");

      expect(items[2].name, 'Зеркало (The Mirror)');
      expect(items[3].name, 'Spider-Man: Across the Spider-Verse 🕷️🕸️');
    });

    test('Performance: parses 1,000 CSV rows efficiently without stack overflow', () {
      final buffer = StringBuffer();
      buffer.writeln('Date,Name,Year,Letterboxd URI,Rating,Rewatch,Review');
      for (int i = 0; i < 1000; i++) {
        buffer.writeln('2026-01-01,"Movie #$i, The Sequel",${2000 + (i % 25)},https://boxd.it/$i,${(i % 5) + 0.5},${i % 2 == 0 ? "yes" : "no"},"Review for movie $i with ""escaped"" quotes"');
      }

      final stopwatch = Stopwatch()..start();
      final items = LetterboxdCsvParser.parse(buffer.toString());
      stopwatch.stop();

      expect(items.length, 1000);
      expect(items[500].name, 'Movie #500, The Sequel');
      expect(items[500].review, 'Review for movie 500 with "escaped" quotes');
      expect(stopwatch.elapsedMilliseconds, lessThan(1000));
    });

    test('LetterboxdImportItem: toApiPayload conversion', () {
      final item = LetterboxdImportItem(
        name: 'Dune',
        year: 2021,
        watchedDate: DateTime(2026, 2, 1),
        rating: 9,
        review: 'Epic sci-fi',
        letterboxdUri: 'https://boxd.it/dune',
        isRewatch: true,
      );

      final payload = item.toApiPayload(matchedTmdbId: 438631);
      expect(payload['originalName'], 'Dune');
      expect(payload['year'], 2021);
      expect(payload['movieId'], 438631);
      expect(payload['rating'], 9);
      expect(payload['review'], 'Epic sci-fi');
      expect(payload['date'], '2026-02-01');
      expect(payload['letterboxdURI'], 'https://boxd.it/dune');
    });
  });
}
