const loaded = new Set();

/** Pick the same WebP background URL the <picture> element would use. */
export function pickBgWebpUrl(name) {
  const landscape = window.matchMedia("(min-aspect-ratio: 1/1)").matches;
  const dpr = window.devicePixelRatio || 1;
  const cssW = window.innerWidth * dpr;
  if (landscape) {
    return cssW >= 2400
      ? `assets/images/${name}-landscape-2560.webp`
      : `assets/images/${name}-landscape.webp`;
  }
  return cssW >= 1320 ? `assets/images/${name}-1440.webp` : `assets/images/${name}.webp`;
}

export function preloadUrl(url) {
  if (!url || loaded.has(url)) return;
  loaded.add(url);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

export function hydrateLazyImages(root = document) {
  root.querySelectorAll("img[data-lazy-src]").forEach((img) => {
    const url = img.getAttribute("data-lazy-src");
    if (!url || img.getAttribute("src")) return;
    img.src = url;
    img.removeAttribute("data-lazy-src");
  });
}

const TAROT_URLS = [
  "assets/images/tarot-back.webp",
  "assets/images/tarot-steeds.webp",
  "assets/images/tarot-golden-hour.webp",
  "assets/images/tarot-hearth.webp",
];

export function preloadTarotAssets() {
  TAROT_URLS.forEach(preloadUrl);
}

export function ensureQuestMapImage() {
  const img = document.querySelector("#mapOverlay img[data-lazy-src], #mapOverlay img");
  if (!img) return;
  const url = img.getAttribute("data-lazy-src");
  if (url && !img.getAttribute("src")) {
    img.src = url;
    img.removeAttribute("data-lazy-src");
  }
}
