
import React, { useState } from 'react';
import { LucideHistory, LucideCalendar, LucidePlay, LucideDownload, LucideArrowLeft, LucideMapPin } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { format } from 'date-fns';

export const HistorialRutas: React.FC = () => {
  const { vehicles } = useApp();
  const [selectedPlate, setSelectedPlate] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isReplaying, setIsReplaying] = useState(false);

  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 animate-fadeIn h-full flex flex-col">
      <div className="flex items-center gap-4 border-b pb-6 shrink-0">
        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
          <LucideHistory size={24}/>
        </div>
        <div>
          <h4 className="text-xl font-black text-slate-800 uppercase italic">Reconstrucción de Rutas</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Auditoría Operativa Satelital</p>
        </div>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Unidad Patrimonial</label>
            <select 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              value={selectedPlate}
              onChange={e => setSelectedPlate(e.target.value)}
            >
              <option value="">SELECCIONE...</option>
              {vehicles.map(v => <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha de Auditoría</label>
            <div className="relative">
              <LucideCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input 
                type="date" 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {selectedPlate && (
          <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white shadow-2xl space-y-6 animate-fadeIn">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resumen del Viaje</p>
                   <h5 className="text-2xl font-black italic tracking-tighter text-blue-400 mt-2">142.5 KM RECORRIDOS</h5>
                </div>
                <LucideMapPin className="text-slate-700" size={32}/>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <p className="text-[7px] font-black text-slate-500 uppercase">Tiempo Total</p>
                   <p className="text-lg font-black">04:22 HS</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <p className="text-[7px] font-black text-slate-500 uppercase">Vel. Media</p>
                   <p className="text-lg font-black">62 KM/H</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setIsReplaying(!isReplaying)}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2"
                >
                  <LucidePlay size={16}/> {isReplaying ? 'Detener' : 'Reproducir'}
                </button>
                <button className="p-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
                  <LucideDownload size={18}/>
                </button>
             </div>
          </div>
        )}
      </div>
      
      <div className="pt-6 border-t border-slate-100 flex items-center gap-2">
         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Base de Datos GPS Sincronizada</p>
      </div>
    </div>
  );
};
