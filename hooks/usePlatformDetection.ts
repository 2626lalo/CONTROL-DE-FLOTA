
import { useState, useEffect } from 'react';

export interface PlatformCapabilities {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasCamera: boolean;
  hasTouch: boolean;
  online: boolean;
}

export const usePlatformDetection = (): PlatformCapabilities => {
  const [capabilities, setCapabilities] = useState<PlatformCapabilities>({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    hasCamera: false,
    hasTouch: false,
    online: navigator.onLine,
  });

  useEffect(() => {
    const detect = async () => {
      const ua = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const isAndroid = /android/.test(ua);
      const isMobile = isIOS || isAndroid || window.innerWidth <= 768;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      let hasCamera = false;
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        hasCamera = devices.some(d => d.kind === 'videoinput');
      }

      setCapabilities({
        isMobile,
        isIOS,
        isAndroid,
        hasCamera,
        hasTouch,
        online: navigator.onLine,
      });
    };

    detect();
    const h1 = () => setCapabilities(prev => ({ ...prev, online: true }));
    const h2 = () => setCapabilities(prev => ({ ...prev, online: false }));
    window.addEventListener('online', h1);
    window.addEventListener('offline', h2);
    return () => {
      window.removeEventListener('online', h1);
      window.removeEventListener('offline', h2);
    };
  }, []);

  return capabilities;
};
