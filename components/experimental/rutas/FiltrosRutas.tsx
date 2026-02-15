
import React from 'react';
import { LucideFilter, LucideSearch, LucideCalendar, LucideRotateCcw } from 'lucide-react';

export const FiltrosRutas: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-end animate-fadeIn relative z-40">
      <div className="space-y-2">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><LucideSearch size={10}/> Patente / Lugar</label>
        <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none" placeholder="BUSCAR..." />
      </div>
      <div className="space-y-2">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><LucideCalendar size={10}/> Fecha</label>
        <input type="date" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none" />
      </div>
      <div className="space-y-2">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Estado</label>
        <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase outline-none">
          <option value="">TODOS</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="EN CURSO">EN CURSO</option>
          <option value="COMPLETADO">COMPLETADO</option>
        </select>
      </div>
      <button className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 border border-slate-200"><LucideRotateCcw size={14}/> Limpiar</button>
    </div>
  );
};
