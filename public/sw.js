// Network only: journal data always comes fresh from the server. The worker exists so the
// app is installable and shows offline.html instead of the browser's error page.
const CACHE = 'journaling-offline-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.add('/offline.html')));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.mode !== 'navigate') return;

    event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
});
