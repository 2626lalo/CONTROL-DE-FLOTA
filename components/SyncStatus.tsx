import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { obtenerPendientes } from '../utils/offlineStorage';

export const SyncStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkPendientes = async () => {
      try {
        const items = await obtenerPendientes();
        setPendientes(items.length);
      } catch (e) {
        console.error("Error checking pending items", e);
      }
    };

    checkPendientes();
    const interval = setInterval(checkPendientes, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendientes === 0) return null;

  return (
    <div className={`fixed bottom-24 right-6 px-5 py-3 rounded-[1.5rem] shadow-2xl flex items-center gap-3 z-[4000] border border-white/20 backdrop-blur-md transition-all animate-fadeIn ${
      isOnline ? 'bg-emerald-600' : 'bg-amber-600'
    } text-white`}>
      {isOnline ? (
        <>
          <RefreshCw size={16} className="animate-spin" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase leading-none">Sincronizando</span>
            <span className="text-[11px] font-bold mt-0.5">{pendientes} tareas pendientes</span>
          </div>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase leading-none">Modo Offline</span>
            <span className="text-[11px] font-bold mt-0.5">{pendientes} cambios guardados</span>
          </div>
        </>
      )}
    </div>
  );
};