// Service Worker for Emprende+ PWA
// Advanced caching with multiple strategies

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `emprende-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `emprende-dynamic-${CACHE_VERSION}`;
const API_CACHE = `emprende-api-${CACHE_VERSION}`;
const OFFLINE_CACHE = `emprende-offline-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
];

// Offline fallback
const OFFLINE_PAGE = '/offline.html';

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache First - for static assets
  cacheFirst: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    } catch {
      return caches.match(OFFLINE_PAGE);
    }
  },

  // Network First - for API calls
  networkFirst: async (request, cacheName, timeout = 5000) => {
    const cache = await caches.open(cacheName);

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(request, { signal: controller.signal });
      clearTimeout(id);

      if (response.ok) cache.put(request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(request);
      return cached || caches.match(OFFLINE_PAGE);
    }
  },

  // Stale While Revalidate - for dynamic content
  staleWhileRevalidate: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    }).catch(() => cached);

    return cached || fetchPromise;
  },
};

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(STATIC_ASSETS);

      // Cache offline page
      const offlineCache = await caches.open(OFFLINE_CACHE);
      await offlineCache.add(OFFLINE_PAGE);

      // Skip waiting to activate immediately
      self.skipWaiting();
    })(),
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) =>
            name.startsWith('emprende-') &&
            ![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, OFFLINE_CACHE].includes(name)
          )
          .map((name) => caches.delete(name))
      );

      // Claim all clients
      self.clients.claim();
    })(),
  );
});

// Fetch - apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension, blob, data URLs
  if (!url.protocol.startsWith('http')) return;

  // Strategy selection based on request type
  if (STATIC_ASSETS.some((asset) => url.pathname === asset || url.pathname.endsWith(asset.replace('/', '')))) {
    // Static assets - Cache First
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request, STATIC_CACHE));
    return;
  }

  // API calls - Network First with timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request, API_CACHE, 3000));
    return;
  }

  // Navigation requests - Stale While Revalidate
  if (request.mode === 'navigate') {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // Other assets - Stale While Revalidate
  event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Background Sync - sync offline data when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncSales());
  } else if (event.tag === 'sync-expenses') {
    event.waitUntil(syncExpenses());
  } else if (event.tag === 'sync-inventory') {
    event.waitUntil(syncInventory());
  } else if (event.tag === 'sync-all') {
    event.waitUntil(syncAllData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Emprende+', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action buttons
    console.log('Action clicked:', event.action);
  } else {
    // Default click - open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === self.location.origin && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Periodic sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-rate') {
    event.waitUntil(syncExchangeRate());
  }
});

// Helper functions
async function syncSales() {
  console.log('Syncing sales...');
  // Implementation would read from IndexedDB and POST to server
}

async function syncExpenses() {
  console.log('Syncing expenses...');
}

async function syncInventory() {
  console.log('Syncing inventory...');
}

async function syncAllData() {
  console.log('Syncing all data...');
  await Promise.all([syncSales(), syncExpenses(), syncInventory()]);
}

async function syncExchangeRate() {
  try {
    const response = await fetch('/api/bcv/api/v1/rate.json');
    const data = await response.json();
    if (data.USD) {
      // Update cache
      const cache = await caches.open(API_CACHE);
      cache.put('/api/bcv/api/v1/rate.json', new Response(JSON.stringify(data)));
    }
  } catch (e) {
    console.log('Rate sync failed:', e);
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  } else if (event.data === 'clearCache') {
    clearAllCaches();
  } else if (event.data === 'updateCache') {
    updateStaticCache();
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
}

async function updateStaticCache() {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(STATIC_ASSETS);
}