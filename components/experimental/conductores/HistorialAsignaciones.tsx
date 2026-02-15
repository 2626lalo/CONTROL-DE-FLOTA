
import React from 'react';
import { LucideHistory, LucideCar, LucideCalendar, LucideGauge } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  asignaciones: any[];
}

export const HistorialAsignaciones: React.FC<Props> = ({ asignaciones }) => {
  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 animate-fadeIn">
      <div className="flex items-center gap-4 border-b pb-6">
        <LucideHistory className="text-blue-600" size={24}/>
        <h4 className="text-xl font-black text-slate-800 uppercase italic">Bitácora de Asignaciones</h4>
      </div>

      <div className="space-y-10 relative before:absolute before:left-8 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {asignaciones.map((a, idx) => (
          <div key={idx} className="relative pl-20 group">
            <div className={`absolute left-[1.35rem] top-1.5 w-5 h-5 rounded-full z-10 border-4 border-white shadow-md ${!a.fechaFin ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`}></div>
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all group-hover:scale-[1.01]">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg">
                    <LucideCar size={20}/>
                  </div>
                  <div>
                    <h5 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{a.vehiclePlate}</h5>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-widest italic">{a.tipo}</p>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${!a.fechaFin ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  {!a.fechaFin ? 'ACTUALMENTE ASIGNADO' : 'HISTÓRICO'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-200/50">
                <div className="flex items-center gap-3">
                   <LucideCalendar className="text-slate-400" size={16}/>
                   <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase">Inicio</p>
                     <p className="text-[11px] font-bold text-slate-700">{format(parseISO(a.fechaInicio), 'dd/MM/yyyy')}</p>
                   </div>
                </div>
                {a.fechaFin && (
                  <div className="flex items-center gap-3">
                    <LucideCalendar className="text-slate-400" size={16}/>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">Finalización</p>
                      <p className="text-[11px] font-bold text-slate-700">{format(parseISO(a.fechaFin), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                   <LucideGauge className="text-slate-400" size={16}/>
                   <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase">KM Entrega</p>
                     <p className="text-[11px] font-bold text-slate-700">{a.startKm?.toLocaleString()} KM</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {asignaciones.length === 0 && (
          <div className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest text-xs">Sin registros históricos de flota</div>
        )}
      </div>
    </div>
  );
};
