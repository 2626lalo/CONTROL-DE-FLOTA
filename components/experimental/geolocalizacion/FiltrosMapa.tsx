
import React from 'react';
import { LucideFilter, LucideCar, LucideActivity, LucideBox, LucideRotateCcw } from 'lucide-react';
import { VehicleStatus } from '../../../types';

interface Props {
  status: string;
  setStatus: (v: string) => void;
  costCenter: string;
  setCostCenter: (v: string) => void;
  costCenters: string[];
  onReset: () => void;
}

export const FiltrosMapa: React.FC<Props> = ({ status, setStatus, costCenter, setCostCenter, costCenters, onReset }) => {
  return (
    <div className="p-4 bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-xl space-y-4 animate-fadeIn">
      <div className="flex items-center gap-2 px-2 border-b border-slate-50 pb-2">
        <LucideFilter size={14} className="text-blue-600"/>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filtros de Visibilidad</span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[7px] font-black text-slate-400 uppercase ml-2">Estado Operativo</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-100"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="">TODOS LOS ESTADOS</option>
            {Object.values(VehicleStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[7px] font-black text-slate-400 uppercase ml-2">Centro de Costo</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-100"
            value={costCenter}
            onChange={e => setCostCenter(e.target.value)}
          >
            <option value="">TODAS LAS BASES</option>
            {costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
          </select>
        </div>

        <button 
          onClick={onReset}
          className="w-full py-2 bg-slate-100 text-slate-400 hover:text-rose-500 rounded-xl text-[8px] font-black uppercase transition-all flex items-center justify-center gap-2"
        >
          <LucideRotateCcw size={12}/> Restablecer Mapa
        </button>
      </div>
    </div>
  );
};
