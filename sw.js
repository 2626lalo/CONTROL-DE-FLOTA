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
    const { obtenerPendientes, eliminarPendiente } = await import('./utils/offlineStorage.ts');
    
    const pendientes = await obtenerPendientes();
    
    for (const item of pendientes) {
      try {
        switch (item.tipo) {
          case 'checklist':
            // En un entorno real con Firebase SDK disponible en el SW
            // (Requiere configuración avanzada de service worker con módulos)
            // Por simplicidad, simulamos el envío a un endpoint de sync o 
            // intentamos disparar la lógica de Firebase si se inyectó.
            console.log('Sincronizando checklist offline:', item.datos);
            // Simulación de POST
            await fetch('/api/sync-checklist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.datos)
            });
            break;
            
          case 'ubicacion':
            console.log('Sincronizando ubicación offline:', item.datos);
            await fetch('/api/sync-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.datos)
            });
            break;

          default:
            // Fallback genérico para otros tipos
            await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tipo: item.tipo, datos: item.datos })
            });
        }
        
        await eliminarPendiente(item.id);
      } catch (error) {
        console.error('Error sincronizando item:', item.id, error);
        item.intentos++;
        // Si falló pero queremos reintentar más tarde, el Background Sync de la API 
        // del navegador suele reintentar automáticamente si no devolvemos error fatal.
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