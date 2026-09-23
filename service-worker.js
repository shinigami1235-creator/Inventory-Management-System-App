// Offline support and updates for the installed app. tools/build.js stamps CACHE_VERSION with the
// build time, so every push to GitHub is a new version without editing this file by hand.
//
// The page itself is fetched network first: with an internet connection the tablet always gets
// the newest push, and with none it opens the last copy it saved. Icons and the manifest are
// served from the saved copy. The clinic's data lives in the browser's storage, which this file
// never touches, so an update never changes or clears it.
const CACHE_VERSION = '20260923164708';
const CACHE = 'ims-' + CACHE_VERSION;
const PRECACHE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('ims-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
