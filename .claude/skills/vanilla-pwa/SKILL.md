---
name: vanilla-pwa
description: Vanilla HTML/CSS/JS PWA patterns — service workers, localStorage, offline caching, manifest.json, mobile-first CSS. Trigger on PWA, service worker, offline, caching, manifest, localStorage topics.
---

# Vanilla PWA Development

## Service Worker Pattern (Cache-First)

```js
const CACHE_NAME = 'daily-score-v1';
const ASSETS = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

- Always bump `CACHE_NAME` version when deploying changes
- List ALL files in ASSETS array
- Delete old caches on activate

## localStorage Patterns

```js
// Save with error handling
function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      // Show user-friendly message
    }
  }
}

// Load with fallback
function load(key, fallback = null) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}
```

## File Export (Mobile-Compatible)

```js
function downloadFile(content, filename, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

Works on mobile Safari and Chrome — triggers native share/save sheet.

## PWA Manifest Essentials

```json
{
  "name": "App Name",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F5F0EB",
  "theme_color": "#3D3229",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## iOS PWA Required Meta Tags

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="App Name">
<link rel="apple-touch-icon" href="icon-192.png">
```

## Mobile-First CSS Pattern

```css
/* Base: mobile (375px+) */
.container { padding: 16px; }

/* Tablet+ */
@media (min-width: 768px) {
  .container { max-width: 480px; margin: 0 auto; }
}
```

- Touch targets: minimum 44x44px
- Use `viewport` meta tag: `width=device-width, initial-scale=1`
- Use `-webkit-tap-highlight-color: transparent` for custom tap states
- Use `touch-action: manipulation` to disable double-tap zoom on buttons

## Cloudflare Workers Static Serving

Use Cloudflare Pages (simpler) or Workers with `@cloudflare/kv-asset-handler` for static sites. Pages is preferred — just point at the directory, no worker code needed.
