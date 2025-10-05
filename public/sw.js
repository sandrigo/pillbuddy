const CACHE_NAME = 'pillbuddy-v5';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/badge-72.png'
];

// Message Handler - Für SKIP_WAITING Command
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING message received - activating new service worker');
    self.skipWaiting();
  }
});

// Install Event - Cache initialisieren
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Failed to cache:', err);
      });
    })
    // Removed auto-skipWaiting - now controlled by user action
  );
});

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache-First Strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  // NEVER cache Supabase API requests (for real-time sync)
  if (event.request.url.includes('supabase.co')) {
    console.log('[SW] Bypassing cache for Supabase:', event.request.url);
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW] Serving from cache:', event.request.url);
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((err) => {
        console.error('[SW] Fetch failed:', err);
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        throw err;
      });
    })
  );
});

// Push Event - Push Notifications empfangen
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  let notificationData = {
    title: 'PillBuddy Erinnerung',
    body: 'Sie haben eine neue Benachrichtigung',
    icon: '/icon-192.png',
    badge: '/badge-72.png'
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/icon-192.png',
    badge: notificationData.badge || '/badge-72.png',
    vibrate: [200, 100, 200],
    tag: notificationData.tag || 'pillbuddy-notification',
    requireInteraction: true,
    actions: [
      { action: 'view', title: '👁️ Anzeigen' },
      { action: 'dismiss', title: '❌ Schließen' }
    ],
    data: notificationData.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open app on notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (let client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if app is not open
      if (clients.openWindow) {
        const urlToOpen = event.action === 'view' && event.notification.data.medicationId
          ? `/?medication=${event.notification.data.medicationId}`
          : '/';
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background Sync Event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-medications') {
    event.waitUntil(syncMedications());
  }
});

async function syncMedications() {
  console.log('[SW] Syncing medications...');
  // This would sync any pending changes made while offline
  // For now, this is a placeholder for future implementation
  return Promise.resolve();
}

// Periodic Background Sync (for checking medication levels)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-medications') {
    event.waitUntil(checkMedicationLevels());
  }
});

async function checkMedicationLevels() {
  console.log('[SW] Checking medication levels...');
  // This would be called periodically to check medication levels
  // and send notifications if needed
  return Promise.resolve();
}
