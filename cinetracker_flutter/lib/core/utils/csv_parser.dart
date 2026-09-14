import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';

/// Single item parsed from a Letterboxd CSV export.
class LetterboxdImportItem {
  final String name;
  final int? year;
  final DateTime? watchedDate;
  final String? letterboxdUri;
  final int? rating; // Converted to CineTracker 1-10 scale
  final bool isRewatch;
  final String? review;

  const LetterboxdImportItem({
    required this.name,
    this.year,
    this.watchedDate,
    this.letterboxdUri,
    this.rating,
    this.isRewatch = false,
    this.review,
  });

  Map<String, dynamic> toApiPayload({int? matchedTmdbId}) {
    final payload = <String, dynamic>{
      'originalName': name,
      'year': year,
      'date': SerializationHelpers.formatDateOnly(watchedDate),
    };
    if (matchedTmdbId != null) payload['movieId'] = matchedTmdbId;
    if (rating != null) payload['rating'] = rating;
    if (review != null) payload['review'] = review;
    if (letterboxdUri != null) payload['letterboxdURI'] = letterboxdUri;
    return payload;
  }
}

/// Robust RFC-4180 CSV parser and Letterboxd importer in pure Dart.
abstract final class LetterboxdCsvParser {
  /// Parses standard RFC-4180 CSV string into raw rows and columns.
  /// Handles quoted fields, embedded commas, double-quote escaping (""), and newlines.
  static List<List<String>> parseRawCsv(String input) {
    final List<List<String>> rows = [];
    if (input.isEmpty) return rows;

    // Remove BOM if present
    String text = input;
    if (text.startsWith('\uFEFF')) {
      text = text.substring(1);
    }

    final StringBuffer curField = StringBuffer();
    final List<String> curRow = [];
    bool inQuotes = false;
    int i = 0;
    final int len = text.length;

    while (i < len) {
      final char = text[i];

      if (inQuotes) {
        if (char == '"') {
          // Check for escaped quote ("")
          if (i + 1 < len && text[i + 1] == '"') {
            curField.write('"');
            i += 2;
            continue;
          } else {
            // End of quoted field
            inQuotes = false;
            i++;
            continue;
          }
        } else {
          curField.write(char);
          i++;
          continue;
        }
      } else {
        if (char == '"') {
          inQuotes = true;
          i++;
          continue;
        } else if (char == ',') {
          curRow.add(curField.toString());
          curField.clear();
          i++;
          continue;
        } else if (char == '\r') {
          // Check for CRLF (\r\n)
          if (i + 1 < len && text[i + 1] == '\n') {
            i++;
          }
          curRow.add(curField.toString());
          curField.clear();
          rows.add(List<String>.from(curRow));
          curRow.clear();
          i++;
          continue;
        } else if (char == '\n') {
          curRow.add(curField.toString());
          curField.clear();
          rows.add(List<String>.from(curRow));
          curRow.clear();
          i++;
          continue;
        } else {
          curField.write(char);
          i++;
          continue;
        }
      }
    }

    // Add trailing field and row
    if (curField.isNotEmpty || curRow.isNotEmpty) {
      curRow.add(curField.toString());
      rows.add(curRow);
    }

    return rows;
  }

  /// Parses Letterboxd CSV content into strongly-typed [LetterboxdImportItem] entities.
  static List<LetterboxdImportItem> parse(String csvContent) {
    final rawRows = parseRawCsv(csvContent);
    if (rawRows.isEmpty) return [];

    // Header inspection (case-insensitive column matching)
    final header = rawRows.first.map((h) => h.trim().toLowerCase()).toList();
    int nameIdx = _findHeaderIndex(header, ['name', 'title', 'movie title', 'film']);
    int yearIdx = _findHeaderIndex(header, ['year', 'release year']);
    int dateIdx = _findHeaderIndex(header, ['watched date', 'date', 'watched', 'added']);
    int uriIdx = _findHeaderIndex(header, ['letterboxd uri', 'uri', 'url', 'letterboxd url']);
    int ratingIdx = _findHeaderIndex(header, ['rating', 'stars', 'user rating']);
    int rewatchIdx = _findHeaderIndex(header, ['rewatch', 'is rewatch']);
    int reviewIdx = _findHeaderIndex(header, ['review', 'notes']);

    if (nameIdx == -1) {
      // If no explicit header matched, assume column 0 is name
      nameIdx = 0;
    }

    final List<LetterboxdImportItem> items = [];

    for (int r = 1; r < rawRows.length; r++) {
      final row = rawRows[r];
      if (row.isEmpty || row.every((col) => col.trim().isEmpty)) continue;

      final name = nameIdx >= 0 && nameIdx < row.length ? row[nameIdx].trim() : '';
      if (name.isEmpty) continue;

      int? year;
      if (yearIdx >= 0 && yearIdx < row.length) {
        year = int.tryParse(row[yearIdx].trim());
      }

      DateTime? watchedDate;
      if (dateIdx >= 0 && dateIdx < row.length) {
        watchedDate = SerializationHelpers.parseDate(row[dateIdx].trim());
      }

      String? letterboxdUri;
      if (uriIdx >= 0 && uriIdx < row.length) {
        final uri = row[uriIdx].trim();
        if (uri.isNotEmpty) letterboxdUri = uri;
      }

      int? userRating;
      if (ratingIdx >= 0 && ratingIdx < row.length) {
        final rawRating = row[ratingIdx].trim();
        if (rawRating.isNotEmpty) {
          final star = double.tryParse(rawRating);
          if (star != null && star > 0) {
            // Convert Letterboxd 0.5 - 5.0 stars to CineTracker 1 - 10 scale
            userRating = (star * 2.0).round().clamp(1, 10);
          }
        }
      }

      bool isRewatch = false;
      if (rewatchIdx >= 0 && rewatchIdx < row.length) {
        final raw = row[rewatchIdx].trim().toLowerCase();
        isRewatch = raw == 'yes' || raw == 'true' || raw == '1';
      }

      String? review;
      if (reviewIdx >= 0 && reviewIdx < row.length) {
        final rev = row[reviewIdx].trim();
        if (rev.isNotEmpty) review = rev;
      }

      items.add(LetterboxdImportItem(
        name: name,
        year: year,
        watchedDate: watchedDate,
        letterboxdUri: letterboxdUri,
        rating: userRating,
        isRewatch: isRewatch,
        review: review,
      ));
    }

    return items;
  }

  static int _findHeaderIndex(List<String> header, List<String> aliases) {
    for (final alias in aliases) {
      final index = header.indexOf(alias);
      if (index != -1) return index;
    }
    return -1;
  }
}
