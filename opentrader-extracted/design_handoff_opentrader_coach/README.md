# Handoff: OpenTrader Coach — Webinar Q&A Browser

## Overview
A single-page app for browsing coaching webinar questions. Users can search across all sessions, filter by topic, jump to a specific moment in a video (via timestamped questions), and toggle between light and dark themes. Sessions are grouped by date and collapsible. A floating player strip appears when a timestamp is clicked.

## About the Design Files
The files in this bundle (`OpenTrader Coach.html`, `components.jsx`, `styles.css`, `data.js`) are **HTML design prototypes** — they show the intended look, layout, and behavior of the UI. They are **not** production code to copy directly. The task is to **recreate these designs in your target codebase** (React, Next.js, Vue, etc.) using its established patterns, component libraries, and data-fetching conventions.

## Fidelity
**High-fidelity.** Colors, typography, spacing, border radii, shadows, hover states, animations, and interactions are all final. Recreate pixel-accurately using the codebase's existing libraries and patterns.

---

## Screens / Views

### 1. Main Page (single view — no routing needed)

**Layout:** Centered single-column, `max-width: 920px`, `margin: 0 auto`, `padding: 36px 28px 120px`. Full-page background with a subtle radial accent wash (see Design Tokens).

---

### Header
- **Height:** ~56px, flex row, space-between
- **Left — Brand lockup:**
  - 9×9px circle dot, `background: accent`, with `box-shadow: 0 0 0 3px accent/18%`
  - "OpenTrader" in `font-weight: 600`, `font-size: 19px`, `letter-spacing: -0.015em`
  - "Coach" in accent color, `font-weight: 500`
- **Right — Stats + Toggle:**
  - Two stat blocks (Sessions · Questions), each with a large mono number (`font-size: 17px`, tabular-nums) and a small uppercase label (`font-size: 10.5px`, `letter-spacing: 0.12em`, muted color)
  - 1px vertical divider between stats and between stats and toggle
  - **Theme toggle** — a pill-shaped toggle switch (48×26px) that alternates Paper ↔ Dusk theme:
    - Light state: muted track, thumb on left, sun icon
    - Dark state: dark blue track (`oklch(0.32 0.025 260)`), thumb on right, moon icon
    - Thumb slides with `transition: left 0.2s cubic-bezier(0.4,0,0.2,1)`
    - Persisted to `localStorage`

---

### Sticky Search Bar + Filter Row
- Sticks to top (`position: sticky; top: 0`), fades out at bottom via gradient
- **Search input:** 48px tall, `border-radius: 14px`, panel background, 1px border. On focus: accent border + `box-shadow: 0 0 0 4px accent/12%`. Contains a search SVG icon on the left and a `/` keycap hint on the right. Press `/` to focus, `Escape` to blur.
- **Live result count** appears below when a query is active: `"X matches for 'query'"`
- **Filter chips** (below search, `margin-top: 12px`): All · Chart Review · Trade Review · Mindset · Setups. Pill-shaped, `border-radius: 999px`, `padding: 6px 12px`. Active chip inverts to ink background + bg-colored text.

---

### Session Cards (scrollable list)
Each session is a card:
- `border-radius: 16px`, panel background, 1px border (line-soft color), subtle box-shadow
- **Session header** (14px padding, light gradient background):
  - Collapse toggle chevron (rotates 90° when expanded)
  - **Date** (`font-weight: 600`, `font-size: 14.5px`)
  - **Title** (muted, `font-weight: 500`, `font-size: 13.5px`)
  - 3px dot separator
  - **Duration** in mono font (`font-size: 12px`, muted)
  - **Question count** pill — right-aligned, `border-radius: 999px`, soft bg
- **Session body** — list of question rows (see below), `padding: 4px 8px 10px`

---

### Question Rows
Two-column grid: `74px | 1fr`, `gap: 16px`. Rows separated by a dashed border-top.

- **Timestamp button (left column):**
  - Pill: accent-soft background, accent-ink text, 1px accent/18% border, `border-radius: 6px`, mono font, `font-size: 12px`
  - Contains a small play triangle + the timestamp string (e.g. `07:32`)
  - Hover: fills solid accent, white text
  - Three style variants (toggle via Tweaks): `pill` (default), `mono` (no bg, no icon), `ghost` (neutral border)
  - **On click:** opens the floating Player Strip at the bottom of the viewport

- **Question body (right column):**
  - Question text: `font-size: 15px`, `line-height: 1.58`, `text-wrap: pretty`, ink color
  - Search matches highlighted with a warm yellow mark (`border-radius: 3px`)
  - **Hover-only metadata row** (fades in on row hover, `opacity: 0 → 1`):
    - Asker name (medium weight, ink-soft)
    - "·" separator
    - "Open transcript" button (ghost, links to transcript)
    - "Copy link" button

- **Row hover state:** very subtle accent background tint (`accent/4%`)
- **Playing state** (when timestamp is active): stronger accent tint (`accent/8%`)

---

### Floating Player Strip
Appears at bottom of viewport when a timestamp is clicked. Animates up (`translateY(20px) → 0`, `opacity 0 → 1`).

- `position: fixed; bottom: 16px`, centered, `max-width: 720px`
- Panel background, 1px border, large shadow, `border-radius: 14px`
- **Contents:** pause button (accent-filled circle, 34px), session + timestamp title (uppercase, muted, 11.5px), question text (truncated, 13px), × close button
- Thin progress bar at very bottom of strip (2px, accent fill, animates)

---

### Tweaks Panel
Floating panel (`position: fixed; right: 20px; bottom: 20px; width: 280px`). Shown/hidden by toolbar toggle or host `__activate_edit_mode` postMessage.

Controls:
- **Theme** — four swatches: Paper, Cream, Sage, Dusk
- **Body font** — pill buttons: Geist, IBM Plex, Source Serif
- **Density** — Cozy / Comfortable / Airy (adjusts row padding + gap)
- **Timestamp style** — pill / mono / ghost
- **Accent hue** — range slider 10–360°, live preview swatch

---

## Interactions & Behavior

| Interaction | Behavior |
|---|---|
| Click timestamp | Opens player strip showing session name, timestamp, question text; fake progress animates |
| Click × on player | Dismisses player strip |
| Type in search | Filters sessions/questions live; highlights matches in yellow |
| Press `/` | Focuses search input |
| Press `Escape` | Blurs search input |
| Click filter chip | Filters by topic (Chart Review, Trade Review, Mindset, Setups, All) |
| Click session header | Collapses/expands that session's questions |
| Click theme toggle | Switches between Paper (light) and Dusk (dark) theme, persists to localStorage |
| Hover question row | Reveals asker name + action links |

---

## State Management

```
query: string                  // search input value
filter: "all"|"chart"|"trade"|"mindset"|"setup"
playing: { q, t, session, sessionIso } | null
tweaks: {
  theme: "paper"|"cream"|"sage"|"dusk"
  font: "geist"|"ibm"|"source"
  density: "cozy"|"comfortable"|"airy"
  tsStyle: "pill"|"mono"|"ghost"
  hue: number (10–360)
}
showTweaks: boolean
```

Tweaks are persisted to `localStorage` key `"ot-tweaks"`.
Theme is applied as `data-theme` on `<html>`. Font as `data-font`. Density as `data-density`. Timestamp style as `data-ts`.

---

## Design Tokens

### Colors (CSS custom properties, oklch)

| Token | Paper (default) | Dusk (dark) |
|---|---|---|
| `--bg` | `oklch(0.985 0.008 85)` | `oklch(0.24 0.015 260)` |
| `--bg-soft` | `oklch(0.965 0.012 82)` | `oklch(0.28 0.018 260)` |
| `--panel` | `oklch(0.995 0.004 85)` | `oklch(0.30 0.018 258)` |
| `--ink` | `oklch(0.24 0.02 60)` | `oklch(0.94 0.012 80)` |
| `--ink-soft` | `oklch(0.42 0.02 60)` | `oklch(0.78 0.015 80)` |
| `--ink-mute` | `oklch(0.58 0.015 60)` | `oklch(0.64 0.018 80)` |
| `--line` | `oklch(0.90 0.012 80)` | `oklch(0.38 0.02 258)` |
| `--line-soft` | `oklch(0.94 0.01 80)` | `oklch(0.34 0.018 258)` |
| `--accent` | `oklch(0.62 0.14 {hue})` | `oklch(0.78 0.12 {hue})` |
| `--accent-soft` | `oklch(0.94 0.04 {hue})` | `oklch(0.35 0.05 {hue})` |
| `--accent-ink` | `oklch(0.42 0.12 {hue})` | `oklch(0.82 0.14 {hue})` |
| `--mark` | `oklch(0.92 0.10 95)` | `oklch(0.45 0.10 70)` |

Default hue: **35** (warm terracotta). Adjustable via Tweaks slider.

Additional themes (Cream, Sage) defined in `styles.css`.

### Typography

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Body | Geist (or IBM Plex Sans / Source Serif 4) | 15.5px | 400 | `line-height: 1.55` |
| Brand | Geist | 19px | 600 | `letter-spacing: -0.015em` |
| Session date | Geist | 14.5px | 600 | `letter-spacing: -0.005em` |
| Question | Geist | 15px | 400 | `line-height: 1.58`, `text-wrap: pretty` |
| Timestamp | Geist Mono | 12px | 500 | tabular-nums |
| Stat number | Geist Mono | 17px | 500 | tabular-nums |
| Stat label | Geist | 10.5px | 400 | uppercase, `letter-spacing: 0.12em` |
| Filter chip | Geist | 13px | 400 | — |
| Meta row | Geist | 12px | 400 | visible on hover only |

### Spacing & Shape

| Token | Value |
|---|---|
| Card border-radius | `16px` |
| Search border-radius | `14px` |
| Chip border-radius | `999px` |
| Timestamp pill border-radius | `6px` |
| Row padding (comfortable) | `14px 0` |
| Row gap (comfortable) | `18px` |
| Session gap (comfortable) | `28px` |
| Max content width | `920px` |

### Shadows
```css
/* Light */
box-shadow: 0 1px 2px oklch(0.2 0.01 60 / 0.04), 0 8px 24px oklch(0.2 0.01 60 / 0.05);
/* Dark */
box-shadow: 0 1px 2px oklch(0 0 0 / 0.25), 0 8px 24px oklch(0 0 0 / 0.28);
```

---

## Data Shape

```ts
type Question = {
  t: string;        // timestamp, e.g. "07:32"
  q: string;        // question text
  asker: string;    // display name, e.g. "Daniel K."
};

type Session = {
  date: string;     // e.g. "March 11, 2026"
  iso: string;      // e.g. "2026-03-11"
  title: string;    // e.g. "Weekly Chart Review"
  duration: string; // e.g. "58:12"
  questions: Question[];
};
```

In production, `SESSIONS` should be fetched from your API. See `data.js` for mock data structure.

---

## Assets
- No external images or icons used. All icons are inline SVG.
- Fonts loaded from Google Fonts: `Geist`, `Geist Mono`, `IBM Plex Sans`, `IBM Plex Mono`, `Source Serif 4`

---

## Files in This Package

| File | Purpose |
|---|---|
| `OpenTrader Coach.html` | Main HTML entry point — reference this in a browser to see the full design |
| `components.jsx` | All React components (Header, SearchBar, FilterRow, SessionBlock, QuestionRow, PlayerStrip, TweaksPanel, ThemeToggle) |
| `styles.css` | All CSS — tokens, themes, layout, components, responsive |
| `data.js` | Mock session/question data — replace with real API calls |

---

## Responsive Behavior
At `max-width: 640px`:
- Shell padding reduces to `20px 14px`
- Question grid columns narrow to `62px 1fr`
- Session title, duration, and count are hidden from the session header
- Stats gap reduces
