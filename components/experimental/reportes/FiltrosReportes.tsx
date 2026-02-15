import React from 'react';
import { LucideFilter, LucideCalendar, LucideLayers, LucideFileText, LucideRotateCcw, LucideActivity, LucideSearch } from 'lucide-react';
import { ServiceStage } from '../../../types';

interface Props {
  type: string;
  setType: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  costCenter: string;
  setCostCenter: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  allCCs: string[];
  onReset: () => void;
  resultCount: number;
}

export const FiltrosReportes: React.FC<Props> = (props) => {
  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 animate-fadeIn relative z-40">
      <div className="flex justify-between items-center px-2">
         <div className="flex items-center gap-2">
            <LucideFilter size={16} className="text-blue-600"/>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Configuración de Filtros</span>
         </div>
         <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">
            {props.resultCount} Registros
         </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
            <LucideFileText size={10}/> Tipo de Reporte
          </label>
          <select 
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase outline-none focus:bg-white transition-all"
            value={props.type}
            onChange={e => props.setType(e.target.value)}
          >
            <option value="VEHICULOS">INVENTARIO VEHÍCULOS</option>
            <option value="SERVICIOS">HISTORIAL SERVICIOS</option>
            <option value="USUARIOS">DIRECTORIO USUARIOS</option>
            <option value="MANTENIMIENTO">ALERTA MANTENIMIENTO</option>
            <option value="COSTOS">ESTADÍSTICA DE COSTOS</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
            <LucideLayers size={10}/> Centro de Costo
          </label>
          <select 
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase outline-none focus:bg-white"
            value={props.costCenter}
            onChange={e => props.setCostCenter(e.target.value)}
          >
            <option value="">TODOS</option>
            {props.allCCs.map(cc => <option key={cc} value={cc}>{cc}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
            <LucideActivity size={10}/> Estado / Etapa
          </label>
          <select 
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase outline-none focus:bg-white"
            value={props.status}
            onChange={e => props.setStatus(e.target.value)}
          >
            <option value="">CUALQUIERA</option>
            {props.type === 'SERVICIOS' ? (
              Object.values(ServiceStage).map(s => <option key={s} value={s}>{s}</option>)
            ) : props.type === 'USUARIOS' ? (
              ['ACTIVO', 'INACTIVO', 'PENDIENTE', 'BLOQUEADO'].map(s => <option key={s} value={s}>{s}</option>)
            ) : (
              ['ACTIVO', 'EN TALLER', 'INACTIVO'].map(s => <option key={s} value={s}>{s}</option>)
            )}
          </select>
        </div>

        <div className="space-y-2 lg:col-span-1">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
            <LucideCalendar size={10}/> Rango Cronológico
          </label>
          <div className="flex gap-2">
            <input type="date" className="flex-1 px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[9px] outline-none" value={props.dateFrom} onChange={e => props.setDateFrom(e.target.value)} />
            <input type="date" className="flex-1 px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[9px] outline-none" value={props.dateTo} onChange={e => props.setDateTo(e.target.value)} />
          </div>
        </div>

        <div>
           <button 
             onClick={props.onReset}
             className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2 border border-slate-200"
           >
             <LucideRotateCcw size={14}/> Limpiar Filtros
           </button>
        </div>
      </div>
    </div>
  );
};