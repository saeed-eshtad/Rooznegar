const prefix = 'rooznegar-';
const version = prefix + '38';
const files = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './fonts/Vazir-Regular.woff2', './fonts/Vazir-Bold.woff2'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(version).then(cache => cache.addAll(files)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(prefix) && key !== version).map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  const asset = files.find(path => new URL(path, self.registration.scope).href === url.href);
  if (!asset && request.mode !== 'navigate') return;
  event.respondWith(fetch(request).catch(() =>
    caches.match(request.mode === 'navigate' ? './index.html' : asset)));
});
