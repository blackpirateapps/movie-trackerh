/// API routes, headers, and default timeouts for CineTracker.
abstract final class ApiConstants {
  // Production live hosted backend on Vercel
  static const String productionBaseUrl = 'https://movie-trackerh.vercel.app';

  // Local development fallbacks
  static const String localBaseUrl = 'http://localhost:3000';
  static const String androidEmulatorBaseUrl = 'http://10.0.2.2:3000';

  // Default base URL points to the live hosted backend
  static const String defaultBaseUrl = productionBaseUrl;

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
