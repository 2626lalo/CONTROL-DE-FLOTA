
import React from 'react';
import { LucideActivity, LucideTrendingUp, LucideTimer, LucideZap, LucideNavigation } from 'lucide-react';

export const EstadisticasMapa: React.FC = () => {
  return (
    <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <LucideActivity className="text-blue-400" size={20}/>
          <h4 className="text-xs font-black uppercase tracking-widest italic">Telemetría Agregada</h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">KMs Recorridos (24h)</p>
            <p className="text-2xl font-black italic text-blue-400 leading-none">1,402</p>
          </div>
          <div className="space-y-1">
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Unidades Online</p>
            <div className="flex items-center gap-2">
               <p className="text-2xl font-black italic text-emerald-400 leading-none">92%</p>
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-black text-slate-400 uppercase">Eficiencia de Ruta</span>
            <span className="text-[8px] font-black text-blue-400">88%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[88%] shadow-lg"></div>
          </div>
        </div>
      </div>
      <LucideNavigation className="absolute -right-8 -bottom-8 text-white opacity-5 group-hover:scale-110 transition-transform duration-700" size={160}/>
    </div>
  );
};
