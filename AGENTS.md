# Agent Instructions & Workflow Rules — CineTracker

These rules apply to all AI agents, assistant models, and developers contributing to this repository.

## 1. Mandatory AI Handoff Maintenance Protocol

**Whenever completing any coding task, architectural change, or bugfix in this repository, you MUST ALWAYS update the AI handoff documentation before finishing the turn:**

1. **Root Handoff Document** ([`HANDOFF.md`](file:///home/dog/git/movie-trackerh/HANDOFF.md)):
   - Documents the overall full-stack architecture (Next.js web, backend API routes, Turso/LibSQL database, React Native mobile, and Flutter iOS app).
   - Any modification to backend endpoints, schemas, authentication, or multi-platform capabilities must be recorded here.

2. **Flutter App Handoff Document** ([`cinetracker_flutter/HANDOFF.md`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/HANDOFF.md)):
   - Documents the native Flutter iOS client (`cinetracker_flutter`).
   - Any change to Flutter domain models, state providers, navigation routes, Cupertino UI components, or testing strategies must be recorded here.

3. **Keep Both Documents in Sync with Reality**:
   - Never leave documentation outdated.
   - Describe current implementation, design tokens, endpoints, and verification instructions.

---

## 2. Flutter Development & Verification Rules

1. **Local Build Prohibition**:
   - **NEVER** run local `flutter build` commands (such as `flutter build apk` or `flutter build ios`) on local developer environments.
   - Standalone release APK packaging is automated strictly within GitHub Actions CI ([`.github/workflows/build-flutter-apk.yml`](file:///home/dog/git/movie-trackerh/.github/workflows/build-flutter-apk.yml)).

2. **Static Analysis & Test Quality Gate**:
   - Always run and satisfy:
     ```bash
     flutter analyze --fatal-infos --fatal-warnings
     flutter test
     ```
   - Zero issues, warnings, or infos are allowed.

3. **Cupertino Identity ("Apple Health × Apple TV × CineTracker")**:
   - Strictly use native Cupertino widgets (`CupertinoTabScaffold`, `CupertinoPageScaffold`, `CupertinoNavigationBar`, `CupertinoActionSheet`, `CupertinoDatePicker`).
   - **No Material Design widgets** (`Divider`, `Scaffold`, `AppBar`, etc. are forbidden).
   - Maintain dark graphite palette (`#121212`, `#1E1E1E`, `#2A2A2A`), CineTracker neon green accents (`#00FF66`), and SF Symbols.

---

## 3. Web & Backend Rules

1. **Next.js 16+ App Router & Turbopack**:
   - Use strict TypeScript typing.
   - Ensure `ensureSchema()` runtime guard is preserved for automatic LibSQL table creation.
   - Preserve 1–10 star rating scale compatibility.
