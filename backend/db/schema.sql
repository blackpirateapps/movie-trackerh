-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movies table (caches data from TMDB)
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY, -- TMDB movie ID
    title TEXT NOT NULL,
    overview TEXT,
    release_date TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    runtime INTEGER,
    vote_average REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-Movie relationship table (reviews, ratings, etc.)
CREATE TABLE IF NOT EXISTS user_movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    rating INTEGER, -- 1-10 scale
    review TEXT,
    watched_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
    UNIQUE (user_id, movie_id)
);

-- Follows table for social graph
CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
    UNIQUE (user_id, movie_id)
);

-- TV Shows table (caches data from TMDB)
CREATE TABLE IF NOT EXISTS tv_shows (
    id INTEGER PRIMARY KEY, -- TMDB TV show ID
    name TEXT NOT NULL,
    overview TEXT,
    first_air_date TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    number_of_seasons INTEGER,
    number_of_episodes INTEGER,
    vote_average REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seasons table (caches season metadata from TMDB)
CREATE TABLE IF NOT EXISTS seasons (
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
);

-- Episodes table (caches episode metadata from TMDB)
CREATE TABLE IF NOT EXISTS episodes (
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
);

-- User-TV Show relationship table (reviews, ratings, favorite, start/end dates, platform tags)
CREATE TABLE IF NOT EXISTS user_tv_shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tv_show_id INTEGER NOT NULL,
    rating INTEGER, -- 1-10 scale
    review TEXT,
    is_favorite INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    watched_where TEXT, -- JSON string of tags e.g. ["Netflix", "Hotstar", "Pirated"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (tv_show_id) REFERENCES tv_shows (id) ON DELETE CASCADE,
    UNIQUE (user_id, tv_show_id)
);

-- User-Episode relationship table (watched status & rating per episode)
CREATE TABLE IF NOT EXISTS user_episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tv_show_id INTEGER NOT NULL,
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    watched INTEGER DEFAULT 1,
    watched_date DATE,
    rating INTEGER, -- 1-10 scale
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (tv_show_id) REFERENCES tv_shows (id) ON DELETE CASCADE,
    UNIQUE (user_id, tv_show_id, season_number, episode_number)
);

-- API Keys table for user API access
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    request_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- API Rate Limits tracking table
CREATE TABLE IF NOT EXISTS api_rate_limits (
    key_id INTEGER PRIMARY KEY,
    window_start INTEGER NOT NULL,
    request_count INTEGER NOT NULL,
    FOREIGN KEY (key_id) REFERENCES api_keys (id) ON DELETE CASCADE
);

