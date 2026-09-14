# Original User Request

## 2026-09-14T12:17:26Z

Build a native CineTracker iOS application in Flutter adhering strictly to Apple Cupertino design patterns ("Apple Health × Apple TV × CineTracker") and integrating with the existing CineTracker backend API.

Working directory: /home/dog/git/movie-trackerh/cinetracker_flutter
Integrity mode: development

References:
- Backend Architecture & API Spec: /home/dog/git/movie-trackerh/HANDOFF.md
- Product & Design Specification: /home/dog/git/movie-trackerh/CineTracker — Complete Flutter iOS App Design & Build Prompt.md
- Flutter SDK path: /home/dog/flutter/bin/flutter

## Requirements

### R1. Native Cupertino iOS Architecture & Theme System
- Implement a Flutter iOS mobile application built from the ground up around Cupertino widgets (`CupertinoTabScaffold`, `CupertinoNavigationBar`, `CupertinoPageScaffold`, `CupertinoActionSheet`, etc.).
- Dark-mode first visual palette with graphite surfaces (`#121212`, `#1E1E1E`), subtle dividers, and CineTracker neon green (`#00FF66`) used deliberately for active states, ratings, streaks, and primary CTAs.
- SF Pro / system typography and SF Symbols iconography.
- 5-tab Cupertino bottom navigation: Home, Library, Watchlist, Stats, Profile. Global search accessible via top navigation header trigger presenting unified movie and TV results with "In Library" indicators.

### R2. Media Tracking, 1-10 Ratings & Fast Logging Sheets
- Interactive 10-star rating component with tap and horizontal drag gestures, consistent across movies, TV shows, and individual episodes.
- Cupertino bottom sheet for logging movies with watched date picker, 10-star rating, review text, and platform tags ("Watched Where").
- TV tracking featuring a prominent "Continue Watching" hero card on Home for the most recent active show, active shows carousel, and automatic next episode resolution.
- TV show and season detail views with progress bars, episode list with tap/swipe watched toggles, and bulk season/show completion confirmation sheets.
- Non-blocking optimistic local UI updates for all logging, rating, and episode progress actions.

### R3. Flagship Media Statistics & Visualizations ("Apple Health for Movies & TV")
- Stats screen with timeframe filters (All Time, Year, Month, Week, Custom) and KPI summary cards (total watch time, film/episode counts, average rating, watch streaks).
- Watch time visualization and 1-10 rating distribution histogram highlighting the mode rating tier.
- 365-day viewing activity heatmap and viewing habits matrix (7x24 weekday vs hour).

### R4. Library, Watchlist & Profile Management
- Library tab with Movies/TV segmented control, grid vs. list view toggle, and filter chips (Watched, Favorites, Unrated).
- Watchlist tab with quick-watch filters and "Pick something for me" recommendation card.
- Profile tab displaying lifetime stats, top 4 favorites showcase, recent activity, diary chronological timeline, and grouped Cupertino settings.
- Settings including account preferences, Letterboxd CSV import flow, data export, and nested developer/API portal.

### R5. Backend Integration & Automated Verification
- Full integration with existing CineTracker backend API endpoints (`/api/auth`, `/api/movies`, `/api/tv`, `/api/user/dashboard`, `/api/user/stats`, `/api/search`, `/api/keys`).
- State management cleanly separating API communication, local UI state, cached state, and mutation state.
- Automated test coverage (`flutter test`) and static analysis (`flutter analyze` with 0 critical errors).

## Acceptance Criteria

### iOS Interaction & Cupertino Polish
- [ ] 5-tab Cupertino bottom navigation operates smoothly with SF Symbols and translucent material styling.
- [ ] Non-blocking optimistic updates apply instantly for rating, logging, and episode toggling without full-screen flickers.
- [ ] Global search sheet presents unified movie and TV results with clear media type labels and library indicators.
- [ ] Layout is responsive across standard iPhone viewports.

### Functional Completeness
- [ ] Home displays "Continue Watching" hero with next episode card, progress indicators, and active shows carousel.
- [ ] 10-star rating component functions smoothly and consistently across movies, TV shows, and episodes.
- [ ] Movie log sheet opens from detail and quick actions, supporting date, rating, review, and platform tags.
- [ ] TV show detail supports episode watched toggles, progress bar animation, and bulk watch sheets.
- [ ] Stats screen renders lifetime KPIs, watch time visualization, and 1-10 rating distribution.
- [ ] Watchlist includes "Pick something for me" random selection feature.

### Quality & Code Health
- [ ] Project compiles and builds using Flutter SDK at `/home/dog/flutter/bin/flutter`.
- [ ] Static analysis runs via `/home/dog/flutter/bin/flutter analyze` and passes with zero errors.
- [ ] Automated test suite runs via `/home/dog/flutter/bin/flutter test` and verifies core models, API client serialization, state management, and Cupertino UI components.

## 2026-09-14T12:38:08Z

IMPORTANT USER CONSTRAINT UPDATE:
1. Do NOT execute any `flutter build` commands (such as `flutter build apk` or `flutter build ios`) in the local environment. Local verification must exclusively use `flutter analyze` and `flutter test`.
2. Android platform files have already been generated in `cinetracker_flutter/android`.
3. A GitHub Actions CI/CD workflow has been created at `.github/workflows/build-flutter-apk.yml` to automatically build, test, and upload the Android Release APK on GitHub. Keep local verification strictly focused on 100% passing tests and 0 analysis errors.

## 2026-09-14T13:05:18Z

CRITICAL USER DIRECTIVE:
The user explicitly objected to the hardening loops: "why are you hardending..? did i tell you to do that?"

Cease all adversarial challenger/hardening loops immediately.
Do NOT spend time running redundant stress tests or remediation iterations on mock services.
Immediately proceed to implementing the core product features and UI screens:
1. Milestone 2: 5-Tab Cupertino Navigation (CupertinoTabScaffold), Global Search Sheet, and 10-Star Rating Component.
2. Milestone 3: Home Tab (Continue Watching Hero Card, Active Shows Carousel, Recently Watched, Weekly Summary), TV Detail & Episode Tracking, Movie Detail & Cupertino Logging Sheet.
3. Milestone 4: Stats Tab (KPI Cards, Watch Time Area Chart, 1-10 Rating Histogram, Activity Heatmap, 7x24 Habit Matrix).
4. Milestone 5: Library (Grid/List, Filters), Watchlist ("Pick for me"), Profile Showcase & Cupertino Settings.

Keep verification streamlined to standard `flutter analyze` and core widget/unit tests. Prioritize delivering the user-facing application screens and navigation now.


