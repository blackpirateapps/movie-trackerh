# CineTracker Flutter iOS Application — AI Handoff & Architecture Document

This document provides a comprehensive, production-grade technical specification of the **CineTracker native Flutter iOS application** (`cinetracker_flutter`). It serves as the single source of truth for future AI agents and software engineers to understand the design system, state management, screen hierarchies, API contracts, domain models, and testing protocols without needing to reconstruct system context from scratch.

---

## 1. Product Vision & Design Personality

### 1.1 The Concept: "Apple Health × Apple TV × CineTracker"
- **Apple Health**: Serves as the mental model for personal tracking, historical progression, KPI summaries, habit matrices, streaks, and data density without visual clutter.
- **Apple TV**: Serves as the mental model for cinematic presentation, edge-to-edge backdrop art, high-aspect-ratio rounded posters, dark translucency, and immersive transitions.
- **CineTracker**: The functional domain for media tracking, 1–10 star ratings, episode progression, watchlist curation, viewing diary, social discovery, and statistics.

### 1.2 Core Design Principles
- **Native Cupertino First**: Uses pure iOS Cupertino widgets (`CupertinoTabScaffold`, `CupertinoPageScaffold`, `CupertinoNavigationBar`, `CupertinoActionSheet`, `CupertinoDatePicker`, `CupertinoActivityIndicator`). Material Design widgets are strictly forbidden.
- **Dark Graphite Palette**:
  - Base Background: `#121212` (deep dark graphite, avoids pure harsh black)
  - Surface Containers: `#1E1E1E` (grouped cards, inset sections)
  - Elevated / Sheet Surfaces: `#2A2A2A`
  - Subtle Borders & Dividers: `#333333` (0.5pt hairline dividers)
  - CineTracker Neon Green Accent: `#00FF66` (used deliberately for ratings, progress bars, active tabs, streak counters, and primary CTAs).
- **Typography & Iconography**: Cupertino system fonts (SF Pro) and SF Symbols iconography via `CupertinoIcons`.
- **Haptic Feedback**: Standard iOS haptic pulses (`selectionClick()`, `mediumImpact()`, `heavyImpact()`) integrated into rating drag/tap, log saves, episode completions, and tab navigation.

---

## 2. Directory Layout & Code Organization

```
cinetracker_flutter/
├── lib/
│   ├── app.dart                             # Root CupertinoApp with CineTheme.darkTheme
│   ├── main.dart                            # Entrypoint with MultiProvider initialization
│   ├── core/
│   │   ├── constants/
│   │   │   └── api_constants.dart           # Default API base URLs and timeout configurations
│   │   ├── theme/
│   │   │   ├── colors.dart                  # CineColors dark palette and neon green tokens
│   │   │   ├── typography.dart              # CineTypography SF Pro text styles
│   │   │   └── theme.dart                   # Central CupertinoThemeData configuration
│   │   └── utils/
│   │       ├── csv_parser.dart              # Resilient Letterboxd CSV importer parser
│   │       └── serialization_helpers.dart   # JSON parsing sanitizers (clamping, runtime fallbacks)
│   ├── models/
│   │   ├── api_key.dart                     # User REST API key model
│   │   ├── api_models.dart                  # View/detail models (MovieDetail, TvShowDetail, etc.)
│   │   ├── dashboard_data.dart              # Continue Watching & Home dashboard payload
│   │   ├── diary_entry.dart                 # Chronological viewing timeline entry
│   │   ├── episode.dart                     # TV Episode model with 1-10 rating & watch status
│   │   ├── movie.dart                       # Movie model with 1-10 rating, review, platform tags
│   │   ├── search_result.dart               # Unified movie/TV search payload
│   │   ├── season.dart                      # TV Season model with episode lists & progress fraction
│   │   ├── tv_show.dart                     # TV Show model with seasons and tracking state
│   │   ├── user.dart                        # User profile model with safe display name & initials
│   │   └── user_stats.dart                  # Flagship analytics models (heatmap, habit matrix, KPIs)
│   ├── services/
│   │   └── api/
│   │       ├── api_client.dart              # Network exceptions (Unauthorized, NotFound, Conflict)
│   │       ├── api_interface.dart           # Abstract interface contract for all endpoints
│   │       ├── cinetracker_api.dart         # Live HTTP REST client implementation
│   │       └── mock_cinetracker_service.dart # In-memory mock service with rich seeded data
│   ├── state/
│   │   ├── auth_provider.dart               # Session, token, guest mode, and auth transitions
│   │   ├── media_tracking_provider.dart     # Optimistic media logging, favorites, episodes
│   │   ├── search_provider.dart             # Debounced search, unified results, recent queries
│   │   └── stats_provider.dart              # Timeframe analytics, year selection, stats refresh
│   └── ui/
│       ├── navigation/
│       │   └── tab_scaffold.dart            # 5-tab CupertinoTabScaffold (Home, Library, Watchlist, Stats, Profile)
│       ├── screens/
│       │   ├── auth/
│       │   │   ├── login_screen.dart        # Dark Cupertino login with guest access
│       │   │   └── signup_screen.dart       # Cupertino account creation
│       │   ├── diary/
│       │   │   └── diary_screen.dart        # Chronological viewing timeline grouped by date
│       │   ├── home/
│       │   │   └── home_screen.dart         # Continue Watching Hero, Recently Watched, Health cards
│       │   ├── library/
│       │   │   └── library_screen.dart      # Movies/TV segmented tabs, grid/list view, filters
│       │   ├── movies/
│       │   │   └── movie_detail_screen.dart # Cinematic movie details, rating, log sheet trigger
│       │   ├── profile/
│       │   │   └── profile_screen.dart      # Identity, top 4 showcase, lifetime stats, settings links
│       │   ├── settings/
│       │   │   ├── developer_portal_screen.dart # API key management and live console tester
│       │   │   ├── letterboxd_import_screen.dart # CSV upload & parsing preview
│       │   │   └── settings_screen.dart     # Inset grouped preferences, account, data export
│       │   ├── stats/
│       │   │   └── stats_screen.dart        # Apple Health analytics (heatmap, 7x24 habits, mode rating)
│       │   ├── tv/
│       │   │   └── tv_detail_screen.dart    # TV show backdrop, season selector, episode row toggles
│       │   └── watchlist/
│       │       └── watchlist_screen.dart    # Movies/TV queue, 'Pick something for me' generator
│       ├── shared/
│       │   ├── cine_divider.dart            # 0.5pt hairline Cupertino divider
│       │   ├── cupertino_card.dart          # 18pt rounded surface card with subtle border
│       │   ├── frosted_glass.dart           # Backdrop blur frosted glass container
│       │   ├── hero_backdrop.dart           # Cinematic backdrop artwork with bottom dark gradient
│       │   ├── media_poster.dart            # 2:3 aspect ratio poster with error/placeholder fallback
│       │   ├── progress_bar.dart            # Animated Cupertino progress bar with #00FF66 fill
│       │   └── star_rating.dart             # 1-10 star rating bar with drag, tap, and haptics
│       └── sheets/
│           ├── bulk_action_sheet.dart       # Cupertino action sheets for bulk season/show completions
│           ├── global_search_sheet.dart     # Full-screen Cupertino search sheet with library badges
│           └── movie_log_sheet.dart         # Modal bottom sheet for logging date, rating, review, platform
├── test/
│   ├── challenge/
│   │   ├── csv_parser_stress_test.dart
│   │   ├── domain_models_stress_test.dart
│   │   └── serialization_helpers_stress_test.dart
│   ├── unit/
│   │   ├── api_service_test.dart
│   │   ├── csv_parser_test.dart
│   │   ├── models_test.dart
│   │   ├── providers_test.dart
│   │   ├── state_challenge_test.dart
│   │   └── theme_test.dart
│   └── widget/
│       ├── frosted_glass_test.dart
│       ├── screens_test.dart
│       └── ui_components_test.dart
├── pubspec.yaml
└── pubspec.lock
```

---

## 3. State Management & Data Flow

State is managed cleanly through Flutter's `provider` package using `ChangeNotifier`:

### 3.1 `AuthProvider` ([`lib/state/auth_provider.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/state/auth_provider.dart))
- **Session Check**: Verifies stored JWT token against `checkSession()`.
- **Login / Signup**: Authenticates user and persists token in `SharedPreferences`.
- **Guest Mode**: Allows immediate offline/demo exploration with a pre-authenticated guest identity without blocking the user.

### 3.2 `MediaTrackingProvider` ([`lib/state/media_tracking_provider.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/state/media_tracking_provider.dart))
- **Optimistic UI Updates**: All actions (logging a movie, toggling watchlist, setting favorites, toggling episode watched status, bulk marking seasons) immediately mutate in-memory state and call `notifyListeners()`, then sync with the API in the background.
- **Auto-Rollback on Failure**: If the API call fails, the state reverts and an error banner is presented.
- **Computed Getters**: `favoriteMovies`, `watchedMovies`, `watchlistMovies`, `lastWatchedMovies`, and active TV shows.

### 3.3 `StatsProvider` ([`lib/state/stats_provider.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/state/stats_provider.dart))
- **Timeframe Filtering**: Supports `all`, `year`, `month`, `week`, and `custom` ranges.
- **Media Filtering**: Supports `all`, `movies`, and `tv`.
- **Auto-Sync**: Automatically fetches updated `UserStats` payload whenever filters or selected years change.

### 3.4 `SearchProvider` ([`lib/state/search_provider.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/state/search_provider.dart))
- **Debounced Input**: 400ms timer debounce prevents hammering search endpoints during rapid typing.
- **Unified Results**: Normalizes movies and TV shows into unified `SearchResult` items annotated with TMDB metadata and library presence badges.

---

## 4. Design System & Tokens

### 4.1 Colors ([`lib/core/theme/colors.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/core/theme/colors.dart))
| Token | Value | Role |
| :--- | :--- | :--- |
| `background` | `#121212` | Root page background, deep graphite |
| `surfaceGraphite` | `#1E1E1E` | Inset grouped list tiles, card surfaces |
| `surfaceElevated` | `#2A2A2A` | Floating modal sheets, action sheets |
| `surfaceTranslucent`| `#E61A1A1A` | Frosted navigation bars, bottom tab bar |
| `neonGreen` | `#00FF66` | CineTracker brand accent (CTAs, active tabs, progress, ratings) |
| `neonGreenSubtle` | `rgba(0,255,102, 0.15)` | Selected chip backgrounds, badge fills |
| `textPrimary` | `#EDEDED` | Primary headers, movie titles, high-contrast values |
| `textSecondary` | `#A0A0A0` | Subtitles, release years, season numbers |
| `textTertiary` | `#636366` | Disabled states, placeholders, icons |
| `borderSubtle` | `#333333` | 0.5pt subtle surface borders |
| `divider` | `#2C2C2E` | List separators, section splitters |

### 4.2 Reusable Cupertino Components
1. **`StarRating`** ([`lib/ui/shared/star_rating.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/shared/star_rating.dart)): 10-star rating bar supporting continuous horizontal drag gesture or direct star tapping, with haptic feedback on each rating increment.
2. **`MediaPoster`** ([`lib/ui/shared/media_poster.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/shared/media_poster.dart)): Strict 2:3 aspect ratio poster with 12–16pt radius, TMDB image caching, placeholder fallback with movie title, and optional rating badge overlay.
3. **`CineProgressBar`** ([`lib/ui/shared/progress_bar.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/shared/progress_bar.dart)): Animated progress bar with rounded ends, dark track, and neon green fill.
4. **`CineCard`** ([`lib/ui/shared/cupertino_card.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/shared/cupertino_card.dart)): Grouped surface card with 18pt radius, `#1E1E1E` background, and `#333333` border.
5. **`CineDivider`** ([`lib/ui/shared/cine_divider.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/shared/cine_divider.dart)): 0.5pt hairline divider for Cupertino lists and inset sections.
6. **`HeroBackdrop`** ([`lib/ui/shared/hero_backdrop.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/shared/hero_backdrop.dart)): Cinematic backdrop header with progressive dark bottom gradient overlay.
7. **`FrostedGlass`** ([`lib/ui/shared/frosted_glass.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/shared/frosted_glass.dart)): `BackdropFilter` container with configurable blur and border radius.

---

## 5. Screen Catalog & Key Flows

### 5.1 Home Screen ([`lib/ui/screens/home/home_screen.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/screens/home/home_screen.dart))
- **Continue Watching Hero**: Occupies 50–60% of viewport, presenting the most recently watched active TV show with next-episode prompt, runtime, and progress bar.
- **Other Shows in Progress**: Horizontal carousel of secondary shows.
- **Recently Watched**: Chronological list of logged movies and episodes.
- **"This Week" Apple Health Card**: Quick KPI summary card with weekly watch hours, streak count, and films logged.

### 5.2 TV Detail Screen ([`lib/ui/screens/tv/tv_detail_screen.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/screens/tv/tv_detail_screen.dart))
- **Backdrop Artwork & Overall Progress**: Completion percentage, total watched vs remaining episodes.
- **Next Up Episode Card**: One-tap completion for the next episode.
- **Interactive Season Picker**: Horizontal season chips with watch percentages.
- **Episode List**: Episode rows with episode code (e.g. `S01E03`), title, runtime, still thumbnail, tap-to-toggle watched button, and swipe actions.
- **Bulk Actions**: Cupertino Action Sheet for "Mark Entire Season as Watched" and "Mark Entire Show as Watched".

### 5.3 Movie Detail Screen ([`lib/ui/screens/movies/movie_detail_screen.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/screens/movies/movie_detail_screen.dart))
- **Cinematic Artwork & Details**: Poster, overview, runtime, release date, director, cast.
- **Interactive 1–10 Rating Bar**: Instant rating input with immediate optimistic state update.
- **Log Sheet Trigger**: Opens `MovieLogSheet` for full review, date, and platform tagging.
- **Watchlist & Favorite Actions**: Cupertino icon buttons with active neon green toggles.

### 5.4 Stats Screen ("Apple Health for Movies & TV") ([`lib/ui/screens/stats/stats_screen.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/screens/stats/stats_screen.dart))
- **Timeframe Segments**: All Time, Year, Month, Week, Custom.
- **KPI Summary Grid**: Total hours watched, days spent, films count, episodes count, average rating, watch streak.
- **Watch Time Curve**: Smooth `fl_chart` area chart with neon green line and gradient fill.
- **1–10 Rating Distribution Histogram**: Bar chart with color progression and `Mode: ★ X/10` callout.
- **365-Day Activity Heatmap**: Yearly grid with intensity levels.
- **7x24 Viewing Habits Matrix**: Day of week vs hour of day matrix highlighting peak viewing windows.
- **Top Genres, Creators & Hall of Fame**: Ranked breakdown of personal media preferences.

### 5.5 Fast Logging & Modal Sheets
- **`MovieLogSheet`** ([`lib/ui/sheets/movie_log_sheet.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/sheets/movie_log_sheet.dart)): Bottom modal sheet prompting for watched date (`CupertinoDatePicker`), 1–10 star rating, optional review, and quick platform tag chips (Netflix, Prime Video, Hotstar, Apple TV, Theater, Physical Disc, Pirated, Other).
- **`BulkActionSheet`** ([`lib/ui/sheets/bulk_action_sheet.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/sheets/bulk_action_sheet.dart)): Destructive/confirmative Cupertino Action Sheets for season and show completions.
- **`GlobalSearchSheet`** ([`lib/ui/sheets/global_search_sheet.dart`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/lib/ui/sheets/global_search_sheet.dart)): Full-screen search with filters, search history, and library indicators.

---

## 6. Testing & Verification Standards

To guarantee enterprise-grade stability and prevent regressions:

### 6.1 Static Analysis Gate
The codebase must strictly pass:
```bash
flutter analyze --fatal-infos --fatal-warnings
```
- **Strict Inference**: All `CupertinoPageRoute` instances must specify explicit generic types (e.g., `CupertinoPageRoute<void>`).
- **Unawaited Futures**: All async calls that are intentionally fire-and-forget must be wrapped in `unawaited()`.
- **No Unused Imports / No Dead Code**.

### 6.2 Automated Test Suite
Run the comprehensive test suite with:
```bash
flutter test
```
The suite contains **140 automated tests**:
- **Domain Model Stress Tests** (`test/challenge/`): Verifies null safety, fallback runtimes, corrupted season arrays, and 1–10 rating clamping.
- **Serialization Helpers Tests** (`test/challenge/`): Tests JSON type conversions and platform tag parsing.
- **Provider & State Machine Tests** (`test/unit/`): Tests optimistic updates, rollbacks, and guest mode transitions.
- **Widget Tests** (`test/widget/`): Tests `StarRating` drag/tap, `CineProgressBar`, `CineCard`, `CineDivider`, `MediaPoster`, `CineTrackerTabScaffold` 5-tab switching, and `MovieLogSheet` logging.

### 6.3 Local Build Prohibition
- **DO NOT run local `flutter build` commands** (such as `flutter build apk` or `flutter build ios`) in local terminal environments.
- Standalone release packaging is exclusively handled by GitHub Actions CI ([`.github/workflows/build-flutter-apk.yml`](file:///home/dog/git/movie-trackerh/.github/workflows/build-flutter-apk.yml)).

### 6.4 Android Release Keystore Signing via Repository Secrets
The CI workflow automatically detects and signs the production APK when repository secrets are provided in GitHub (`Settings > Secrets and variables > Actions > Repository secrets`):
- `KEYSTORE_BASE64` or `ANDROID_KEYSTORE_BASE64`: Base64-encoded string of your `.jks` or `.keystore` file (e.g. `base64 -w 0 my-release-key.jks`).
- `KEYSTORE_PASSWORD` or `ANDROID_KEYSTORE_PASSWORD`: Password for the keystore file.
- `KEY_ALIAS` or `ANDROID_KEY_ALIAS`: Alias name given to the signing key.
- `KEY_PASSWORD` or `ANDROID_KEY_PASSWORD`: Password for the private key (defaults to keystore password if omitted).
- **Graceful Fallback**: If secrets are not present, Gradle automatically falls back to debug signing config so CI builds and PR tests never fail.

---

## 7. Live Backend Integration & Connectivity

The native Flutter application connects directly to the live hosted CineTracker backend:

### 7.1 Configuration & Endpoints
- **Production URL**: `https://movie-trackerh.vercel.app` (`ApiConstants.productionBaseUrl`)
- **Default Base URL**: `ApiConstants.defaultBaseUrl = productionBaseUrl`
- **Dual Authentication**: `ApiClient` automatically attaches both `Cookie: token=<jwt>` and `Authorization: Bearer <jwt>` to outgoing HTTP requests, supporting both browser-compatible cookie authentication and native Bearer token authorization.
- **Resilient Fallback Querying**: `CineTrackerApi` provides transparent fallback routes:
  - `getMovies()`: Attempts `GET /api/movies`. If 400/error, queries user profile via `GET /api/user?username=<username>`.
  - `getTvShows()`: Attempts `GET /api/tv`. If 400/error, queries user profile via `GET /api/user?username=<username>`.
  - `getDiary()`: Attempts `GET /api/user/diary`. If 404, gracefully falls back to `GET /api/user?action=feed`.
  - `getApiKeys()`: Parses both direct arrays and `{ keys: [...] }` wrappers.
  - `getStats()`: Normalizes timeframe aliases (`year` -> `yearly`, `month` -> `monthly`, `week` -> `weekly`) and `movies` -> `movie`.
- **Guest / Offline Resilience**: All providers (`MediaTrackingProvider`, `StatsProvider`, `SearchProvider`) accept an optional `fallbackMockApi` (`MockCineTrackerService`). If network or unauthenticated requests fail, the app gracefully falls back so UI exploration is never blocked.

### 7.2 Verified Live Account Metrics
The integration has been verified live against `https://movie-trackerh.vercel.app` using account:
- **Email**: `hi@sudipx.in`
- **Username**: `blackpiratex` (User ID: 1)
- **Continue Watching Hero**: *The Simpsons* (Season 7, Episode 16: "Lisa the Iconoclast" next up)
- **Live Movies Tracked**: 235 films (Latest: *Contact* rated 7/10)
- **Live TV Shows Tracked**: 21 series (*Lost in Space*, *The Simpsons*, etc.)
- **Watch Diary Entries**: 50 chronological watch events
- **Lifetime Watch Hours**: 1,556.6 hours across 2,192 TV episodes and 235 movies

### 7.3 Platform Network Permissions
- **Android Manifest** ([`android/app/src/main/AndroidManifest.xml`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/android/app/src/main/AndroidManifest.xml)):
  - `<uses-permission android:name="android.permission.INTERNET"/>` enables outgoing socket and HTTP/HTTPS traffic in standalone release APKs.
  - `<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>` allows checking connectivity state.
  - `android:usesCleartextTraffic="true"` allows cleartext HTTP communication for local development servers (`http://10.0.2.2:3000` or local IPs).
- **iOS App Transport Security** ([`ios/Runner/Info.plist`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/ios/Runner/Info.plist)):
  - `NSAppTransportSecurity` with `NSAllowsArbitraryLoads` and `NSAllowsLocalNetworking` enabled.

---

## 8. Mandatory AI Workflow Protocol

Any future AI assistant modifying this application must adhere to the following workflow:
1. **Run Static Verification First**: Verify with `flutter analyze --fatal-infos --fatal-warnings` (must report 0 issues).
2. **Execute Full Test Suite**: Verify with `flutter test` (all 140 automated tests must pass).
3. **Preserve Cupertino Identity**: Never introduce Material widgets, web-style cards, or sketch borders.
4. **Update Handoff Documents**:
   - Always update [`HANDOFF.md`](file:///home/dog/git/movie-trackerh/HANDOFF.md) in the project root.
   - Always update [`cinetracker_flutter/HANDOFF.md`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/HANDOFF.md) whenever changes touch the Flutter mobile application.
5. **Mandatory Git Commit & Push**:
   - Always stage, commit with a descriptive message, and push to remote (`git push origin <branch>`) before concluding any turn.
