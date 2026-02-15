import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export const UpdateNotification = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.ready.then((registration) => {
        // Verificar si ya hay un worker esperando
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShow(true);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setShow(true);
            }
          });
        });
      });
    }
  }, []);

  const update = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-6 z-[5000] animate-fadeIn border border-white/20 backdrop-blur-md">
      <div className="flex-1">
        <p className="font-black text-sm uppercase italic tracking-tighter">Nueva versión disponible</p>
        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Sincronizá para ver los últimos cambios</p>
      </div>
      <button 
        onClick={update}
        className="bg-white text-blue-600 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-blue-50 transition-all active:scale-95 shadow-xl"
      >
        <RefreshCw size={14} className="animate-spin-slow" />
        Actualizar
      </button>
    </div>
  );
};