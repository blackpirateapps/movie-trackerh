import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';

abstract class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic responseBody;

  const ApiException(this.message, {this.statusCode, this.responseBody});

  @override
  String toString() => 'ApiException(code: $statusCode): $message';
}

class BadRequestException extends ApiException {
  const BadRequestException(super.message, {super.responseBody})
      : super(statusCode: 400);
}

class UnauthorizedException extends ApiException {
  const UnauthorizedException(super.message, {super.responseBody})
      : super(statusCode: 401);
}

class ForbiddenException extends ApiException {
  const ForbiddenException(super.message, {super.responseBody})
      : super(statusCode: 403);
}

class NotFoundException extends ApiException {
  const NotFoundException(super.message, {super.responseBody})
      : super(statusCode: 404);
}

class ConflictException extends ApiException {
  const ConflictException(super.message, {super.responseBody})
      : super(statusCode: 409);
}

class RateLimitException extends ApiException {
  final int? retryAfterSeconds;

  const RateLimitException(super.message,
      {this.retryAfterSeconds, super.responseBody})
      : super(statusCode: 429);
}

class ServerException extends ApiException {
  const ServerException(super.message, {int? statusCode, super.responseBody})
      : super(statusCode: statusCode ?? 500);
}

class NetworkException extends ApiException {
  final Object? cause;

  const NetworkException(super.message, {this.cause})
      : super(statusCode: null, responseBody: null);

  @override
  String toString() => 'NetworkException: $message (cause: $cause)';
}

class ApiClient {
  final String baseUrl;
  final Duration timeout;
  final http.Client _client;

  String? _sessionToken;
  String? _apiKey;

  ApiClient({
    String? baseUrl,
    Duration? timeout,
    http.Client? client,
  })  : baseUrl = (baseUrl ?? ApiConstants.defaultBaseUrl)
            .replaceAll(RegExp(r'/+$'), ''),
        timeout = timeout ?? ApiConstants.requestTimeout,
        _client = client ?? http.Client();

  String? get sessionToken => _sessionToken;
  void setSessionToken(String? token) => _sessionToken = token;

  String? get apiKey => _apiKey;
  void setApiKey(String? key) => _apiKey = key;

  Map<String, String> _buildHeaders(Map<String, String>? extraHeaders) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (_sessionToken != null && _sessionToken!.isNotEmpty) {
      headers[ApiConstants.cookieHeader] =
          '${ApiConstants.sessionCookieName}=$_sessionToken';
    }

    if (_apiKey != null && _apiKey!.isNotEmpty) {
      headers[ApiConstants.authHeader] = 'Bearer $_apiKey';
      headers[ApiConstants.apiKeyHeader] = _apiKey!;
    }

    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }

    return headers;
  }

  Uri _resolveUri(String path, [Map<String, dynamic>? queryParams]) {
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final fullUrl = '$baseUrl$cleanPath';
    final uri = Uri.parse(fullUrl);

    if (queryParams == null || queryParams.isEmpty) {
      return uri;
    }

    final queryStrings = <String, String>{};
    queryParams.forEach((key, value) {
      if (value != null) {
        queryStrings[key] = value.toString();
      }
    });

    return uri.replace(queryParameters: queryStrings);
  }

  void _extractSessionCookie(http.Response response) {
    final rawSetCookie = response.headers[ApiConstants.setCookieHeader];
    if (rawSetCookie == null) return;

    final match =
        RegExp(r'(?:^|;\s*)token=([^;]+)').firstMatch(rawSetCookie);
    if (match != null) {
      final token = match.group(1);
      if (token != null && token.isNotEmpty) {
        _sessionToken = token;
      }
    }
  }

  dynamic _processResponse(http.Response response) {
    _extractSessionCookie(response);

    final statusCode = response.statusCode;
    dynamic decodedBody;

    if (response.body.isNotEmpty) {
      try {
        decodedBody = jsonDecode(utf8.decode(response.bodyBytes));
      } catch (_) {
        decodedBody = response.body;
      }
    }

    if (statusCode >= 200 && statusCode < 300) {
      return decodedBody;
    }

    final errorMessage = (decodedBody is Map && decodedBody['message'] != null)
        ? decodedBody['message'].toString()
        : (decodedBody is Map && decodedBody['error'] != null)
            ? decodedBody['error'].toString()
            : 'HTTP request failed with status $statusCode';

    switch (statusCode) {
      case 400:
        throw BadRequestException(errorMessage, responseBody: decodedBody);
      case 401:
        throw UnauthorizedException(errorMessage, responseBody: decodedBody);
      case 403:
        throw ForbiddenException(errorMessage, responseBody: decodedBody);
      case 404:
        throw NotFoundException(errorMessage, responseBody: decodedBody);
      case 409:
        throw ConflictException(errorMessage, responseBody: decodedBody);
      case 429:
        int? retryAfter;
        final retryHeader = response.headers['retry-after'];
        if (retryHeader != null) {
          retryAfter = int.tryParse(retryHeader);
        } else if (decodedBody is Map &&
            decodedBody['retry_after_seconds'] != null) {
          retryAfter =
              int.tryParse(decodedBody['retry_after_seconds'].toString());
        }
        throw RateLimitException(errorMessage,
            retryAfterSeconds: retryAfter, responseBody: decodedBody);
      default:
        throw ServerException(errorMessage,
            statusCode: statusCode, responseBody: decodedBody);
    }
  }

  Future<dynamic> get(String path,
      {Map<String, dynamic>? queryParams, Map<String, String>? headers}) async {
    final uri = _resolveUri(path, queryParams);
    try {
      final response = await _client
          .get(uri, headers: _buildHeaders(headers))
          .timeout(timeout);
      return _processResponse(response);
    } on SocketException catch (e) {
      throw NetworkException(
          'Cannot connect to server at $baseUrl. Check network connection.',
          cause: e);
    } on TimeoutException catch (e) {
      throw NetworkException(
          'Request to $uri timed out after ${timeout.inSeconds}s.',
          cause: e);
    } on http.ClientException catch (e) {
      throw NetworkException('HTTP client error: ${e.message}', cause: e);
    }
  }

  Future<dynamic> post(String path,
      {dynamic body,
      Map<String, dynamic>? queryParams,
      Map<String, String>? headers}) async {
    final uri = _resolveUri(path, queryParams);
    try {
      final encodedBody = body != null ? jsonEncode(body) : null;
      final response = await _client
          .post(uri, headers: _buildHeaders(headers), body: encodedBody)
          .timeout(timeout);
      return _processResponse(response);
    } on SocketException catch (e) {
      throw NetworkException(
          'Cannot connect to server at $baseUrl. Check network connection.',
          cause: e);
    } on TimeoutException catch (e) {
      throw NetworkException(
          'Request to $uri timed out after ${timeout.inSeconds}s.',
          cause: e);
    } on http.ClientException catch (e) {
      throw NetworkException('HTTP client error: ${e.message}', cause: e);
    }
  }

  void close() => _client.close();
}
