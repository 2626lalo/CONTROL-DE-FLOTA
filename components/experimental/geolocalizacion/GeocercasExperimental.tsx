
import React, { useState } from 'react';
import { LucideShield, LucidePlus, LucideTarget, LucideX, LucideTrash2, LucideCheck, LucideBell } from 'lucide-react';

export const GeocercasExperimental: React.FC = () => {
  const [geocercas, setGeocercas] = useState<any[]>([
    { id: 1, name: 'BASE CENTRAL MENDOZA', type: 'CIRCULO', color: '#3b82f6', vehicles: 45, alerts: true },
    { id: 2, name: 'ZONA DE CARGA PUERTO', type: 'POLIGONO', color: '#ef4444', vehicles: 12, alerts: true }
  ]);

  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 animate-fadeIn h-full flex flex-col">
      <div className="flex justify-between items-center border-b pb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100">
            <LucideShield size={24}/>
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-800 uppercase italic leading-none">Gestión de Geocercas</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Perímetros de Seguridad</p>
          </div>
        </div>
        <button className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-emerald-600 transition-all active:scale-95">
          <LucidePlus size={20}/>
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
        {geocercas.map(geo => (
          <div key={geo.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 group hover:bg-white hover:shadow-xl transition-all">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: geo.color }}></div>
                   <div>
                      <h5 className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{geo.name}</h5>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{geo.type}</p>
                   </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-2 text-slate-300 hover:text-rose-500 transition-all"><LucideTrash2 size={16}/></button>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-white border border-slate-100 rounded-xl">
                   <p className="text-[7px] font-black text-slate-400 uppercase">Activos</p>
                   <p className="text-xs font-black text-slate-800">{geo.vehicles} Unidades</p>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl">
                   <p className="text-[7px] font-black text-slate-400 uppercase">Alertas</p>
                   <div className="flex items-center gap-2 text-emerald-600">
                      <LucideCheck size={10}/>
                      <span className="text-[8px] font-black uppercase">Activo</span>
                   </div>
                </div>
             </div>

             <button className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">
                <LucideTarget size={14}/> Configurar Reglas
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};
