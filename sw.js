/*
 * SIGNAL V2.0 SERVICE WORKER
 * Implements Aggressive Asset Caching for Offline Content Creation
 */

const CACHE_NAME = 'signal-v2-cache-v1';
const ASSETS = [
  'index.html',
  'style.css',
  'js/main.js',
  'js/engine.js',
  'js/shaders.js',
  'js/renderer-worker.js',
  'js/audio.js',
  'js/export.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
