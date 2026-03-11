# Technical Specification: Daily Score PWA

**Created**: 2026-03-09
**Status**: Draft

## Overview

A mobile-first PWA that replaces the "Good Life Tracker" Excel spreadsheet. Users answer 28 reflection questions daily, scoring 1-5 or entering hours. Data lives in localStorage with CSV export. Works offline, installable on phone.

## Goals

- Replace spreadsheet with a phone-friendly daily ritual
- Work offline after first load
- Persist data locally with ability to export
- Show trends over time

## Non-Goals

- Cloud sync or multi-device support
- User accounts or authentication
- Push notification reminders
- Importing existing spreadsheet data

## Architecture

### High-Level

```
┌─────────────────────────────┐
│       index.html            │
│  ┌───────────┐ ┌──────────┐│
│  │ Score View│ │History   ││
│  │ (default) │ │View      ││
│  └───────────┘ └──────────┘│
│         ↕                   │
│       app.js                │
│    ┌──────────┐             │
│    │localStorage│           │
│    └──────────┘             │
└─────────────────────────────┘
        ↕
     sw.js (offline cache)
```

Single HTML file, one CSS file, one JS file. No build step. Service worker caches everything for offline use.

### Components

| Component | Responsibility |
|-----------|---------------|
| Score View | Render questions for selected date, accept input |
| History View | Show last 4 weeks of daily/category averages |
| Settings View | Add, edit, reorder, delete questions and categories |
| Date Navigator | Select date, defaults to today |
| Data Layer | Read/write localStorage, export to CSV |
| Service Worker | Cache app shell, enable offline |

## Data Model

### Question Definition (user-configurable, stored in localStorage)

```js
{
  id: "wellbeing-overall",        // unique key, auto-generated
  category: "Overall wellbeing",  // group label
  question: "What was my overall wellbeing?",
  frequency: "daily",             // "daily" | "weekly"
  scale: "1-5",                   // "1-5" | "hours"
  order: 0                        // sort position within category
}
```

Questions stored in localStorage key `ds-questions`. On first launch, populated with the 28 default questions. User can add, edit, reorder, and delete questions via Settings. Deleting a question removes it from the active list but past answers (keyed by question ID) remain in storage.

### Stored Answer (localStorage)

Key format: `ds-YYYY-MM-DD`

```json
{
  "date": "2026-03-09",
  "answers": {
    "wellbeing-overall": 4,
    "wellbeing-person": 3,
    "faith-spiritual": 5,
    "physical-sleep-hours": 7.5,
    "work-hours": 8
  },
  "updatedAt": "2026-03-09T22:15:00Z"
}
```

### Full Question List

| ID | Category | Question | Frequency | Scale |
|----|----------|----------|-----------|-------|
| wellbeing-overall | Overall wellbeing & actions | What was my overall wellbeing? | daily | 1-5 |
| wellbeing-person | Overall wellbeing & actions | Was I the person I want to be? | daily | 1-5 |
| faith-spiritual | Faith | Did I engage in spiritual practices? | daily | 1-5 |
| rel-partner | Relationships & community | Did I love my partner well? | daily | 1-5 |
| rel-family | Relationships & community | Did I love my family well? | weekly | 1-5 |
| rel-friends | Relationships & community | Did I love my friends well? | daily | 1-5 |
| rel-community | Relationships & community | Did I contribute to society / the community? | weekly | 1-5 |
| mental-routine | Mental health | Did I do my morning routine? | daily | 1-5 |
| mental-stress | Mental health | How did I handle stress? | daily | 1-5 |
| mental-time | Mental health | Did I spend 5+ minutes on mental health? | daily | 1-5 |
| physical-feel | Physical health | How did I feel physically? | daily | 1-5 |
| physical-sleep-hours | Physical health | How many hours of sleep did I get? | daily | hours |
| physical-sleep-quality | Physical health | What was the quality of my sleep? | daily | 1-5 |
| physical-eat | Physical health | Did I eat healthy? | daily | 1-5 |
| physical-workout | Physical health | Did I work out? | daily | 1-5 |
| work-enjoy | Work | Did I enjoy work? | daily | 1-5 |
| work-hours | Work | How many hours did I work? | daily | hours |
| work-financial | Work | Was I wise financially? | weekly | 1-5 |
| purpose-meaning | Purpose & engagement | Did I experience meaning? | daily | 1-5 |
| purpose-positive | Purpose & engagement | Did I experience positive emotions? | daily | 1-5 |
| purpose-engaged | Purpose & engagement | Did I feel engaged by what I was doing? | daily | 1-5 |
| achieve-sense | Achievement & growth | Did I have a sense of achievement? | daily | 1-5 |
| achieve-learn | Achievement & growth | Was my mind stimulated / did I learn? | weekly | 1-5 |
| achieve-goals | Achievement & growth | Did I achieve my daily goals? | daily | 1-5 |
| character-virtues | Character & virtue | Did I practice the virtues I am working on? | daily | 1-5 |
| character-service | Character & virtue | Was I of service or generous to others? | weekly | 1-5 |
| character-habits | Character & virtue | Did I practice the habits I am building? | daily | 1-5 |
| entertain-healthy | Entertainment | Was my engagement in hobbies & entertainment healthy? | weekly | 1-5 |

## UI Design

### Score View (default)

```
┌──────────────────────────┐
│  ◀  Sun, Mar 9, 2026  ▶  │
│                          │
│ ○ Score  ○ History  ⚙   │
│                          │
│ OVERALL WELLBEING        │
│                          │
│ What was my overall      │
│ wellbeing?               │
│ ① ② ③ ④ ⑤              │
│                          │
│ Was I the person I want  │
│ to be?                   │
│ ① ② ③ ④ ⑤              │
│                          │
│ ─────────────────────    │
│ FAITH                    │
│                          │
│ Did I engage in          │
│ spiritual practices?     │
│ ① ② ③ ④ ⑤              │
│                          │
│ ─────────────────────    │
│ ... more categories ...  │
│                          │
│ [Show weekly questions]  │
│                          │
│         [Export CSV]     │
└──────────────────────────┘
```

- Date navigation: left/right arrows, tapping date opens native date picker
- Score buttons: circular, tappable, selected state is filled
- Hours input: simple number field with stepper (0.5 increments for sleep, 1 for work)
- Weekly questions hidden on non-Sundays, toggle to reveal
- Categories separated by thin divider + label

### History View

```
┌──────────────────────────┐
│  ◀  Week of Mar 3  ▶     │
│                          │
│ ○ Score    ● History     │
│                          │
│ DAILY AVERAGE            │
│ M  T  W  Th F  Sa Su    │
│ 3.8 4.1 -- -- -- -- --  │
│ ▓▓ ▓▓▓                  │
│                          │
│ BY CATEGORY              │
│ Overall wellbeing   4.0  │
│ ████████████░░░░░░       │
│ Faith               3.5  │
│ ██████████░░░░░░░░       │
│ Relationships       4.2  │
│ █████████████░░░░░       │
│ Mental health       3.0  │
│ ████████░░░░░░░░░░       │
│ ...                      │
└──────────────────────────┘
```

- Weekly view with day-by-day dots/bars
- Category averages as horizontal bars
- Navigate between weeks

### Settings View

```
┌──────────────────────────┐
│  ← Settings              │
│                          │
│ OVERALL WELLBEING        │
│ ┌──────────────────────┐ │
│ │ ≡ What was my        │ │
│ │   overall wellbeing? │ │
│ │   Daily · 1-5   [✎]  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ ≡ Was I the person   │ │
│ │   I want to be?      │ │
│ │   Daily · 1-5   [✎]  │ │
│ └──────────────────────┘ │
│ [+ Add question]         │
│                          │
│ ─────────────────────    │
│ FAITH                    │
│ ...                      │
│                          │
│ [+ Add category]         │
│                          │
│ ─────────────────────    │
│ DATA                     │
│ [Export CSV]             │
│ [Export JSON backup]     │
│ [Import JSON backup]    │
└──────────────────────────┘
```

- Gear icon in nav opens Settings
- Each question: drag handle (≡) for reorder, edit button (✎) to modify
- Edit opens inline form: question text, frequency (daily/weekly), scale (1-5/hours)
- Swipe left or delete button to remove a question (with confirmation)
- "Add question" at bottom of each category
- "Add category" at bottom of the list
- Categories can be renamed or deleted (moves questions to uncategorized or deletes them)
- Export/Import in the settings footer

### Edit Question Form

```
┌──────────────────────────┐
│ Question text:           │
│ ┌──────────────────────┐ │
│ │ What was my overall  │ │
│ │ wellbeing?           │ │
│ └──────────────────────┘ │
│                          │
│ Category:                │
│ [Overall wellbeing    ▼] │
│                          │
│ Frequency:               │
│ ● Daily  ○ Weekly        │
│                          │
│ Scale:                   │
│ ● 1-5    ○ Hours         │
│                          │
│ [Delete]     [Save]      │
└──────────────────────────┘
```

## Export Feature

### CSV Export

Button in Score View footer. Generates a CSV file with:

```csv
Date,Category,Question,Value
2026-03-09,Overall wellbeing,What was my overall wellbeing?,4
2026-03-09,Overall wellbeing,Was I the person I want to be?,3
...
```

Export options:
- **Current week** (default)
- **All data**

Uses `Blob` + `URL.createObjectURL` + `<a download>` pattern. Works on mobile Safari and Chrome — triggers the native share/save sheet.

### JSON Backup

Secondary option: export all localStorage data as a single JSON file for backup/restore.

## Weekly Questions Logic

- 7 questions are marked `frequency: "weekly"`
- On Sundays (day 0): shown inline with daily questions
- On other days: hidden behind a "Show weekly questions" toggle
- Weekly answers stored with the Sunday date

## Performance

- Total app size: ~30KB (HTML + CSS + JS)
- localStorage read/write: <1ms
- No network requests after first cache
- 28 questions render in single paint

## Security

- No sensitive data transmitted — everything stays on device
- No external scripts or CDN dependencies
- CSP headers recommended if served from a host

## Testing Strategy

- Manual testing on iPhone Safari + Android Chrome
- Test offline mode: load once, enable airplane mode, reload
- Test data persistence: score, close browser, reopen
- Test export: download CSV, open in Excel/Numbers
- Test date navigation: score multiple days, verify isolation

## Deployment

Cloudflare Workers serving static files. Simple worker that serves the HTML/CSS/JS/manifest/icons. No server-side logic needed.

## Aesthetic Direction

Warm Journal — cream/parchment tones, serif display font, feels like a personal leather notebook. Quiet, reflective, intimate.

## Open Questions

- [ ] None remaining
