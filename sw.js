const CACHE_NAME = 'flota-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pendientes') {
    event.waitUntil(sincronizarPendientes());
  }
});

async function sincronizarPendientes() {
  try {
    // Import dynamically from the ESM utility
    const { obtenerPendientes, eliminarPendiente } = await import('/utils/offlineStorage.ts');
    
    const pendientes = await obtenerPendientes();
    
    for (const item of pendientes) {
      try {
        // En un entorno real, aquí se llamaría a la API de Firebase o un endpoint de sincronización
        // Simulación de POST de sincronización
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: item.tipo,
            datos: item.datos
          })
        });
        
        if (response.ok) {
          await eliminarPendiente(item.id);
        }
      } catch (error) {
        console.error('Error sincronizando item:', item.id, error);
        item.intentos++;
        // Si falló pero queremos reintentar más tarde, podemos dejarlo en la DB
      }
    }
  } catch (error) {
    console.error('Error en proceso de sincronización:', error);
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});