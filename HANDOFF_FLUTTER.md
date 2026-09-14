# CineTracker Flutter iOS Application — AI Handoff Document

The dedicated AI handoff and architectural documentation for the native Flutter iOS app is located at:

👉 [**`cinetracker_flutter/HANDOFF.md`**](file:///home/dog/git/movie-trackerh/cinetracker_flutter/HANDOFF.md)

### Quick Summary
- **Product Vision**: "Apple Health × Apple TV × CineTracker"
- **Design System**: Native Cupertino Dark Graphite (`#121212`, `#1E1E1E`), Neon Green accent (`#00FF66`), SF Symbols, SF Pro system typography.
- **Navigation**: 5-Tab `CupertinoTabScaffold` (Home, Library, Watchlist, Stats, Profile).
- **State Architecture**: `AuthProvider`, `MediaTrackingProvider`, `StatsProvider`, `SearchProvider`.
- **Quality Gates**:
  - `flutter analyze --fatal-infos --fatal-warnings` (0 issues)
  - `flutter test` (140 tests passing)
- **CI/CD Workflow**: [`.github/workflows/build-flutter-apk.yml`](file:///home/dog/git/movie-trackerh/.github/workflows/build-flutter-apk.yml)
