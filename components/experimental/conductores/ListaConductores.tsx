import React, { useState, useEffect, useMemo } from 'react';
import { LucideSearch, LucideUser, LucideChevronRight, LucidePhone, LucideMail, LucideCar, LucideFilter, LucideRotateCcw, LucideChevronLeft, LucideLoader2 } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { User, UserRole } from '../../../types';
import { db } from '../../../firebaseConfig';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

interface Props {
  onSelectDriver: (id: string) => void;
  limit?: number;
}

export const ListaConductores: React.FC<Props> = ({ onSelectDriver, limit }) => {
  const { user: currentUser, addNotification } = useApp();
  const [conductores, setConductores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [filterCC, setFilterCC] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = limit || 10;

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'users'), 
      where('role', 'in', ['USER', 'CONDUCTOR', 'CONDUCTOR'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      // Filtro por rol supervisor (solo ve los de su CC)
      if (currentUser?.role === UserRole.SUPERVISOR) {
        const myCC = (currentUser.costCenter || currentUser.centroCosto?.nombre || '').toUpperCase();
        setConductores(docs.filter(d => (d.costCenter || d.centroCosto?.nombre || '').toUpperCase() === myCC));
      } else {
        setConductores(docs);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading conductores:", error);
      addNotification("Error al sincronizar lista de conductores", "error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const allCCs = useMemo(() => {
    const set = new Set(conductores.map(c => c.costCenter || c.centroCosto?.nombre).filter(Boolean));
    return Array.from(set).sort();
  }, [conductores]);

  const filtered = useMemo(() => {
    return conductores.filter(c => {
      const term = search.toLowerCase();
      const matchSearch = c.nombre.toLowerCase().includes(term) || 
                          c.apellido.toLowerCase().includes(term) || 
                          c.email.toLowerCase().includes(term);
      const matchCC = !filterCC || (c.costCenter || c.centroCosto?.nombre) === filterCC;
      return matchSearch && matchCC;
    });
  }, [conductores, search, filterCC]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse px-4">
      <LucideLoader2 className="text-blue-600 animate-spin mb-4" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sincronizando Directorio...</p>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-sm space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <LucideSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
            <input 
              type="text" 
              placeholder="BUSCAR CONDUCTOR..." 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold uppercase text-xs outline-none focus:ring-4 focus:ring-blue-100 transition-all min-h-[48px]"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              className="flex-1 md:w-64 px-5 py-4 bg-slate-50 border-none rounded-2xl font-black uppercase text-[10px] outline-none min-h-[48px]"
              value={filterCC}
              onChange={e => { setFilterCC(e.target.value); setCurrentPage(1); }}
            >
              <option value="">C. COSTO: TODOS</option>
              {allCCs.map(cc => <option key={cc} value={cc}>{cc}</option>)}
            </select>
            <button onClick={() => { setSearch(''); setFilterCC(''); }} className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:text-rose-500 transition-all min-h-[48px]">
              <LucideRotateCcw size={20}/>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* VISTA DESKTOP: TABLA */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">Identidad / Perfil</th>
                <th className="px-8 py-6">Contacto</th>
                <th className="px-8 py-6">Centro de Costo</th>
                <th className="px-8 py-6 text-center">Estado</th>
                <th className="px-8 py-6 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map(d => (
                <tr key={d.id} onClick={() => onSelectDriver(d.id)} className="hover:bg-blue-50/50 transition-all cursor-pointer group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg uppercase shadow-lg group-hover:bg-blue-600 transition-colors">
                        {d.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 uppercase italic leading-none">{d.nombre} {d.apellido}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-widest">Rol: {d.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold">
                        <LucidePhone size={12}/> {d.telefono || 'S/N'}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-[9px] font-medium italic">
                        <LucideMail size={12}/> {d.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded-lg border border-blue-100">
                      {d.costCenter || d.centroCosto?.nombre || 'S/A'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      d.approved && d.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {d.approved ? 'AUTORIZADO' : 'PENDIENTE'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <LucideChevronRight className="text-slate-200 group-hover:text-blue-600 transition-all ml-auto" size={24}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL: TARJETAS */}
        <div className="sm:hidden divide-y divide-slate-50">
           {paginated.map(d => (
             <div key={d.id} onClick={() => onSelectDriver(d.id)} className="p-6 space-y-5 active:bg-blue-50 transition-all">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                        {d.nombre.charAt(0)}
                      </div>
                      <div>
                         <h4 className="font-black text-slate-800 uppercase italic leading-none">{d.nombre} {d.apellido}</h4>
                         <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded border border-blue-100">
                            {d.costCenter || d.centroCosto?.nombre || 'S/A'}
                         </span>
                      </div>
                   </div>
                   <LucideChevronRight size={20} className="text-slate-300"/>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div className="space-y-1">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Contacto</p>
                      <p className="text-[10px] font-bold text-slate-600 truncate">{d.email}</p>
                   </div>
                   <div className="text-right space-y-1">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                      <span className={`text-[8px] font-black uppercase italic ${d.approved ? 'text-emerald-600' : 'text-rose-500 animate-pulse'}`}>
                        {d.approved ? 'AUTORIZADO' : 'PENDIENTE'}
                      </span>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Paginación - ADAPTADA */}
        {totalPages > 1 && (
          <div className="p-4 md:p-6 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase">Mostrando {paginated.length} de {filtered.length}</p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="flex-1 sm:flex-none p-3 bg-white rounded-xl border border-slate-200 disabled:opacity-30 flex items-center justify-center min-h-[44px]"><LucideChevronLeft size={18}/></button>
              <div className="px-5 py-3 bg-white rounded-xl border border-slate-200 text-[10px] font-black flex items-center justify-center flex-1 sm:flex-none">{currentPage} / {totalPages}</div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="flex-1 sm:flex-none p-3 bg-white rounded-xl border border-slate-200 disabled:opacity-30 flex items-center justify-center min-h-[44px]"><LucideChevronRight size={18}/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};