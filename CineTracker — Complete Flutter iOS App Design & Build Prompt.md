# CineTracker — Flutter iOS App
## Complete Product, UX, UI, and Interaction Specification

Build a completely new **CineTracker iOS application in Flutter**, designed from the ground up around **Cupertino/iOS interaction patterns**.

This is **not a React Native conversion**.

Do not copy, reproduce, or visually port the existing React Native application. Do not reuse its layouts, navigation structure, components, or hand-drawn visual language.

The existing CineTracker web/backend implementation is the **functional source of truth**. The Flutter application is a brand-new native-feeling client with a new information architecture, new design system, new navigation, and new interaction model.

The existing backend already provides movie and TV discovery/search, movie tracking, TV show tracking, season/episode tracking, 1–10 ratings, reviews, watched dates, watchlist, favorites, social/following, personalized dashboard data, universal search, Letterboxd import, and extensive statistics/analytics. Preserve and consume those capabilities through the existing APIs rather than duplicating business logic in the Flutter app.

---

# 1. PRODUCT VISION

CineTracker should feel like:

**Apple Health × Apple TV × CineTracker**

Apple Health provides the mental model of:

- personal progress
- history
- metrics
- trends
- streaks
- visual summaries
- long-term personal data

Apple TV provides:

- cinematic imagery
- premium media presentation
- large artwork
- rich content hierarchy
- immersive transitions
- beautiful content detail screens

CineTracker provides:

- personal movie/TV tracking
- ratings
- watch history
- episode progress
- watchlist
- reviews
- viewing statistics
- personal taste
- optional social activity

The result should feel like a **premium personal media-tracking application**, not a generic TMDB browser and not a web app wrapped inside a mobile shell.

The core emotional proposition is:

> **“This is my movie and TV life.”**

---

# 2. DESIGN PERSONALITY

The app should feel:

- premium
- cinematic
- sophisticated
- dark-first
- spacious
- modern
- personal
- data-aware
- unmistakably iOS
- subtly branded

Avoid:

- hand-drawn styling
- sketch borders
- excessive outlines
- dense desktop-style dashboards
- web-like cards everywhere
- excessive neon
- overly playful UI
- generic Material Design
- Android-looking navigation
- excessive gradients
- excessive text labels in navigation
- clutter

The application should look intentionally designed for iPhone.

---

# 3. VISUAL DESIGN SYSTEM

## 3.1 Appearance

Support:

**Dark mode first**

Also support Light Mode using appropriate dynamic Cupertino/system colors.

Dark mode is the primary visual identity.

Use near-black/dark graphite surfaces rather than pure black everywhere.

Recommended visual hierarchy:

- primary background: very dark graphite
- secondary grouped surface: slightly lighter graphite
- elevated surface: slightly lighter again
- separators: extremely subtle
- primary text: near-white
- secondary text: muted gray
- tertiary metadata: subdued gray
- CineTracker accent: neon green

Preserve the brand's existing neon green accent:

**#00FF66**

However, use it deliberately.

Use it for:

- selected navigation state
- primary CTA emphasis
- watched/progress state
- rating emphasis
- important statistics
- streak indicators
- progress bars
- active controls
- positive completion states

Do not make the entire UI neon green.

---

# 3.2 Typography

Use the iOS system typography wherever possible.

Use **SF Pro / Cupertino-compatible system typography**.

Hierarchy:

Large navigation titles:
- bold
- large
- confident

Section titles:
- semibold
- compact

Media titles:
- bold or semibold

Metadata:
- smaller
- muted
- clean

Statistics:
- very large
- high contrast
- semibold/bold

Do not use Inter as the primary interface typeface.

The app should visually feel native to iOS.

---

# 3.3 Cards

Use rounded cards with approximately **16–20pt corner radii**.

However:

**Do not put every piece of content inside a card.**

Use cards for:

- Continue Watching
- statistics modules
- important media actions
- episode progress
- grouped information
- featured content

Allow simple sections and lists to exist directly on the background.

Cards should feel like **iOS grouped surfaces**, not Bootstrap/Web cards.

---

# 3.4 Artwork

Artwork is extremely important.

Use:

- cinematic backdrops
- high-quality posters
- rounded poster corners
- edge-to-edge artwork in hero contexts
- subtle image gradients only when needed for readability

Poster corners should be rounded rather than sharp.

Typical poster radius:

**12–16pt**

Hero artwork can have larger rounded corners.

Never distort poster aspect ratios.

Preserve movie poster ratio around 2:3.

---

# 3.5 Glass / Materials

Use Cupertino-like translucent materials selectively.

Use subtle translucency for:

- bottom tab bar
- floating navigation elements
- overlays on artwork
- search presentation
- sheets where appropriate

Do not turn the entire app into glassmorphism.

The visual language should remain grounded and premium.

---

# 3.6 Shadows

Use very subtle elevation.

Do not create large web-style drop shadows.

Prefer:

- surface contrast
- blur/material
- border/separator
- artwork depth

over heavy shadows.

---

# 3.7 Gradients

Use mostly **subtle cinematic gradients**.

Especially useful for:

- darkening hero artwork toward text
- poster overlays
- bottom areas of backdrop images

Avoid loud decorative gradients.

---

# 3.8 Motion

Motion should be a defining part of the application.

Use:

- smooth page transitions
- shared-element poster transitions
- hero expansion
- card expansion
- spring interactions
- checkmark animations
- progress animation
- chart entrance animations
- subtle number animations
- bottom-sheet presentation
- fade/scale transitions

Animation should feel cinematic but restrained.

Avoid gimmicky animation.

Use haptic feedback for meaningful actions.

---

# 4. GLOBAL NAVIGATION

Use a **5-tab Cupertino-style bottom navigation structure**:

1. Home
2. Library
3. Watchlist
4. Stats
5. Profile

Use appropriate **SF Symbols**.

The selected tab uses the CineTracker green accent.

The tab bar should be:

- translucent/material
- iOS-native
- floating visually above content
- subtle
- not oversized

Social does NOT receive its own permanent bottom tab.

Search also does NOT receive its own permanent tab.

---

# 5. GLOBAL SEARCH

Search should be globally accessible from the top of major screens.

Do not dedicate an entire navigation tab to Search.

Trigger Search as a **full-screen Cupertino search experience / search sheet**.

The search UI should include:

Search field at the top.

Placeholder:

> Search movies & shows

Below:

Recent searches.

When searching, show unified results.

Support:

- Movies
- TV Shows
- All results

Use media-type labels discreetly.

If content is already in the user's CineTracker library, show a subtle:

> In Library

indicator.

Search results should use the existing unified search backend.

---

# 6. HOME SCREEN

## Purpose

Home answers:

> **“What am I currently watching, what have I recently watched, and how has my week been?”**

It should not feel like a generic discovery homepage.

The most important element is:

**Continue Watching**

---

## 6.1 Header

Top:

**Good evening**

Optionally show the user's first/display name underneath or beside it.

Upper-right:

- profile avatar
- search button

Avoid a huge logo.

Branding should be subtle.

---

## 6.2 Continue Watching Hero

This is the dominant component.

Show **one featured active TV show**.

Use the most recently active show.

Use a large full-bleed cinematic backdrop.

Hero card:

- approximately 50–60% of the available screen height on a typical iPhone
- rounded 16–20pt corners
- artwork dominates
- lower portion fades into dark gradient
- show title large
- season/episode
- progress
- next episode
- primary Continue action

Example conceptual layout:

```text
┌────────────────────────────────────┐
│                                    │
│                                    │
│          SHOW BACKDROP             │
│                                    │
│                                    │
│                                    │
│                                    │
│   Severance                        │
│   Season 2 · Episode 4             │
│                                    │
│   ███████████████░░░               │
│   4 of 10 episodes                 │
│                                    │
│   Next · S2 E5                     │
│   [ Continue Watching ]            │
└────────────────────────────────────┘
```

Tapping the card anywhere should open/continue the show context.

The button visually reinforces the action.

The primary action is:

**Continue Watching**

Do not require precise tapping on a tiny button.

---

## 6.3 Active Shows

Below the hero:

Section title:

**Other Shows**

Horizontal poster carousel.

Show compact poster cards.

Each card displays:

- poster
- show name
- season/episode progress

Do not show four large dashboard cards.

Keep this visually light.

---

## 6.4 Recently Watched

Section title:

**Recently Watched**

Horizontal poster carousel.

Each item:

- poster
- title
- user rating
- optionally watched date

Use 3–4 visible cards depending on device width.

Rating is represented through stars.

---

## 6.5 Watchlist Preview

Section:

**From Your Watchlist**

Horizontal cards.

Show 4–6 items.

Add a small:

**See All**

button.

---

## 6.6 Weekly Summary

Near the bottom:

**This Week**

Show:

- total hours
- films watched
- episodes watched
- current streak

Example:

```text
This Week

12h 42m
watched

6 films      18 episodes
🔥 5 day streak
```

This should feel like a small Apple Health summary rather than a dashboard grid.

---

# 7. LIBRARY

Library is the user's collection.

Library should have a dedicated navigation tab.

Opening Library should provide an overview before diving into media collections.

Top segmented control:

**Movies | TV Shows**

Then:

- Recently Added
- In Progress
- Favorites
- Unrated
- optionally Recently Watched

Provide access to Diary from Library but do not make Diary part of the primary bottom navigation.

---

# 8. MOVIE LIBRARY

Support:

**Grid view + List view**

The user can toggle between them.

Filters:

- All
- Watched
- Favorites
- Unrated

Optional sorting:

- Recently Watched
- Recently Added
- Highest Rated
- Title
- Release Date

---

## 8.1 Grid Mode

Two or three columns depending on screen width.

On standard iPhones prefer **2 large posters** when the screen allows it.

Cards:

- rounded poster
- subtle rating badge
- title below if space permits
- minimal metadata

Do not cram information over the poster.

---

## 8.2 List Mode

Rows:

Poster thumbnail
Movie title
Year/runtime
User rating
Watched date

Example:

```text
[poster]  Dune: Part Two
          2024 · 2h 46m
          ★★★★★
          Watched Sep 12
```

Use clean iOS list separators.

Allow swipe actions where appropriate.

---

# 9. TV LIBRARY

TV should be fundamentally more progress-oriented than movie browsing.

Top filters:

- In Progress
- Completed
- Not Started
- Favorites

Use large rounded rows.

Each show:

```text
[poster]

Severance
Season 2 · Episode 4 / 10

████████░░

4 episodes remaining
```

Emphasize progress over generic ratings.

Secondary metadata can show:

- user rating
- number of seasons
- last watched date

---

# 10. WATCHLIST

Watchlist is its own primary tab.

Top:

**Watchlist**

Segment:

**Movies | TV**

Use a hybrid browsing experience.

Sections can include:

- Tonight
- Recently Added
- Quick Watches
- TV Shows
- Movies

Do not over-engineer recommendation logic.

The watchlist primarily exists to organize the user's own queue.

---

## 10.1 Pick Something For Me

Provide a visually interesting action near the top:

**Pick something for me**

This selects a movie/show from the user's watchlist.

Present the result as a cinematic recommendation card.

Example:

```text
Tonight's Pick

Arrival

1h 56m
Sci-Fi · Drama

[ Watch ]
```

This is a lightweight convenience feature, not an AI recommendation system.

---

# 11. MOVIE DETAIL SCREEN

The movie detail page should prioritize information and actions before immersive artwork.

Structure:

1. Poster
2. Title
3. Metadata
4. User rating
5. Watched action
6. Watchlist action
7. User review
8. Overview
9. Cast
10. Genres/details
11. Public/community information where appropriate

---

## 11.1 Header

Standard iOS navigation.

Back button:

**Movies**

Right side:

More/context menu if appropriate.

---

## 11.2 Media Header

Large rounded poster.

Beside/below it depending on screen width:

**Dune: Part Two**

2024 · 2h 46m

Sci-Fi · Drama

---

## 11.3 User Rating

Large:

**★★★★★★★★★☆**

**9 / 10**

The rating system is **1–10**.

Make this interactive.

---

# 12. RATING COMPONENT

Use ten stars.

Visual:

```text
☆ ☆ ☆ ☆ ☆ ☆ ☆ ☆ ☆ ☆

9 / 10
```

Allow:

- direct tapping
- horizontal dragging
- keyboard/accessibility interaction if supported

Add subtle haptic feedback when changing rating.

Do not turn the rating into a rainbow spectrum.

Maintain one consistent rating interaction throughout:

- movies
- TV shows
- episodes

---

# 13. WATCHED ACTION

The primary movie action should be:

**Watched**

But tapping Watched should not require navigating to a separate page.

Open a native **Cupertino bottom sheet**.

---

# 14. LOG MOVIE SHEET

The Log Movie sheet contains:

Movie title/poster

**Watched**

Date:

**Today**

with date picker.

Rating:

10-star selector.

Review:

Optional text field.

Watched where:

Picker.

Existing backend support for watched-where/platform tagging should be preserved.

Primary action:

**Save**

Secondary:

**Cancel**

Use native iOS sheet behavior.

Use keyboard-aware layout.

Do not let the keyboard obscure the save action.

Saving should immediately update the UI optimistically.

---

# 15. MOVIE STATES

Movie can visually transition between:

### Not tracked

Actions:

**Mark Watched**
**Add to Watchlist**

### Watchlisted

Actions:

**Mark Watched**
**In Watchlist ✓**

### Watched

Actions:

**Watched ✓**
**Add/Edit Rating**
**Edit Review**

The state should be visually obvious but understated.

---

# 16. TV DETAIL SCREEN

TV detail is one of the flagship experiences.

Hierarchy:

1. Backdrop artwork
2. Show identity
3. Overall progress
4. Continue/next episode
5. Season selector
6. Episode list
7. Show rating/review
8. Details

---

## 16.1 Hero

Use large rounded backdrop artwork.

Overlay:

Show title.

Rating.

Season count.

Episode count.

Overall progress.

Example:

```text
Severance

★ 9/10

18 / 20 episodes

██████████████████░░
```

---

# 17. TV CONTINUE CARD

Immediately below the hero:

```text
Continue Watching

S2 · E5
48 min

[ Continue ]
```

Show the next unwatched episode.

Use episode title where available.

Include runtime where available.

This should be the most prominent action on the TV detail screen.

---

# 18. SEASON SELECTOR

Use a native segmented/pill-like horizontal selector or Cupertino-style control.

Example:

**Season 1 | Season 2 | Season 3**

Show completion:

Season 1
8/8

Season 2
4/10

Season 3
0/10

---

# 19. EPISODE LIST

Each episode row should contain:

- episode number
- title
- runtime
- watched state
- air date
- optional rating
- optional still thumbnail

Example:

```text
✓  E4
   The Garden
   48 min

○  E5
   Episode Title
   51 min
```

---

# 20. EPISODE INTERACTIONS

Support both:

### Tap

Tapping the episode row toggles watched/unwatched.

### Swipe

Swipe right to mark watched.

Swipe again / opposite direction as appropriate to reverse.

Use haptic feedback.

Marking an episode watched should:

- animate the checkmark
- animate the progress bar
- update episode count
- calculate the next episode
- update Continue Watching
- optimistically update the local UI
- synchronize in background

---

# 21. EPISODE DETAILS / CONTEXT MENU

Long press or context menu should offer:

- Mark watched
- Mark unwatched
- Rate episode
- Edit watched date

Do not force the user into a full episode detail page for simple actions.

---

# 22. BULK TV ACTIONS

Preserve existing functionality for:

**Mark Season as Watched**

and

**Mark Entire Show as Watched**

These actions should be secondary, not visually dominant.

Before bulk actions, show a lightweight confirmation sheet.

Example:

> Mark all 10 episodes in Season 2 as watched?

Actions:

**Mark Watched**

**Cancel**

---

# 23. TV SHOW RATING

Show-level rating uses the same 10-star system as movies.

Example:

```text
Your Rating

★★★★★★★★★☆

9 / 10
```

Allow optional review.

TV tracking can also preserve:

- favorite state
- start date
- end date
- watched where/platform tags

These are part of the existing product model.

---

# 24. DIARY / HISTORY

Diary is intentionally secondary.

The user selected no dedicated Diary tab.

Instead, make it accessible from Library and Profile.

A lightweight chronological history:

```text
September 14

🎬 Dune: Part Two
★★★★★

📺 Severance
S2 E4
★★★★½

September 13

🎬 ...
```

Do not make the diary overly social.

This is personal history.

---

# 25. STATS TAB

Stats is a primary bottom-tab.

It should feel like:

**Apple Health for movies and television.**

Not a generic BI dashboard.

---

## 25.1 Stats Header

Large:

**2026**

Filter:

All | Movies | TV

Allow timeframe:

- All Time
- Year
- Month
- Week
- Custom Range

Keep the controls compact.

---

# 26. PRIMARY KPI

Largest statistic:

**187h 24m**

Watched

Below:

**84 Films**
**213 Episodes**

Then:

**Average Rating**

8.1 / 10

Then:

**Current Streak**

🔥 14 days

**Longest Streak**

31 days

Use large numerals.

---

# 27. WATCH TIME CHART

Create a cinematic but clean chart.

Show:

**Watch Time**

Optional comparison between:

- total watch hours
- TV episode hours

Use the CineTracker accent for the primary series.

Do not overdecorate the chart.

Animation:

Chart draws in smoothly when the screen appears.

---

# 28. RATING DISTRIBUTION

A clean horizontal or vertical distribution.

1–10.

Highlight the user's most frequent rating tier.

Example:

**Most Common**

8 / 10

The histogram should feel polished and understated.

---

# 29. ACTIVITY HEATMAP

Use a 365-day activity heatmap.

Inspired by contribution graphs but redesigned to feel native.

Show intensity based on viewing activity.

Use several shades of CineTracker green.

Do not make it look like GitHub.

Make it elegant.

---

# 30. TOP GENRES

Horizontal progress bars.

Top 5 genres.

Example:

Drama
██████████████
32%

Sci-Fi
████████
18%

Thriller
██████
14%

Keep this compact.

---

# 31. CREATORS & STARS

Show:

Most watched directors.

Most watched actors.

Use small circular portraits where available.

Each row:

Name
Role
Number of titles watched

Avoid making this card too tall.

---

# 32. HALL OF FAME

Poster grid of the user's highest-rated films and shows.

This should be visually rich.

Use rounded posters.

Rating displayed subtly.

This is one area where cinematic presentation can take precedence over data density.

---

# 33. WATCHING HABITS

Provide a 7 × 24 visualization.

Days of week on one axis.

Hours on the other.

Show peak viewing periods.

Use green intensity.

Keep labels readable.

This should feel like a beautiful personal insight rather than an analytics tool.

---

# 34. PROFILE TAB

Profile should NOT feel like generic account settings.

It should feel like the user's personal CineTracker identity.

Header:

Avatar

Display Name

@username

Short bio

Stats:

Films
TV Shows
Hours Watched

---

# 35. PROFILE CONTENT

After header:

**Favorites**

Four large posters.

Then:

**Recent Activity**

Then:

**Diary**

Then:

Navigation links:

- My Movies
- My TV Shows
- Watchlist
- Stats
- Settings

Social information can appear here.

---

# 36. SOCIAL

Social is a secondary feature.

Existing social functionality should be preserved.

Activity can include:

- followed users
- movie ratings
- movie reviews
- TV activity
- follows/unfollows

Do not let social dominate the main CineTracker experience.

A good Activity screen can be accessible through Profile or an Activity affordance within Profile.

---

# 37. USER PROFILE

When viewing another user's profile:

Show:

- avatar
- display name
- username
- bio
- follower/following information
- film count
- TV count
- hours watched
- favorites
- recent activity

Primary action:

**Follow**

or

**Following**

Respect private profile preferences.

---

# 38. SETTINGS

Settings should live under Profile.

Use a classic but premium Cupertino grouped-list structure.

Sections:

## Account

- Profile
- Email
- Password
- Privacy

## Preferences

- Appearance
- Default library layout
- Hide NSFW
- Private account

## Data

- Import Letterboxd
- Export Data

## Developer

- API Keys
- API Documentation
- Developer Console

## Danger Zone

- Delete Account

The API/developer functionality exists in the current product and should remain available, but it should be deeply nested rather than exposed in the main UI.

---

# 39. LETTERBOXD IMPORT

Create a clean import experience.

Entry point:

Profile → Settings → Data → Import Letterboxd

Screen:

**Import from Letterboxd**

Explain briefly:

> Import your watched history or watchlist.

Offer:

**Watched History**

**Watchlist**

Then:

- file picker
- parsing progress
- matching progress
- ambiguous title review
- import results

Provide clear summary:

```text
Import Complete

127 movies matched
4 movies need review
38 watchlist items added
```

Use native progress UI.

---

# 40. DATA EXPORT

Profile → Settings → Data.

Provide:

**Export my CineTracker data**

Allow exporting available user data.

Do not make API terminology the default for ordinary users.

---

# 41. API / DEVELOPER SETTINGS

Developer functionality can remain comprehensive.

Preserve existing functionality for:

- API key creation
- API key revocation
- API key prefix display
- request count
- last used
- API documentation
- interactive API console
- code examples

However, this section should look like a clean developer tool inside Settings rather than part of the main application.

---

# 42. AUTHENTICATION

Build:

- Login
- Sign Up
- Logout
- password management

Use Cupertino input fields and buttons.

Do not visually copy the old post-it/hand-drawn authentication screens.

Authentication should feel premium and minimal.

---

# 43. ONBOARDING

Create a very short onboarding experience.

Do not force lengthy tutorials.

Possible flow:

### Welcome

**Your watching life, tracked.**

### Personalization

Ask for only useful initial preferences.

### Start

Offer:

**Search for a movie**

**Import Letterboxd**

**Start from scratch**

Keep onboarding optional and skippable.

---

# 44. EMPTY STATES

Use minimal cinematic empty states.

Examples:

### Empty Watchlist

> Your watchlist is empty.

CTA:

**Find something to watch**

### No watched movies

> Start building your movie history.

CTA:

**Log a movie**

### No active TV shows

> You're not currently following a show.

CTA:

**Find a show**

Avoid cartoon illustrations.

Use subtle artwork only where appropriate.

---

# 45. LOADING STATES

Avoid spinners wherever possible.

Use:

- skeleton posters
- skeleton text
- animated placeholders
- subtle shimmer

For actions already performed by the user, prefer optimistic updates.

The existing web implementation already follows a non-blocking interaction strategy for edits and watched/rating actions. Preserve this philosophy in Flutter.

---

# 46. ERROR STATES

Errors should be human.

Do not show raw backend/API messages as the primary UI.

Example:

> Couldn't load your library.

CTA:

**Try Again**

If an individual image fails, preserve layout and show a neutral placeholder.

---

# 47. OFFLINE / NETWORK RESILIENCE

Design the application so cached content remains useful where possible.

Prioritize local UI responsiveness.

Mutations should feel immediate when reasonable and synchronize afterward.

Avoid full-screen reloads after:

- logging a movie
- rating
- editing a review
- marking an episode watched
- adding/removing watchlist
- favoriting

---

# 48. GLOBAL QUICK ACTIONS

A universal `+` action may be available from Home/Library contexts.

It should open:

**Log Something**

Then:

Search movie or show.

After selection:

- Mark watched
- Add to watchlist
- Rate
- Review

The goal is to make logging something take seconds.

---

# 49. TRANSITIONS

Important transitions:

### Home → TV Detail

Hero artwork should smoothly expand into the detail screen.

### Home → Movie Detail

Poster should transition into the movie poster on detail.

### Library → Detail

Poster can participate in a shared-element transition.

### Episode watched

Animate:

checkmark
progress bar
episode status
next episode

### Stats

Numbers can gently count/transition into place.

Charts should animate into view.

Do not animate every component.

---

# 50. HAPTICS

Use haptics for meaningful interaction:

- marking watched
- rating changes
- favorite toggle
- watchlist toggle
- bulk completion
- successful save
- significant navigation actions

Do not use haptics continuously.

---

# 51. RESPONSIVE DESIGN

Primary target:

**iPhone**

Support different iPhone screen sizes gracefully.

Do not design against one fixed resolution.

Cards, poster sizes, text and gutters should respond naturally.

The interface should feel equally considered on smaller and larger iPhones.

iPad support can be secondary, but avoid making architectural decisions that prevent it later.

---

# 52. ACCESSIBILITY

Support:

- Dynamic Type
- VoiceOver
- semantic labels
- sufficient contrast
- large tap targets
- reduced motion
- accessible star ratings
- accessible progress states

Every poster needs meaningful accessibility text.

Example:

> Dune: Part Two, watched, rated 9 out of 10

Do not rely exclusively on color to communicate state.

---

# 53. DATA AND BACKEND INTEGRATION

The Flutter app should consume the existing CineTracker APIs.

Do not duplicate server business logic unnecessarily.

Preserve existing concepts:

Movies.

TV Shows.

Seasons.

Episodes.

User movie records.

User TV records.

User episode records.

Watchlist.

Favorites.

Reviews.

Ratings.

Watch dates.

Watched-where/platform data.

Following.

User profiles.

Dashboard.

Statistics.

Universal Search.

API/data export.

Use the existing API semantics as the backend contract.

The current backend uses TMDB IDs for movie and TV entities and caches TMDB metadata locally. 
Do not replace the existing backend with a new local database unless necessary for client-side caching/offline functionality.

---

# 54. STATE MANAGEMENT

Use a clean feature-oriented architecture.

Recommended conceptual structure:

```text
lib/
  app/
  core/
    networking/
    storage/
    theme/
    routing/
    errors/
  features/
    auth/
    home/
    search/
    movies/
    tv/
    library/
    watchlist/
    stats/
    profile/
    settings/
    import/
  shared/
    widgets/
    components/
    sheets/
```

Use a modern predictable state-management solution appropriate for Flutter.

Keep:

- API state
- local UI state
- cached state
- mutation state

separate.

Avoid a giant global state object.

---

# 55. CORE FLUTTER DESIGN PRINCIPLE

Use Flutter to emulate **native iOS behavior**, not merely to render a custom dark theme.

Prefer Cupertino components when an appropriate Cupertino equivalent exists.

Use:

- CupertinoNavigationBar
- CupertinoTabBar
- CupertinoPageScaffold
- CupertinoSliverNavigationBar
- CupertinoSearchTextField
- CupertinoActionSheet
- CupertinoAlertDialog
- CupertinoSlidingSegmentedControl
- CupertinoSwitch
- CupertinoDatePicker
- CupertinoButton
- CupertinoFormSection
- CupertinoListSection
- CupertinoTextField

Use Material components only when there is a concrete reason.

The application should not feel like Material Design with rounded corners.

---

# 56. VISUAL PRIORITY RULE

Every screen should answer:

> What is the one thing the user should do or understand here?

Examples:

Home:
**Continue watching.**

Library:
**Browse your collection.**

Watchlist:
**Choose what to watch next.**

Stats:
**Understand your watching.**

Profile:
**See your personal CineTracker identity.**

Movie Detail:
**Log/rate the movie.**

TV Detail:
**Continue the show and manage episode progress.**

Do not allow secondary features to compete with the primary action.

---

# 57. FINAL APP HIERARCHY

The finished app should broadly feel like this:

```text
CINETRACKER

HOME
│
├── Continue Watching
│   └── One featured show
│
├── Other Shows
├── Recently Watched
├── Watchlist Preview
└── This Week


LIBRARY
│
├── Movies
│   ├── Grid
│   └── List
│
├── TV Shows
│   └── Progress List
│
├── Favorites
├── Unrated
└── Diary


WATCHLIST
│
├── Movies
├── TV
├── Recently Added
├── Quick Watches
└── Pick Something For Me


STATS
│
├── Overview
├── Watch Time
├── Rating Distribution
├── Activity
├── Genres
├── Creators & Stars
├── Hall of Fame
└── Watching Habits


PROFILE
│
├── Personal Profile
├── Favorites
├── Recent Activity
├── Diary
├── My Movies
├── My TV
├── Watchlist
└── Settings
    ├── Account
    ├── Preferences
    ├── Data
    ├── Developer
    └── Danger Zone
```

---

# 58. IMPLEMENTATION PRIORITY

Build in this order:

## Phase 1 — Foundation

- Flutter project
- Cupertino theme
- routing
- API client
- authentication
- typography
- color system
- spacing system
- reusable cards
- poster components
- rating component
- sheet system
- bottom navigation

## Phase 2 — Core Tracking

- Home
- Movie Detail
- Movie logging
- Library
- Watchlist
- TV Detail
- episode tracking

## Phase 3 — Personal Dashboard

- Stats
- Profile
- Diary
- favorites
- progress tracking

## Phase 4 — Secondary Features

- Search
- Social/activity
- Letterboxd import
- developer/API section
- data export
- advanced settings

---

# 59. NON-NEGOTIABLE DESIGN RULES

1. Do not port the React Native UI.

2. Do not recreate the hand-drawn visual design.

3. Do not build a Material Design app.

4. Use Cupertino/iOS interaction patterns throughout.

5. Dark mode is the primary visual expression.

6. CineTracker neon green `#00FF66` remains the signature accent.

7. Use green selectively.

8. Artwork should feel cinematic and premium.

9. Continue Watching is the most important Home feature.

10. One active show is featured prominently on Home.

11. TV is progress-oriented.

12. Movies are collection-oriented.

13. Stats are a first-class product feature.

14. Social is secondary.

15. Search is global, not a primary bottom tab.

16. Watch/list/log actions should be fast.

17. Use bottom sheets for logging/editing.

18. Use optimistic UI for common tracking actions.

19. Avoid unnecessary full-screen reloads.

20. Do not put everything inside cards.

21. Use native iOS typography and system behavior.

22. Use subtle haptics and high-quality motion.

23. Preserve the existing backend's functionality and semantics.

24. Keep developer/API functionality hidden inside Settings.

25. The app should feel like a **personal media health dashboard with cinematic content**, not a generic movie database.

---

# 60. DEFINITION OF SUCCESS

A user should be able to open CineTracker and immediately answer:

**What am I watching?**

**What episode is next?**

**What did I watch recently?**

**What's in my watchlist?**

**How much have I watched?**

**What do I usually like?**

And they should be able to:

**log a movie**
**rate it**
**write a quick review**
**mark an episode watched**
**continue a TV show**
**browse their collection**
**check their statistics**

without feeling like they are interacting with a database.

The finished experience should feel:

> **Like Apple Health, if Apple Health tracked your relationship with movies and television.**

And visually:

> **Like Apple TV, if it were entirely about your own viewing life.**

With:

> **CineTracker's neon-green identity, ratings, history, progress, and personality.**