# AGENTS.md — Daily Score PWA

## Project Overview

Mobile-first PWA for daily life reflection scoring. Vanilla HTML/CSS/JS, no build step, no framework. Data in localStorage, deployed to Cloudflare Workers.

## Tech Stack

- **Language**: Vanilla JavaScript (ES modules OK, no transpilation)
- **Styling**: Plain CSS with CSS variables
- **Storage**: localStorage
- **Hosting**: Cloudflare Workers (static file serving)
- **Build**: None — files served as-is

## How to Work on This Project

### File Conventions

- Single `index.html` — all views rendered by JS, no routing library
- Single `style.css` — use CSS variables for theming, mobile-first media queries
- Single `app.js` — all app logic; organize with clear section comments
- `sw.js` — service worker, keep minimal (cache-first strategy)
- No npm, no node_modules, no package.json

### Aesthetic: Warm Journal

- Cream/parchment background tones
- Serif display font for headings
- Clean sans-serif for body/UI
- Feels like writing in a leather notebook — quiet, reflective, intimate
- No corporate/generic look. No purple gradients. No Inter/Roboto.

### Data Conventions

- localStorage keys prefixed with `ds-` (e.g., `ds-2026-03-09`, `ds-questions`)
- Dates always in `YYYY-MM-DD` format
- Question IDs are kebab-case slugs (e.g., `wellbeing-overall`)
- Questions stored as array in `ds-questions`; answers stored per-date in `ds-YYYY-MM-DD`
- Deleting a question removes it from `ds-questions` but never touches past answer data

### Views

Three views, toggled by JS (no page navigation):
1. **Score View** (default) — date picker + all questions for that day
2. **History View** — weekly averages and trends
3. **Settings View** — manage questions, categories, export/import

### Weekly Questions

- 7 questions have `frequency: "weekly"`
- Shown inline on Sundays (day 0 in JS `getDay()`)
- Hidden on other days behind a "Show weekly questions" toggle
- Weekly answers stored on the date they were answered (not forced to Sunday)

### Service Worker

- Cache-first strategy for all app files
- Cache name includes version string — bump on every deploy
- On activate, delete old caches
- No runtime caching of external resources (there are none)

## Confidence Check (Required Before Implementation)

Before starting any non-trivial task, assess confidence:

1. **Duplicate check**: Search codebase for similar functionality
2. **Architecture check**: Verify approach fits existing patterns (vanilla JS, no deps)
3. **Docs check**: Read MDN for Web APIs, don't assume browser support
4. **Examples check**: Find working code samples if using unfamiliar APIs
5. **Root cause check**: Understand the actual problem

Proceed only at >=90% confidence. Below 70%, stop and ask questions.

## Error Recovery Protocol

1. **STOP** — Don't re-run the same command
2. **Investigate** — Read error message, check browser console, search MDN
3. **Hypothesize** — "Error caused by X because evidence Y"
4. **Design different approach** — Not the same approach again
5. **Document** — Record learning for future prevention

### Anti-patterns
- "Error occurred, trying again..."
- "Retrying with longer timeout..."
- "Warning but it works, ignoring..."

### Correct patterns
- "Error occurred. Checking MDN docs for correct API usage..."
- "Root cause: localStorage quota. Adding size check..."

## Wrap-Up Checklist (REQUIRED per phase)

### 1. Verification
- [ ] App opens without console errors
- [ ] All views render correctly at 375px width
- [ ] No broken layouts on scroll

### 2. "Done Means" Criteria
- [ ] All criteria from the phase in PLAN.md marked complete
- [ ] Evidence shown (screenshot or console output)

### 3. Documentation
- [ ] TESTING.md has steps for new features
- [ ] Code comments explain non-obvious logic

### 4. User Confirmation
- [ ] Walk user through test steps
- [ ] Wait for explicit "confirmed working"
- [ ] Never proceed without sign-off

### 5. Commit
- [ ] Clean diff (no debug code, no console.log)
- [ ] Good commit message

## CRITICAL Patterns

### Service Worker Gotcha
Changing any cached file requires bumping the SW cache version. Otherwise users get stale files forever. Always increment `CACHE_VERSION` in `sw.js` when deploying updates.

### localStorage Limits
Safari in private browsing has ~0 localStorage. The app should gracefully handle `QuotaExceededError` — catch it on write and show a user-friendly message.

### iOS PWA Quirks
- `<meta name="apple-mobile-web-app-capable" content="yes">` required
- `apple-touch-icon` link tag needed (separate from manifest icons)
- iOS doesn't support `beforeinstallprompt` — user must manually "Add to Home Screen"
- Status bar style: `<meta name="apple-mobile-web-app-status-bar-style" content="default">`

### Mobile Touch Targets
All tappable elements must be at least 44x44px (Apple HIG). Score buttons especially.

## Dependencies

None. Zero external dependencies. Everything is vanilla browser APIs:
- `localStorage` for persistence
- `Service Worker` + `Cache API` for offline
- `Blob` + `URL.createObjectURL` for file export
- Native `<input type="date">` for date picking

## When Requirements Are Unclear

- Make the most reasonable assumption and state it explicitly
- Proceed rather than blocking
- Document assumptions in code comments
- Flag: "Assuming X because Y"
