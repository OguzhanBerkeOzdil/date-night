# The Quest of Lady {name} 💌

A mobile-first, medieval-fantasy date quest — 12 screens, horse narrator, dragon boss fight, potion brewing, oracle tarot, and a shareable royal decree (PNG + WhatsApp).

Live: [https://oguzhanberkeozdil.github.io/date-night/](https://oguzhanberkeozdil.github.io/date-night/)

## Run locally

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080). ES modules require a static server (not `file://`).

## Personalize

```
https://oguzhanberkeozdil.github.io/date-night/?name=Ayşe
```

- Shows **Lady Ayşe** (strips a leading `Lady` from the param).
- Without `?name=`, copy uses **my lady** (never “Lady you”).

## Config (`js/config.js`)

```js
fromName: "Oğuzhan",
whatsappNumber: "",  // set to e.g. "905xxxxxxxxx" for direct wa.me link
defaultTitle: "my lady",
letter: [ /* paragraphs */ ],
```

Empty `whatsappNumber` → `https://wa.me/?text=…` (contact picker).

## QR code

Point any QR generator at your URL (optionally with `?name=`).

## Tests

```bash
node tests/v2-flow.spec.mjs
```

Playwright mobile flow (iPhone + Pixel viewports).

## Assets & credits

- Storybook illustrations in `assets/images/` (WebP; cutouts processed with [rembg](https://github.com/danielgatis/rembg)).
- UI icons: simplified gold-line SVGs (style inspired by [Game-icons.net](https://game-icons.net/) CC BY 3.0).
- Ambient music: optional Web Audio lute drone on **New Game** (no external MP3 bundled). Add a Pixabay lute loop to `assets/audio/` and wire in `js/audio.js` if desired ([Pixabay license](https://pixabay.com/service/license-summary/)).
- Fonts: [Google Fonts](https://fonts.google.com/) — Cinzel, Cinzel Decorative, Crimson Pro, Dancing Script (OFL).

## Deploy

GitHub Pages → `main` / root. `.nojekyll` included.

### Cache version (required on every deploy)

Bump **`APP_CACHE_VERSION`** in `js/cache-version.js` (single source of truth). Match that value on every `?v=` query in `index.html` (CSS, `main.js`, manifest). Copy the same string into **`sw.js`** (classic worker — no `import`/`export`; `test/unit/cache-version.test.mjs` enforces parity). Register **`./sw.js`** as a classic script (stable URL, no `?v=` on the worker; use `updateViaCache: 'none'`). Legacy `sw.js?v=…` registrations are unregistered on load. Install precaches those versioned URLs plus the JS module graph into `quest-assets-*`; offline fallback may use `ignoreSearch` only inside that cache. On activate, delete **only** stale `quest-shell-*` / `quest-assets-*` names (not other apps on the same GitHub Pages origin).

## npm tests

```bash
npm ci && npx playwright install chromium && npm test
```
