
import React from 'react';
import { LucideShield, LucideTarget, LucideBell, LucideX, LucideSave, LucideTrash2 } from 'lucide-react';

interface Props {
  geofence: any;
  onClose: () => void;
}

export const DetalleGeocerca: React.FC<Props> = ({ geofence, onClose }) => {
  return (
    <div className="bg-white rounded-[3.5rem] shadow-2xl p-10 space-y-8 animate-fadeIn border-t-[12px] border-emerald-600">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg">
            <LucideShield size={24}/>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{geofence.name}</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Reglas de Perímetro</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"><LucideX/></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <LucideTarget size={14} className="text-indigo-600"/> Definición de Disparadores
          </h4>
          <div className="space-y-3">
             {['Alerta al Entrar', 'Alerta al Salir', 'Permanencia Prohibida', 'Exceso de Velocidad en Zona'].map((rule, i) => (
               <label key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group hover:bg-indigo-50 transition-all">
                  <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-indigo-800">{rule}</span>
                  <div className="w-10 h-5 bg-slate-200 rounded-full relative transition-all">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-md"></div>
                  </div>
               </label>
             ))}
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <LucideBell size={14} className="text-amber-500"/> Notificaciones
          </h4>
          <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-xl space-y-4">
            <p className="text-[8px] font-black text-slate-500 uppercase">Canales de Alerta</p>
            <div className="flex gap-2">
               <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase">Push App</span>
               <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase">WhatsApp</span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium italic mt-4">
              "Se notificará al Jefe de Flota y al Conductor asignado en caso de infracción de perímetro."
            </p>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex gap-4">
        <button className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] hover:text-rose-600">Eliminar Geocerca</button>
        <button className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3 active:scale-95">
          <LucideSave size={18}/> Sincronizar Reglas
        </button>
      </div>
    </div>
  );
};
