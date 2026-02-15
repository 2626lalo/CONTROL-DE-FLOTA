
import React from 'react';
import { LucideTimer, LucideNavigation2, LucideDollarSign, LucideArrowLeft, LucideCheck } from 'lucide-react';
import { CostosRuta } from './CostosRuta';

// FIX: Declare google global variable to avoid TypeScript errors
declare const google: any;

interface Props {
  // FIX: Using any[] for routes to resolve google namespace existence error
  routes: any[];
  onSelect: (index: number) => void;
  onBack: () => void;
}

export const ComparadorRutas: React.FC<Props> = ({ routes, onSelect, onBack }) => {
  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 p-12 flex flex-col animate-fadeIn">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all shadow-sm"><LucideArrowLeft size={24}/></button>
          <div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Comparador de Alternativas</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Análisis Multi-Criterio de Despacho</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 overflow-y-auto custom-scrollbar p-2">
        {routes.map((route, idx) => {
          const leg = route.legs[0];
          const distKm = (leg.distance?.value || 0) / 1000;
          const duration = leg.duration?.text || '';
          
          return (
            <div key={idx} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-2xl transition-all group overflow-hidden">
               <div className="p-10 space-y-10 flex-1">
                  <div className="flex justify-between items-start">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${idx === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {idx === 0 ? 'Opción Recomendada' : `Alternativa ${idx + 1}`}
                    </span>
                    <LucideNavigation2 className="text-slate-200 group-hover:text-blue-500 transition-colors" size={32}/>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><LucideNavigation2 size={10}/> Distancia</p>
                       <p className="text-2xl font-black text-slate-800 italic">{distKm.toFixed(1)} <span className="text-xs">KM</span></p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><LucideTimer size={10}/> Tiempo Est.</p>
                       <p className="text-2xl font-black text-slate-800 italic uppercase">{duration}</p>
                    </div>
                  </div>

                  <CostosRuta distance={distKm} />
               </div>

               <button 
                onClick={() => onSelect(idx)}
                className="w-full py-6 bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.3em] group-hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
               >
                 <LucideCheck size={18}/> Seleccionar Opción
               </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
