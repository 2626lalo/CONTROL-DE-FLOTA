
import React from 'react';
import { LucideTimer, LucideNavigation2, LucideDollarSign, LucideArrowLeft, LucideCheck, LucideShieldCheck, LucideZap } from 'lucide-react';
import { CostosRuta } from './CostosRuta';

interface Props {
  routes: any[];
  onSelect: (index: number) => void;
  onBack: () => void;
}

export const ComparadorRutas: React.FC<Props> = ({ routes, onSelect, onBack }) => {
  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 p-10 flex flex-col animate-fadeIn">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><LucideArrowLeft size={24}/></button>
          <div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Trayectorias Halladas</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <LucideZap size={14} className="text-amber-500 animate-pulse"/> Análisis de Alternativas de Despacho
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 flex-1 overflow-y-auto custom-scrollbar p-2">
        {routes.map((route, idx) => {
          const leg = route.legs[0];
          // Distancia total sumando todos los tramos si hay paradas
          const totalDistMeters = route.legs.reduce((acc: number, l: any) => acc + (l.distance?.value || 0), 0);
          const totalDistKm = totalDistMeters / 1000;
          
          const totalDurationSeconds = route.legs.reduce((acc: number, l: any) => acc + (l.duration?.value || 0), 0);
          const durationText = `${Math.floor(totalDurationSeconds / 3600)}h ${Math.floor((totalDurationSeconds % 3600) / 60)}m`;
          
          return (
            <div key={idx} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-3xl transition-all group overflow-hidden border-t-[8px] border-t-slate-100 hover:border-t-blue-600">
               <div className="p-10 space-y-8 flex-1">
                  <div className="flex justify-between items-start">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${idx === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                      {idx === 0 ? 'MÁS RÁPIDA (RECOMENDADA)' : `ALTERNATIVA ${idx + 1}`}
                    </span>
                    <LucideNavigation2 className="text-slate-100 group-hover:text-blue-500 transition-colors" size={40}/>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Distancia Total</p>
                           <p className="text-2xl font-black text-slate-800 italic">{totalDistKm.toFixed(1)} <span className="text-sm">KM</span></p>
                        </div>
                        <div className="text-right">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tiempo Estimado</p>
                           <p className="text-xl font-black text-slate-800 italic uppercase">{durationText}</p>
                        </div>
                    </div>
                    
                    <CostosRuta distance={totalDistKm} />
                  </div>

                  <div className="space-y-4">
                     <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                        <LucideShieldCheck size={12} className="text-emerald-500"/> Atributos de Ruta
                     </h5>
                     <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase">Sin Peajes</span>
                        <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase">Vía Troncal</span>
                        {idx === 0 && <span className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-[8px] font-black text-blue-600 uppercase">Ecoeficiente</span>}
                     </div>
                  </div>
               </div>

               <button 
                onClick={() => onSelect(idx)}
                className="w-full py-8 bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.4em] hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95"
               >
                 <LucideCheck size={20}/> Seleccionar y Asignar
               </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
