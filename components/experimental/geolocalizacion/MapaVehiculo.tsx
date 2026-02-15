
import React, { useEffect, useRef, useState } from 'react';
import { LucideCar, LucideNavigation2, LucideX, LucideClock, LucideGauge, LucideActivity } from 'lucide-react';
import { Vehicle } from '../../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  activeView: 'GLOBAL' | 'VEHICLE' | 'HISTORY' | 'GEOFENCES';
  selectedPlate: string | null;
  vehicles: Vehicle[];
  ubicaciones: any[];
  onClose: () => void;
}

export const MapaVehiculo: React.FC<Props> = ({ activeView, selectedPlate, vehicles, ubicaciones, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any>(null);

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
    if (!mapRef.current || !(window as any).L) return;
    const L = (window as any).L;
    
    if (mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([-34.6037, -58.3816], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
    
    updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapInstance.current || !(window as any).L) return;
    const L = (window as any).L;

    // Limpiar marcadores viejos si cambiamos a modo vehículo
    if (activeView === 'VEHICLE') {
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
    }

    const unitsToRender = activeView === 'VEHICLE' 
      ? vehicles.filter(v => v.plate === selectedPlate)
      : vehicles;

    unitsToRender.forEach(v => {
      const lastPos = ubicaciones.find(u => u.vehiclePlate === v.plate);
      if (!lastPos) return;

      const coords: [number, number] = [lastPos.lat, lastPos.lng];
      
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative group">
            <div class="p-2 bg-slate-950 text-white rounded-xl shadow-2xl border-2 border-white transition-all transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h10c0-1.1.9-2 2-2z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              ${v.plate}
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      if (markersRef.current[v.plate]) {
        markersRef.current[v.plate].setLatLng(coords);
      } else {
        markersRef.current[v.plate] = L.marker(coords, { icon }).addTo(mapInstance.current);
      }

      if (activeView === 'VEHICLE' && selectedPlate === v.plate) {
        mapInstance.current.setView(coords, 16);
      }
    });
  };

  useEffect(() => {
    updateMarkers();
  }, [ubicaciones, activeView, selectedPlate]);

  return (
    <div className="w-full h-full relative group">
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {activeView === 'VEHICLE' && selectedPlate && (
        <div className="absolute top-8 left-8 right-8 md:right-auto md:w-96 bg-white/90 backdrop-blur-md p-8 rounded-[3rem] border border-slate-100 shadow-2xl z-20 animate-fadeIn">
           <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-slate-950 text-white rounded-2xl shadow-xl"><LucideCar size={24}/></div>
                 <div>
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{selectedPlate}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Monitoreo en Tiempo Real</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><LucideX/></button>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><LucideGauge size={10}/> Velocidad</p>
                 <p className="text-lg font-black text-slate-800 italic">45 <span className="text-[10px] not-italic text-slate-400">KM/H</span></p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><LucideClock size={10}/> Última Señal</p>
                 <p className="text-[10px] font-black text-blue-600">HACE 2 MIN</p>
              </div>
           </div>

           <button className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
              <LucideActivity size={16}/> Abrir Telemetría Completa
           </button>
        </div>
      )}
    </div>
  );
};
