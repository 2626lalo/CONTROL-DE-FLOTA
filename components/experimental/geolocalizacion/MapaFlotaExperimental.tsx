import React, { useState, useEffect, useMemo } from 'react';
import { 
  LucideMap, LucideNavigation, LucideLayers, LucideMaximize, 
  LucideRefreshCw, LucideFilter, LucideActivity, LucideShield,
  LucideSearch, LucideCar, LucideInfo, LucideHistory
} from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { MapaVehiculo } from './MapaVehiculo';
import { FiltrosMapa } from './FiltrosMapa';
import { UltimaUbicacion } from './UltimaUbicacion';
import { PanelControlMapa } from './PanelControlMapa';
import { HistorialRutas } from './HistorialRutas';
import { GeocercasExperimental } from './GeocercasExperimental';
import { AlertasGeolocalizacion } from './AlertasGeolocalizacion';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useLoadScript } from '@react-google-maps/api';

type MapView = 'GLOBAL' | 'VEHICLE' | 'HISTORY' | 'GEOFENCES' | 'ALERTS';

export const MapaFlotaExperimental: React.FC = () => {
  const { vehicles, user, addNotification } = useApp();
  const [activeView, setActiveView] = useState<MapView>('GLOBAL');
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);
  const [ubicaciones, setUbicaciones] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCC, setFilterCC] = useState('');

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.API_KEY || '',
    libraries: ['drawing', 'geometry']
  });

  // Suscripción en tiempo real a las últimas ubicaciones de todos los vehículos
  useEffect(() => {
    const q = query(collection(db, 'ubicaciones'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nuevasUbicaciones: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const plate = data.vehiclePlate;
        // Solo guardamos la más reciente por placa
        if (!nuevasUbicaciones[plate] || data.timestamp > nuevasUbicaciones[plate].timestamp) {
          nuevasUbicaciones[plate] = { id: doc.id, ...data };
        }
      });
      setUbicaciones(nuevasUbicaciones);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to locations:", error);
      addNotification("Error al sincronizar rastreo satelital", "error");
    });
    return () => unsubscribe();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch = v.plate.toLowerCase().includes(search.toLowerCase()) ||
                          v.make.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || v.status === filterStatus;
      const matchCC = !filterCC || v.costCenter === filterCC;
      return matchSearch && matchStatus && matchCC;
    });
  }, [vehicles, search, filterStatus, filterCC]);

  const allCostCenters = useMemo(() => {
    return Array.from(new Set(vehicles.map(v => v.costCenter).filter(Boolean))).sort();
  }, [vehicles]);

  if (loadError) return <div className="p-20 text-center font-black uppercase text-rose-600">Error cargando motor de mapas</div>;
  if (!isLoaded) return <div className="p-20 text-center animate-pulse font-black uppercase text-slate-300">Inicializando Satélites...</div>;

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col animate-fadeIn overflow-hidden">
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
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Rastreo Satelital</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
               {[
                 { id: 'GLOBAL', label: 'Flota', icon: LucideMap },
                 { id: 'HISTORY', label: 'Historial', icon: LucideHistory },
                 { id: 'GEOFENCES', label: 'Cercas', icon: LucideShield },
                 { id: 'ALERTS', label: 'Alertas', icon: LucideShieldAlert }
               ].map(v => (
                 <button 
                  key={v.id}
                  onClick={() => setActiveView(v.id as MapView)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === v.id ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   <v.icon size={14}/> {v.label}
                 </button>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className={`hidden lg:flex w-96 bg-white border-r border-slate-100 flex-col shadow-2xl z-10 animate-fadeIn transition-all ${activeView === 'GLOBAL' || activeView === 'VEHICLE' ? '' : 'lg:w-0 lg:opacity-0 lg:pointer-events-none'}`}>
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
             <FiltrosMapa 
               status={filterStatus} setStatus={setFilterStatus} 
               costCenter={filterCC} setCostCenter={setFilterCC} 
               costCenters={allCostCenters}
               onReset={() => { setFilterStatus(''); setFilterCC(''); setSearch(''); }}
             />
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
             <UltimaUbicacion 
                vehicles={filteredVehicles} 
                ubicaciones={Object.values(ubicaciones)} 
                onSelect={(plate) => { setSelectedPlate(plate); setActiveView('VEHICLE'); }}
             />
          </div>
        </aside>

        <main className="flex-1 bg-slate-100 relative">
           {(activeView === 'GLOBAL' || activeView === 'VEHICLE') && (
             <MapaVehiculo 
               activeView={activeView}
               selectedPlate={selectedPlate}
               vehicles={filteredVehicles}
               ubicaciones={Object.values(ubicaciones)}
               onClose={() => { setSelectedPlate(null); setActiveView('GLOBAL'); }}
             />
           )}
           
           {activeView === 'HISTORY' && (
             <div className="absolute inset-0 z-20 flex bg-slate-100">
               <HistorialRutas />
             </div>
           )}

           {activeView === 'GEOFENCES' && (
             <div className="absolute inset-0 z-20 flex bg-slate-100">
               <GeocercasExperimental />
             </div>
           )}

           {activeView === 'ALERTS' && (
             <div className="absolute inset-0 z-20 flex bg-slate-100 p-8 overflow-y-auto custom-scrollbar">
               <div className="max-w-3xl mx-auto w-full">
                  <AlertasGeolocalizacion />
               </div>
             </div>
           )}
           
           {(activeView === 'GLOBAL' || activeView === 'VEHICLE') && <PanelControlMapa activeView={activeView} />}
        </main>
      </div>
    </div>
  );
};

const LucideShieldAlert = ShieldAlert;
import { ShieldAlert } from 'lucide-react';