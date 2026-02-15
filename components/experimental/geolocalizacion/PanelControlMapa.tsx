
import React from 'react';
import { 
  Layers as LucideLayers, 
  Maximize as LucideMaximize, 
  Navigation as LucideNavigation, 
  Locate as LucideLocate, 
  Ruler as LucideRuler, 
  TrafficCone as LucideTrafficCone 
} from 'lucide-react';

interface Props {
  activeView: string;
}

export const PanelControlMapa: React.FC<Props> = ({ activeView }) => {
  return (
    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-[500] animate-fadeIn">
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-[2rem] shadow-2xl border border-white flex flex-col gap-2">
        {[
          { icon: LucideLocate, label: 'Mi Posición', color: 'blue' },
          { icon: LucideLayers, label: 'Capas', color: 'slate' },
          { icon: LucideTrafficCone, label: 'Tráfico', color: 'rose' },
          { icon: LucideRuler, label: 'Medir', color: 'emerald' },
        ].map((btn, idx) => (
          <button 
            key={idx}
            className={`p-4 rounded-2xl transition-all shadow-sm group relative ${
              btn.color === 'blue' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <btn.icon size={22}/>
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl">
              {btn.label}
            </div>
          </button>
        ))}
      </div>

      <button className="p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-blue-600 transition-all active:scale-90">
         <LucideMaximize size={24}/>
      </button>
    </div>
  );
};
