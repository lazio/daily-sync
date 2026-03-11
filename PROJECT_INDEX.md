# Project Index

**Last updated**: 2026-03-09

## Overview

Mobile-first PWA for daily life scoring — 28 reflection questions across 10 categories, user-configurable, with history trends and CSV/JSON export. Vanilla HTML/CSS/JS, no build step.

## Tech Stack

- **Language**: Vanilla JavaScript
- **Styling**: Plain CSS
- **Storage**: localStorage
- **Hosting**: Cloudflare Workers
- **Testing**: Manual (mobile Safari + Chrome)
- **Build**: None

## Directory Structure (planned)

```
daily-score/
├── index.html              # Single page app shell (all 3 views)
├── style.css               # All styles, CSS variables, mobile-first
├── app.js                  # All app logic, data layer, rendering
├── sw.js                   # Service worker (cache-first)
├── manifest.json           # PWA manifest
├── icon-192.png            # App icon 192x192
├── icon-512.png            # App icon 512x512
├── wrangler.toml           # Cloudflare config (Phase 5)
├── worker.js               # CF Worker (Phase 5, if not using Pages)
├── AGENTS.md               # Development guidelines
├── SPEC.md                 # Technical specification
├── PLAN.md                 # Implementation phases
├── PROJECT_INDEX.md        # This file
└── 3._Good_Life_Tracker_Full.xlsx  # Original spreadsheet (reference only)
```

## Entry Points

- `index.html` — App shell, loads `style.css` and `app.js`
- `sw.js` — Service worker, registered from `index.html`

## Key Data

| localStorage Key | Content |
|------------------|---------|
| `ds-questions` | Array of question objects (user-configurable) |
| `ds-YYYY-MM-DD` | Answers for a specific date |

## Commands

- `python3 -m http.server 8000` — Local dev server
- `npx wrangler deploy` — Deploy to Cloudflare (Phase 5)
