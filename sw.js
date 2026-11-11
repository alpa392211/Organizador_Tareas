/**
 * sw.js - Service Worker for Organizador_Tareas v1.4.3
 * Offline caching, instant reload updates, and resilient network-first navigation.
 */

const CACHE_NAME = 'organizador-tareas-cache-v1.4.3';

const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './manifest.json',
    './favicon.ico',
    // CSS stylesheets
    './css/tailwind.min.css?v=1.4.3',
    './css/styles.css?v=1.4.3',
    // JavaScript application modules
    './js/institutions.js?v=1.4.3',
    './js/storage.js?v=1.4.3',
    './js/haptics.js?v=1.4.3',
    './js/notifications.js?v=1.4.3',
    './js/widgets.js?v=1.4.3',
    './js/subjects.js?v=1.4.3',
    './js/tasks.js?v=1.4.3',
    './js/notes.js?v=1.4.3',
    './js/calendar.js?v=1.4.3',
    './js/archive.js?v=1.4.3',
    './js/app.js?v=1.4.3',
    // PWA Icons
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-512x512.png',
    './assets/icons/icon-maskable-192x192.png',
    './assets/icons/icon-maskable-512x512.png',
    './assets/icons/apple-touch-icon.png',
    './assets/icons/favicon-32x32.png',
    './assets/icons/favicon-16x16.png',
    './assets/icons/favicon.ico',
    // Core school identity badges
    './assets/general.svg',
    './assets/unam.svg',
    './assets/ipn.svg',
    './assets/uam.svg',
    './assets/cch.png',
    './assets/cecyt.svg',
    './assets/enp.svg',
    './assets/colbach.svg'
];

// Install Event: Precaches core assets using Promise.allSettled for maximum fault tolerance
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            const results = await Promise.allSettled(
                PRECACHE_ASSETS.map(url =>
                    cache.add(url).catch(err => {
                        console.warn(`[SW] Precache item skipped: ${url} (${err.message})`);
                    })
                )
            );
            console.log(`[SW v1.4.3] Precaching complete. Processed ${results.length} assets.`);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event: Purges stale caches from previous versions
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        console.log(`[SW v1.4.3] Purging deprecated cache: ${name}`);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Intelligent routing strategy
self.addEventListener('fetch', event => {
    const request = event.request;

    // Only process GET requests
    if (request.method !== 'GET') return;

    // Strategy 1: HTML Navigation requests -> Network-First with instant Cache Fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    console.log('[SW v1.4.3] Navigation offline. Serving cached index.html fallback.');
                    const cachedNav = await caches.match(request);
                    if (cachedNav) return cachedNav;
                    return caches.match('./index.html') || caches.match('index.html');
                })
        );
        return;
    }

    // Strategy 2: Local Static Assets -> Cache-First with Network Fallback
    const requestUrl = new URL(request.url);
    if (requestUrl.origin === self.location.origin) {
        event.respondWith(
            caches.match(request, { ignoreSearch: true }).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // Strategy 3: External CDNs (e.g. Tailwind CDN, Google Fonts) -> Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            const fetchPromise = fetch(request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                }
                return networkResponse;
            }).catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});

// Message Event: Support immediate skipWaiting triggered by frontend UI
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
