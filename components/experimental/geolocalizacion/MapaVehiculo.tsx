import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { LucideCar, LucideNavigation2, LucideX, LucideClock, LucideGauge, LucideActivity } from 'lucide-react';
import { Vehicle } from '../../../types';
import { format, parseISO } from 'date-fns';

// FIX: Declare google global variable to avoid TypeScript errors when using Google Maps SDK members
declare const google: any;

interface Props {
  activeView: 'GLOBAL' | 'VEHICLE' | 'HISTORY' | 'GEOFENCES';
  selectedPlate: string | null;
  vehicles: Vehicle[];
  ubicaciones: any[];
  onClose: () => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: -34.6037,
  lng: -58.3816
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
    { featureType: "landscape", elementType: "all", stylers: [{ color: "#f1f5f9" }] },
    { featureType: "road", elementType: "all", stylers: [{ color: "#ffffff" }] },
    { featureType: "water", elementType: "all", stylers: [{ color: "#cbd5e1" }] }
  ]
};

export const MapaVehiculo: React.FC<Props> = ({ activeView, selectedPlate, vehicles, ubicaciones, onClose }) => {
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);

  const markers = useMemo(() => {
    const unitsToRender = activeView === 'VEHICLE' && selectedPlate
      ? vehicles.filter(v => v.plate === selectedPlate)
      : vehicles;

    return unitsToRender.map(v => {
      const lastPos = ubicaciones.find(u => u.vehiclePlate === v.plate);
      if (!lastPos) return null;

      const diffMin = (Date.now() - new Date(lastPos.timestamp).getTime()) / 60000;
      let color = '#10b981'; // Verde: Activo < 5 min
      if (diffMin > 60) color = '#ef4444'; // Rojo: Detenido > 1 hora
      else if (diffMin > 5) color = '#f59e0b'; // Amarillo: Inactivo > 5 min

      return {
        ...lastPos,
        vehicle: v,
        color
      };
    }).filter(Boolean);
  }, [vehicles, ubicaciones, activeView, selectedPlate]);

  const mapCenter = useMemo(() => {
    if (activeView === 'VEHICLE' && selectedPlate) {
      const lastPos = ubicaciones.find(u => u.vehiclePlate === selectedPlate);
      if (lastPos) return { lat: lastPos.lat, lng: lastPos.lng };
    }
    return center;
  }, [activeView, selectedPlate, ubicaciones]);

  const getMarkerIcon = (color: string) => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#FFFFFF',
    scale: 2,
    anchor: new google.maps.Point(12, 22)
  });

  return (
    <div className="w-full h-full relative group">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={activeView === 'VEHICLE' ? 16 : 12}
        options={mapOptions}
      >
        {markers.map((m: any) => (
          <Marker
            key={m.vehiclePlate}
            position={{ lat: m.lat, lng: m.lng }}
            icon={getMarkerIcon(m.color)}
            onClick={() => setSelectedMarker(m)}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 min-w-[180px] space-y-3">
              <div className="flex justify-between items-start border-b pb-2">
                <div>
                   <h4 className="font-black text-slate-800 text-lg leading-none uppercase italic">{selectedMarker.vehiclePlate}</h4>
                   <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{selectedMarker.vehicle.make} {selectedMarker.vehicle.model}</p>
                </div>
                <div className={`w-2 h-2 rounded-full mt-1 ${selectedMarker.color === '#10b981' ? 'bg-emerald-500' : selectedMarker.color === '#ef4444' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                   <p className="text-[7px] font-black text-slate-400 uppercase">Velocidad</p>
                   <p className="text-xs font-black text-slate-700">{selectedMarker.velocidad} KM/H</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                   <p className="text-[7px] font-black text-slate-400 uppercase">Dirección</p>
                   <p className="text-xs font-black text-slate-700">{selectedMarker.direccion}°</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase">
                <LucideClock size={10}/>
                Sincronizado: {format(parseISO(selectedMarker.timestamp), 'HH:mm:ss')} HS
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {activeView === 'VEHICLE' && selectedPlate && (
        <div className="absolute top-8 left-8 right-8 md:right-auto md:w-96 bg-white/90 backdrop-blur-md p-8 rounded-[3rem] border border-slate-100 shadow-2xl z-20 animate-fadeIn">
           <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-slate-950 text-white rounded-2xl shadow-xl"><LucideCar size={24}/></div>
                 <div>
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{selectedPlate}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Rastreo Satelital Activo</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><LucideX/></button>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><LucideGauge size={10}/> Velocidad Actual</p>
                 <p className="text-lg font-black text-slate-800 italic">{ubicaciones.find(u => u.vehiclePlate === selectedPlate)?.velocidad || 0} <span className="text-[10px] not-italic text-slate-400">KM/H</span></p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><LucideClock size={10}/> Última Señal</p>
                 <p className="text-[10px] font-black text-blue-600">SINCRO ONLINE</p>
              </div>
           </div>

           <button className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
              <LucideActivity size={16}/> Abrir Telemetría Integral
           </button>
        </div>
      )}
    </div>
  );
};