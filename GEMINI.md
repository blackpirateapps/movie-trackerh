# CineTracker — AI Agent Guidelines & Workflow Rules

Refer to the primary instructions in [**`AGENTS.md`**](file:///home/dog/git/movie-trackerh/AGENTS.md).

### Core Workflows:
1. **Always Update AI Handoff Documents**:
   - Root: [`HANDOFF.md`](file:///home/dog/git/movie-trackerh/HANDOFF.md)
   - Flutter iOS App: [`cinetracker_flutter/HANDOFF.md`](file:///home/dog/git/movie-trackerh/cinetracker_flutter/HANDOFF.md)
2. **Quality Verification**:
   - Flutter: `flutter analyze --fatal-infos --fatal-warnings` & `flutter test`.
   - Never run local `flutter build` commands (CI handles build artifacts).
   - Strict Cupertino widgets only for the Flutter iOS app.
3. **Mandatory Git Commit & Push**:
   - Always stage, commit with descriptive messages, and `git push` to remote before concluding the turn.

