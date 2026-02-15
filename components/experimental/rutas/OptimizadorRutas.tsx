
import React, { useState, useEffect } from 'react';
import { 
  LucideRoute, LucidePlus, LucideList, LucideActivity, 
  LucideRefreshCw, LucideShieldCheck, LucideMap, LucideNavigation 
} from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { PlanificadorRutas } from './PlanificadorRutas';
import { ListaRutas } from './ListaRutas';
import { DetalleRuta } from './DetalleRuta';
import { GraficosRutas } from './GraficosRutas';

type RouteView = 'LIST' | 'PLANNER' | 'DETAIL' | 'ANALYTICS';

export const OptimizadorRutas: React.FC = () => {
  const { user, addNotification } = useApp();
  const [activeView, setActiveView] = useState<RouteView>('LIST');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);

  // Carga dinámica del SDK de Google Maps con Places y Directions
  useEffect(() => {
    if (window.google) {
      setIsMapsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY}&libraries=places,directions`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsMapsLoaded(true);
    document.head.appendChild(script);
  }, []);

  if (!isMapsLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
            <LucideRefreshCw className="animate-spin text-blue-500" size={64}/>
            <LucideRoute className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={24}/>
        </div>
        <p className="text-blue-500 font-black uppercase text-[11px] tracking-[0.4em] animate-pulse">Sincronizando con Satélites...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col animate-fadeIn overflow-hidden">
      {/* HEADER CORPORATIVO */}
      <div className="p-8 border-b border-slate-200 bg-white z-20 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-slate-950 text-white rounded-[2rem] shadow-2xl rotate-3">
              <LucideRoute size={36} className="text-blue-400"/>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <LucideShieldCheck size={16} className="text-emerald-600"/>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Logistics Intelligence Engine v1.5</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Despacho Logístico</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
               {[
                 { id: 'LIST', label: 'Bitácora', icon: LucideList },
                 { id: 'ANALYTICS', label: 'Eficiencia', icon: LucideActivity }
               ].map(v => (
                 <button 
                  key={v.id}
                  onClick={() => setActiveView(v.id as RouteView)}
                  className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === v.id ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   <v.icon size={14}/> {v.label}
                 </button>
               ))}
            </div>
            {activeView !== 'PLANNER' && (
                <button 
                onClick={() => setActiveView('PLANNER')}
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 shadow-blue-200"
                >
                <LucidePlus size={20}/> Nueva Planificación
                </button>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
        <div className="max-w-7xl mx-auto h-full">
           {activeView === 'LIST' && <ListaRutas onSelect={(id) => { setSelectedRouteId(id); setActiveView('DETAIL'); }} />}
           {activeView === 'PLANNER' && <PlanificadorRutas onCancel={() => setActiveView('LIST')} />}
           {activeView === 'DETAIL' && selectedRouteId && <DetalleRuta routeId={selectedRouteId} onBack={() => setActiveView('LIST')} />}
           {activeView === 'ANALYTICS' && <GraficosRutas />}
        </div>
      </main>
    </div>
  );
};
