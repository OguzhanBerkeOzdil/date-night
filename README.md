# Date Night 💌

A playful, mobile-first questionnaire for a second date — open it from a QR code, answer a few cute questions, and get a shareable **date ticket** at the end.

Live on GitHub Pages: [https://oguzhanberkeozdil.github.io/date-night/](https://oguzhanberkeozdil.github.io/date-night/)

## Open locally

No build step. From the repo root:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080) (or open `index.html` via any static file server).

## Personalize with `?name=`

Add her name to the URL:

```
https://oguzhanberkeozdil.github.io/date-night/?name=Ayşe
```

If `name` is missing, the copy uses **"you"** instead.

Answers are saved in the browser (`localStorage`) as she goes, so a refresh mid-flow can keep progress on the same device.

## QR code for Oğuzhan

1. Use the production URL (with `?name=…` if you want it baked in):
   - `https://oguzhanberkeozdil.github.io/date-night/?name=HerName`
2. Generate a QR code with any free tool, for example:
   - [https://www.qr-code-generator.com/](https://www.qr-code-generator.com/)
   - Or iOS **Shortcuts** / Android **Google Lens** → create QR from link
3. Show the QR on your phone or print it — she scans and the survey opens in mobile Safari/Chrome.

## Share answers

On the final screen, **Send to Oğuzhan 💌** opens WhatsApp with a prefilled summary (`wa.me`). **Copy summary** is the clipboard fallback. **Replay** clears saved answers and starts over.

## Deploy (GitHub Pages)

Repository → **Settings** → **Pages** → **Deploy from a branch** → branch `main`, folder `/ (root)`.

The `.nojekyll` file is included so GitHub Pages serves the site as-is.

## Art assets

Illustrations live in `assets/images/` as WebP with JPG fallbacks (forest quest background, celebration scene, horse mascot, parchment texture). Replace those files to swap art without changing code.

## Tech

Vanilla HTML, CSS, and JavaScript only — no framework, no backend.
