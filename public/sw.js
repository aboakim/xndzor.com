/* Xndzor PWA service worker — production only (registered from client).
 * Caches a minimal offline shell; never caches auth/API. */

const CACHE = "xndzor-shell-v2";
const PRECACHE = ["/", "/hy", "/manifest.webmanifest?v=2", "/favicon.svg?v=2", "/icons/icon-192.png?v=2"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function shouldBypass(url) {
  const { pathname } = url;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.includes("next-auth")) return true;
  if (pathname.startsWith("/_next/webpack-hmr")) return true;
  if (pathname.startsWith("/_next/static/chunks/webpack")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (shouldBypass(url)) return;

  // Network-first for navigations so content stays fresh.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => undefined);
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match("/hy") || caches.match("/")),
        ),
    );
    return;
  }

  // Cache-first for static icons / manifest / same-origin static assets.
  const isStatic =
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.svg" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/favicon-32.png" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/_next/static/");

  if (!isStatic) return;

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => undefined);
        }
        return res;
      });
    }),
  );
});
