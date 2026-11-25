/**
 * sw.js - Service Worker for Organizador_Tareas v1.6.0 (liquid-glass-mobile-perf)
 * Offline caching, instant reload updates, and resilient network-first navigation.
 */

const CACHE_NAME = 'organizador-tareas-cache-v1.6.0';

const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './manifest.json',
    './favicon.ico',
    // Fuentes locales Inter Variable
    './assets/fonts/inter-latin-opsz-normal.woff2',
    './assets/fonts/inter-latin-ext-opsz-normal.woff2',
    // CSS stylesheets
    './css/tailwind.min.css?v=1.6.0',
    './css/styles.css?v=1.6.0',
    './css/liquid-glass.css?v=1.6.0',
    './css/mobile-perf.css?v=1.6.0',
    // JavaScript application modules
    './js/storage.js?v=1.6.0',
    './js/haptics.js?v=1.6.0',
    './js/liquid-glass.js?v=1.6.0',
    './js/segmented.js?v=1.6.0',
    './js/notifications.js?v=1.6.0',
    './js/widgets.js?v=1.6.0',
    './js/subjects.js?v=1.6.0',
    './js/tasks.js?v=1.6.0',
    './js/notes.js?v=1.6.0',
    './js/calendar.js?v=1.6.0',
    './js/archive.js?v=1.6.0',
    './js/photo-editor.js?v=1.6.0',
    './js/backgrounds.js?v=1.6.0',
    './js/app.js?v=1.6.0',
    './js/performance.js?v=1.6.0',
    // PWA Icons
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-512x512.png',
    './assets/icons/icon-maskable-192x192.png',
    './assets/icons/icon-maskable-512x512.png',
    './assets/icons/apple-touch-icon.png',
    './assets/icons/favicon-32x32.png',
    './assets/icons/favicon-16x16.png',
    './assets/icons/favicon.ico'
];

// Install Event: Precaches core assets using Promise.allSettled without forcing aggressive reload on first install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            const results = await Promise.allSettled(
                PRECACHE_ASSETS.map(url =>
                    cache.add(url).catch(() =>
                        fetch(url)
                            .then(networkRes => {
                                if (networkRes && networkRes.ok) {
                                    return cache.put(url, networkRes);
                                }
                            })
                            .catch(err => {
                                console.warn(`[SW] Precache item skipped: ${url} (${err.message})`);
                            })
                    )
                )
            );
            console.log(`[SW v1.6.0] Precaching complete. Processed ${results.length} assets.`);
        })
    );
});

// Activate Event: Purges stale caches from previous versions without hijacking first-load state unexpectedly
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        console.log(`[SW v1.6.0] Purging deprecated cache: ${name}`);
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
                    console.log('[SW v1.6.0] Navigation offline. Serving cached index.html fallback.');
                    const cachedNav = await caches.match(request);
                    if (cachedNav) return cachedNav;
                    return caches.match('./index.html') || caches.match('index.html');
                })
        );
        return;
    }

    // Strategy 2: Local Static Assets -> Network-First for manifests, Cache-First for other static assets
    const requestUrl = new URL(request.url);
    if (requestUrl.origin === self.location.origin) {
        if (requestUrl.pathname.endsWith('/manifest.webmanifest') || requestUrl.pathname.endsWith('/manifest.json')) {
            event.respondWith(
                fetch(request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            const copy = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                        }
                        return networkResponse;
                    })
                    .catch(() => caches.match(request, { ignoreSearch: true }))
            );
            return;
        }
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

// Notification Click Event: Focus or open app on the relevant view (subjects/tasks/notes)
self.addEventListener('notificationclick', event => {
    event.notification.close();
    const action = (event.notification.data && event.notification.data.action) || 'subjects';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(`./index.html?action=${encodeURIComponent(action)}`);
            }
        })
    );
});
