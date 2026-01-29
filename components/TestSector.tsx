import React from 'react';
import { 
  LucideFlaskConical, LucideSparkles, LucideTerminal, 
  LucideBox, LucideCode2, LucideZap,
  // Added missing LucideInfo import
  LucideInfo
} from 'lucide-react';

export const TestSector = () => {
  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {/* Cabecera del Laboratorio - Mantenemos la identidad visual */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg">
               <LucideFlaskConical size={20}/>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ambiente de Desarrollo Limpio</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Laboratorio Técnico</h1>
          <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest flex items-center gap-2">
            <LucideCode2 size={12} className="text-indigo-500"/> Área lista para nueva implementación
          </p>
        </div>
      </div>

      {/* Espacio de trabajo vacío (Blank Canvas) */}
      <div className="min-h-[600px] bg-slate-950 rounded-[4rem] shadow-2xl border-4 border-slate-900 flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="relative z-10 text-center space-y-6 max-w-lg px-10">
          <div className="w-24 h-24 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
             <LucideTerminal size={40} className="text-indigo-400 opacity-50"/>
          </div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Área de Prototipado Vacía</h2>
          <p className="text-slate-400 font-medium text-sm leading-relaxed">
            Se ha purgado todo el código experimental anterior. Este sector está ahora en estado <span className="text-indigo-400 font-black">"Baseline Zero"</span>, listo para recibir la nueva sección que decidas desarrollar.
          </p>
          <div className="flex justify-center gap-4 pt-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <LucideZap size={14} className="text-amber-400"/>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Listo para Inyectar Código</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <LucideBox size={14} className="text-blue-400"/>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Entorno Aislado</span>
             </div>
          </div>
        </div>

        {/* Capa estética de fondo (Rejilla técnica) */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <LucideSparkles className="absolute -bottom-20 -right-20 text-white opacity-5 group-hover:scale-110 transition-transform duration-1000" size={400}/>
      </div>

      {/* Footer Informativo */}
      <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] flex items-center gap-6">
         <div className="p-4 bg-white rounded-2xl shadow-sm">
            <LucideInfo className="text-indigo-600" size={24}/>
         </div>
         <p className="text-xs font-bold text-indigo-900/60 leading-relaxed uppercase tracking-tight">
           Recuerda que cualquier cambio realizado aquí no afectará al resto de la aplicación hasta que solicites su integración oficial en el menú principal.
         </p>
      </div>
    </div>
  );
};