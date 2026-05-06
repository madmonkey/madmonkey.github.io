// Pirate Social Service Worker — Push Notifications + Offline Caching

const CACHE_NAME = 'ps-cache-v1';

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Pirate Social', body: event.data.text() };
  }

  const { title, body, tag, data } = payload;

  const options = {
    body: body || '',
    icon: '/images/logoImage.svg',
    badge: '/images/logoImage.svg',
    tag: tag || 'ps-notification',
    data: data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  // Single waitUntil with Promise.all — required so the SW isn't killed early
  // (calling event.waitUntil twice is a spec violation; only the first extends lifetime)
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title || '🏴\u200d☠️ Pirate Social', options),
      // Badging API — Chrome/Edge, and Safari 16.4+ home-screen PWA on iOS
      self.navigator?.setAppBadge?.().catch(() => {}),
      // Broadcast to any open app windows
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({
            type: 'PUSH_NOTIFICATION',
            title,
            body,
            data,
          });
        }
      }),
    ])
  );
});

// Notification click handler — focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = '/social';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If the app is already open, focus it
      for (const client of clients) {
        if (client.url.includes('/social') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Install event — cache shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});
