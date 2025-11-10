/* sw.js - simple offline-first service worker */
const APP_VERSION = 'pwa-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js'
  // add more assets you want guaranteed offline, e.g. fonts, images
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_VERSION).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === APP_VERSION ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // For navigation requests (HTML), use network-first so updates appear quickly
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(APP_VERSION);
        cache.put('/index.html', net.clone());
        return net;
      } catch {
        const cache = await caches.open(APP_VERSION);
        return (await cache.match('/index.html')) || Response.error();
      }
    })());
    return;
  }

  // For other requests (CSS/JS/images), use cache-first
  event.respondWith((async () => {
    const cache = await caches.open(APP_VERSION);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const net = await fetch(req);
      if (req.method === 'GET' && net.status === 200) {
        cache.put(req, net.clone());
      }
      return net;
    } catch {
      return cached || Response.error();
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
