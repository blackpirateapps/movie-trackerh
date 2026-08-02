# CineTracker (movie-trackerh) - AI Handoff & Architecture Document

This document provides a comprehensive technical overview of the **CineTracker** codebase (`movie-trackerh`). It is structured to allow future AI agents and developers to quickly understand the system architecture, code organization, database schemas, API endpoints, authentication mechanisms, and recent Next.js App Router migration without needing to re-analyze the codebase.

---

## 1. Executive Summary & Application Purpose

**CineTracker** is a full-stack movie tracking and social networking web application built with **Next.js App Router**. Key user capabilities include:
- **Movie Discovery & Search**: Query movies using TMDB (The Movie Database) API with local caching in a LibSQL (Turso) database.
- **Personal Movie Tracking**: Rate movies (1–5 stars), write text reviews, record watched dates, and toggle watchlist status.
- **Letterboxd CSV Import**: Interactively import watched history (`watched.csv`) or watchlists (`watchlist.csv`) exported from Letterboxd with TMDB title matching and manual selection.
- **Social Graph & Feed**: Follow/unfollow other users, view community profiles, and see recent movie activity from followed users.
- **User Authentication**: Secure signup/login using bcrypt-hashed passwords and JWT tokens set in HTTP-only cookies.

---

## 2. Technology Stack & Framework Conversion

The application has been transformed from a Vite SPA into a modern **Next.js App Router** full-stack application:

- **Framework**: Next.js 14+ (App Router with `src/app`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) with custom theme configuration (`oklch` color palette, custom components `.btn`, `.card`, `.form-input`, `.glass`)
- **Routing & Rendering**: Next.js Client and Server Components with `next/navigation` (`useRouter`, `useParams`) and `next/link`
- **HTTP Client**: Axios (`src/lib/api.js`) configured with relative paths (`baseURL: ''`) for API routes
- **Backend API Routes**: Next.js Route Handlers in `src/app/api/...` (`GET`, `POST` functions returning `NextResponse`)
- **Authentication**: JWT signed token stored in HTTP-only `token` cookie, authenticated via `backend/lib/auth.js`
- **Database Engine**: Turso (Hosted LibSQL / SQLite) via `@libsql/client`

---

## 3. Directory & File Structure

```
movie-trackerh/
├── backend/
│   ├── db/
│   │   ├── migrate.js       # Database migration script (reads schema.sql & updates table structure)
│   │   └── schema.sql       # Initial SQLite database schema DDL (includes users, movies, user_movies, follows, watchlist)
│   └── lib/
│       ├── auth.js          # Authentication helper function (verifies token from cookie)
│       ├── jwt.js           # JWT signing (`signToken`) & verification (`verifyToken`) helpers
│       └── turso.js         # Turso db client instance initialization (@libsql/client)
├── src/
│   ├── app/                 # Next.js App Router Routes & API Handlers
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── route.js # GET session check; POST login, signup, logout
│   │   │   ├── import/
│   │   │   │   └── route.js # POST parse CSV, search TMDB, import movie to DB
│   │   │   ├── movies/
│   │   │   │   └── route.js # GET search TMDB / get movie details; POST rate/review & watchlist toggle
│   │   │   └── user/
│   │   │       └── route.js # GET list users, single profile, action=feed; POST follow/unfollow user
│   │   ├── feed/
│   │   │   └── page.jsx     # Activity feed page
│   │   ├── import/
│   │   │   └── page.jsx     # Interactive Letterboxd CSV importer page
│   │   ├── login/
│   │   │   └── page.jsx     # User login form
│   │   ├── movie/
│   │   │   └── [id]/
│   │   │       └── page.jsx # Dynamic Movie details page
│   │   ├── profile/
│   │   │   └── [username]/
│   │   │       └── page.jsx # Dynamic User profile page
│   │   ├── signup/
│   │   │   └── page.jsx     # User signup form
│   │   ├── users/
│   │   │   └── page.jsx     # Community directory page
│   │   ├── globals.css      # Tailwind CSS directives & custom component styles
│   │   ├── layout.jsx       # Root layout wrapping app in AuthProvider and Navbar
│   │   └── page.jsx         # Home page with hero banner & movie search
│   ├── components/
│   │   ├── MovieCard.jsx    # Card component displaying poster, title, rating overlay
│   │   ├── Navbar.jsx       # Global header navigation with brand logo, links, auth state
│   │   └── StarRating.jsx   # Interactive and read-only star rating component (1-5 stars)
│   ├── contexts/
│   │   └── AuthContext.jsx  # React Client Context providing user session & auth actions
│   ├── hooks/
│   │   └── useAuth.js       # Convenience hook consuming AuthContext
│   └── lib/
│       └── api.js           # Pre-configured Axios instance using relative API paths
├── jsconfig.json            # Path aliases mapping `@/*` to `./src/*`
├── next.config.js           # Next.js configuration (remote image domains)
├── package.json             # NPM dependencies & Next.js scripts (`dev`, `build`, `start`)
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
   - `password_hash` / `password`: TEXT NOT NULL (hashed with bcrypt)
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

2. `movies` (caches metadata from TMDB)
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
   - `user_id`: INTEGER NOT NULL (FK -> users.id)
   - `movie_id`: INTEGER NOT NULL (FK -> movies.id)
   - `rating`: INTEGER (1-5 scale)
   - `review`: TEXT
   - `watched_date`: DATE
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `updated_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `UNIQUE(user_id, movie_id)` constraint used for `UPSERT` / `ON CONFLICT` operations

4. `follows` (social connection graph)
   - `follower_id`: INTEGER NOT NULL (FK -> users.id)
   - `following_id`: INTEGER NOT NULL (FK -> users.id)
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `PRIMARY KEY (follower_id, following_id)`

5. `watchlist`
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `user_id`: INTEGER NOT NULL (FK -> users.id)
   - `movie_id`: INTEGER NOT NULL (FK -> movies.id)
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `UNIQUE(user_id, movie_id)`

---

## 5. API Endpoint Reference (Next.js App Router Route Handlers)

### `/api/auth`
- `GET`: Validates session cookie. Returns `{ user: { id, username, email } }`.
- `POST`:
  - `action: 'signup'`: Creates user. Body: `{ username, email, password }`.
  - `action: 'login'`: Authenticates user. Body: `{ email, password }`.
  - `action: 'logout'`: Clears token cookie.

### `/api/movies`
- `GET`:
  - `?query=<search_term>`: Proxy search to TMDB API (`/3/search/movie`). Returns list of movies.
  - `?id=<tmdb_movie_id>`: Fetches TMDB movie details, caches movie in local `movies` DB table, and returns movie data along with `currentUserReview`, `isInWatchlist`, and `reviews` (top 10 public reviews).
- `POST`:
  - `action: 'watchlist'`: Toggles movie in `watchlist` table for authenticated user. Body: `{ movieId, action: 'watchlist' }`.
  - Default (Rate/Review): Upserts into `user_movies` table. Body: `{ movieId, rating, review, watchedDate }`.

### `/api/user`
- `GET`:
  - `?action=feed`: Returns recent movie ratings and reviews from users that the current user follows.
  - `?action=list&page=1&limit=20&search=`: Returns paginated list of users with stats (`movies`, `followers`, `following`).
  - `?username=<username>`: Returns user profile, tracked movies list, follower/following counts, and `isFollowing` status for the authenticated user.
- `POST`:
  - `action: 'follow'`: Inserts row into `follows` table. Body: `{ action: 'follow', followingId }`.
  - `action: 'unfollow'`: Deletes row from `follows` table. Body: `{ action: 'unfollow', followingId }`.

### `/api/import`
- `POST`:
  - `action: 'parse'`: Accepts Letterboxd CSV string `csvData` and `importType` (`watched` or `watchlist`). Parses CSV rows to JSON array.
  - `action: 'search'`: Searches TMDB for movie name. Body: `{ action: 'search', movieName }`.
  - `action: 'import'`: Caches selected TMDB movie and adds entry to `user_movies` or `watchlist`. Body: `{ action: 'import', movieId, originalData, importType }`.

---

## 6. Environment Variables

The application requires the following environment variables (defined in Vercel or `.env.local`):

| Variable | Description |
|---|---|
| `TURSO_DATABASE_URL` | Turso database connection URL (e.g. `libsql://<db-name>.turso.io`) |
| `TURSO_AUTH_TOKEN` | Turso database API access token |
| `JWT_SECRET` | Secret key used for signing & verifying session JWT tokens |
| `TMDB_API_KEY` | API Key for The Movie Database API (v3) |
| `NODE_ENV` | Environment mode (`development` or `production`) |

---

## 7. Development & Build Commands

- **Start Next.js Dev Server**: `npm run dev` (Runs Next.js on `http://localhost:3000`)
- **Build Next.js App**: `npm run build` (Compiles server handlers and static pages)
- **Start Next.js Production Server**: `npm run start`
- **Database Migration**: `node backend/db/migrate.js`

---

*Document updated post Next.js App Router migration on 2026-08-02.*
