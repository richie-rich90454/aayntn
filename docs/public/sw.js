/*
 * The aayntn service worker.
 *
 * The site is a set of static files, so the whole of it can be cached and
 * read without a network. The cache is versioned: when the deployment
 * changes, the version changes with it, and the old cache is dropped.
 *
 * The worker is deliberately simple. It never intercepts a navigation request
 * with a stale document, because a stale lesson is worse than no lesson, and
 * it never caches a response that reports an error.
 */

const CACHE = "aayntn-v1";
const SHELL = ["/", "/index.html", "/fonts/fonts.css"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
            .catch(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((names) =>
                Promise.all(
                    names.filter((name) => name !== CACHE).map((name) => caches.delete(name)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // A navigation asks for a page: try the network, and fall back to the
    // cached copy only when the network is gone.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(() =>
                    caches.match(request).then((cached) => cached || caches.match("/index.html")),
                ),
        );
        return;
    }

    // Everything else is an asset whose name changes when it changes, so the
    // cache can serve it without ever going stale.
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                if (response.ok && response.type === "basic") {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                }
                return response;
            });
        }),
    );
});
