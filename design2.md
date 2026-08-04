Cinetracker UI/UX Design System Document

Target Audience: AI Development Agents, UI Engineers
Version: 1.0
Design Philosophy: Utilitarian, Minimalist, High-Contrast Dark Mode, Function-over-Flair, Data-Dense.

1. Core Directives (CRITICAL RULES)

NEVER deviate from the defined color palette. Do not introduce new grays or accents.

NEVER use box-shadows for elevation. Elevation is achieved through background color lightening (Surface -> Hover) and 1px borders.

STRICT ASPECT RATIO: All media posters (Movie/TV) must strictly adhere to a 2 / 3 aspect ratio. No exceptions.

MOBILE FIRST: Layouts must natively support small screens (320px width) before scaling up. Never hardcode fixed pixel widths on structural containers.

2. Design Tokens

2.1 Color Palette

All color values must use these exact Hex codes mapped to these semantic variable names.

Token Name

Hex Value

Usage Directive

bgBase

#121212

App background, lowest z-index, dropdown backgrounds.

bgSurface

#1E1E1E

Elevated containers, cards, navigation bar background.

bgHover

#2A2A2A

Hover states for rows/cards, placeholder background for missing images.

borderSubtle

#333333

All dividers, outlines, container borders (1px solid).

textMain

#EDEDED

Primary headings, standard body text. (High contrast).

textMuted

#A0A0A0

Secondary text, metadata, disabled states, unselected tabs.

accent

#00FF66

Primary CTAs, active states, ratings, TV badges. Use sparingly.

accentHover

#00CC52

Hover state for accent elements.

2.2 Typography

Font Family: Inter, sans-serif. (Fallback: system-ui).

Weights:

Light (300): Rarely used, large atmospheric text.

Regular (400): Standard body copy, descriptions.

Medium (500): Navigation links, tabs, secondary buttons.

Bold (700): App logo, primary headings (H1, H2), metadata labels.

Scale (Tailwind equivalents):

text-[10px] / 0.625rem: Super metadata (Year on grid, badges).

text-xs / 0.75rem: Standard metadata, labels, small buttons.

text-sm / 0.875rem: Standard body, nav links, search input.

text-base / 1rem: Hero description body.

text-lg / 1.125rem: Subheadings.

text-3xl / 1.875rem to text-5xl / 3rem: Hero Titles (fluid scaling based on viewport).

Styling Rules:

Metadata labels (e.g., "FEATURE FILM", "DIRECTOR") MUST be uppercase, text-xs (or smaller), font-bold, with tracking-widest (letter-spacing: 0.1em).

3. Component Architecture

3.1 Media Posters (The Grid Item)

Structure: Relative container -> Aspect Ratio Wrapper -> Image.

Wrapper: CSS aspect-ratio: 2 / 3; overflow: hidden; background-color: var(--bgHover); border-radius: 4px; border: 1px solid var(--borderSubtle);

Image: object-fit: cover; width: 100%; height: 100%;.

Interaction:

Image scales up to 1.03 on wrapper hover (transition: transform 0.3s ease).

Overlay appears on hover: bgBase/80 (80% opacity), backdrop-blur-sm, fading in (0.2s duration).

Badges (TV): Positioned top-1 right-1, absolute, z-10. Background bgBase/90, Text accent. Padding px-1.5 py-0.5. Text size text-[10px].

3.2 Buttons

Primary Action (e.g., "Log"): Background accent, Text bgBase (for contrast), font-bold, uppercase, tracking-wider, rounded (4px). Hover background accentHover.

Ghost/Icon (e.g., "Like", "Watchlist"): Background transparent. Text textMuted. Border 1px borderSubtle. Hover background bgHover, Hover text textMain. Size 44px by 44px minimum tap target for mobile.

Focus State (Accessibility): ALL interactive elements MUST implement a focus ring on keyboard navigation: outline-2 outline-accent outline-offset-2.

3.3 Navigation Bar

Behavior: Sticky top (sticky top-0, z-50).

Visuals: Background bgBase/90 with CSS backdrop-filter: blur(12px). Bottom border 1px solid borderSubtle.

Height: Fixed at 64px (h-16).

4. Layout & Mobile Optimization Matrix

The app utilizes a mobile-first fluid grid layout. Use the following Tailwind breakpoints mapping:

default: < 640px (Mobile)

sm: >= 640px (Large Phones/Small Tablets)

md: >= 768px (Tablets)

lg: >= 1024px (Desktops)

4.1 Global Container

All main content must be constrained within a centered container: max-w-6xl mx-auto.

Horizontal padding: px-4 on mobile, sm:px-6, lg:px-8.

4.2 Media Grid Behaviors

The grid must dense-pack posters based on viewport width:

default (Mobile): grid-cols-3 (3 items per row). Gap: gap-3.

sm: grid-cols-4. Gap: gap-4.

md: grid-cols-5. Gap: gap-4.

lg: grid-cols-6. Gap: gap-4.

4.3 Hero Section (Featured Item) Mobile Rules

Layout: <div class="flex flex-col md:flex-row">

Mobile (< 768px): The poster sits above the details text. Poster width locked to w-32. Details text is left-aligned. Action buttons wrap (flex-wrap).

Desktop (>= 768px): Poster is on the left (w-48), details on the right taking remaining space. Items align to the bottom of the container.

Backdrop: The background hero image MUST have an overlay gradient fading to bgSurface to ensure text readability, regardless of the image's inherent brightness.

4.4 Navigation Mobile Rules

Links: The central navigation links (Diary, Films, Shows) MUST be hidden on default (< 768px). Include a hamburger menu icon only if necessary, otherwise rely on bottom-nav for mobile (future scope).

Search: The expanded search input field MUST be hidden on default (< 640px). It is replaced by a single magnifying glass icon button.

4.5 Filter Tabs

On mobile, if filter tabs (e.g., "Recent", "Movies", "TV") exceed the screen width, the container MUST allow horizontal scrolling (overflow-x-auto) while hiding the system scrollbar (scrollbar-width: none;).

5. Assets & Iconography

Icons: Use the Phosphor Icons library (Web version).

Weights: Use Regular weight for most UI elements. Use Fill weight for active states (e.g., a filled star for a rating, a filled heart for a liked item).

Fallbacks: If a poster image fails to load (404), the UI MUST fallback gracefully to the bgHover background color displaying a centered ph-film-strip icon in textMuted color.
