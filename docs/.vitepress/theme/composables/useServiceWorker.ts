/**
 * Register the service worker.
 *
 * The worker gives the encyclopedia an offline copy. It is registered after
 * the page has loaded, so that it never competes with the first paint, and
 * only in a production build, so that a development session is never served
 * from a stale cache.
 */
export function registerServiceWorker(): void {
    if (typeof window === "undefined") return;
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register(`${import.meta.env.BASE_URL}sw.js`, {
                // The worker answers for the whole site, wherever it is
                // published, so its reach is the base rather than its own
                // directory.
                scope: import.meta.env.BASE_URL,
            })
            .catch(() => {
                // A reader whose browser refuses the worker simply reads online.
            });
    });
}
