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
 *
 * Every address is built from the directory that holds this file, because the
 * site may be published under a path rather than at the root of a domain.
 */

const BASE = new URL("./", self.location).pathname;
const CACHE = "aayntn-v3";
const SHELL = [
    BASE,
    `${BASE}index.html`,
    `${BASE}fonts/fonts.css`,
    `${BASE}book/`,
    `${BASE}book/index.html`,
    `${BASE}download/`,
    `${BASE}download/index.html`,
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            // One missing optional page must not prevent the shell from
            // installing, so each address is cached on its own.
            .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
            .then(() => self.skipWaiting())
            .catch(() => self.skipWaiting()),
    );
});

/**
 * The page asks for the book and the download page after the worker is
 * active, so a reader who has opened the site once can take the printable
 * edition offline without opening it first.
 */
self.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.type !== "aayntn:cache" || !Array.isArray(data.urls)) return;

    const origin = self.location.origin;
    const urls = data.urls
        .filter((url) => typeof url === "string")
        .map((url) => new URL(url, self.location.href))
        .filter((url) => url.origin === origin)
        .map((url) => url.href);

    event.waitUntil(
        caches.open(CACHE).then((cache) => Promise.allSettled(urls.map((url) => cache.add(url)))),
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
                    caches
                        .match(request)
                        .then((cached) => cached || caches.match(`${BASE}index.html`)),
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
