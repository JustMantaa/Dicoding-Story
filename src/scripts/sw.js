const CACHE_NAME = "dicoding-story-v1";
const BASE_PATH = "";

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/app.bundle.js`,
  `${BASE_PATH}/app.css`,
  `${BASE_PATH}/images/hero.png`,
  `${BASE_PATH}/favicon.png`,
  `${BASE_PATH}/images/logo.png`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/sw.bundle.js`,
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (err) {
          // Silent fail on cache add
        }
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const serviceWorkerUrl = self.location.href;

  // Bypass requests for the Service Worker script itself
  if (event.request.url === serviceWorkerUrl) {
    return;
  }

  if (event.request.method !== "GET" || event.request.url.startsWith('chrome-extension://') || event.request.url.includes('devtools')) {
    return;
  }

  const isAppShell = urlsToCache.some(url => event.request.url.endsWith(url));
  if (isAppShell) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return caches.match(`${BASE_PATH}/index.html`);
      })
  );
});

self.addEventListener("push", (event) => {
  let notificationData = {
    title: "Dicoding Story",
    body: "Cerita baru telah ditambahkan",
    icon: `${BASE_PATH}/images/logo.png`,
    badge: `${BASE_PATH}/images/logo.png`,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Lihat Cerita',
        icon: `${BASE_PATH}/images/logo.png`
      },
      {
        action: 'close',
        title: 'Tutup',
        icon: `${BASE_PATH}/images/logo.png`
      },
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) notificationData.title = data.title;
      if (data.body) notificationData.body = data.body;
      if (data.icon) notificationData.icon = data.icon;
      if (data.data) notificationData.data = { ...notificationData.data, ...data.data };
    } catch (error) {
      // If JSON parsing fails, try to get text
      const text = event.data.text();
      if (text) notificationData.body = text;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
