import 'package:cinetracker_flutter/core/utils/serialization_helpers.dart';

class User {
  final int id;
  final String username;
  final String email;
  final String displayName;
  final String? avatarUrl;
  final String? bio;
  final String? website;
  final DateTime? createdAt;

  const User({
    required this.id,
    required this.username,
    required this.email,
    required this.displayName,
    this.avatarUrl,
    this.bio,
    this.website,
    this.createdAt,
  });

  String get safeDisplayName =>
      displayName.isNotEmpty ? displayName : (username.isNotEmpty ? username : 'User');

  String get initials {
    final name = safeDisplayName.trim();
    if (name.isEmpty) return 'U';
    return name[0].toUpperCase();
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: SerializationHelpers.parseInt(json['id']),
      username: json['username']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      displayName: json['displayName']?.toString() ??
          json['display_name']?.toString() ??
          json['username']?.toString() ??
          'User',
      avatarUrl:
          json['avatarUrl']?.toString() ?? json['avatar_url']?.toString(),
      bio: json['bio']?.toString(),
      website: json['website']?.toString(),
      createdAt: SerializationHelpers.parseDate(
          json['createdAt'] ?? json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'displayName': displayName,
      'avatarUrl': avatarUrl,
      'bio': bio,
      'website': website,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  User copyWith({
    int? id,
    String? username,
    String? email,
    String? displayName,
    String? avatarUrl,
    String? bio,
    String? website,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      website: website ?? this.website,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is User &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          username == other.username;

  @override
  int get hashCode => id.hashCode ^ username.hashCode;
}
