import { db, ensureSchema } from './turso';

/**
 * Retrieve cached user stats if present and younger than maxAgeHours (default 24h).
 */
export async function getCachedUserStats(
  userId: number,
  cacheKey: string,
  maxAgeHours: number = 24
): Promise<any | null> {
  try {
    await ensureSchema();
    const res = await db.execute({
      sql: `SELECT stats_data, updated_at FROM user_stats_cache WHERE user_id = ? AND cache_key = ?`,
      args: [userId, cacheKey],
    });

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const updatedAt = new Date(String(row.updated_at)).getTime();
    const now = Date.now();
    const ageInHours = (now - updatedAt) / (1000 * 60 * 60);

    if (ageInHours > maxAgeHours) {
      return null; // Expired
    }

    return JSON.parse(String(row.stats_data));
  } catch (error) {
    console.error('Error fetching cached user stats:', error);
    return null;
  }
}

/**
 * Upsert cached user stats payload for a given cache key.
 */
export async function setCachedUserStats(
  userId: number,
  cacheKey: string,
  statsData: object
): Promise<void> {
  try {
    await ensureSchema();
    const jsonStr = JSON.stringify(statsData);
    await db.execute({
      sql: `INSERT INTO user_stats_cache (user_id, cache_key, stats_data, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(cache_key) DO UPDATE SET
              stats_data = excluded.stats_data,
              updated_at = CURRENT_TIMESTAMP`,
      args: [userId, cacheKey, jsonStr],
    });
  } catch (error) {
    console.error('Error setting cached user stats:', error);
  }
}

/**
 * Invalidate all cached stats for a user (called when user edits/logs movies, tv, episodes, or imports CSV).
 */
export async function invalidateUserStatsCache(userId: number): Promise<void> {
  try {
    await ensureSchema();
    await db.execute({
      sql: `DELETE FROM user_stats_cache WHERE user_id = ?`,
      args: [userId],
    });
  } catch (error) {
    console.error('Error invalidating user stats cache:', error);
  }
}
