
import React, { useEffect, useState } from 'react';
import { 
  LucideNavigation, LucideCalendar, LucideUser, LucideCar, 
  LucideChevronRight, LucideFilter, LucideSearch, LucideClock, LucideActivity, LucideRotateCcw, LucideLoader2 
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface Props {
  onSelect: (id: string) => void;
}

export const ListaRutas: React.FC<Props> = ({ onSelect }) => {
  const [rutas, setRutas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'rutasPlanificadas'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRutas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = rutas.filter(r => {
    const term = search.toLowerCase();
    const matchSearch = !search || 
        r.vehiclePlate?.toLowerCase().includes(term) ||
        r.origen?.direccion?.toLowerCase().includes(term) ||
        r.destino?.direccion?.toLowerCase().includes(term);
    
    const matchStatus = !filterStatus || r.estado === filterStatus;
    
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4 animate-pulse">
        <LucideLoader2 className="text-blue-600 animate-spin" size={48}/>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Bitácora Logística...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn h-full flex flex-col pb-20">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <LucideSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
          <input 
            type="text" 
            placeholder="BUSCAR POR PATENTE, ORIGEN O DESTINO..." 
            className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <select 
              className="px-6 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest outline-none shadow-xl cursor-pointer"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">TODOS LOS ESTADOS</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN CURSO">EN CURSO</option>
              <option value="COMPLETADO">COMPLETADO</option>
            </select>
            <button onClick={() => { setSearch(''); setFilterStatus(''); }} className="p-5 bg-slate-100 text-slate-400 rounded-2xl hover:text-rose-600 transition-all">
                <LucideRotateCcw size={24}/>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] border-b">
              <tr>
                <th className="px-10 py-6">Bitácora / Trayectoria</th>
                <th className="px-10 py-6">Recurso Designado</th>
                <th className="px-10 py-6 text-center">Métricas SLA</th>
                <th className="px-10 py-6 text-center">Estado</th>
                <th className="px-10 py-6 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(ruta => (
                <tr key={ruta.id} onClick={() => onSelect(ruta.id)} className="hover:bg-blue-50/50 transition-all cursor-pointer group">
                  <td className="px-10 py-8 max-w-sm">
                    <div className="space-y-2 overflow-hidden">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                         <p className="text-[11px] font-black text-slate-800 uppercase italic truncate">{ruta.origen?.direccion}</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-rose-600"></div>
                         <p className="text-[11px] font-black text-blue-600 uppercase italic truncate">{ruta.destino?.direccion}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 text-white rounded-lg group-hover:bg-blue-600 transition-colors shadow-lg"><LucideCar size={14}/></div>
                        <span className="text-sm font-black uppercase italic text-slate-800 tracking-tighter">{ruta.vehiclePlate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        <LucideUser size={12}/> ID: {ruta.conductorId?.substring(0,8)}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="space-y-1.5">
                       <p className="text-sm font-black text-slate-800 italic">{ruta.distancia} KM</p>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1"><LucideClock size={10}/> {ruta.tiempo} MINUTOS</p>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                      ruta.estado === 'COMPLETADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                    }`}>
                      {ruta.estado}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <LucideChevronRight className="text-slate-200 group-hover:text-blue-600 transition-all ml-auto" size={32}/>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-40 text-center bg-white"><LucideActivity size={64} className="mx-auto text-slate-100 mb-6"/><p className="text-slate-300 font-black uppercase text-xs tracking-widest italic">Sin planificaciones registradas</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
