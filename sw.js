/* Service worker for the Training Log PWA. Generated values are filled in by pwa/build_pwa.py. */
const VERSION = "25be16928e6c";
const CACHE = "tl-" + VERSION;
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./vendor/jszip.min.js", "./vendor/xlsx.full.min.js", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512-maskable.png", "./icons/icon-512.png"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k.startsWith("tl-")).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // App shell: any navigation inside the scope serves the cached page (works offline).
  if (req.mode === "navigate") {
    e.respondWith(caches.match("./index.html").then(r => r || fetch(req)));
    return;
  }
  // Own assets: cache first, then network.
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(req, {ignoreSearch: true}).then(r => r || fetch(req)));
    return;
  }
  // Web fonts: cache first, fill the cache from the network when online; silently fall back offline.
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(CACHE + "-fonts").then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }
      catch (err) { return new Response("", {status: 503}); }
    }));
  }
});
