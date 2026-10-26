const CACHE_VERSION = "20261026";
const SHELL_CACHE = `quest-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `quest-assets-${CACHE_VERSION}`;

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./css/v2.css",
  "./css/desktop.css",
  "./js/main.js",
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
      .catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("quest-") && k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, res.clone());
    return res;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("./index.html");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(ASSET_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch (_) {
    return cached;
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
    event.respondWith(cacheFirst(request));
    return;
  }
});
