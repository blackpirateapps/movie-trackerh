import crypto from 'crypto';
import { db, ensureSchema } from './turso';

export interface ApiKeyRecord {
  id: number;
  user_id: number;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  request_count: number;
  is_active: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
  Generate a new secure API key for a user.
  Key format: cin_live_<48 hex chars>
  Stores SHA-256 hash in database for security, returning raw key once.
 */
export async function generateApiKey(userId: number, name: string): Promise<{
  id: number;
  name: string;
  rawKey: string;
  keyPrefix: string;
  createdAt: string;
}> {
  await ensureSchema();

  const randomHex = crypto.randomBytes(24).toString('hex'); // 48 chars
  const rawKey = `cin_live_${randomHex}`;
  const keyPrefix = `cin_live_${randomHex.slice(0, 8)}...`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const cleanName = name.trim() || 'API Key';

  const res = await db.execute({
    sql: `INSERT INTO api_keys (user_id, name, key_prefix, key_hash, created_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          RETURNING id, created_at`,
    args: [userId, cleanName, keyPrefix, keyHash],
  });

  const row = res.rows[0];
  const id = Number(row?.id || 0);
  const createdAt = String(row?.created_at || new Date().toISOString());

  return {
    id,
    name: cleanName,
    rawKey,
    keyPrefix,
    createdAt,
  };
}

/**
 * Validate an incoming API key string.
 */
export async function validateApiKey(rawKey: string): Promise<{
  valid: boolean;
  userId?: number;
  keyId?: number;
  keyName?: string;
  error?: string;
}> {
  if (!rawKey || typeof rawKey !== 'string') {
    return { valid: false, error: 'Missing or invalid API key format' };
  }

  const cleanKey = rawKey.trim();
  if (!cleanKey.startsWith('cin_live_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  await ensureSchema();

  const keyHash = crypto.createHash('sha256').update(cleanKey).digest('hex');

  const res = await db.execute({
    sql: `SELECT id, user_id, name, is_active FROM api_keys WHERE key_hash = ?`,
    args: [keyHash],
  });

  if (res.rows.length === 0) {
    return { valid: false, error: 'Invalid API key' };
  }

  const row = res.rows[0];
  if (!row.is_active) {
    return { valid: false, error: 'API key has been revoked' };
  }

  return {
    valid: true,
    keyId: Number(row.id),
    userId: Number(row.user_id),
    keyName: String(row.name),
  };
}

/**
 * List all active/created API keys for a user (without raw keys).
 */
export async function getUserApiKeys(userId: number): Promise<ApiKeyRecord[]> {
  await ensureSchema();

  const res = await db.execute({
    sql: `SELECT id, user_id, name, key_prefix, created_at, last_used_at, request_count, is_active
          FROM api_keys
          WHERE user_id = ? AND is_active = 1
          ORDER BY id DESC`,
    args: [userId],
  });

  return res.rows.map((row: any) => ({
    id: Number(row.id),
    user_id: Number(row.user_id),
    name: String(row.name),
    key_prefix: String(row.key_prefix),
    created_at: String(row.created_at),
    last_used_at: row.last_used_at ? String(row.last_used_at) : null,
    request_count: Number(row.request_count || 0),
    is_active: Number(row.is_active),
  }));
}

/**
 * Revoke (deactivate or delete) an API key.
 */
export async function revokeApiKey(userId: number, keyId: number): Promise<boolean> {
  await ensureSchema();

  const res = await db.execute({
    sql: `UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?`,
    args: [keyId, userId],
  });

  return (res.rowsAffected || 0) > 0;
}

/**
 * Rate Limiting per API key (default: 60 requests per minute).
 * Updates request counts and last_used_at timestamp.
 */
export async function checkRateLimit(
  keyId: number,
  limit: number = 60
): Promise<RateLimitResult> {
  await ensureSchema();

  const nowSec = Math.floor(Date.now() / 1000);
  const currentWindowStart = Math.floor(nowSec / 60) * 60; // Start of current 1-minute window
  const resetSeconds = Math.max(1, (currentWindowStart + 60) - nowSec);

  // Fetch current window rate limit record
  const rlRes = await db.execute({
    sql: `SELECT window_start, request_count FROM api_rate_limits WHERE key_id = ?`,
    args: [keyId],
  });

  let currentCount = 0;
  let storedWindow = 0;

  if (rlRes.rows.length > 0) {
    storedWindow = Number(rlRes.rows[0].window_start);
    currentCount = Number(rlRes.rows[0].request_count);
  }

  if (storedWindow !== currentWindowStart) {
    // New window
    currentCount = 1;
    await db.execute({
      sql: `INSERT INTO api_rate_limits (key_id, window_start, request_count)
            VALUES (?, ?, 1)
            ON CONFLICT(key_id) DO UPDATE SET window_start = ?, request_count = 1`,
      args: [keyId, currentWindowStart, currentWindowStart],
    });
  } else {
    // Same window
    if (currentCount >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetSeconds,
      };
    }

    currentCount += 1;
    await db.execute({
      sql: `UPDATE api_rate_limits SET request_count = request_count + 1 WHERE key_id = ?`,
      args: [keyId],
    });
  }

  // Update key usage statistics asynchronously
  db.execute({
    sql: `UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP, request_count = request_count + 1 WHERE id = ?`,
    args: [keyId],
  }).catch((err) => console.error('Failed to update api_keys stats:', err));

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - currentCount),
    resetSeconds,
  };
}
