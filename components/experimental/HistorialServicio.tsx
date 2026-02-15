import React from 'react';
import { LucideHistory, LucideCheckCircle2, LucideUser, LucideClock, LucideEye } from 'lucide-react';
import { ServiceHistoryItem } from '../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  history: ServiceHistoryItem[];
  onViewRecord?: (h: ServiceHistoryItem) => void;
}

export const HistorialServicio: React.FC<Props> = ({ history, onViewRecord }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
          <LucideHistory size={24}/>
        </div>
        <div>
          <h4 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Trazabilidad de Gestión</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Registro de Auditoría Nivel 1</p>
        </div>
      </div>

      <div className="space-y-6">
        {history.map((h, i) => (
          <div 
            key={i} 
            onClick={() => onViewRecord?.(h)}
            className="flex gap-8 group cursor-pointer"
          >
            <div className="relative flex flex-col items-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg z-10 ${
                i === 0 ? 'bg-blue-600 text-white scale-110' : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:border-blue-400 group-hover:text-blue-600'
              }`}>
                {i === 0 ? <LucideCheckCircle2 size={24}/> : <LucideClock size={20}/>}
              </div>
              {i < history.length - 1 && (
                <div className="w-1 h-full bg-slate-100 absolute top-12 bottom-0 rounded-full"></div>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 hover:shadow-xl hover:border-blue-100 transition-all group-hover:translate-x-2">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">{h.estado || h.toStage}</span>
                  {onViewRecord && <LucideEye size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"/>}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{format(parseISO(h.date || h.fecha || new Date().toISOString()), 'dd MMM yyyy, HH:mm')} HS</span>
              </div>
              <p className="text-xs font-black text-slate-700 leading-relaxed italic">"{h.comment || h.comentario}"</p>
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[9px] font-black uppercase">
                     {(h.userName || h.usuario || 'U').charAt(0)}
                   </div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsable: <span className="text-slate-900">{h.userName || h.usuario}</span></span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {(!history || history.length === 0) && (
          <div className="py-20 text-center border-4 border-dashed border-slate-100 rounded-[3rem]">
            <LucideHistory size={48} className="mx-auto text-slate-100 mb-4"/>
            <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Sin registros de trazabilidad aún</p>
          </div>
        )}
      </div>
    </div>
  );
};