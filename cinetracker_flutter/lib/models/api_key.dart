import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';

class ApiKey {
  final int id;
  final String name;
  final String keyPrefix;
  final String? rawKey; // Non-null only once upon generation
  final DateTime createdAt;
  final DateTime? lastUsedAt;
  final int requestCount;
  final bool isActive;

  const ApiKey({
    required this.id,
    required this.name,
    required this.keyPrefix,
    this.rawKey,
    required this.createdAt,
    this.lastUsedAt,
    this.requestCount = 0,
    this.isActive = true,
  });

  factory ApiKey.fromJson(Map<String, dynamic> json) {
    final id = SerializationHelpers.parseInt(json['id']);
    final name = json['name']?.toString() ?? 'Personal Key';
    final keyPrefix = json['key_prefix']?.toString() ??
        json['keyPrefix']?.toString() ??
        'cin_live_...';
    final rawKey = json['rawKey']?.toString();
    final createdAt = SerializationHelpers.parseDate(
            json['created_at'] ?? json['createdAt']) ??
        DateTime.now();
    final lastUsedAt = SerializationHelpers.parseDate(
        json['last_used_at'] ?? json['lastUsedAt']);
    final requestCount = SerializationHelpers.parseInt(
        json['request_count'] ?? json['requestCount'], 0);
    final isActive =
        SerializationHelpers.parseBool(json['is_active'] ?? json['isActive'], true);

    return ApiKey(
      id: id,
      name: name,
      keyPrefix: keyPrefix,
      rawKey: rawKey,
      createdAt: createdAt,
      lastUsedAt: lastUsedAt,
      requestCount: requestCount,
      isActive: isActive,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'key_prefix': keyPrefix,
      if (rawKey != null) 'rawKey': rawKey,
      'created_at': createdAt.toIso8601String(),
      'last_used_at': lastUsedAt?.toIso8601String(),
      'request_count': requestCount,
      'is_active': isActive,
    };
  }

  ApiKey copyWith({
    int? id,
    String? name,
    String? keyPrefix,
    String? rawKey,
    DateTime? createdAt,
    DateTime? lastUsedAt,
    int? requestCount,
    bool? isActive,
  }) {
    return ApiKey(
      id: id ?? this.id,
      name: name ?? this.name,
      keyPrefix: keyPrefix ?? this.keyPrefix,
      rawKey: rawKey ?? this.rawKey,
      createdAt: createdAt ?? this.createdAt,
      lastUsedAt: lastUsedAt ?? this.lastUsedAt,
      requestCount: requestCount ?? this.requestCount,
      isActive: isActive ?? this.isActive,
    );
  }
}
