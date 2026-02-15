import React from 'react';
import { LucideSearch, LucideFilter, LucideRotateCcw, LucideCalendar, LucideLayers, LucideTarget } from 'lucide-react';
import { ServiceStage } from '../../types';

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: any) => void;
  filterCC: string;
  setFilterCC: (v: string) => void;
  filterPriority: string;
  setFilterPriority: (v: string) => void;
  filterDateFrom: string;
  setFilterDateFrom: (v: string) => void;
  filterDateTo: string;
  setFilterDateTo: (v: string) => void;
  allCCs: string[];
  onReset: () => void;
}

export const FiltrosAvanzados: React.FC<Props> = (props) => {
  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 items-end animate-fadeIn relative z-40">
      <div className="space-y-2 lg:col-span-2">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
          <LucideSearch size={10}/> Patente / Código Evento
        </label>
        <input 
          type="text" 
          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-8 focus:ring-blue-50 transition-all" 
          placeholder="BUSCAR..." 
          value={props.searchQuery}
          onChange={e => props.setSearchQuery(e.target.value)} 
        />
      </div>

      <div className="space-y-2">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
          <LucideLayers size={10}/> C. Costo
        </label>
        <select 
          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase outline-none focus:bg-white"
          value={props.filterCC}
          onChange={e => props.setFilterCC(e.target.value)}
        >
          <option value="">TODOS</option>
          {props.allCCs.map(cc => <option key={cc} value={cc}>{cc}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
          <LucideTarget size={10}/> Prioridad
        </label>
        <select 
          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase outline-none focus:bg-white"
          value={props.filterPriority}
          onChange={e => props.setFilterPriority(e.target.value)}
        >
          <option value="">TODAS</option>
          <option value="URGENTE">URGENTE</option>
          <option value="ALTA">ALTA</option>
          <option value="MEDIA">MEDIA</option>
          <option value="BAJA">BAJA</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
          <LucideCalendar size={10}/> Rango de Fecha
        </label>
        <div className="flex gap-2">
          <input type="date" className="flex-1 px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[9px] outline-none" value={props.filterDateFrom} onChange={e => props.setFilterDateFrom(e.target.value)} />
          <input type="date" className="flex-1 px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[9px] outline-none" value={props.filterDateTo} onChange={e => props.setFilterDateTo(e.target.value)} />
        </div>
      </div>

      <div className="lg:col-span-1">
         <button 
           onClick={props.onReset}
           className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2 border border-slate-200"
         >
           <LucideRotateCcw size={14}/> Limpiar
         </button>
      </div>
    </div>
  );
};