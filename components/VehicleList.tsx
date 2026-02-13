import React, { useState } from 'react';
import { useApp } from '../context/FleetContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LucidePlus, LucideSearch, LucideLayoutGrid, LucideList, 
  LucideCar, LucideChevronRight, 
  LucideDatabase, LucideFuel,
  LucideTrash2, LucideBox
} from 'lucide-react';
import { VehicleStatus, UserRole } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

export const VehicleList = () => {
  const { vehicles, user, deleteVehicle } = useApp();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCC, setFilterCC] = useState('');
  const [plateToDelete, setPlateToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAdmin = user?.role === UserRole.ADMIN;
  const costCenters = Array.from(new Set(vehicles.map(v => v.costCenter).filter(Boolean)));

  const filtered = vehicles.filter(v => {
    const term = search.toLowerCase();
    const plate = v.plate || '';
    const model = v.model || '';
    const matchesSearch = plate.toLowerCase().includes(term) || model.toLowerCase().includes(term);
    const matchesStatus = filterStatus === '' || v.status === filterStatus;
    const matchesCC = filterCC === '' || v.costCenter === filterCC;
    return matchesSearch && matchesStatus && matchesCC;
  });

  const handleDeleteConfirm = () => {
    if (plateToDelete) {
        deleteVehicle(plateToDelete);
        setPlateToDelete(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-24">
      <ConfirmationModal 
        isOpen={!!plateToDelete}
        title="Confirmar Eliminación"
        message={`¿Está seguro de que desea eliminar permanentemente la unidad ${plateToDelete}? Esta acción borrará todos sus documentos, historial y fotos.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setPlateToDelete(null)}
        isDanger={true}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <LucideDatabase className="text-blue-600" size={16}/>
            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Management</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Flota Corporativa</h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 flex gap-1">
             <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                <LucideLayoutGrid size={18}/>
             </button>
             <button onClick={() => setViewMode('TABLE')} className={`hidden md:block p-2 rounded-lg transition-all ${viewMode === 'TABLE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                <LucideList size={18}/>
             </button>
          </div>
          <Link to="/vehicles/new" className="flex-1 md:flex-none bg-blue-600 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
            <LucidePlus size={18}/> Nueva Unidad
          </Link>
        </div>
      </div>

      {vehicles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
             <div className="md:col-span-2 relative">
                <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                  type="text" 
                  placeholder="Buscar unidad..." 
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-blue-50 font-bold text-slate-700 uppercase text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
             <select 
                className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm font-black text-[9px] uppercase tracking-widest outline-none appearance-none"
                value={filterCC}
                onChange={e => setFilterCC(e.target.value)}
             >
                <option value="">Centro de Costo</option>
                {costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
             </select>
             <select 
                className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm font-black text-[9px] uppercase tracking-widest outline-none appearance-none"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
             >
                <option value="">Estado Operativo</option>
                {Object.values(VehicleStatus).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>

          {(viewMode === 'GRID' || window.innerWidth < 768) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filtered.map(v => (
                <div key={v.plate} onClick={() => navigate(`/vehicles/detail/${v.plate}`)} className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all group relative">
                   <div className="h-40 md:h-48 bg-slate-100 relative overflow-hidden">
                      {v.images.front ? <img src={v.images.front} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={v.plate} /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-200"><LucideCar size={40} className="opacity-20"/></div>}
                      
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPlateToDelete(v.plate); }}
                          className="absolute top-4 left-4 p-3 bg-white/90 hover:bg-rose-600 hover:text-white text-rose-600 rounded-2xl shadow-xl transition-all opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm"
                          title="Eliminar registro"
                        >
                          <LucideTrash2 size={16}/>
                        </button>
                      )}

                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${v.status === VehicleStatus.ACTIVE ? 'bg-emerald-500' : 'bg-amber-500'} text-white shadow-lg`}>
                        {v.status}
                      </div>
                   </div>
                   <div className="p-6 md:p-8">
                      <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">{v.plate}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate">{v.make} {v.model}</p>
                      <div className="mt-4 md:mt-6 flex justify-between items-center bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                         <span className="text-[8px] font-black text-slate-400 uppercase">Km Acumulado</span>
                         <span className="text-sm md:text-base font-black text-slate-800">{(v.currentKm || 0).toLocaleString()} KM</span>
                      </div>
                   </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center">
                    <LucideSearch size={48} className="mx-auto text-slate-200 mb-4"/>
                    <p className="text-slate-400 font-black uppercase text-xs">No hay coincidencias con la búsqueda</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-6">Unidad</th>
                    <th className="px-8 py-6">Kilometraje</th>
                    <th className="px-8 py-6">Centro de Costo</th>
                    <th className="px-8 py-6">Estado</th>
                    <th className="px-8 py-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(v => (
                    <tr key={v.plate} onClick={() => navigate(`/vehicles/detail/${v.plate}`)} className="hover:bg-blue-50/50 cursor-pointer transition-all group">
                      <td className="px-8 py-6">
                        <div>
                            <p className="font-black text-slate-800 text-sm uppercase leading-none">{v.plate}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{v.make} {v.model}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-700 text-sm">{(v.currentKm || 0).toLocaleString()} KM</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{v.costCenter}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${v.status === VehicleStatus.ACTIVE ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {isAdmin && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPlateToDelete(v.plate); }}
                              className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                            >
                              <LucideTrash2 size={16}/>
                            </button>
                          )}
                          <LucideChevronRight className="text-slate-200 group-hover:text-blue-600 transition-all" size={20}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="py-32 bg-white rounded-[3.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-10">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                <LucideBox size={60}/>
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Inventario Vacío</h2>
            <p className="text-slate-400 font-bold text-xs mt-4 max-w-sm leading-relaxed uppercase tracking-widest">
                No se han detectado unidades registradas en la base de datos empresarial. Comience cargando su primer activo o utilice la carga masiva desde el panel de administración.
            </p>
            <Link to="/vehicles/new" className="mt-10 px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all transform active:scale-95 flex items-center gap-3">
                <LucidePlus size={22}/> Realizar Primer Alta
            </Link>
        </div>
      )}
    </div>
  );
};