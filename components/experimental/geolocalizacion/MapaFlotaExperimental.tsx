
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LucideMap, LucideNavigation, LucideLayers, LucideMaximize, 
  LucideRefreshCw, LucideFilter, LucideActivity, LucideShield,
  LucideSearch, LucideCar, LucideInfo
} from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { MapaVehiculo } from './MapaVehiculo';
import { FiltrosMapa } from './FiltrosMapa';
import { UltimaUbicacion } from './UltimaUbicacion';
import { PanelControlMapa } from './PanelControlMapa';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

type MapView = 'GLOBAL' | 'VEHICLE' | 'HISTORY' | 'GEOFENCES';

export const MapaFlotaExperimental: React.FC = () => {
  const { vehicles, user, addNotification } = useApp();
  const [activeView, setActiveView] = useState<MapView>('GLOBAL');
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  // Suscripción en tiempo real a las últimas ubicaciones
  useEffect(() => {
    const q = query(collection(db, 'ubicaciones'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUbicaciones(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => 
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.make.toLowerCase().includes(search.toLowerCase())
    );
  }, [vehicles, search]);

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col animate-fadeIn overflow-hidden">
      {/* HEADER ESTRATÉGICO */}
      <div className="p-8 border-b border-slate-200 bg-white z-20 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-slate-950 text-white rounded-[1.5rem] shadow-2xl">
              <LucideMap size={32} className="text-blue-400"/>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <LucideShield size={16} className="text-emerald-600"/>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Satellite Fleet Tracking v4.0</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Mesa de Geolocalización</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
               {['GLOBAL', 'GEOFENCES'].map(v => (
                 <button 
                  key={v}
                  onClick={() => setActiveView(v as MapView)}
                  className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeView === v ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {v === 'GLOBAL' ? 'Flota' : 'Geocercas'}
                 </button>
               ))}
            </div>
            <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm">
              <LucideRefreshCw size={20}/>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* PANEL LATERAL DE CONTROL */}
        <aside className="hidden lg:flex w-96 bg-white border-r border-slate-100 flex-col shadow-2xl z-10 animate-fadeIn">
          <div className="p-6 border-b border-slate-50 space-y-4">
             <div className="relative">
                <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                <input 
                  type="text" 
                  placeholder="BUSCAR UNIDAD..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-black uppercase text-[10px] outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
             <UltimaUbicacion 
                vehicles={filteredVehicles} 
                ubicaciones={ubicaciones} 
                onSelect={(plate) => { setSelectedPlate(plate); setActiveView('VEHICLE'); }}
             />
          </div>
        </aside>

        {/* MAPA INTERACTIVO */}
        <main className="flex-1 bg-slate-100 relative">
           <MapaVehiculo 
             activeView={activeView}
             selectedPlate={selectedPlate}
             vehicles={vehicles}
             ubicaciones={ubicaciones}
             onClose={() => { setSelectedPlate(null); setActiveView('GLOBAL'); }}
           />
           
           <PanelControlMapa activeView={activeView} />
        </main>
      </div>
    </div>
  );
};
