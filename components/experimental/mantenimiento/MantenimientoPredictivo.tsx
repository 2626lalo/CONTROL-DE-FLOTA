import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LucideZap, LucideAlertTriangle, LucideHistory, LucideDollarSign, 
  LucideCalendar, LucideActivity, LucideLayout, LucidePlus,
  LucideRefreshCw, LucideFilter
} from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { AlertasMantenimiento } from './AlertasMantenimiento';
import { HistorialServiciosVehiculo } from './HistorialServiciosVehiculo';
import { CostosMantenimiento } from './CostosMantenimiento';
import { ProximosVencimientos } from './ProximosVencimientos';
import { CalendarioMantenimiento } from './CalendarioMantenimiento';
import { GraficosMantenimiento } from './GraficosMantenimiento';
import { RegistrarServicioModal } from './RegistrarServicioModal';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

type Tab = 'DASHBOARD' | 'ALERTS' | 'HISTORY' | 'COSTS' | 'CALENDAR';

export const MantenimientoPredictivo: React.FC = () => {
  const { vehicles, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // 1. CARGA DE DATOS OPTIMIZADA CON LIMIT
  useEffect(() => {
    console.time('Maintenance_Snapshot');
    const q = query(
      collection(db, 'mantenimientos'), 
      orderBy('fecha', 'desc'),
      limit(150) // Solo los últimos 150 registros para rendimiento
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMantenimientos(docs);
      setLoading(false);
      console.timeEnd('Maintenance_Snapshot');
    }, (error) => {
      console.error("Error loading maintenance data:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. CÁLCULO DE ALERTAS MEMOIZADO
  const calculateAlerts = useCallback((vehiclesList: any[]) => {
    const alerts: any[] = [];
    const hoy = startOfDay(new Date());
    
    vehiclesList.forEach(vehicle => {
      const kmRestante = (vehicle.nextServiceKm || 0) - (vehicle.currentKm || 0);
      if (kmRestante <= 0) {
        alerts.push({
          id: `alert-km-${vehicle.plate}`,
          tipo: 'service',
          patente: vehicle.plate,
          mensaje: 'SERVICE VENCIDO (KM EXCEDIDO)',
          urgencia: 'alta',
          valor: `${Math.abs(kmRestante).toLocaleString()} KM EXCEDIDOS`
        });
      } else if (kmRestante < 1500) {
        alerts.push({
          id: `alert-km-${vehicle.plate}`,
          tipo: 'service',
          patente: vehicle.plate,
          mensaje: 'SERVICE PRÓXIMO',
          urgencia: kmRestante < 500 ? 'alta' : 'media',
          valor: `${kmRestante.toLocaleString()} KM RESTANTES`
        });
      }
      
      const vtvDoc = vehicle.documents?.find((d: any) => d.type.toUpperCase().includes('VTV'));
      if (vtvDoc?.expirationDate) {
        const vtvDate = parseISO(vtvDoc.expirationDate);
        const diffTime = vtvDate.getTime() - hoy.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) {
          alerts.push({
            id: `alert-vtv-${vehicle.plate}`,
            tipo: 'vtv',
            patente: vehicle.plate,
            mensaje: 'VTV VENCIDA',
            urgencia: 'alta',
            valor: `VENCIDO HACE ${Math.abs(daysUntil)} DÍAS`
          });
        } else if (daysUntil < 30) {
          alerts.push({
            id: `alert-vtv-${vehicle.plate}`,
            tipo: 'vtv',
            patente: vehicle.plate,
            mensaje: `VTV POR VENCER`,
            urgencia: daysUntil < 10 ? 'alta' : 'media',
            valor: `${daysUntil} DÍAS RESTANTES`
          });
        }
      }
    });
    
    return alerts.sort((a, b) => (a.urgencia === 'alta' ? -1 : 1));
  }, []);

  const alertas = useMemo(() => calculateAlerts(vehicles), [vehicles, calculateAlerts]);

  return (
    <div className="min-h-screen bg-[#fcfdfe] space-y-10 animate-fadeIn p-4 md:p-8 pb-32">
      {/* MODAL REGISTRO */}
      {showRegisterModal && (
        <RegistrarServicioModal 
          vehicles={vehicles} 
          onClose={() => setShowRegisterModal(false)} 
        />
      )}

      {/* HEADER ESTRATÉGICO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b border-slate-200 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-slate-950 text-white rounded-[2rem] shadow-2xl rotate-3">
            <LucideZap size={36} className="text-amber-400 animate-pulse"/>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LucideActivity size={18} className="text-blue-600"/>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fleet Predictive Engine v3.5</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Mantenimiento Maestro</h1>
          </div>
        </div>
        <button 
          onClick={() => setShowRegisterModal(true)}
          className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-3xl hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95"
        >
          <LucidePlus size={22}/> Registrar Intervención
        </button>
      </div>

      {/* NAVEGACIÓN MODULAR */}
      <div className="flex gap-4 md:gap-10 border-b border-slate-100 overflow-x-auto scrollbar-hide pb-1">
        {[
          { id: 'DASHBOARD', label: 'Dashboard', icon: LucideLayout },
          { id: 'ALERTS', label: 'Alertas Críticas', icon: LucideAlertTriangle, count: alertas.length },
          { id: 'HISTORY', label: 'Historial Integral', icon: LucideHistory },
          { id: 'COSTS', label: 'Análisis de Costos', icon: LucideDollarSign },
          { id: 'CALENDAR', label: 'Agenda Técnica', icon: LucideCalendar },
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-5 px-4 text-[11px] font-black uppercase tracking-widest shrink-0 flex items-center gap-3 border-b-4 transition-all relative ${
              activeTab === tab.id ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={16}/> {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="absolute top-0 -right-2 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-white shadow-sm">
                {tab.count}
              </span>
            )}
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
               <AlertasMantenimiento vehicles={vehicles} mantenimientos={mantenimientos} alerts={alertas} />
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <ProximosVencimientos vehicles={vehicles} />
                  <GraficosMantenimiento mantenimientos={mantenimientos} />
               </div>
            </div>
          )}

          {activeTab === 'ALERTS' && (
            <div className="space-y-10">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Monitor de Urgencias Técnicas</h4>
              <AlertasMantenimiento vehicles={vehicles} mantenimientos={mantenimientos} alerts={alertas} full />
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