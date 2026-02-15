
import React from 'react';
import { LucideCar, LucideNavigation2, LucideActivity, LucideAlertTriangle, LucideCheckCircle2 } from 'lucide-react';
import { Vehicle } from '../../../types';

interface Props {
  vehicles: Vehicle[];
  ubicaciones: any[];
  onSelect: (plate: string) => void;
}

export const UltimaUbicacion: React.FC<Props> = ({ vehicles, ubicaciones, onSelect }) => {
  return (
    <div className="space-y-6">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-4 flex items-center justify-between">
        Estado de Telemetría 
        <span className="text-blue-600">{vehicles.length} Activos</span>
      </h4>
      <div className="space-y-4">
        {vehicles.map(v => {
          const lastPos = ubicaciones.find(u => u.vehiclePlate === v.plate);
          const isOnline = lastPos && (Date.now() - new Date(lastPos.timestamp).getTime()) < 3600000;

          return (
            <div 
              key={v.plate} 
              onClick={() => onSelect(v.plate)}
              className="bg-slate-50 p-6 rounded-[2.2rem] border-2 border-transparent hover:border-blue-200 hover:bg-white hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl shadow-lg transition-all ${isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                       <LucideCar size={20}/>
                    </div>
                    <div>
                       <h5 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter leading-none">{v.plate}</h5>
                       <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{v.make} {v.model}</p>
                    </div>
                 </div>
                 <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
              </div>

              {lastPos ? (
                <div className="grid grid-cols-2 gap-3 mt-6">
                   <div className="text-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-[7px] font-black text-slate-400 uppercase">Velocidad</p>
                      <p className="text-sm font-black text-slate-800">{lastPos.velocidad} KM/H</p>
                   </div>
                   <div className="text-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-[7px] font-black text-slate-400 uppercase">Precisión</p>
                      <p className="text-sm font-black text-slate-800">{lastPos.precision}m</p>
                   </div>
                </div>
              ) : (
                <div className="mt-6 flex items-center gap-3 text-slate-400 italic">
                   <LucideAlertTriangle size={14}/>
                   <span className="text-[9px] font-bold uppercase">Sin datos de reporte reciente</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
