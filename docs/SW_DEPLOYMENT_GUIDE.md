# Service Worker & Deployment Guide

## How Cache Busting Works

SoundSteps uses a three-layer defense against stale assets after deploys:

### Layer 1: Auto-Versioned Cache Name

`public/sw.js` uses a `__BUILD_VERSION__` placeholder for its cache name:

```js
const CACHE_NAME = 'soundsteps-__BUILD_VERSION__';
```

At build time, the `swVersionPlugin` in `vite.config.js` replaces this with a unique timestamp (e.g., `soundsteps-mltg6ppm`). Every deploy gets a new cache name, which causes the old cache to be deleted on SW activation.

### Layer 2: Network-First for Hashed Assets

JS/CSS bundles under `/assets/` use **network-first** strategy. Since Vite content-hashes filenames (e.g., `Settings-DyC45jFw.js`), a stale cache pointing to old hashes would break the app. Network-first ensures the browser always tries to fetch the latest chunk first, falling back to cache only when offline.

**Do NOT change `/assets/` to cache-first.** This was the root cause of the Session 33 stale-chunk incident.

### Layer 3: Client-Side Update Detection

`src/main.tsx` registers the SW with automatic update handling:

- **60-second polling**: `registration.update()` every minute checks for a new SW
- **`updatefound` listener**: Detects when a new SW starts installing
- **`controllerchange` listener**: Auto-reloads when a new SW takes control
- **Reload guard**: `isReloading` flag prevents infinite reload loops

### Layer 4: Stale Chunk Recovery (Fallback)

If a user somehow loads a stale chunk reference:

- `lazyRetry()` in `App.tsx` catches the import error and reloads once (using `sessionStorage` guard)
- `RouteErrorFallback` in the React Router `errorElement` catches chunk errors and shows a refresh prompt
- `ErrorBoundary` wrapping the entire app catches any remaining chunk errors

## Caching Strategy Summary

| Asset Type | Strategy | Rationale |
|---|---|---|
| `/assets/*.js`, `/assets/*.css` | Network-first | Vite hashes change per deploy; stale = broken |
| Images (`.png`, `.svg`, `.ico`) | Cache-first | Rarely change, safe to serve stale |
| Fonts (`.woff2`) | Cache-first | Never change |
| Audio (`.mp3`, `/audio/`) | Network-only | Too large to cache, always streamed |
| Navigation (HTML) | Network-first | Ensures fresh `index.html` with correct chunk refs |

## Deploy Checklist

1. **Build**: `npm run build` — verify `[sw-version] Stamped sw.js with cache version: soundsteps-xxxxx` appears in output
2. **Push to main** — Vercel auto-deploys
3. **Verify**: Visit production URL, open DevTools > Application > Service Workers
   - New SW should appear as "waiting to activate" or "activated"
   - Cache Storage should show the new `soundsteps-xxxxx` cache name
4. **No manual action needed** — the update detection in main.tsx handles the transition automatically

## Troubleshooting

### User stuck on loading spinner after deploy

This should be prevented by the auto-versioning system. If it happens anyway:

1. **Check SW status**: DevTools > Application > Service Workers — is the old SW still controlling?
2. **Force update**: Click "Update" in the SW panel, then "skipWaiting"
3. **Nuclear option**: Click "Unregister", then hard-refresh (Cmd+Shift+R)
4. **Clear cache**: DevTools > Application > Cache Storage > delete all `soundsteps-*` entries

### Build output doesn't show version stamp

The `swVersionPlugin` only runs during `npm run build`. In dev mode, the `__BUILD_VERSION__` placeholder stays as-is (SW isn't registered in dev anyway).

### Infinite reload loop

The `isReloading` guard in main.tsx prevents this. If it somehow occurs:
1. Open DevTools quickly before the reload
2. Go to Application > Service Workers > Unregister
3. Hard refresh

## Architecture Decision Record

**Date**: 2026-02-19 (Session 33)

**Context**: After a production deploy, the service worker served stale JS chunks from cache. The old chunk filenames no longer existed on the server, causing `TypeError: Failed to fetch dynamically imported module`. Users saw an infinite loading spinner with no way to recover without manually clearing the SW.

**Decision**:
- Changed `/assets/` caching from cache-first to network-first
- Added build-time cache versioning via Vite plugin
- Added client-side SW update detection with auto-reload
- Added multi-layer chunk error recovery (lazyRetry, RouteErrorFallback, ErrorBoundary)

**Consequences**:
- Slightly more network requests for JS/CSS (network-first vs cache-first), but negligible impact since these are one-time loads per session
- Automatic cache invalidation on every deploy — no manual version bumps needed
- Users automatically get fresh assets within 60 seconds of a deploy
