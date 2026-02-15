import React, { useState, useMemo } from 'react';
// FIX: Added LucideSearch to the imports from lucide-react to resolve the error on line 132
import { LucideHistory, LucideCalendar, LucidePlay, LucideDownload, LucideArrowLeft, LucideMapPin, LucideRefreshCw, LucideClock, LucideNavigation2, LucideSearch } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { GoogleMap, Polyline, Marker } from '@react-google-maps/api';

// FIX: Declare google global variable to avoid TypeScript errors when using Google Maps SDK members
declare const google: any;

export const HistorialRutas: React.FC = () => {
  const { vehicles, addNotification } = useApp();
  const [selectedPlate, setSelectedPlate] = useState('');
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [routePoints, setRoutePoints] = useState<any[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIdx, setReplayIdx] = useState(0);

  const fetchRoute = async () => {
    if (!selectedPlate) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'ubicaciones'),
        where('vehiclePlate', '==', selectedPlate),
        where('timestamp', '>=', startOfDay(parseISO(dateFrom)).toISOString()),
        where('timestamp', '<=', endOfDay(parseISO(dateTo)).toISOString()),
        orderBy('timestamp', 'asc')
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data());
      setRoutePoints(data);
      if (data.length === 0) {
        addNotification("No se encontraron registros para ese periodo", "warning");
      } else {
        addNotification(`Cargados ${data.length} puntos de trayectoria`, "success");
      }
    } catch (err) {
      console.error(err);
      addNotification("Error al consultar historial", "error");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (routePoints.length < 2) return { km: 0, time: '0m', avgSpeed: 0 };
    
    // Cálculo simplificado de distancia (podría usarse haversine para precisión real)
    let dist = 0;
    let totalSpeed = 0;
    routePoints.forEach((p, i) => {
      totalSpeed += p.velocidad || 0;
    });

    const start = new Date(routePoints[0].timestamp);
    const end = new Date(routePoints[routePoints.length - 1].timestamp);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);

    return {
      km: (totalSpeed / routePoints.length) * (diffMs / 3600000), // Estimación tosca
      time: `${hours}h ${mins}m`,
      avgSpeed: Math.round(totalSpeed / routePoints.length)
    };
  }, [routePoints]);

  const path = useMemo(() => 
    routePoints.map(p => ({ lat: p.lat, lng: p.lng })), 
  [routePoints]);

  React.useEffect(() => {
    let timer: any;
    if (isReplaying && routePoints.length > 0) {
      timer = setInterval(() => {
        setReplayIdx(prev => {
          if (prev >= routePoints.length - 1) {
            setIsReplaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isReplaying, routePoints]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row animate-fadeIn">
      <aside className="w-full lg:w-96 bg-white border-r border-slate-100 p-8 space-y-8 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-4 border-b pb-6">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
            <LucideHistory size={24}/>
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-800 uppercase italic leading-none">Bitácora de Viajes</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Reconstrucción Satelital</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Unidad Patrimonial</label>
            <select 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              value={selectedPlate}
              onChange={e => setSelectedPlate(e.target.value)}
            >
              <option value="">SELECCIONE...</option>
              {vehicles.map(v => <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Desde</label>
              <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Hasta</label>
              <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>

          <button 
            disabled={loading || !selectedPlate}
            onClick={fetchRoute}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
          >
            {loading ? <LucideRefreshCw className="animate-spin" size={18}/> : <LucideSearch size={18}/>}
            Consultar Trayectorias
          </button>
        </div>

        {routePoints.length > 0 && (
          <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white shadow-2xl space-y-6 animate-fadeIn relative overflow-hidden">
             <div className="relative z-10 space-y-6">
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resumen del Viaje</p>
                   <h5 className="text-2xl font-black italic tracking-tighter text-blue-400 mt-2">{stats.km.toFixed(1)} KM ESTIMADOS</h5>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[7px] font-black text-slate-500 uppercase">Tiempo Motor</p>
                      <p className="text-lg font-black italic">{stats.time}</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[7px] font-black text-slate-500 uppercase">Vel. Media</p>
                      <p className="text-lg font-black italic">{stats.avgSpeed} KM/H</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => setIsReplaying(!isReplaying)}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95"
                   >
                     <LucidePlay size={16}/> {isReplaying ? 'Detener' : 'Reproducir'}
                   </button>
                   <button className="p-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all shadow-xl">
                      <LucideDownload size={18}/>
                   </button>
                </div>
             </div>
             <LucideNavigation2 className="absolute -right-8 -bottom-8 opacity-10 text-blue-500 rotate-45" size={160}/>
          </div>
        )}
      </aside>

      <main className="flex-1 bg-slate-100 relative">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={path[0] || { lat: -34.6037, lng: -58.3816 }}
          zoom={12}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          {path.length > 0 && (
            <>
              <Polyline
                path={path}
                options={{
                  strokeColor: '#3b82f6',
                  strokeOpacity: 0.8,
                  strokeWeight: 4
                }}
              />
              <Marker position={path[0]} label="INICIO" />
              <Marker position={path[path.length - 1]} label="FIN" />
              {isReplaying && routePoints[replayIdx] && (
                <Marker 
                  position={{ lat: routePoints[replayIdx].lat, lng: routePoints[replayIdx].lng }}
                  icon={{
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 5,
                    fillColor: '#FFFFFF',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    rotation: routePoints[replayIdx].direccion || 0
                  }}
                />
              )}
            </>
          )}
        </GoogleMap>
      </main>
    </div>
  );
};