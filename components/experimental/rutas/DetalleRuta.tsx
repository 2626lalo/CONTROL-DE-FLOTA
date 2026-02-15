
import React, { useEffect, useState, useRef } from 'react';
import { LucideArrowLeft, LucideNavigation, LucideShare2, LucideFileText, LucideCar, LucideUser, LucideClock, LucideMaximize } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { ExportarRuta } from './ExportarRuta';

// FIX: Declare google global variable to avoid TypeScript errors
declare const google: any;

interface Props {
  routeId: string;
  onBack: () => void;
}

export const DetalleRuta: React.FC<Props> = ({ routeId, onBack }) => {
  const [ruta, setRuta] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const d = await getDoc(doc(db, 'rutasPlanificadas', routeId));
      if (d.exists()) {
        const data = d.data();
        setRuta(data);
        initMiniMap(data);
      }
    };
    fetch();
  }, [routeId]);

  const initMiniMap = (data: any) => {
    if (!mapRef.current) return;
    // FIX: Accessing google.maps.Map after global declaration
    const map = new google.maps.Map(mapRef.current, {
      zoom: 12,
      disableDefaultUI: true,
      styles: [
        { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
        { featureType: "landscape", elementType: "all", stylers: [{ color: "#0f172a" }] },
        { featureType: "road", elementType: "all", stylers: [{ color: "#1e293b" }] }
      ]
    });

    // FIX: Using google.maps.geometry and Polyline from global declaration
    const path = google.maps.geometry.encoding.decodePath(data.overview_polyline);
    const polyline = new google.maps.Polyline({ path, strokeColor: "#3b82f6", strokeOpacity: 1, strokeWeight: 5, map });
    
    // FIX: Using LatLngBounds from google global declaration
    const bounds = new google.maps.LatLngBounds();
    path.forEach((p: any) => bounds.extend(p));
    map.fitBounds(bounds);
  };

  if (!ruta) return <div className="p-20 text-center animate-pulse">Consultando Repositorio Logístico...</div>;

  return (
    <div className="h-full flex flex-col md:flex-row gap-8 animate-fadeIn">
      <div className="w-full md:w-96 space-y-8">
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
          <div className="flex items-center gap-6 border-b pb-6">
            <button onClick={onBack} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all shadow-sm"><LucideArrowLeft size={20}/></button>
            <h4 className="text-xl font-black uppercase italic tracking-tighter">Resumen de Viaje</h4>
          </div>

          <div className="space-y-8">
            <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
               <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4">Unidad Patrimonial</p>
               <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{ruta.vehiclePlate}</h3>
               <LucideCar className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700" size={140}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Distancia</p>
                <p className="text-lg font-black text-slate-800 italic">{ruta.distancia}</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Tiempo Est.</p>
                <p className="text-lg font-black text-slate-800 italic uppercase">{ruta.tiempo}</p>
              </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
               <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><LucideUser size={20}/></div>
                  <div><p className="text-[10px] font-black text-blue-800 uppercase italic">Conductor Asignado</p><p className="text-[10px] font-bold text-blue-600 uppercase">ID: {ruta.conductorId?.substring(0,10)}</p></div>
               </div>
            </div>
          </div>

          <ExportarRuta origin={ruta.origen} destination={ruta.destino} />
        </div>
      </div>

      <div className="flex-1 bg-slate-900 rounded-[4rem] overflow-hidden shadow-2xl border border-white/5 relative">
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute top-8 left-8 p-6 bg-white/10 backdrop-blur-md border border-white/10 rounded-[2.5rem] text-white">
           <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-blue-400">Estado de Sincronización</p>
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[10px] font-black uppercase tracking-widest italic">Ruta Despachada Cloud</p>
           </div>
        </div>
      </div>
    </div>
  );
};
