
import React, { useEffect, useState } from 'react';
import { 
  LucideNavigation, LucideCalendar, LucideUser, LucideCar, 
  LucideChevronRight, LucideFilter, LucideSearch 
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

  useEffect(() => {
    const q = query(collection(db, 'rutasPlanificadas'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRutas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = rutas.filter(r => 
    r.vehiclePlate?.toLowerCase().includes(search.toLowerCase()) ||
    r.origen?.toLowerCase().includes(search.toLowerCase()) ||
    r.destino?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn h-full flex flex-col">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="relative">
          <LucideSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
          <input 
            type="text" 
            placeholder="BUSCAR POR PATENTE, ORIGEN O DESTINO..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold uppercase text-xs outline-none focus:ring-4 focus:ring-blue-100 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b">
              <tr>
                <th className="px-8 py-6 text-slate-800">Trayectoria</th>
                <th className="px-8 py-6">Recurso / Activo</th>
                <th className="px-8 py-6">Métricas de Viaje</th>
                <th className="px-8 py-6">Estado</th>
                <th className="px-8 py-6 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(ruta => (
                <tr key={ruta.id} onClick={() => onSelect(ruta.id)} className="hover:bg-blue-50/50 transition-all cursor-pointer group">
                  <td className="px-8 py-6 max-w-sm">
                    <div className="space-y-1.5 overflow-hidden">
                      <p className="text-[11px] font-black text-slate-800 uppercase italic truncate">{ruta.origen}</p>
                      <div className="flex items-center gap-2 text-slate-300 ml-2">
                        <div className="w-0.5 h-3 bg-slate-200"></div>
                        <LucideNavigation size={10} className="rotate-90"/>
                      </div>
                      <p className="text-[11px] font-black text-blue-600 uppercase italic truncate">{ruta.destino}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-700 italic">
                        <LucideCar size={14} className="text-blue-500"/> {ruta.vehiclePlate}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                        <LucideUser size={12}/> ID: {ruta.conductorId?.substring(0,8)}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-800 italic">{ruta.distancia}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">SLA: {ruta.tiempo}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      ruta.estado === 'COMPLETADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {ruta.estado}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <LucideChevronRight className="text-slate-200 group-hover:text-blue-600 transition-all ml-auto" size={24}/>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">No se encontraron rutas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
