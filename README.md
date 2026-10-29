# Two-Day Date Quest

A mobile-first, medieval-fantasy invitation that unfolds in two short chapters. Chapter I gathers low-pressure preferences and creates an Adventurer's Pass. Chapter II opens on the scheduled day for a one-minute start and an optional two-minute closing reflection.

Live: [https://oguzhanberkeozdil.github.io/date-night/](https://oguzhanberkeozdil.github.io/date-night/)

## Run locally

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080). ES modules require a static server (not `file://`).

## Private invite

Production links use a high-entropy `?invite=` token created outside the browser. The raw token is never committed. Progress remains available locally and, when the private sync endpoint is configured, continues on another device.

Create an invite from a trusted local shell after setting `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`:

```bash
npm run invite:create -- --name "My Lady" --date 2026-10-28
```

Only the generated private URL should be shared. Do not put a service-role key, invite token, or guest answers in source control.

## Config (`js/config.js`)

```js
fromName: "Oğuzhan",
whatsappNumber: "",  // set to e.g. "905xxxxxxxxx" for direct wa.me link
defaultTitle: "my lady",
letter: [ /* paragraphs */ ],
```

Empty `whatsappNumber` → `https://wa.me/?text=…` (contact picker).

## Private sync architecture

- `quest_invites` stores only a SHA-256 digest of the invite token.
- `quest_progress` stores the current versioned response for that invite.
- Public table access is revoked and RLS is enabled.
- The browser talks only to the `quest-state` Edge Function; the service-role key stays server-side.
- The browser keeps an offline local copy and retries when the connection returns.
- No analytics, location, photo, or device fingerprint is collected by the app.

Apply `supabase/migrations/20261027130017_create_quest_invites.sql`, deploy `supabase/functions/quest-state`, then set `questApiUrl` in `js/runtime-config.js` to the deployed function URL.

## Assets & credits

- Storybook illustrations in `assets/images/` (WebP; cutouts processed with [rembg](https://github.com/danielgatis/rembg)).
- UI icons: simplified gold-line SVGs (style inspired by [Game-icons.net](https://game-icons.net/) CC BY 3.0).
- Ambient music: optional Web Audio lute drone on **New Game** (no external MP3 bundled). Add a Pixabay lute loop to `assets/audio/` and wire in `js/audio.js` if desired ([Pixabay license](https://pixabay.com/service/license-summary/)).
- Fonts: [Google Fonts](https://fonts.google.com/) — Cinzel, Cinzel Decorative, Crimson Pro, Dancing Script (OFL).

## Deploy

GitHub Pages → `main` / root. `.nojekyll` included.

### Cache version (required on every deploy)

Bump **`APP_CACHE_VERSION`** in `js/cache-version.js` (single source of truth). Match that value on every `?v=` query in `index.html` (CSS, `main.js`, manifest) and on every relative JavaScript module import. Copy the same string into **`sw.js`** (classic worker — no `import`/`export`; `test/unit/cache-version.test.mjs` enforces parity across all three surfaces). Register **`./sw.js`** as a classic script (stable URL, no `?v=` on the worker; use `updateViaCache: 'none'`). Legacy `sw.js?v=…` registrations are unregistered on load. Install precaches those versioned URLs plus the JS module graph into `quest-assets-*`; offline fallback may use `ignoreSearch` only inside that cache. On activate, delete **only** stale `quest-shell-*` / `quest-assets-*` names (not other apps on the same GitHub Pages origin).

## Quality checks

```bash
npm ci && npx playwright install chromium && npm test
```

The suite covers 320, 360, 390, and 1440 px layouts, keyboard navigation, accessible naming, Chapter I accept/maybe/decline paths, Chapter II locking/early open/completion, private-state restoration, offline persistence, and service-worker upgrades.
