import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'flota-offline';
const DB_VERSION = 1;

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('pendientes')) {
        const store = db.createObjectStore('pendientes', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('tipo', 'tipo');
      }
    },
  });
};

export const guardarPendiente = async (tipo: string, datos: any) => {
  const db = await initDB();
  const id = await db.add('pendientes', {
    tipo,
    datos,
    timestamp: Date.now(),
    intentos: 0
  });

  // Request background sync if available
  try {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      // @ts-ignore
      await reg.sync.register('sync-pendientes');
    }
  } catch (e) {
    console.warn("Background Sync registration failed:", e);
  }

  return id;
};

export const obtenerPendientes = async () => {
  const db = await initDB();
  return db.getAll('pendientes');
};

export const eliminarPendiente = async (id: number) => {
  const db = await initDB();
  return db.delete('pendientes', id);
};