
import React from 'react';
import { LucideAlertCircle, LucideGauge, LucideArrowRight, LucideClock, LucideAlertTriangle, LucideShieldAlert } from 'lucide-react';
import { Vehicle } from '../../../types';

interface Props {
  vehicles: Vehicle[];
  mantenimientos: any[];
  alerts: any[];
  full?: boolean;
}

export const AlertasMantenimiento: React.FC<Props> = ({ vehicles, alerts, full }) => {
  if (alerts.length === 0) return (
    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm text-center">
       <LucideShieldAlert className="mx-auto text-emerald-100 mb-6" size={64}/>
       <h4 className="text-xl font-black text-slate-300 uppercase italic tracking-tighter">Sin Alertas Críticas</h4>
       <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">La flota se encuentra dentro de los parámetros de compliance.</p>
    </div>
  );

  const displayAlerts = full ? alerts : alerts.slice(0, 3);

  return (
    <div className="space-y-6">
      {!full && (
        <div className="flex items-center justify-between px-4">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <LucideAlertTriangle className="text-rose-500" size={16}/> Urgencias Técnicas Detectadas
          </h4>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayAlerts.map((alert, i) => (
          <div 
            key={i} 
            className={`p-8 rounded-[2.5rem] border-2 transition-all hover:shadow-xl relative overflow-hidden group animate-fadeIn ${
              alert.urgencia === 'alta' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl shadow-lg ${alert.urgencia === 'alta' ? 'bg-rose-600' : 'bg-amber-500'} text-white`}>
                {alert.tipo === 'service' ? <LucideGauge size={24}/> : <LucideAlertCircle size={24}/>}
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                alert.urgencia === 'alta' ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {alert.urgencia === 'alta' ? 'CRÍTICO' : 'ATENCIÓN'}
              </span>
            </div>
            
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">{alert.patente}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">{alert.mensaje}</p>
            
            <div className="mt-8 p-4 bg-white/50 rounded-2xl border border-white/50">
               <p className={`text-lg font-black italic tracking-tighter ${alert.urgencia === 'alta' ? 'text-rose-600' : 'text-amber-600'}`}>{alert.valor}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/50 flex justify-between items-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <LucideClock size={10}/> REQUIERE ACCIÓN INMEDIATA
              </span>
              <LucideArrowRight className="text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" size={18}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
