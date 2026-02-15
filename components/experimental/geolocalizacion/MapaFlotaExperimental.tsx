import React, { useState, useEffect, useMemo, Suspense, lazy, useCallback } from 'react';
import { 
  LucideMap, LucideNavigation, LucideLayers, LucideMaximize, 
  LucideRefreshCw, LucideFilter, LucideActivity, LucideShield,
  LucideSearch, LucideCar, LucideInfo, LucideHistory, LucideLoader2,
  LucideChevronLeft, LucideChevronRight, LucideMenu
} from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { MapaVehiculo } from './MapaVehiculo';
import { FiltrosMapa } from './FiltrosMapa';
import { UltimaUbicacion } from './UltimaUbicacion';
import { PanelControlMapa } from './PanelControlMapa';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useLoadScript } from '@react-google-maps/api';

// Optimización: Lazy loading de módulos secundarios pesados
const HistorialRutas = lazy(() => import('./HistorialRutas').then(m => ({ default: m.HistorialRutas })));
const GeocercasExperimental = lazy(() => import('./GeocercasExperimental').then(m => ({ default: m.GeocercasExperimental })));
const AlertasGeolocalizacion = lazy(() => import('./AlertasGeolocalizacion').then(m => ({ default: m.AlertasGeolocalizacion })));

type MapView = 'GLOBAL' | 'VEHICLE' | 'HISTORY' | 'GEOFENCES' | 'ALERTS';

const SkeletonLoader = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 gap-4 animate-pulse">
    <LucideLoader2 size={48} className="text-blue-600 animate-spin"/>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando Módulo Satelital...</p>
  </div>
);

export const MapaFlotaExperimental: React.FC = () => {
  const { vehicles, user, addNotification } = useApp();
  const [activeView, setActiveView] = useState<MapView>('GLOBAL');
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);
  const [ubicaciones, setUbicaciones] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCC, setFilterCC] = useState('');

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.API_KEY || '',
    libraries: ['drawing', 'geometry']
  });

  // Suscripción en tiempo real optimizada
  useEffect(() => {
    console.time('Firestore_Locations_Snapshot');
    const q = query(
      collection(db, 'ubicaciones'), 
      orderBy('timestamp', 'desc'),
      limit(200) // Optimización: Solo traer las últimas 200 posiciones para rendimiento
    );
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
      console.timeEnd('Firestore_Locations_Snapshot');
    }, (error) => {
      console.error("Error listening to locations:", error);
      addNotification("Error al sincronizar rastreo satelital", "error");
    });
    return () => unsubscribe();
  }, [addNotification]);

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

  const handleSelectVehicle = useCallback((plate: string) => {
    setSelectedPlate(plate);
    setActiveView('VEHICLE');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);

  if (loadError) return <div className="p-20 text-center font-black uppercase text-rose-600 px-4">Error cargando motor de mapas</div>;
  if (!isLoaded) return <div className="p-20 text-center animate-pulse font-black uppercase text-slate-300 px-4">Inicializando Satélites...</div>;

  return (
    <div className="h-screen bg-[#fcfdfe] flex flex-col animate-fadeIn overflow-hidden fixed inset-0 z-50 md:relative md:z-0">
      {/* HEADER COMPACTO PARA MÓVIL */}
      <div className="px-4 md:px-8 py-4 md:py-6 border-b border-slate-200 bg-white z-40 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2.5 bg-slate-900 text-white rounded-xl shadow-lg active:scale-90"
            >
              <LucideMenu size={20}/>
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-950 text-white rounded-xl shadow-xl hidden sm:block">
                <LucideMap size={20} className="text-blue-400"/>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <LucideShield size={12} className="text-emerald-600"/>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Satellite Track v4.0</span>
                </div>
                <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Rastreo Satelital</h1>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1">
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-inner whitespace-nowrap">
               {[
                 { id: 'GLOBAL', label: 'Flota', icon: LucideMap },
                 { id: 'HISTORY', label: 'Historial', icon: LucideHistory },
                 { id: 'GEOFENCES', label: 'Cercas', icon: LucideShield },
                 { id: 'ALERTS', label: 'Alertas', icon: LucideShieldAlert }
               ].map(v => (
                 <button 
                  key={v.id}
                  onClick={() => { setActiveView(v.id as MapView); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                  className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeView === v.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   <v.icon size={12}/> {v.label}
                 </button>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* PANEL LATERAL RESPONSIVO */}
        <aside className={`fixed lg:relative inset-y-0 left-0 w-[280px] md:w-96 bg-white border-r border-slate-100 flex flex-col shadow-2xl z-[100] transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'} ${activeView === 'GLOBAL' || activeView === 'VEHICLE' ? '' : 'lg:hidden'}`}>
          <div className="p-4 md:p-6 border-b border-slate-50 space-y-4">
             <div className="relative">
                <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                <input 
                  type="text" 
                  placeholder="BUSCAR UNIDAD..." 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl font-black uppercase text-[9px] outline-none focus:ring-4 focus:ring-blue-100 transition-all min-h-[44px]"
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
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
             <UltimaUbicacion 
                vehicles={filteredVehicles} 
                ubicaciones={Object.values(ubicaciones)} 
                onSelect={handleSelectVehicle}
             />
          </div>
        </aside>

        {/* CONTENEDOR DE MAPA - FULL SCREEN EN MÓVIL */}
        <main className="flex-1 bg-slate-100 relative overflow-hidden">
           {(activeView === 'GLOBAL' || activeView === 'VEHICLE') && (
             <MapaVehiculo 
               activeView={activeView}
               selectedPlate={selectedPlate}
               vehicles={filteredVehicles}
               ubicaciones={Object.values(ubicaciones)}
               onClose={() => { setSelectedPlate(null); setActiveView('GLOBAL'); }}
             />
           )}
           
           <Suspense fallback={<SkeletonLoader />}>
              {activeView === 'HISTORY' && (
                <div className="absolute inset-0 z-[60] flex bg-slate-100 overflow-hidden">
                  <HistorialRutas />
                </div>
              )}

              {activeView === 'GEOFENCES' && (
                <div className="absolute inset-0 z-[60] flex bg-slate-100 overflow-hidden">
                  <GeocercasExperimental />
                </div>
              )}

              {activeView === 'ALERTS' && (
                <div className="absolute inset-0 z-[60] flex bg-slate-100 p-4 md:p-8 overflow-y-auto custom-scrollbar">
                  <div className="max-w-3xl mx-auto w-full">
                      <AlertasGeolocalizacion />
                  </div>
                </div>
              )}
           </Suspense>
           
           {/* Botón de expansión Sidebar en Desktop */}
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur shadow-2xl rounded-2xl text-slate-400 hover:text-blue-600 transition-all z-50 border border-slate-100 active:scale-90"
           >
             {isSidebarOpen ? <LucideChevronLeft size={20}/> : <LucideChevronRight size={20}/>}
           </button>

           {(activeView === 'GLOBAL' || activeView === 'VEHICLE') && <PanelControlMapa activeView={activeView} />}
        </main>
      </div>
    </div>
  );
};

const LucideShieldAlert = ShieldAlert;
import { ShieldAlert } from 'lucide-react';