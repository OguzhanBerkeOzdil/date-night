/* Classic service worker — version must match js/cache-version.js (see test/unit/cache-version.test.mjs). */
const APP_CACHE_VERSION = "20261031";

const SHELL_CACHE = `quest-shell-${APP_CACHE_VERSION}`;
const ASSET_CACHE = `quest-assets-${APP_CACHE_VERSION}`;

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./css/v2.css",
  "./css/desktop.css",
  "./js/cache-version.js",
  "./js/main.js",
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
  "./assets/images/wax-seal.webp",
  "./assets/images/bg-title.webp",
  "./assets/images/bg-title.jpg",
  "./assets/images/horse-idle.webp",
  "./assets/images/dragon-doubt.webp",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[quest-sw] install failed", err);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

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
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith("/index.html") || url.pathname.endsWith("/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    url.pathname.includes("/css/") ||
    url.pathname.includes("/js/") ||
    url.pathname.includes("/assets/")
  ) {
    event.respondWith(versionedAsset(request));
    return;
  }
});
