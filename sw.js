/* Classic service worker — version must match js/cache-version.js (see test/unit/cache-version.test.mjs). */
const APP_CACHE_VERSION = "20261104";

const SHELL_CACHE = `quest-shell-${APP_CACHE_VERSION}`;
const ASSET_CACHE = `quest-assets-${APP_CACHE_VERSION}`;

const V = APP_CACHE_VERSION;

const SHELL_URLS = ["./", "./index.html", "./today/index.html"];

/** URLs as requested by index.html (must include ?v=). */
const VERSIONED_PRECACHE = [
  `./manifest.webmanifest?v=${V}`,
  `./css/fonts.css?v=${V}`,
  `./css/styles.css?v=${V}`,
  `./css/v2.css?v=${V}`,
  `./css/desktop.css?v=${V}`,
  `./js/main.js?v=${V}`,
  `./css/today.css?v=${V}`,
  `./today/index.html`,
];

/** Module graph and static assets (no ?v= on bare module URLs). */
const ASSET_PRECACHE = [
  "./js/cache-version.js",
  "./js/app-chrome.js",
  "./js/config.js",
  "./js/copy-data.js",
  "./js/state.js",
  "./js/screens.js",
  "./js/ui-feedback.js",
  "./js/dragon-guards.js",
  "./js/hud.js",
  "./js/audio.js",
  "./js/achievements.js",
  "./js/bard.js",
  "./js/decree.js",
  "./js/dialogue.js",
  "./js/epigraph.js",
  "./js/icons.js",
  "./js/image-utils.js",
  "./js/particles.js",
  "./js/app-config.js",
  "./js/feedback.js",
  "./js/horses.js",
  "./js/certificate.js",
  "./js/today/main.js",
  "./js/today/copy.js",
  "./js/today/pass.js",
  "./assets/images/wax-seal.webp",
  "./assets/images/bg-title.webp",
  "./assets/images/bg-title.jpg",
  "./assets/images/horse-idle.webp",
  "./assets/images/dragon-doubt.webp",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/fonts/cinzel-decorative-latin-700-normal.woff2",
  "./assets/fonts/cinzel-decorative-latin-ext-700-normal.woff2",
  "./assets/fonts/cinzel-latin-500-normal.woff2",
  "./assets/fonts/cinzel-latin-600-normal.woff2",
  "./assets/fonts/cinzel-latin-700-normal.woff2",
  "./assets/fonts/cinzel-latin-ext-500-normal.woff2",
  "./assets/fonts/cinzel-latin-ext-600-normal.woff2",
  "./assets/fonts/cinzel-latin-ext-700-normal.woff2",
  "./assets/fonts/crimson-pro-latin-400-italic.woff2",
  "./assets/fonts/crimson-pro-latin-400-normal.woff2",
  "./assets/fonts/crimson-pro-latin-500-normal.woff2",
  "./assets/fonts/crimson-pro-latin-600-normal.woff2",
  "./assets/fonts/crimson-pro-latin-ext-400-italic.woff2",
  "./assets/fonts/crimson-pro-latin-ext-400-normal.woff2",
  "./assets/fonts/crimson-pro-latin-ext-500-normal.woff2",
  "./assets/fonts/crimson-pro-latin-ext-600-normal.woff2",
  "./assets/fonts/dancing-script-latin-500-normal.woff2",
  "./assets/fonts/dancing-script-latin-600-normal.woff2",
  "./assets/fonts/dancing-script-latin-ext-500-normal.woff2",
  "./assets/fonts/dancing-script-latin-ext-600-normal.woff2",
];

function isQuestCacheName(name) {
  return name.startsWith("quest-shell-") || name.startsWith("quest-assets-");
}

function reloadRequest(url) {
  return new Request(url, { cache: "reload" });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS.map(reloadRequest))),
      caches
        .open(ASSET_CACHE)
        .then((cache) =>
          cache.addAll([...VERSIONED_PRECACHE, ...ASSET_PRECACHE].map(reloadRequest))
        ),
    ])
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[quest-sw] install failed", err);
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) => isQuestCacheName(k) && k !== SHELL_CACHE && k !== ASSET_CACHE
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function matchInAssetCache(request) {
  const cache = await caches.open(ASSET_CACHE);
  const exact = await cache.match(request);
  if (exact) return exact;
  return cache.match(request, { ignoreSearch: true });
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const index = await caches.match("./index.html");
    if (index) return index;
    throw err;
  }
}

async function versionedAsset(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(ASSET_CACHE);
      await cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await matchInAssetCache(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/") ||
    url.pathname.includes("/today/")
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    url.pathname.includes("/css/") ||
    url.pathname.includes("/js/") ||
    url.pathname.includes("/assets/") ||
    url.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(versionedAsset(request));
    return;
  }
});
