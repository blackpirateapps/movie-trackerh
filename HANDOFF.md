# CineTracker (movie-trackerh) - AI Handoff & Architecture Document

This document provides a comprehensive technical overview of the **CineTracker** codebase (`movie-trackerh`). It is structured to allow future AI agents and developers to quickly understand the system architecture, code organization, database schemas, API endpoints, authentication mechanisms, Hand-Drawn design system, and full-stack TypeScript architecture without needing to re-analyze the codebase.

---

## 1. Executive Summary & Application Purpose

**CineTracker** is a full-stack movie tracking and social networking web application built with **Next.js 16+ App Router (Turbopack)**, **TypeScript**, and a custom **Hand-Drawn Design System**. Key user capabilities include:
- **Movie Discovery & Search**: Query movies using TMDB (The Movie Database) API with local caching in a LibSQL (Turso) database.
- **Personal Movie Tracking**: Rate movies (1–5 stars), write text reviews, record watched dates, and toggle watchlist status.
- **Letterboxd CSV Import**: Interactively import watched history (`watched.csv`) or watchlists (`watchlist.csv`) exported from Letterboxd with TMDB title matching and manual selection.
- **Social Graph & Feed**: Follow/unfollow other users, view community profiles, and see recent movie activity from followed users.
- **User Authentication**: Secure signup/login using bcrypt-hashed passwords and JWT tokens set in HTTP-only cookies.
- **Temporary Root Admin Password Reset**: Allows resetting any user password by authenticating with `ROOT_ADMIN_PASSWORD` stored in environment variables.

---

## 2. Technology Stack & Design System Architecture

The application is built on a modern full-stack **TypeScript + Next.js App Router** architecture:

- **Framework**: Next.js 16+ (App Router with `src/app` and Turbopack compiler)
- **Language**: TypeScript (`tsconfig.json` with strict type-checking and path alias `@/*`)
- **Icons**: Lucide React (`lucide-react`) with thick stroke width (`2.5` to `3`)
- **Styling & Design System**: Custom Hand-Drawn UI built on Tailwind CSS v4 (`@tailwindcss/postcss`)
  - **Typography**: Google Fonts (`Kalam` for felt-tip marker titles, `Patrick Hand` for legible handwritten body text)
  - **Color Palette**: Warm Paper (`#fdfbf7`), Soft Pencil Black (`#2d2d2d`), Erased Paper Muted (`#e5e0d8`), Red Correction Marker (`#ff4d4d`), Blue Pen (`#2d5da1`), Post-it Yellow (`#fff9c4`)
  - **Wobbly Borders**: Irregular organic `border-radius` ellipses (`border-3 border-[#2d2d2d]`, `borderRadius: 255px 15px 225px 15px / 15px 225px 15px 255px`)
  - **Hard Offset Shadows**: Blurless solid box-shadows (`4px 4px 0px #2d2d2d` and `8px 8px 0px #2d2d2d`). Buttons press flat (`0px 0px` shadow with translation) on click.
  - **Paper Grain Texture**: Background radial dot grid pattern (`radial-gradient(#e5e0d8 1.5px, transparent 1.5px)`)
  - **Paper Accents**: Semi-transparent tape strips (`.tape-strip`) and red pin thumbtacks (`.thumbtack`)
- **Routing & Rendering**: Next.js Client and Server Components (`.tsx`) with `next/navigation` (`useRouter`, `useParams`) and `next/link`
- **HTTP Client**: Axios (`src/lib/api.ts`) configured with relative paths (`baseURL: ''`) for API routes
- **Backend API Routes**: Next.js Route Handlers in `src/app/api/...` (`route.ts`) (`GET`, `POST` functions returning `NextResponse`)
- **Authentication**: JWT signed token stored in HTTP-only `token` cookie, authenticated via `backend/lib/auth.ts`
- **Database Engine**: Turso (Hosted LibSQL / SQLite) via `@libsql/client`

---

## 3. Directory & File Structure

```
movie-trackerh/
├── backend/
│   ├── db/
│   │   ├── migrate.ts       # Database migration script (reads schema.sql & updates table structure)
│   │   └── schema.sql       # Initial SQLite database schema DDL (includes users, movies, user_movies, follows, watchlist)
│   └── lib/
│       ├── auth.ts          # Authentication helper function (verifies token from cookie)
│       ├── jwt.ts           # JWT signing (`signToken`) & verification (`verifyToken`) helpers
│       └── turso.ts         # Turso db client instance initialization (@libsql/client)
├── src/
│   ├── app/                 # Next.js App Router Routes & API Handlers
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── route.ts # GET session check; POST login, signup, logout, reset-password
│   │   │   ├── import/
│   │   │   │   └── route.ts # POST parse CSV, search TMDB, import movie to DB
│   │   │   ├── movies/
│   │   │   │   └── route.ts # GET search TMDB / get movie details; POST rate/review & watchlist toggle
│   │   │   └── user/
│   │   │       └── route.ts # GET list users, single profile, action=feed; POST follow/unfollow user
│   │   ├── feed/
│   │   │   └── page.tsx     # Hand-Drawn activity feed pinboard
│   │   ├── import/
│   │   │   └── page.tsx     # Interactive Letterboxd CSV importer notebook page
│   │   ├── login/
│   │   │   └── page.tsx     # Hand-Drawn post-it login form & emergency reset modal
│   │   ├── movie/
│   │   │   └── [id]/
│   │   │       └── page.tsx # Dynamic Movie detail scrapbook page
│   │   ├── profile/
│   │   │   └── [username]/
│   │   │       └── page.tsx # Dynamic User personal profile page
│   │   ├── signup/
│   │   │   └── page.tsx     # Hand-Drawn post-it signup form
│   │   ├── users/
│   │   │   └── page.tsx     # Hand-Drawn community directory board
│   │   ├── globals.css      # Hand-Drawn design system tokens, wobbly borders, paper texture, custom styles
│   │   ├── layout.tsx       # Root layout wrapping app in AuthProvider and Navbar
│   │   └── page.tsx         # Home page with hero banner & movie search
│   ├── components/
│   │   ├── MovieCard.tsx    # Photo print / sketch frame card with tape top accent, hard shadow & wobbly border
│   │   ├── Navbar.tsx       # Hand-drawn navigation header with brand logo & mobile dropdown
│   │   └── StarRating.tsx   # Interactive and read-only hand-drawn star rating component (1-5 stars)
│   ├── contexts/
│   │   └── AuthContext.tsx  # React Client Context providing user session & auth actions
│   ├── hooks/
│   │   └── useAuth.ts       # Convenience hook consuming AuthContext
│   ├── lib/
│   │   └── api.ts           # Pre-configured Axios instance using relative API paths
│   └── types/
│       └── index.ts         # Shared TypeScript interfaces (User, Movie, FeedItem, etc.)
├── design.md                # Comprehensive Hand-Drawn Design System Specification
├── tsconfig.json            # TypeScript configuration (`compilerOptions`, `@/*` path mapping)
├── next.config.js           # Next.js configuration (remote image domains)
├── vercel.json              # Vercel deployment configuration (`framework: nextjs`)
├── package.json             # NPM dependencies & Next.js scripts (`dev`, `build`, `start`, `lint`)
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
  - `action: 'login'`: Authenticates user using `password` column. Body: `{ email, password }`.
  - `action: 'logout'`: Clears token cookie.
  - `action: 'reset-password'`: (Temporary Admin feature) Validates `rootPassword` against `process.env.ROOT_ADMIN_PASSWORD` and updates target user's `password` column. Body: `{ rootPassword, usernameOrEmail, newPassword }`.

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
| `ROOT_ADMIN_PASSWORD` | (Temporary) Secret root admin password for emergency user password resets |
| `NODE_ENV` | Environment mode (`development` or `production`) |

---

## 7. Development & Build Commands

- **Start Next.js Dev Server**: `npm run dev` (Runs Next.js Turbopack on `http://localhost:3000`)
- **Build Next.js App**: `npm run build` (Compiles TypeScript server handlers and static pages)
- **Start Next.js Production Server**: `npm run start`
- **TypeScript Typecheck**: `npx tsc --noEmit`
- **Lint Check**: `npm run lint`

---

*Document updated post Hand-Drawn Design System transformation on 2026-08-02.*
