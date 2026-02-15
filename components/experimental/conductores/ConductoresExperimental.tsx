
import React, { useState, useEffect } from 'react';
import { 
  LucideUsers, LucideClipboardCheck, LucideBarChart3, LucidePlus,
  LucideLayout, LucideActivity, LucideShieldCheck, LucideRefreshCw
} from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { ListaConductores } from './ListaConductores';
import { FichaConductor } from './FichaConductor';
import { ChecklistDiarioConductor } from './ChecklistDiarioConductor';
import { GraficosConductores } from './GraficosConductores';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

type ViewMode = 'DASHBOARD' | 'DIRECTORY' | 'MY_CHECKLIST' | 'REPORTS';

export const ConductoresExperimental: React.FC = () => {
  const { user, vehicles, addNotification } = useApp();
  // FIX: Casted user?.role to string to allow comparison with 'CONDUCTOR' as it's not present in the UserRole enum
  const [activeView, setActiveView] = useState<ViewMode>((user?.role as string) === 'CONDUCTOR' ? 'MY_CHECKLIST' : 'DASHBOARD');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  useEffect(() => {
    const q = query(collection(db, 'asignaciones'), orderBy('fechaInicio', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAsignaciones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfdfe] space-y-10 animate-fadeIn p-4 md:p-8 pb-32">
      {/* HEADER MASTER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b border-slate-200 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-slate-950 text-white rounded-[2rem] shadow-2xl rotate-3">
            <LucideUsers size={36} className="text-blue-400"/>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LucideShieldCheck size={18} className="text-emerald-600"/>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fleet Personnel Control v1.0</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Gestión de Conductores</h1>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN MODULAR */}
      <div className="flex gap-4 md:gap-10 border-b border-slate-100 overflow-x-auto scrollbar-hide pb-1">
        {isAdmin && (
          <>
            <button onClick={() => { setActiveView('DASHBOARD'); setSelectedDriverId(null); }} className={`pb-5 px-4 text-[11px] font-black uppercase tracking-widest shrink-0 flex items-center gap-3 border-b-4 transition-all ${activeView === 'DASHBOARD' ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <LucideLayout size={16}/> Resumen
            </button>
            <button onClick={() => { setActiveView('DIRECTORY'); setSelectedDriverId(null); }} className={`pb-5 px-4 text-[11px] font-black uppercase tracking-widest shrink-0 flex items-center gap-3 border-b-4 transition-all ${activeView === 'DIRECTORY' || selectedDriverId ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <LucideUsers size={16}/> Directorio
            </button>
          </>
        )}
        <button onClick={() => { setActiveView('MY_CHECKLIST'); setSelectedDriverId(null); }} className={`pb-5 px-4 text-[11px] font-black uppercase tracking-widest shrink-0 flex items-center gap-3 border-b-4 transition-all ${activeView === 'MY_CHECKLIST' ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
          <LucideClipboardCheck size={16}/> Mi Checklist Diario
        </button>
        {isAdmin && (
          <button onClick={() => { setActiveView('REPORTS'); setSelectedDriverId(null); }} className={`pb-5 px-4 text-[11px] font-black uppercase tracking-widest shrink-0 flex items-center gap-3 border-b-4 transition-all ${activeView === 'REPORTS' ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <LucideBarChart3 size={16}/> Analítica
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LucideRefreshCw className="animate-spin text-blue-600 mb-4" size={48}/>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sincronizando Personal...</p>
        </div>
      ) : (
        <div className="animate-fadeIn">
          {activeView === 'DASHBOARD' && (
            <div className="space-y-10">
               <GraficosConductores asignaciones={asignaciones} />
               <ListaConductores onSelectDriver={setSelectedDriverId} limit={5} />
            </div>
          )}

          {activeView === 'DIRECTORY' && !selectedDriverId && (
            <ListaConductores onSelectDriver={setSelectedDriverId} />
          )}

          {(selectedDriverId) && (
            <FichaConductor 
              driverId={selectedDriverId} 
              onBack={() => setSelectedDriverId(null)} 
              asignaciones={asignaciones}
            />
          )}

          {activeView === 'MY_CHECKLIST' && (
            <ChecklistDiarioConductor />
          )}

          {activeView === 'REPORTS' && (
            <GraficosConductores asignaciones={asignaciones} fullHeight />
          )}
        </div>
      )}
    </div>
  );
};
