# CineTracker (movie-trackerh) - AI Handoff & Architecture Document

This document provides a comprehensive technical overview of the **CineTracker** codebase (`movie-trackerh`). It is structured to allow future AI agents and developers to quickly understand the system architecture, code organization, database schemas, API endpoints, authentication mechanisms, and known issues without needing to re-analyze the codebase.

---

## 1. Executive Summary & Application Purpose

**CineTracker** is a full-stack movie tracking and social networking web application. Key user capabilities include:
- **Movie Discovery & Search**: Query movies using the TMDB (The Movie Database) API with local caching in a LibSQL (Turso) database.
- **Personal Movie Tracking**: Rate movies (1–5 stars), write text reviews, record watched dates, and toggle watchlist status.
- **Letterboxd CSV Import**: Interactively import watched history (`watched.csv`) or watchlists (`watchlist.csv`) exported from Letterboxd with TMDB title matching and manual selection.
- **Social Graph & Feed**: Follow/unfollow other users, view community profiles, and see recent movie activity from followed users.
- **User Authentication**: Secure signup/login using bcrypt-hashed passwords and JWT tokens set in HTTP-only cookies.

---

## 2. Technology Stack & Environment

- **Frontend**:
  - **Framework**: React 18 (Vite build tool)
  - **Routing**: `react-router-dom` v6
  - **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss` alpha release) with custom theme configuration (`oklch` color palette, custom components `.btn`, `.card`, `.form-input`, `.glass`)
  - **HTTP Client**: Axios (`src/lib/api.js`) configured with `withCredentials: true`
  - **Font**: Google Fonts - Inter / Inter Variable
- **Backend / Serverless API**:
  - **Host**: Vercel Serverless Functions (`api/` directory)
  - **URL Routing**: Rewrites configured in `vercel.json` routing all `/api/*` requests to serverless handlers and non-API routes to `index.html`
  - **JWT / Auth**: `jsonwebtoken`, `bcryptjs`, `cookie`
  - **CSV Parser**: `csv-parser` with Node `stream.Readable`
- **Database**:
  - **Engine**: Turso (Hosted LibSQL / SQLite) via `@libsql/client`
  - **ORM / Client**: Raw SQL execution via `db.execute()` in `backend/lib/turso.js`

---

## 3. Directory & File Structure

```
movie-trackerh/
├── api/                     # Vercel Serverless Function Handlers
│   ├── auth.js              # GET session check; POST login, signup, logout
│   ├── import.js            # POST parse CSV, search TMDB, import movie to DB
│   ├── movies.js            # GET search TMDB / get movie details; POST rate/review & watchlist toggle
│   └── user.js              # GET user list, single profile; POST follow/unfollow user
├── backend/
│   ├── db/
│   │   ├── migrate.js       # Database migration script (reads schema.sql & updates table structure)
│   │   └── schema.sql       # Initial SQLite database schema DDL
│   └── lib/
│       ├── auth.js          # Authentication helper function (verifies token from req cookie)
│       ├── jwt.js           # JWT signing (`signToken`) & verification (`verifyToken`) helpers
│       └── turso.js         # Turso db client instance initialization (@libsql/client)
├── src/
│   ├── components/
│   │   ├── Layout.jsx       # Root page layout wrapper (includes Navbar)
│   │   ├── MovieCard.jsx    # Card component displaying movie poster, title, rating overlay
│   │   ├── Navbar.jsx       # Global header navigation with brand logo, links, auth state
│   │   └── StarRating.jsx   # Interactive and read-only star rating component (1-5 stars)
│   ├── contexts/
│   │   └── AuthContext.jsx  # React Context providing `user`, `login`, `signup`, `logout`, `loading` state
│   ├── hooks/
│   │   └── useAuth.js       # Convenience hook consuming AuthContext
│   ├── lib/
│   │   └── api.js           # Pre-configured Axios instance (baseURL handling dev/prod)
│   ├── pages/
│   │   ├── Feed.jsx         # Social activity feed page
│   │   ├── Home.jsx         # Landing page with hero banner & TMDB movie search
│   │   ├── Import.jsx       # Interactive Letterboxd CSV importer UI
│   │   ├── Login.jsx        # Login page form
│   │   ├── Movie.jsx        # Movie details page (TMDB info, user rating, watchlist toggle, reviews)
│   │   ├── Profile.jsx      # User profile page (stats, tracked movies grid, recent activity)
│   │   ├── Signup.jsx       # User registration page form
│   │   └── Users.jsx        # Community members directory with search, pagination & follow buttons
│   ├── App.jsx              # Main React route definitions
│   ├── index.css            # Tailwind CSS directives, theme variables & custom utilities
│   └── main.jsx             # React DOM entry point wrapping App in AuthProvider and BrowserRouter
├── index.html               # Vite HTML entry template
├── package.json             # NPM dependencies and scripts
├── postcss.config.js        # PostCSS configuration for Tailwind v4
├── tailwind.config.js       # Tailwind configuration file
├── vercel.json              # Vercel deployment rewrites
└── vite.config.js           # Vite build and dev server config
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

5. `watchlist` *(Required table referenced by `api/movies.js` & `api/import.js`)*
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `user_id`: INTEGER NOT NULL (FK -> users.id)
   - `movie_id`: INTEGER NOT NULL (FK -> movies.id)
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `UNIQUE(user_id, movie_id)`

---

## 5. Authentication & Authorization Flow

1. **State Management**: `AuthContext.jsx` manages `user` state globally.
2. **Session Verification**: On initial load, `AuthContext` issues `GET /api/auth`. If a valid `token` cookie exists, the user object `{ id, username, email }` is returned.
3. **Login / Signup**:
   - `POST /api/auth` with `action: 'signup'` or `action: 'login'`.
   - Passwords are validated/hashed using `bcryptjs` with salt round `12`.
   - On success, a JWT signed with `JWT_SECRET` (containing `{ sub: userId, username, email }`) is issued in a `token` HTTP-only cookie (`SameSite: lax/none`, `Max-Age: 30 days`).
4. **Protected Endpoints**: Serverless handlers call `authenticate(req, res)` from `backend/lib/auth.js`. It parses `req.headers.cookie` and verifies the JWT.

---

## 6. API Endpoint Reference

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

## 7. Environment Variables

The application requires the following environment variables (defined in Vercel or local `.env`):

| Variable | Description |
|---|---|
| `TURSO_DATABASE_URL` | Turso database connection URL (e.g. `libsql://<db-name>.turso.io`) |
| `TURSO_AUTH_TOKEN` | Turso database API access token |
| `JWT_SECRET` | Secret key used for signing & verifying session JWT tokens |
| `TMDB_API_KEY` | API Key for The Movie Database API (v3) |
| `NODE_ENV` | Environment mode (`development` or `production`) |

---

## 8. Development & Build Commands

- **Start Development Server**: `npm run dev` (Vite on `http://localhost:3000`)
- **Build Production Bundle**: `npm run build` (Outputs to `dist/`)
- **Preview Production Build**: `npm run preview`
- **Database Migration**: `node backend/db/migrate.js`

---

## 9. Key Technical Findings & Audit Recommendations

Future agents working on this repository should keep in mind the following findings:

1. **`watchlist` Table Schema**:
   - `schema.sql` does not explicitly contain `CREATE TABLE IF NOT EXISTS watchlist ...`.
   - Ensure `watchlist` table is included in database migrations if setting up a fresh database instance:
     ```sql
     CREATE TABLE IF NOT EXISTS watchlist (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         user_id INTEGER NOT NULL,
         movie_id INTEGER NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
         FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
         UNIQUE (user_id, movie_id)
     );
     ```

2. **Feed Endpoint Alignment**:
   - `Feed.jsx` makes a `GET` request to `/api/user?action=feed`.
   - If feed functionality needs extension, ensure `/api/user.js` handles `action === 'feed'` by querying `user_movies` for users that the current user follows.

3. **Tailwind CSS v4 Configuration**:
   - Uses `@import "tailwindcss";` and `@theme` block in `src/index.css`.
   - Configured with `@tailwindcss/postcss` plugin in `postcss.config.js`.

---

*Handoff document generated on 2026-08-02.*
