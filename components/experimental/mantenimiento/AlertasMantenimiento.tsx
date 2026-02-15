
import React from 'react';
import { LucideAlertCircle, LucideGauge, LucideArrowRight, LucideClock } from 'lucide-react';
import { Vehicle } from '../../../types';

interface Props {
  vehicles: Vehicle[];
  mantenimientos: any[];
  limit?: number;
}

export const AlertasMantenimiento: React.FC<Props> = ({ vehicles, limit }) => {
  const alerts = vehicles.map(v => {
    const kmRestante = (v.nextServiceKm || 0) - (v.currentKm || 0);
    let severity: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN';
    
    if (kmRestante <= 500) severity = 'RED';
    else if (kmRestante <= 1500) severity = 'YELLOW';

    return {
      ...v,
      kmRestante,
      severity
    };
  }).filter(v => v.severity !== 'GREEN')
    .sort((a, b) => a.kmRestante - b.kmRestante);

  const displayAlerts = limit ? alerts.slice(0, limit) : alerts;

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <LucideAlertCircle className="text-rose-500" size={16}/> Alertas de Servicio Inminente
        </h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayAlerts.map(v => (
          <div 
            key={v.plate} 
            className={`p-8 rounded-[2.5rem] border-2 transition-all hover:shadow-xl relative overflow-hidden group ${
              v.severity === 'RED' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl shadow-lg ${v.severity === 'RED' ? 'bg-rose-600' : 'bg-amber-500'} text-white`}>
                <LucideGauge size={24}/>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                v.severity === 'RED' ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {v.kmRestante <= 0 ? 'KILOMETRAJE EXCEDIDO' : `FALTAN ${v.kmRestante.toLocaleString()} KM`}
              </span>
            </div>
            
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">{v.plate}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{v.make} {v.model}</p>
            
            <div className="mt-8 pt-6 border-t border-slate-200/50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-500 font-black text-[9px] uppercase tracking-widest">
                <LucideClock size={14}/> Siguiente hito: {v.nextServiceKm.toLocaleString()} KM
              </div>
              <button className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-blue-600 transition-all group-hover:translate-x-1">
                <LucideArrowRight size={18}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
