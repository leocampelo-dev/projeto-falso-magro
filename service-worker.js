/**
 * service-worker.js
 * Cache básico para permitir instalação como PWA e uso offline
 * dos arquivos principais da aplicação.
 *
 * IMPORTANTE: sempre que publicar uma atualização do app,
 * aumente o número da versão (CACHE_NAME) para forçar
 * o navegador a buscar os arquivos novos.
 */

const CACHE_NAME = 'falso-magro-v10';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/js/supabase-config.js',
  './assets/js/supabase-client.js',
  './assets/js/storage.js',
  './assets/js/auth.js',
  './assets/js/calculator.js',
  './assets/js/project-options.js',
  './assets/js/diet-models.js',
  './assets/js/substitutions.js',
  './assets/js/mini-loader.js',
  './assets/js/onboarding.js',
  './assets/js/dashboard.js',
  './assets/js/plan.js',
  './assets/js/checkin.js',
  './assets/js/progress.js',
  './assets/js/guide-content.js',
  './assets/js/admin.js',
  './assets/js/app.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
