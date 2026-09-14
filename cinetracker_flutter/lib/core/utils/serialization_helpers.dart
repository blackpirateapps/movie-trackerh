import 'dart:convert';

/// Utilities for resilient serialization between CineTracker REST/SQLite API and Flutter Dart models.
abstract final class SerializationHelpers {
  /// Parses dates from ISO8601 strings, SQLite DATE ('YYYY-MM-DD'),
  /// SQLite TIMESTAMP ('YYYY-MM-DD HH:MM:SS'), or epoch milliseconds.
  static DateTime? parseDate(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is int) {
      if (value <= 0) return null;
      // If seconds instead of milliseconds
      if (value < 10000000000) {
        return DateTime.fromMillisecondsSinceEpoch(value * 1000, isUtc: true);
      }
      return DateTime.fromMillisecondsSinceEpoch(value, isUtc: true);
    }
    if (value is String) {
      final trimmed = value.trim();
      if (trimmed.isEmpty) return null;

      // Try standard DateTime.tryParse (handles ISO-8601 & SQLite YYYY-MM-DD HH:MM:SS)
      final parsed = DateTime.tryParse(trimmed);
      if (parsed != null) return parsed;

      // Handle simple 'YYYY-MM-DD' if not picked up
      final dateRegExp = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$');
      final match = dateRegExp.firstMatch(trimmed);
      if (match != null) {
        final year = int.tryParse(match.group(1) ?? '');
        final month = int.tryParse(match.group(2) ?? '');
        final day = int.tryParse(match.group(3) ?? '');
        if (year != null && month != null && day != null) {
          return DateTime(year, month, day);
        }
      }
    }
    return null;
  }

  /// Formats a DateTime into SQLite / API standard 'YYYY-MM-DD'.
  static String? formatDateOnly(DateTime? date) {
    if (date == null) return null;
    final year = date.year.toString().padLeft(4, '0');
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  /// Parses 1-10 integer rating. Floating numbers are rounded. 0 or negative is null (unrated).
  static int? parseUserRating(dynamic value) {
    if (value == null) return null;
    if (value is int) {
      if (value <= 0) return null;
      return value.clamp(1, 10);
    }
    if (value is num) {
      final rounded = value.round();
      if (rounded <= 0) return null;
      return rounded.clamp(1, 10);
    }
    if (value is String) {
      final trimmed = value.trim();
      if (trimmed.isEmpty) return null;
      final parsedNum = num.tryParse(trimmed);
      if (parsedNum != null) {
        final rounded = parsedNum.round();
        if (rounded <= 0) return null;
        return rounded.clamp(1, 10);
      }
    }
    return null;
  }

  /// Parses community ratings (e.g. TMDB vote_average 8.2).
  static double? parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      final trimmed = value.trim();
      if (trimmed.isEmpty) return null;
      return double.tryParse(trimmed);
    }
    return null;
  }

  /// Parses integers with fallback.
  static int parseInt(dynamic value, [int fallback = 0]) {
    if (value == null) return fallback;
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) {
      final trimmed = value.trim();
      if (trimmed.isEmpty) return fallback;
      return int.tryParse(trimmed) ?? fallback;
    }
    return fallback;
  }

  /// Parses booleans from bool, int (1/0), or string ('true'/'false').
  static bool parseBool(dynamic value, [bool fallback = false]) {
    if (value == null) return fallback;
    if (value is bool) return value;
    if (value is num) return value != 0;
    if (value is String) {
      final lower = value.trim().toLowerCase();
      if (lower == 'true' || lower == '1') return true;
      if (lower == 'false' || lower == '0') return false;
    }
    return fallback;
  }

  /// Safe runtime for movies (defaults to 105 min if null or <= 0).
  static int parseMovieRuntime(dynamic value) {
    final parsed = parseInt(value, 0);
    return parsed > 0 ? parsed : 105;
  }

  /// Safe runtime for TV episodes (defaults to 45 min if null or <= 0).
  static int parseEpisodeRuntime(dynamic value) {
    final parsed = parseInt(value, 0);
    return parsed > 0 ? parsed : 45;
  }

  /// Robust platform tags parsing from JSON string, comma string, or List.
  static List<String> parseWatchedWhere(dynamic value) {
    if (value == null) return [];
    if (value is List) {
      return value
          .map((e) => e?.toString().trim() ?? '')
          .where((s) => s.isNotEmpty)
          .toList();
    }
    if (value is String) {
      final trimmed = value.trim();
      if (trimmed.isEmpty) return [];

      // Try parsing as JSON array
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          final decoded = jsonDecode(trimmed);
          if (decoded is List) {
            return decoded
                .map((e) => e?.toString().trim() ?? '')
                .where((s) => s.isNotEmpty)
                .toList();
          }
        } catch (_) {
          // Fall through to comma split
        }
      }

      // Fallback to comma-delimited split
      return trimmed
          .split(',')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();
    }
    return [];
  }
}
