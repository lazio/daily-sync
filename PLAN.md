# Implementation Plan: Daily Score PWA

**Created**: 2026-03-09
**Status**: Draft

## Overview

Mobile-first PWA for daily life reflection — replacing the Excel spreadsheet with a phone-friendly app that works offline. 28 default questions across 10 categories (user-configurable), scored daily (1-5 scale or hours), with weekly-only questions shown on Sundays. Deployed to Cloudflare Workers.

## Scope

### In Scope
- 28 default questions, grouped by 10 categories
- User-configurable questions via Settings (add, edit, reorder, delete)
- Date navigation (today by default, swipe/tap to change)
- 1-5 tappable score buttons + numeric input for hours
- Weekly questions visible on Sundays (with manual toggle)
- localStorage persistence keyed by date
- History view with weekly averages per category
- CSV and JSON export/import
- Offline support via service worker
- PWA installable (manifest.json)
- Deploy to Cloudflare Workers

### Out of Scope
- Cloud sync / multi-device
- Push notification reminders
- User accounts / auth

### Assumptions
| Assumption | Rationale | Impact if Wrong |
|------------|-----------|-----------------|
| Cloudflare Workers for HTTPS hosting | PWA needs HTTPS | Service worker won't register |
| Phone screen ~375px+ wide | Modern smartphones | Layout may need adjustment |
| localStorage sufficient | Single user, ~1KB/day | ~365KB/year, well within limits |

## Approach

**Vanilla HTML/CSS/JS** — no framework. Reasons:
- Zero build step, deploy static files via Cloudflare Workers
- Smallest possible bundle for offline caching
- No dependency management
- Perfectly sufficient for this scope

## File Structure

```
daily-score/
├── index.html          # Single page app shell
├── style.css           # All styles
├── app.js              # App logic, data, rendering
├── sw.js               # Service worker for offline
├── manifest.json       # PWA manifest
├── icon-192.png        # App icon
├── icon-512.png        # App icon
├── wrangler.toml       # Cloudflare Workers config
└── worker.js           # CF Worker to serve static files
```

## Phases

### Phase 0: App Shell & Styling

**Goal**: Render all questions for today's date with the full Warm Journal visual design. Questions loaded from JS defaults (will become configurable in Phase 3).

**Files**:
- Create: `index.html`, `style.css`, `manifest.json`

**Done Means**:
- [ ] Opening index.html shows today's date and all 28 questions grouped by category
- [ ] 1-5 score buttons rendered for scale questions
- [ ] Numeric input rendered for hours questions
- [ ] Weekly questions only visible if today is Sunday
- [ ] Looks good on a 375px wide viewport (mobile)
- [ ] Warm Journal aesthetic: cream/parchment, serif display font, leather notebook feel

**Test It**:
1. Open in browser, resize to mobile width
2. Verify all categories and questions visible

---

### Phase 1: Interactivity & Data Persistence

**Goal**: Tapping scores saves to localStorage. Navigating dates loads saved data. Export works.

**Depends on**: Phase 0

**Files**:
- Create: `app.js`
- Modify: `index.html` (add script tag)

**Done Means**:
- [ ] Tapping a 1-5 button highlights it and saves to localStorage
- [ ] Entering hours saves on blur/change
- [ ] Date picker works — changing date loads that day's saved answers
- [ ] Navigating back to today shows previously saved scores
- [ ] "Show weekly questions" toggle works on non-Sunday days
- [ ] localStorage key format: `ds-YYYY-MM-DD`
- [ ] CSV export downloads file (works on mobile)
- [ ] JSON export/import for full backup

**Test It**:
1. Score a few questions, refresh page — scores persist
2. Change date, score something, go back to today — both days saved
3. Export CSV, open in spreadsheet app

---

### Phase 2: History & Trends View

**Goal**: See weekly averages and recent history at a glance.

**Depends on**: Phase 1

**Files**:
- Modify: `app.js`, `style.css`, `index.html`

**Done Means**:
- [ ] Toggle between "Score" and "History" views
- [ ] History shows last 7 days with daily average score
- [ ] Per-category weekly average displayed
- [ ] Visual indicator (color/bar) for score levels
- [ ] Empty days shown as blank, not zero

**Test It**:
1. Fill in several days of data
2. Switch to history view
3. Verify averages are correct

---

### Phase 3: Settings — Configurable Questions

**Goal**: User can customize questions, categories, frequency, and scale from within the app.

**Depends on**: Phase 1 (can parallel with Phase 2)

**Files**:
- Modify: `app.js`, `style.css`, `index.html`

**Done Means**:
- [ ] Settings view accessible via gear icon
- [ ] List all questions grouped by category
- [ ] Add new question (text, category, frequency, scale)
- [ ] Edit existing question
- [ ] Delete question (with confirmation) — past data preserved
- [ ] Reorder questions within a category (drag or up/down buttons)
- [ ] Add and rename categories
- [ ] Questions stored in `ds-questions` localStorage key

**Test It**:
1. Add a new question, go back to Score view — it appears
2. Delete a question, check past days — old answers still there
3. Reorder questions, verify new order persists

---

### Phase 4: PWA & Offline

**Goal**: Installable on phone, works without internet.

**Depends on**: Phases 2 and 3

**Files**:
- Create: `sw.js`, `icon-192.png`, `icon-512.png`
- Modify: `index.html` (register service worker)

**Done Means**:
- [ ] Service worker caches all app files
- [ ] App works in airplane mode after first load
- [ ] "Add to Home Screen" prompt available on mobile
- [ ] App icons display correctly
- [ ] manifest.json configured with Warm Journal theme colors

**Test It**:
1. Serve locally, open on phone, add to home screen
2. Turn off wifi, open app — works fully
3. Score something offline, verify it persists

---

### Phase 5: Deploy to Cloudflare Workers

**Goal**: App live on the internet with HTTPS.

**Depends on**: Phase 4

**Files**:
- Create: `wrangler.toml`, `worker.js`

**Done Means**:
- [ ] `wrangler deploy` succeeds
- [ ] App accessible at Cloudflare URL
- [ ] Service worker registers (HTTPS required)
- [ ] Installable as PWA from the live URL

**Test It**:
1. Deploy, open URL on phone
2. Install PWA, test offline

---

## Dependency Graph

```
Phase 0 (Shell & Style)
    ↓
Phase 1 (Interactivity & Data)
    ↓         ↓
Phase 2    Phase 3
(History)  (Settings)
    ↓         ↓
Phase 4 (PWA & Offline)
    ↓
Phase 5 (Cloudflare Deploy)
```

Phases 2 and 3 can run in parallel after Phase 1.

## Risk Summary

**Overall Risk**: Low

All phases use well-understood web APIs. No external dependencies. Main risk is getting the mobile UX right — mitigated by testing on actual phone after Phase 0.
