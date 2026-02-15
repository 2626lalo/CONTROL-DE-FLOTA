
import React, { useState, useEffect } from 'react';
import { 
  LucideZap, LucideAlertTriangle, LucideHistory, LucideDollarSign, 
  LucideCalendar, LucideActivity, LucideLayout, LucidePlus,
  LucideRefreshCw, LucideFilter
} from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { useFirebase } from '../../../context/FirebaseContext';
import { AlertasMantenimiento } from './AlertasMantenimiento';
import { HistorialServiciosVehiculo } from './HistorialServiciosVehiculo';
import { CostosMantenimiento } from './CostosMantenimiento';
import { ProximosVencimientos } from './ProximosVencimientos';
import { CalendarioMantenimiento } from './CalendarioMantenimiento';
import { GraficosMantenimiento } from './GraficosMantenimiento';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

type Tab = 'DASHBOARD' | 'ALERTS' | 'HISTORY' | 'COSTS' | 'CALENDAR';

export const MantenimientoPredictivo: React.FC = () => {
  const { vehicles, user, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'mantenimientos'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMantenimientos(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfdfe] space-y-10 animate-fadeIn p-4 md:p-8 pb-32">
      {/* HEADER ESTRATÉGICO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b border-slate-200 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-slate-950 text-white rounded-[2rem] shadow-2xl rotate-3">
            <LucideZap size={36} className="text-amber-400 animate-pulse"/>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LucideActivity size={18} className="text-blue-600"/>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fleet Predictive Engine v3.0</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Mantenimiento Maestro</h1>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN MODULAR */}
      <div className="flex gap-4 md:gap-10 border-b border-slate-100 overflow-x-auto scrollbar-hide pb-1">
        {[
          { id: 'DASHBOARD', label: 'Resumen', icon: LucideLayout },
          { id: 'ALERTS', label: 'Alertas Críticas', icon: LucideAlertTriangle },
          { id: 'HISTORY', label: 'Historial por Unidad', icon: LucideHistory },
          { id: 'COSTS', label: 'Análisis de Costos', icon: LucideDollarSign },
          { id: 'CALENDAR', label: 'Agenda Técnica', icon: LucideCalendar },
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-5 px-4 text-[11px] font-black uppercase tracking-widest shrink-0 flex items-center gap-3 border-b-4 transition-all ${
              activeTab === tab.id ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={16}/> {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LucideRefreshCw className="animate-spin text-blue-600 mb-4" size={48}/>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sincronizando Inteligencia...</p>
        </div>
      ) : (
        <div className="animate-fadeIn">
          {activeTab === 'DASHBOARD' && (
            <div className="space-y-12">
               <AlertasMantenimiento vehicles={vehicles} mantenimientos={mantenimientos} limit={3} />
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <ProximosVencimientos vehicles={vehicles} />
                  <GraficosMantenimiento mantenimientos={mantenimientos} />
               </div>
            </div>
          )}

          {activeTab === 'ALERTS' && (
            <div className="space-y-10">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Monitor de Urgencias Técnicas</h4>
              <AlertasMantenimiento vehicles={vehicles} mantenimientos={mantenimientos} />
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <HistorialServiciosVehiculo vehicles={vehicles} mantenimientos={mantenimientos} />
          )}

          {activeTab === 'COSTS' && (
            <CostosMantenimiento mantenimientos={mantenimientos} vehicles={vehicles} />
          )}

          {activeTab === 'CALENDAR' && (
            <CalendarioMantenimiento mantenimientos={mantenimientos} />
          )}
        </div>
      )}
    </div>
  );
};
