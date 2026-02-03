import React, { useState } from 'react';
import { useApp } from '../context/FleetContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LucidePlus, LucideSearch, LucideLayoutGrid, LucideList, 
  LucideCar, LucideShieldCheck, LucideWrench, LucideAlertTriangle, 
  LucideBuilding2, LucideCheckCircle2, LucideChevronRight, 
  LucideInfo, LucideLayers, LucideMapPin, LucideDatabase, LucideFuel,
  LucideTrash2
} from 'lucide-react';
import { Vehicle, VehicleStatus, UserRole } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

export const VehicleList = () => {
  const { vehicles, user, deleteVehicle } = useApp();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCC, setFilterCC] = useState('');
  const [plateToDelete, setPlateToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const isMainAdmin = user?.email === 'alewilczek@gmail.com';

  const costCenters = Array.from(new Set(vehicles.map(v => v.costCenter).filter(Boolean)));

  const filtered = vehicles.filter(v => {
    const term = search.toLowerCase();
    const plate = v.plate || '';
    const model = v.model || '';
    const vin = v.vin || '';
    const motorNum = v.motorNum || '';
    
    const matchesSearch = plate.toLowerCase().includes(term) || 
                          model.toLowerCase().includes(term) ||
                          vin.toLowerCase().includes(term) ||
                          motorNum.toLowerCase().includes(term);
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
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      <ConfirmationModal 
        isOpen={!!plateToDelete}
        title="Eliminación Integral de Unidad"
        message={`¿Está completamente seguro de eliminar la unidad ${plateToDelete}? Esta acción es irreversible y purgará todos los registros históricos, servicios y checklists asociados a este dominio en todo el sistema.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setPlateToDelete(null)}
        isDanger={true}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LucideDatabase className="text-blue-600" size={20}/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Management System</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Flota Corporativa</h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
             <button onClick={() => setViewMode('GRID')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                <LucideLayoutGrid size={20}/>
             </button>
             <button onClick={() => setViewMode('TABLE')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'TABLE' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                <LucideList size={20}/>
             </button>
          </div>
          <Link to="/vehicles/new" className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all transform active:scale-95">
            <LucidePlus size={20}/> Nueva Unidad
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="md:col-span-2 relative">
            <LucideSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
              type="text" 
              placeholder="Buscar por Patente, Chasis, Motor..." 
              className="w-full pl-14 pr-6 py-4.5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-700 uppercase"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <select 
            className="p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm font-black text-[10px] uppercase tracking-widest outline-none appearance-none"
            value={filterCC}
            onChange={e => setFilterCC(e.target.value)}
         >
            <option value="">Centro de Costo</option>
            {costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
         </select>
         <select 
            className="p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm font-black text-[10px] uppercase tracking-widest outline-none appearance-none"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
         >
            <option value="">Estado Operativo</option>
            {Object.values(VehicleStatus).map(s => <option key={s} value={s}>{s}</option>)}
         </select>
      </div>

      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filtered.map(v => (
            <div key={v.plate} onClick={() => navigate(`/vehicles/detail/${v.plate}`)} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-2xl transition-all group hover:border-blue-300 relative">
               <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {v.images.front ? <img src={v.images.front} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={v.plate} /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-200"><LucideCar size={48} className="opacity-20"/></div>}
                  <div className={`absolute top-5 right-5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v.status === VehicleStatus.ACTIVE ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {v.status}
                  </div>
                  {isMainAdmin && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlateToDelete(v.plate);
                      }}
                      className="absolute top-5 left-5 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100 shadow-lg border border-white/10"
                    >
                      <LucideTrash2 size={16}/>
                    </button>
                  )}
               </div>
               <div className="p-8">
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">{v.plate || 'SIN DOMINIO'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{v.make || 'Genérico'} {v.model || 'Sin Modelo'}</p>
                  <div className="mt-6 flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Km Acumulado</span>
                     <span className="text-base font-black text-slate-800">{(v.currentKm || 0).toLocaleString()} KM</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Unidad / Patente</th>
                <th className="px-8 py-6">Info Técnica</th>
                <th className="px-8 py-6">Kilometraje</th>
                <th className="px-8 py-6">Centro de Costo</th>
                <th className="px-8 py-6">Estado</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(v => (
                <tr key={v.plate} onClick={() => navigate(`/vehicles/detail/${v.plate}`)} className="hover:bg-blue-50/50 cursor-pointer transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-600 transition-colors">
                        {(v.plate || '??').substring(0,2)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-base tracking-tighter uppercase leading-none">{v.plate || 'S/D'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{v.make} {v.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><LucideFuel size={10}/> {v.fuelType}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-700 text-sm leading-none">{(v.currentKm || 0).toLocaleString()} KM</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[9px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100">{v.costCenter || 'S/A'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${v.status === VehicleStatus.ACTIVE ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                        {isMainAdmin && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPlateToDelete(v.plate);
                                }}
                                className="p-2.5 text-slate-300 hover:text-rose-600 transition-colors"
                            >
                                <LucideTrash2 size={18}/>
                            </button>
                        )}
                        <LucideChevronRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" size={24}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};