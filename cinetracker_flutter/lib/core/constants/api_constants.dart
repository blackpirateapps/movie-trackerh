/// API routes, headers, and default timeouts for CineTracker.
abstract final class ApiConstants {
  // Default base URL for local development (iOS simulator uses localhost)
  static const String defaultBaseUrl = 'http://localhost:3000';

  // Production fallback or custom server override
  static const String stagingBaseUrl = 'https://cinetracker-staging.vercel.app';

  // Timeout settings
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration requestTimeout = Duration(seconds: 20);

  // Cookie and Header constants
  static const String cookieHeader = 'Cookie';
  static const String setCookieHeader = 'set-cookie';
  static const String sessionCookieName = 'token';
  static const String authHeader = 'Authorization';
  static const String apiKeyHeader = 'X-API-Key';

  // Endpoint paths matching src/app/api/
  static const String auth = '/api/auth';
  static const String movies = '/api/movies';
  static const String tv = '/api/tv';
  static const String dashboard = '/api/user/dashboard';
  static const String stats = '/api/user/stats';
  static const String search = '/api/search';
  static const String user = '/api/user';
  static const String keys = '/api/keys';
  static const String importCsv = '/api/import';
  static const String exportData = '/api/v1/export';
}
