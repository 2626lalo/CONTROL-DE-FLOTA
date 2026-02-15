import React, { useEffect, useRef, useState } from 'react';
import { LucideLocate, LucideRefreshCcw, LucideMapPin, LucideNavigation } from 'lucide-react';

interface Props {
  address: string;
  setAddress?: (v: string) => void;
  name?: string;
  setName?: (v: string) => void;
  readOnly?: boolean;
  initialCoords?: [number, number];
}

export const MapaServicio: React.FC<Props> = ({ address, setAddress, name, setName, readOnly, initialCoords }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const initMap = () => {
    if (!mapContainerRef.current || !(window as any).L) return;
    const L = (window as any).L;
    const coords = initialCoords || [-34.6037, -58.3816];
    
    mapInstance.current = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: !readOnly
    }).setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance.current);

    markerInstance.current = L.marker(coords, { 
      draggable: !readOnly 
    }).addTo(mapInstance.current);

    if (!readOnly && markerInstance.current) {
      markerInstance.current.on('dragend', () => {
        const { lat, lng } = markerInstance.current.getLatLng();
        reverseGeocode(lat, lng);
      });
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (readOnly || !setAddress) return;
    setIsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`);
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name.toUpperCase());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const geocode = async (query: string) => {
    if (readOnly || !query || query.length < 5) return;
    setIsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=es`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCoords: [number, number] = [parseFloat(lat), parseFloat(lon)];
        mapInstance.current?.setView(newCoords, 16);
        markerInstance.current?.setLatLng(newCoords);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const newCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      mapInstance.current?.setView(newCoords, 16);
      markerInstance.current?.setLatLng(newCoords);
      reverseGeocode(newCoords[0], newCoords[1]);
    });
  };

  return (
    <div className="space-y-6 flex flex-col h-full animate-fadeIn">
      {!readOnly && (
        <div className="space-y-4 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><LucideNavigation size={10}/> Nombre Establecimiento</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-[10px] outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
                placeholder="EJ: TALLER CENTRAL..." 
                value={name} 
                onChange={e => setName?.(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><LucideMapPin size={10}/> Dirección</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-[10px] outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
                  placeholder="EJ: AV. SIEMPRE VIVA 742..." 
                  value={address} 
                  onChange={e => setAddress?.(e.target.value.toUpperCase())}
                />
                <button type="button" onClick={() => geocode(address)} className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-blue-600 transition-all"><LucideRefreshCcw size={16}/></button>
              </div>
            </div>
          </div>
          <button type="button" onClick={handleGPS} className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 hover:text-white transition-all border border-blue-100">
            <LucideLocate size={18}/> Capturar mi ubicación GPS actual
          </button>
        </div>
      )}

      <div className="flex-1 rounded-[2.5rem] bg-slate-100 border-2 border-slate-50 relative overflow-hidden group shadow-inner min-h-[300px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        {isLoading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <LucideRefreshCcw className="animate-spin text-blue-600" size={32}/>
          </div>
        )}
      </div>
    </div>
  );
};