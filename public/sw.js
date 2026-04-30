// Minimal service worker. Network-first for navigation requests; basic
// passthrough for everything else. Push handler shows a notification when
// payload arrives.
const CACHE = 'rpm-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only intercept same-origin GETs; let the browser handle everything else.
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/rpm-auto-lab/portal/dashboard') || new Response('Offline', { status: 503 })
      )
    );
  }
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const title = data.title || 'RPM Auto Lab';
  const options = {
    body: data.body || '',
    icon: '/rpm-auto-lab/icon-192.png',
    badge: '/rpm-auto-lab/icon-192.png',
    data: { url: data.url || '/rpm-auto-lab/portal/dashboard' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/rpm-auto-lab/portal/dashboard';
  event.waitUntil(self.clients.openWindow(url));
});
