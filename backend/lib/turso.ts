import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient({
  url,
  authToken,
});

let isInitialized = false;

export async function ensureSchema() {
  if (isInitialized) return;
  try {
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        overview TEXT,
        release_date TEXT,
        poster_path TEXT,
        backdrop_path TEXT,
        runtime INTEGER,
        vote_average REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS user_movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        movie_id INTEGER NOT NULL,
        rating INTEGER,
        review TEXT,
        watched_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
        UNIQUE (user_id, movie_id)
      );`,
      `CREATE TABLE IF NOT EXISTS follows (
        follower_id INTEGER NOT NULL,
        following_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        movie_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
        UNIQUE (user_id, movie_id)
      );`,
      `CREATE TABLE IF NOT EXISTS tv_shows (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        overview TEXT,
        first_air_date TEXT,
        poster_path TEXT,
        backdrop_path TEXT,
        number_of_seasons INTEGER,
        number_of_episodes INTEGER,
        vote_average REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS seasons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tv_show_id INTEGER NOT NULL,
        season_number INTEGER NOT NULL,
        name TEXT,
        overview TEXT,
        poster_path TEXT,
        air_date TEXT,
        episode_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tv_show_id) REFERENCES tv_shows (id) ON DELETE CASCADE,
        UNIQUE (tv_show_id, season_number)
      );`,
      `CREATE TABLE IF NOT EXISTS episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tv_show_id INTEGER NOT NULL,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        name TEXT NOT NULL,
        overview TEXT,
        still_path TEXT,
        air_date TEXT,
        vote_average REAL,
        runtime INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tv_show_id) REFERENCES tv_shows (id) ON DELETE CASCADE,
        UNIQUE (tv_show_id, season_number, episode_number)
      );`,
      `CREATE TABLE IF NOT EXISTS user_tv_shows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tv_show_id INTEGER NOT NULL,
        rating INTEGER,
        review TEXT,
        is_favorite INTEGER DEFAULT 0,
        start_date DATE,
        end_date DATE,
        watched_where TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (tv_show_id) REFERENCES tv_shows (id) ON DELETE CASCADE,
        UNIQUE (user_id, tv_show_id)
      );`,
      `CREATE TABLE IF NOT EXISTS user_episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tv_show_id INTEGER NOT NULL,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        watched INTEGER DEFAULT 1,
        watched_date DATE,
        rating INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (tv_show_id) REFERENCES tv_shows (id) ON DELETE CASCADE,
        UNIQUE (user_id, tv_show_id, season_number, episode_number)
      );`
    ];

    for (const stmt of statements) {
      await db.execute(stmt);
    }
    isInitialized = true;
  } catch (error) {
    console.error('Failed to auto-ensure DB schema:', error);
  }
}
