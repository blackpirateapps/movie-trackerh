# CineTracker (movie-trackerh) - AI Handoff & Architecture Document

This document provides a comprehensive technical overview of the **CineTracker** codebase (`movie-trackerh`). It is structured to allow future AI agents and developers to quickly understand the system architecture, code organization, database schemas, API endpoints, authentication mechanisms, Hand-Drawn design system, and full-stack TypeScript architecture without needing to re-analyze the codebase.

---

## 1. Executive Summary & Application Purpose

**CineTracker** is a full-stack movie and TV show tracking & social networking web application built with **Next.js 16+ App Router (Turbopack)**, **TypeScript**, and a custom **Hand-Drawn Design System**. Key user capabilities include:
- **Movie & TV Show Discovery & Search**: Query movies and TV series using TMDB (The Movie Database) API with local caching in a LibSQL (Turso) database.
- **Trending & Popular Releases**: Home page displays top releases of the current year (via TMDB `discover` endpoint sorted by popularity, with fallback to `trending/week`).
- **Personal Media Tracking**: Rate movies, TV shows, and individual episodes on a **1–10 star rating scale**, write text reviews, record start/end dates, mark favorites, and select/create "Watched Where" platform tags (e.g., Netflix, Hotstar, Pirated, Prime Video).
- **Season & Episode Breakdown & Bulk Marking**: Browse full season and episode breakdowns with titles, descriptions, air dates, still images, watched toggles, and episode ratings (1-10). Includes one-click **"Mark Entire Show as Watched"** and **"Mark Season X as Watched"** buttons that automatically update the database.
- **Automatic Database Migration & Rating Scale Constraint Upgrade**: Database migrations and table creations (`CREATE TABLE IF NOT EXISTS`) run automatically during `npm run build` and on cold-start API route invocations (`ensureSchema()`). Automatically migrates legacy `user_movies` tables with `CHECK (rating >= 1 AND rating <= 5)` constraints to support the 1–10 rating scale seamlessly.
- **Letterboxd CSV Import**: Interactively import watched history (`watched.csv`) or watchlists (`watchlist.csv`) exported from Letterboxd with TMDB title matching and manual selection.
- **Social Graph & Feed**: Follow/unfollow other users, view community profiles, and see recent movie & TV show activity from followed users.
- **User Authentication**: Secure signup/login using bcrypt-hashed passwords and JWT tokens set in HTTP-only cookies.
- **REST API Keys & Complete Data Export API**: Authenticated users can generate cryptographically secure API keys (`cin_live_...`), manage/revoke keys, and make rate-limited REST requests (`/api/v1/export`) to retrieve their full user data (movies watched, TV shows tracked, episode watch dates & 1–10 ratings, reviews, platform tags, watchlist, and social graph).
- **Developer Settings Portal & Interactive Console**: Integrated developer portal at `/settings` with key creation, one-time raw key display, live API tester console, interactive multi-language code snippets (cURL, JavaScript, Python, Node.js), one-click **Copy AI Agent Docs** button (markdown specification prompt), and complete endpoint documentation.
- **Flagship Analytics & Interactive Graphs (`/stats`)**: Fully featured analytics dashboard with timeframe filtering (**All-Time**, **Yearly**, **Monthly**, **Weekly**, **Custom Range**), KPI metric cards (hours watched, days spent, avg 1–10 rating, watch streaks), Recharts time series area charts, 1–10 rating distribution histogram, platform share pie charts, and a GitHub-style 365-day activity heatmap grid.
- **Temporary Root Admin Password Reset**: Allows resetting any user password by authenticating with `ROOT_ADMIN_PASSWORD` stored in environment variables.

---

## 2. Technology Stack & Design System Architecture

The application is built on a modern full-stack **TypeScript + Next.js App Router** architecture:

- **Framework**: Next.js 16+ (App Router with `src/app` and Turbopack compiler)
- **Language**: TypeScript (`tsconfig.json` with strict type-checking and path alias `@/*`)
- **Icons**: Lucide React (`lucide-react`)
- **Rating System**: 1 to 10 scale supported across all media types (movies, TV series, individual episodes)
- **Database Initialization & Auto-Migration**: Auto-executing migrations (`npm run build` calls `backend/db/migrate.ts`) plus runtime guard (`ensureSchema()` in `backend/lib/turso.ts`).
- **Styling & Design System (`design2.md`)**: Utilitarian, Minimalist, High-Contrast Dark Mode System
  - **Typography**: Google Font (`Inter`, sans-serif) across headings and body text. Metadata labels are uppercase, `text-xs` (or smaller), `font-bold` with `tracking-widest`.
  - **Color Palette Tokens**:
    - `bgBase`: `#121212` (App background, dropdowns)
    - `bgSurface`: `#1E1E1E` (Elevated cards, container backgrounds, sticky navbar)
    - `bgHover`: `#2A2A2A` (Hover states, poster placeholders)
    - `borderSubtle`: `#333333` (1px solid borders, dividers)
    - `textMain`: `#EDEDED` (Primary headings, text)
    - `textMuted`: `#A0A0A0` (Secondary text, metadata)
    - `accent`: `#00FF66` (Neon green CTAs, ratings, badges, active states)
    - `accentHover`: `#00CC52` (Hover state for accent elements)
  - **Elevation**: Elevation achieved strictly through background color contrast (`#121212` -> `#1E1E1E` -> `#2A2A2A`) and `1px solid #333333` borders. Zero box-shadows.
  - **Media Grid & Posters**: Strict `aspect-[2/3]` wrapper, 4px border-radius, `border border-[#333333]`, hover `scale-105` (0.3s ease) image scaling, backdrop-blur hover overlay.
- **Routing & Rendering**: Next.js Client and Server Components (`.tsx`) with `next/navigation` (`useRouter`, `useParams`) and `next/link`
- **HTTP Client**: Axios (`src/lib/api.ts`) configured with relative paths (`baseURL: ''`) for API routes
- **Backend API Routes**: Next.js Route Handlers in `src/app/api/...` (`route.ts`) (`GET`, `POST` functions returning `NextResponse`)
- **Authentication**: JWT signed token stored in HTTP-only `token` cookie, authenticated via `backend/lib/auth.ts`, alongside SHA-256 hashed API Keys (`cin_live_...`) verified in `backend/lib/apiKeys.ts`
- **Database Engine**: Turso (Hosted LibSQL / SQLite) via `@libsql/client`

---

## 3. Directory & File Structure

```
movie-trackerh/
├── backend/
│   ├── db/
│   │   ├── migrate.ts       # Database migration script (reads schema.sql & updates table structure + migrates legacy constraints)
│   │   └── schema.sql       # Initial SQLite database schema DDL (includes users, movies, user_movies, tv_shows, seasons, episodes, user_tv_shows, user_episodes, follows, watchlist, api_keys, api_rate_limits)
│   └── lib/
│       ├── apiKeys.ts       # Cryptographic API key generation (cin_live_...), SHA-256 hashing, rate limiting (60 req/min), & key validation
│       ├── auth.ts          # Authentication helper function (verifies token from cookie)
│       ├── jwt.ts           # JWT signing (`signToken`) & verification (`verifyToken`) helpers
│       └── turso.ts         # Turso db client instance initialization (@libsql/client) & ensureSchema runtime guard
├── src/
│   ├── app/                 # Next.js App Router Routes & API Handlers
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── route.ts # GET session check; POST login, signup, logout, reset-password
│   │   │   ├── import/
│   │   │   │   └── route.ts # POST parse CSV, search TMDB, import movie to DB
│   │   │   ├── keys/
│   │   │   │   └── route.ts # GET list user API keys; POST create/revoke API keys
│   │   │   ├── movies/
│   │   │   │   └── route.ts # GET search TMDB / get movie details / popular current year; POST rate/review & watchlist toggle
│   │   │   ├── tv/
│   │   │   │   └── route.ts # GET search TMDB TV / show details & seasons; POST track TV, favorite, delete, mark_season_watched, mark_show_watched, episode watched/rated
│   │   │   ├── user/
│   │   │   │   └── route.ts # GET list users, single profile (movies & TV), action=feed; POST follow/unfollow user
│   │   │   └── v1/
│   │   │       ├── export/
│   │   │       │   └── route.ts # GET full user data export (movies, TV, episodes, ratings, reviews, tags, watchlist, social, stats) with rate limiting & query filters
│   │   │       └── user/
│   │   │           └── data/
│   │   │               └── route.ts # GET alias endpoint delegating to /api/v1/export
│   │   ├── feed/
│   │   │   └── page.tsx     # Hand-Drawn activity feed pinboard (Movies & TV)
│   │   ├── import/
│   │   │   └── page.tsx     # Interactive Letterboxd CSV importer notebook page
│   │   ├── login/
│   │   │   └── page.tsx     # Hand-Drawn post-it login form & emergency reset modal
│   │   ├── movie/
│   │   │   └── [id]/
│   │   │       └── page.tsx # Dynamic Movie detail scrapbook page
│   │   ├── tv/
│   │   │   └── [id]/
│   │   │       └── page.tsx # Dynamic TV Show detail & season/episode breakdown page with bulk watch controls
│   │   ├── profile/
│   │   │   ├── edit/
│   │   │   │   └── page.tsx # Utility settings page (profile info, avatar, app preferences, password, danger zone)
│   │   │   └── [username]/
│   │   │       └── page.tsx # Dynamic User personal profile page (Movies & TV tabs)
│   │   ├── settings/
│   │   │   ├── page.tsx     # Flagship Developer Portal & Settings UI (API key management, live API tester, docs & code snippets)
│   │   │   └── api-keys/
│   │   │       └── page.tsx # Redirect route to /settings?tab=api-keys
│   │   ├── signup/
│   │   │   └── page.tsx     # Hand-Drawn post-it signup form
│   │   ├── users/
│   │   │   └── page.tsx     # Hand-Drawn community directory board
│   │   ├── globals.css      # Hand-Drawn design system tokens, wobbly borders, paper texture, custom styles
│   │   ├── layout.tsx       # Root layout wrapping app in AuthProvider and Navbar
│   │   └── page.tsx         # Home page with hero banner, movie/TV search switcher & current year trenders
│   ├── components/
│   │   ├── MovieCard.tsx    # Photo print / sketch frame card for movies
│   │   ├── TVShowCard.tsx   # Photo print / sketch frame card for TV shows with favorite & platform tags
│   │   ├── Navbar.tsx       # Hand-drawn navigation header with brand logo & mobile dropdown
│   │   └── StarRating.tsx   # Interactive and read-only hand-drawn star rating component (1-10 scale)
│   ├── contexts/
│   │   └── AuthContext.tsx  # React Client Context providing user session & auth actions
│   ├── hooks/
│   │   └── useAuth.ts       # Convenience hook consuming AuthContext
│   ├── lib/
│   │   └── api.ts           # Pre-configured Axios instance using relative API paths
│   └── types/
│       └── index.ts         # Shared TypeScript interfaces (User, Movie, TVShow, Season, Episode, ApiKeyRecord, etc.)
├── design.md                # Comprehensive Hand-Drawn Design System Specification
├── tsconfig.json            # TypeScript configuration (`compilerOptions`, `@/*` path mapping)
├── next.config.js           # Next.js configuration (remote image domains)
├── vercel.json              # Vercel deployment configuration (`framework: nextjs`)

├── package.json             # NPM dependencies & Next.js scripts (`dev`, `build` runs migration, `start`, `lint`)
└── HANDOFF.md               # AI Handoff documentation
```

---

## 4. Database Schema & Data Models

The database relies on Turso (SQLite/LibSQL).

### Table Definitions

1. `users`
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `username`: TEXT NOT NULL UNIQUE
   - `email`: TEXT NOT NULL UNIQUE
   - `password`: TEXT NOT NULL (hashed with bcrypt)
   - `display_name`: TEXT
   - `bio`: TEXT
   - `website`: TEXT
   - `avatar_url`: TEXT
   - `pref_default_layout`: TEXT DEFAULT 'grid'
   - `pref_hide_nsfw`: INTEGER DEFAULT 0
   - `pref_is_private`: INTEGER DEFAULT 0
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

2. `movies` (caches data from TMDB)
   - `id`: INTEGER PRIMARY KEY (Matches TMDB movie ID)
   - `title`: TEXT NOT NULL
   - `overview`: TEXT
   - `release_date`: TEXT
   - `poster_path`: TEXT
   - `backdrop_path`: TEXT
   - `runtime`: INTEGER
   - `vote_average`: REAL
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

3. `user_movies` (user reviews & ratings)
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `user_id`: INTEGER NOT NULL
   - `movie_id`: INTEGER NOT NULL
   - `rating`: INTEGER (1-10 scale)
   - `review`: TEXT
   - `watched_date`: DATE
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `updated_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `UNIQUE(user_id, movie_id)` constraint used for `UPSERT` / `ON CONFLICT` operations

4. `tv_shows` (caches data from TMDB)
   - `id`: INTEGER PRIMARY KEY (Matches TMDB TV ID)
   - `name`: TEXT NOT NULL
   - `overview`: TEXT
   - `first_air_date`: TEXT
   - `poster_path`: TEXT
   - `backdrop_path`: TEXT
   - `number_of_seasons`: INTEGER
   - `number_of_episodes`: INTEGER
   - `vote_average`: REAL
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

5. `seasons` (caches season metadata from TMDB)
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `tv_show_id`: INTEGER NOT NULL
   - `season_number`: INTEGER NOT NULL
   - `name`: TEXT
   - `overview`: TEXT
   - `poster_path`: TEXT
   - `air_date`: TEXT
   - `episode_count`: INTEGER
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `UNIQUE(tv_show_id, season_number)`

6. `episodes` (caches episode metadata from TMDB)
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `tv_show_id`: INTEGER NOT NULL
   - `season_number`: INTEGER NOT NULL
   - `episode_number`: INTEGER NOT NULL
   - `name`: TEXT NOT NULL
   - `overview`: TEXT
   - `still_path`: TEXT
   - `air_date`: TEXT
   - `vote_average`: REAL
   - `runtime`: INTEGER
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `UNIQUE(tv_show_id, season_number, episode_number)`

7. `user_tv_shows` (user reviews, ratings, favorite, start/end dates, platform tags)
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `user_id`: INTEGER NOT NULL
   - `tv_show_id`: INTEGER NOT NULL
   - `rating`: INTEGER (1-10 scale)
   - `review`: TEXT
   - `is_favorite`: INTEGER DEFAULT 0
   - `start_date`: DATE
   - `end_date`: DATE
   - `watched_where`: TEXT (JSON array string e.g. `["Netflix","Hotstar","Pirated"]`)
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `updated_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `UNIQUE(user_id, tv_show_id)`

8. `user_episodes` (episode watched state & 1-10 rating)
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `user_id`: INTEGER NOT NULL
   - `tv_show_id`: INTEGER NOT NULL
   - `season_number`: INTEGER NOT NULL
   - `episode_number`: INTEGER NOT NULL
   - `watched`: INTEGER DEFAULT 1
   - `watched_date`: DATE
   - `rating`: INTEGER (1-10 scale)
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `updated_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `UNIQUE(user_id, tv_show_id, season_number, episode_number)`

9. `follows` (social connection graph)
   - `follower_id`: INTEGER NOT NULL
   - `following_id`: INTEGER NOT NULL
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `PRIMARY KEY (follower_id, following_id)`

10. `watchlist`
    - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
    - `user_id`: INTEGER NOT NULL
    - `movie_id`: INTEGER NOT NULL
    - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    - `UNIQUE(user_id, movie_id)`

11. `api_keys` (API key credentials & usage stats)
    - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
    - `user_id`: INTEGER NOT NULL
    - `name`: TEXT NOT NULL
    - `key_prefix`: TEXT NOT NULL (e.g. `cin_live_a1b2c3d4...`)
    - `key_hash`: TEXT NOT NULL UNIQUE (SHA-256 hash of full raw key)
    - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    - `last_used_at`: TIMESTAMP
    - `request_count`: INTEGER DEFAULT 0
    - `is_active`: INTEGER DEFAULT 1

12. `api_rate_limits` (Per-key 1-minute window rate limit counters)
    - `key_id`: INTEGER PRIMARY KEY
    - `window_start`: INTEGER NOT NULL (UNIX timestamp of current 1-minute window)
    - `request_count`: INTEGER NOT NULL

---

## 5. API Endpoint Reference (Next.js App Router Route Handlers)

### `/api/v1/export` (and alias `/api/v1/user/data`)
- `GET`:
  - **Authentication**: `Authorization: Bearer <api_key>`, `X-API-Key: <api_key>`, `?api_key=<api_key>`, or cookie session.
  - **Query Parameters**:
    - `include`: Comma-separated list of data blocks (`profile`, `stats`, `movies`, `tv`, `episodes`, `watchlist`, `social`). Default: all.
    - `since`: ISO date string to filter records created or updated after specified date (`YYYY-MM-DD`).
  - **Rate Limiting**: 60 requests per minute per key. Returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers.
  - **Response Payload**: Returns full structured JSON export containing user profile, lifetime statistics (total films, total TV shows, total episodes, calculated total hours watched), watched movies with 1–10 ratings & reviews, tracked TV shows with platform tags, episode watch dates & ratings, watchlist, and social graph.

### `/api/keys`
- `GET`: Returns list of active API keys for authenticated user (`id`, `name`, `key_prefix`, `created_at`, `last_used_at`, `request_count`).
- `POST`:
  - `action: 'create'`: Generates a new API key. Body: `{ action: 'create', name: 'Key Label' }`. Returns `{ key: { id, name, rawKey, keyPrefix, createdAt } }`. Note: Raw key is returned ONCE.
  - `action: 'revoke'`: Revokes an API key. Body: `{ action: 'revoke', keyId: <id> }`.

### `/api/tv`
- `GET`:
  - `?query=<search_term>`: Search TMDB API (`/3/search/tv`). If `query=popular` or `query=trending`, fetches current year popular TV series via TMDB `discover/tv` (with fallback to `trending/tv/week`).
  - `?id=<tmdb_tv_id>`: Fetches TV show details, caches TV show & seasons metadata in local DB tables, returns show data with `currentUserTrack`, `userEpisodes`, and `reviews`.
  - `?id=<tmdb_tv_id>&season=<season_number>`: Fetches Season details, caches episodes in local `episodes` DB table (with stills), returns season and episodes list with user watched/rating states.
- `POST`:
  - Default (Track TV Show): Body: `{ tvShowId, rating, review, isFavorite, startDate, endDate, watchedWhere }`. Upserts into `user_tv_shows`.
  - `action: 'favorite'`: Body: `{ tvShowId, isFavorite }`. Toggles favorite in `user_tv_shows`.
  - `action: 'delete'`: Body: `{ tvShowId }`. Removes show from user's collection and clears episode tracking records.
  - `action: 'mark_show_watched'`: Body: `{ tvShowId, watchedDate }`. Bulk marks all seasons and episodes for this show as watched with the specified date in `user_episodes`.
  - `action: 'mark_season_watched'`: Body: `{ tvShowId, seasonNumber, watchedDate }`. Bulk marks all episodes in the target season as watched with the specified date in `user_episodes`.
  - `action: 'episode_watched'`: Body: `{ tvShowId, seasonNumber, episodeNumber, watched, rating, watchedDate }`. Upserts into `user_episodes`.

### `/api/auth`
- `GET`: Validates session cookie. Returns `{ user: { id, username, email } }`.
- `POST`:
  - `action: 'signup'`: Creates user. Body: `{ username, email, password }`.
  - `action: 'login'`: Authenticates user using `password` column. Body: `{ email, password }`.
  - `action: 'logout'`: Clears token cookie.
  - `action: 'reset-password'`: (Temporary Admin feature) Validates `rootPassword` against `process.env.ROOT_ADMIN_PASSWORD` and updates target user's `password` column. Body: `{ rootPassword, usernameOrEmail, newPassword }`.

### `/api/movies`
- `GET`:
  - `?query=<search_term>`: Search TMDB API (`/3/search/movie`). If `query=popular` or `query=trending`, fetches current year popular movies via TMDB `discover/movie` (with fallback to `trending/movie/week`).
  - `?id=<tmdb_movie_id>`: Fetches TMDB movie details, caches movie in local `movies` DB table, and returns movie data along with `currentUserReview`, `isInWatchlist`, and `reviews` (top 10 public reviews).
- `POST`:
  - `action: 'watchlist'`: Toggles movie in `watchlist` table for authenticated user. Body: `{ movieId, action: 'watchlist' }`.
  - Default (Rate/Review): Upserts into `user_movies` table (ratings on 1-10 scale). Body: `{ movieId, rating, review, watchedDate }`.

### `/api/user`
- `GET`:
  - `?action=feed`: Returns recent movie & TV show ratings/reviews from users that the current user follows.
  - `?action=list&page=1&limit=20&search=`: Returns paginated list of users with stats (`movies`, `tv_shows`, `followers`, `following`).
  - `?username=<username>`: Returns user profile (display name, bio, website, avatar, preferences), tracked movies, tracked TV shows, top 4 favorites, recent activity, watchlist, calculated `hours_watched` stat, and `isFollowing` status.
- `POST`:
  - `action: 'follow'`: Inserts row into `follows` table. Body: `{ action: 'follow', followingId }`.
  - `action: 'unfollow'`: Deletes row from `follows` table. Body: `{ action: 'unfollow', followingId }`.
  - `action: 'update_profile'`: Updates user profile fields (`displayName`, `username`, `bio`, `website`, `avatarUrl`, `prefDefaultLayout`, `prefHideNsfw`, `prefIsPrivate`).
  - `action: 'change_password'`: Verifies `currentPassword` using bcrypt and updates to `newPassword`.
  - `action: 'delete_account'`: Deletes user record (cascading dependent records) and clears the authentication HTTP-only session cookie.

### `/api/user/dashboard`
- `GET`:
  - **Authentication**: Cookie session (authenticated user required).
  - **Query Parameters**: `tvShowId` (optional, specifies active TV show to feature).
  - **Response Payload**: Returns `currentlyWatching` (featured show metadata, episode watch progress count vs total, last watched episode timestamp, next unwatched episode details including season, episode number, title, overview, air date, and still path, completion status, and `otherActiveShows` list) and `lastWatchedMovies` (list of 6 recently logged movies with 1-10 rating, review text, and watch date).

---

## 6. Environment Variables

The application requires the following environment variables (defined in Vercel or `.env.local`):

| Variable | Description |
|---|---|
| `TURSO_DATABASE_URL` | Turso database connection URL (e.g. `libsql://<db-name>.turso.io`) |
| `TURSO_AUTH_TOKEN` | Turso database API access token |
| `JWT_SECRET` | Secret key used for signing & verifying session JWT tokens |
| `TMDB_API_KEY` | API Key for The Movie Database API (v3) |
| `ROOT_ADMIN_PASSWORD` | (Temporary) Secret root admin password for emergency user password resets |
| `NODE_ENV` | Environment mode (`development` or `production`) |

---

## 7. Development & Build Commands

- **Start Next.js Dev Server**: `npm run dev` (Runs Next.js Turbopack on `http://localhost:3000`)
- **Build Next.js App**: `npm run build` (Executes DB schema migration script `npx -y tsx backend/db/migrate.ts` then builds Next.js app)
- **Start Next.js Production Server**: `npm run start`
- **TypeScript Typecheck**: `npx tsc --noEmit`
---

## 8. Performance & UI Optimization Architecture

The codebase incorporates high-performance full-stack optimizations to eliminate UI flakiness, reduce latency, and minimize database & external network calls:

- **Non-Blocking UI & Background Data Sync**:
  - `MoviePage` ([`src/app/movie/[id]/page.tsx`](file:///home/dog/git/movie-trackerh/src/app/movie/%5Bid%5D/page.tsx)) and `TVShowPage` ([`src/app/tv/[id]/page.tsx`](file:///home/dog/git/movie-trackerh/src/app/tv/%5Bid%5D/page.tsx)) use an optional `showSpinner` flag in `fetchMovieData(showSpinner)` and `fetchTVShowData(showSpinner)`.
  - Initial page loads display full-screen skeleton loaders, while edits, ratings, reviews, watched toggles, and episode updates update local state instantly and sync silently in the background without unmounting the DOM or flickering.
- **Cache-First Database Strategy**:
  - API routes [`/api/movies`](file:///home/dog/git/movie-trackerh/src/app/api/movies/route.ts) and [`/api/tv`](file:///home/dog/git/movie-trackerh/src/app/api/tv/route.ts) check local SQLite/Turso tables (`movies`, `tv_shows`, `seasons`, `episodes`) before making outbound HTTP calls to TMDB.
  - `POST` handlers skip redundant external API fetches when records already exist in local storage.
- **LibSQL / Turso Query Batching**:
  - Database schema guard `ensureSchema()` ([`backend/lib/turso.ts`](file:///home/dog/git/movie-trackerh/backend/lib/turso.ts)) uses `db.batch()` to execute all `CREATE TABLE IF NOT EXISTS` DDL statements in a single network roundtrip.
  - Bulk actions (`mark_season_watched`, `mark_show_watched`) issue batched SQL `UPSERT` statements in single HTTP payloads.
- **Component Memoization**:
  - Pure UI components ([`StarRating`](file:///home/dog/git/movie-trackerh/src/components/StarRating.tsx), [`MovieCard`](file:///home/dog/git/movie-trackerh/src/components/MovieCard.tsx), [`TVShowCard`](file:///home/dog/git/movie-trackerh/src/components/TVShowCard.tsx)) are wrapped in `React.memo` to avoid unnecessary parent re-renders.

---

## 9. Profile Showcase & Settings Architecture

- **Profile Showcase View** ([`src/app/profile/[username]/page.tsx`](file:///home/dog/git/movie-trackerh/src/app/profile/%5Busername%5D/page.tsx)):
  - **User Header**: Avatar, Display Name, Username, Bio, Website, Join Date, Edit Profile / Follow button.
  - **Lifetime Stats**: Total Films, Total TV Shows, Total Hours Watched.
  - **Top 4 Favorites**: 4-poster mini-grid highlighting top rated/favorite releases.
  - **Recent Activity**: 5 most recently logged releases.
  - **Sub-Tabs**: Showcase, Diary, Films, TV, Watchlist.
  - **Developer Settings Portal & Interactive Console**: Integrated developer portal at `/settings` with key creation, one-time raw key display, live API tester console, interactive multi-language code snippets (cURL, JavaScript, Python, Node.js), one-click **Copy AI Agent Docs** button (markdown specification prompt), and complete endpoint documentation.
- **Profile Edit & Utility Settings** ([`src/app/profile/edit/page.tsx`](file:///home/dog/git/movie-trackerh/src/app/profile/edit/page.tsx)):
  - **Basic Info**: Display Name, Username, Bio (textarea), Website.
  - **Avatar Management**: Image URL input, live preview, preset avatar pickers.
  - **App & Profile Preferences**: Grid vs. List layout mode, Hide NSFW content toggle, Profile Privacy toggle.
  - **Account & Security**: Current & New Password update form, linked email display.
  - **Danger Zone**: Red high-contrast Account Deletion with password confirmation modal prompt.

---

- **Flagship Analytics & Interactive Graphs (`/stats`)**: Fully featured analytics dashboard with timeframe filtering (**All-Time**, **Yearly**, **Monthly**, **Weekly**, **Custom Range**), KPI metric cards (hours watched, days spent, avg 1–10 rating, watch streaks), Recharts time series area charts, 1–10 rating distribution histogram, platform share pie charts, and a GitHub-style 365-day activity heatmap grid.

...

## 10. Developer Portal, API Key Management & Data Export Architecture

- **Developer Settings Portal UI** ([`src/app/settings/page.tsx`](file:///home/dog/git/movie-trackerh/src/app/settings/page.tsx)):
  - **API Keys Sub-Tab**: Create named API keys, copy raw key string on generation, view active keys table with prefix, created date, last used timestamp, total request count, and revocation action.
  - **API Documentation Sub-Tab**: Comprehensive specification for `/api/v1/export`, header format (`Authorization: Bearer cin_live_...`), rate limits (60 req/min), field definitions, and one-click **Copy AI Agent Docs** button for instant markdown prompting.
  - **Interactive API Console**: Test requests directly in browser using session cookie or active API keys, view live HTTP status, response latency (ms), rate limit headers, and formatted JSON output.
  - **Multi-Language Code Snippets**: Copyable code samples in cURL, JavaScript (Fetch), Python (requests), and Node.js (Axios).
- **Backend API Key Security & Rate Limiting** ([`backend/lib/apiKeys.ts`](file:///home/dog/git/movie-trackerh/backend/lib/apiKeys.ts)):
  - **Cryptographic Keys**: Format `cin_live_<48 hex chars>`. Raw secrets displayed once to user; SHA-256 key hash stored in DB.
  - **Sliding Window Rate Limiter**: Tracks request counts per 1-minute window in `api_rate_limits` table. Enforces 60 req/min limit and appends `X-RateLimit-*` headers to responses.

---

## 11. Flagship Analytics & Interactive Graphs Architecture (`/stats`)

- **Frontend Page** ([`src/app/stats/page.tsx`](file:///home/dog/git/movie-trackerh/src/app/stats/page.tsx)):
  - **Timeframe Controls**: All-Time, Yearly, Monthly, Weekly, Custom Range, and Media Type (All, Films, TV) filters with dynamic multi-year dropdown selection.
  - **Refresh Analytics Control**: Manual "Refresh Analytics" button (available when viewing own stats) that clears the user's cache and re-aggregates fresh data from the database.
  - **Cache Status Indicator**: Displays a `Cached (24h)` badge in the header when response is served from the database cache.
  - **KPI Metric Summary Cards**: Total hours watched, days non-stop equivalent, films & episodes count, average 1-10 star rating, current watch streak, longest watch streak.
  - **Recharts Visualizations**:
    - **Watch Time & Velocity**: Area chart with `#00FF66` gradient fill.
    - **Rating Distribution**: Bar chart histogram across 1-10 rating scale.
    - **Platform Share**: Donut chart breakdown for `watched_where` tags.
    - **Daily Activity Heatmap**: 365-day contribution matrix grid with 4 intensity levels.
- **Backend Analytics Endpoint & 24h DB Cache Engine**:
  - **API Route** ([`src/app/api/user/stats/route.ts`](file:///home/dog/git/movie-trackerh/src/app/api/user/stats/route.ts)): Computes aggregations prioritizing `COALESCE(watched_date, DATE(created_at))`. Fetches unfiltered available years across full user history for year picker dropdowns.
  - **Cache Helper & Table** ([`backend/lib/statsCache.ts`](file:///home/dog/git/movie-trackerh/backend/lib/statsCache.ts)): Stores stats in `user_stats_cache` table for up to 24 hours.
  - **Automatic Cache Invalidation**: Automatically clears cached stats for a user upon any movie log/rating update ([`src/app/api/movies/route.ts`](file:///home/dog/git/movie-trackerh/src/app/api/movies/route.ts)), TV show/episode track ([`src/app/api/tv/route.ts`](file:///home/dog/git/movie-trackerh/src/app/api/tv/route.ts)), or Letterboxd CSV import ([`src/app/api/import/route.ts`](file:///home/dog/git/movie-trackerh/src/app/api/import/route.ts)).

---

## 12. Personalized Home Dashboard & Quick Media Actions Architecture

- **Backend Dashboard API Endpoint** ([`src/app/api/user/dashboard/route.ts`](file:///home/dog/git/movie-trackerh/src/app/api/user/dashboard/route.ts)):
  - **Currently Watching Show Resolution**: Queries user episode activity (`user_episodes`) and tracked shows (`user_tv_shows`) ordered by most recent activity timestamp. Computes total watched episode count vs overall show episode count.
  - **Next Episode Calculation Engine**: Automatically calculates the exact next unwatched episode (`season_number`, `episode_number`). If current season is completed, rolls over to S{season+1} E1. Returns episode metadata (title, overview, still path, air date, runtime).
  - **Shared TV Helpers** ([`backend/lib/tvHelpers.ts`](file:///home/dog/git/movie-trackerh/backend/lib/tvHelpers.ts)): Shared TMDB API fetcher and DB cache layer for TV shows and season episode breakdowns.
  - **Last Added Watched Movies Query**: Fetches the top 6 most recently logged/updated movies for the authenticated user from `user_movies` joined with `movies`.
- **Frontend Logged-In Home Dashboard UI** ([`src/app/page.tsx`](file:///home/dog/git/movie-trackerh/src/app/page.tsx)):
  - **Currently Watching Featured Card**: Displays currently active TV show, progress bar, last watched episode metadata, next episode preview card, and a primary **"MARK S{season} E{episode} AS WATCHED"** quick action button. Submitting updates the database and instantly refreshes the UI to point to the next episode. Includes horizontal chips to switch between other active shows.
  - **Last Added Watched Movies Grid**: Displays recent watched movies with 1-10 star rating badges and review quotes. Unrated or unreviewed movies feature a **"QUICK RATE & REVIEW"** action button that expands an inline 1-10 star picker (`StarRating`) and review text area for instant saving without full page reload.

---

*Document updated post Personalized Home Dashboard & Quick Media Actions implementation on 2026-08-14.*

