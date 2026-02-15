
import React from 'react';
import { LucideHistory, LucideArrowLeft, LucideCalendar, LucideWrench, LucideDollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface Props {
  plate: string;
  mantenimientos: any[];
  onBack: () => void;
}

export const DetalleServicioVehiculo: React.FC<Props> = ({ plate, mantenimientos, onBack }) => {
  const historial = mantenimientos
    .filter(m => m.vehiclePlate === plate)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const totalInvertido = historial.reduce((acc, curr) => acc + (curr.costo || 0), 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center gap-6">
        <button onClick={onBack} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-400 hover:text-slate-800 transition-all active:scale-95">
          <LucideArrowLeft size={24}/>
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{plate}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Bitácora Técnica del Activo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-between overflow-hidden relative">
           <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Inversión Histórica</p>
              <h3 className="text-4xl font-black italic tracking-tighter">${totalInvertido.toLocaleString()}</h3>
           </div>
           <LucideDollarSign className="absolute -right-8 -bottom-8 opacity-5" size={160}/>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm col-span-2 flex items-center gap-8">
           <div className="p-5 bg-blue-50 text-blue-600 rounded-3xl"><LucideWrench size={32}/></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Intervenciones</p>
              <h3 className="text-3xl font-black text-slate-800 italic">{historial.length} <span className="text-sm not-italic font-bold text-slate-400">EVENTOS REGISTRADOS</span></h3>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 space-y-10">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
           <LucideHistory className="text-blue-600" size={24}/>
           <h4 className="text-sm font-black text-slate-800 uppercase italic">Línea de Tiempo Técnica</h4>
        </div>

        <div className="space-y-12 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
           {historial.map((item, idx) => (
             <div key={idx} className="relative pl-16 group">
                <div className="absolute left-[1.1rem] top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-8 ring-blue-50 group-hover:ring-blue-100 transition-all"></div>
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 group-hover:bg-white group-hover:shadow-xl transition-all">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <span className="px-3 py-1 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase italic tracking-widest">{item.tipo}</span>
                         <span className="text-[10px] font-bold text-slate-400">{format(parseISO(item.fechaRegistro || item.fecha), "dd MMMM yyyy", { locale: es })}</span>
                      </div>
                      <span className="text-sm font-black text-emerald-600 italic">${item.costo?.toLocaleString()}</span>
                   </div>
                   <p className="text-xs font-bold text-slate-700 leading-relaxed italic">"{item.descripcion}"</p>
                   <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <LucideCalendar size={12}/>
                        <span className="text-[9px] font-black uppercase italic">KM: {item.kilometraje?.toLocaleString()}</span>
                      </div>
                      {item.proveedor && (
                         <span className="text-[8px] font-black text-slate-400 uppercase">Taller: {item.proveedor}</span>
                      )}
                   </div>
                </div>
             </div>
           ))}
           {historial.length === 0 && (
             <p className="text-center py-10 text-slate-300 font-black uppercase text-[10px] italic tracking-widest">Sin registros históricos</p>
           )}
        </div>
      </div>
    </div>
  );
};
