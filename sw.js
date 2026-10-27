self.addEventListener('install', (e) => {
  console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (e) => {
  // מאפשר לעבוד בצורה תקינה ברשת
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
