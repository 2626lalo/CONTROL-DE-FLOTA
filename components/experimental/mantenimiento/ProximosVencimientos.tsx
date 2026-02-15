
import React from 'react';
import { LucideShieldAlert, LucideCalendar, LucideClock, LucideExternalLink, LucideShieldCheck } from 'lucide-react';
import { Vehicle } from '../../../types';
import { differenceInDays, parseISO, startOfDay, format } from 'date-fns';

interface Props {
  vehicles: Vehicle[];
}

export const ProximosVencimientos: React.FC<Props> = ({ vehicles }) => {
  const vencimientos = vehicles.flatMap(v => 
    (v.documents || []).map(d => {
      const diff = differenceInDays(parseISO(d.expirationDate), startOfDay(new Date()));
      return {
        plate: v.plate,
        docType: d.type,
        expirationDate: d.expirationDate,
        days: diff,
        severity: diff < 0 ? 'RED' : diff <= 15 ? 'YELLOW' : 'GREEN'
      };
    })
  ).filter(d => d.days <= 30)
   .sort((a, b) => a.days - b.days);

  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 animate-fadeIn h-full">
      <div className="flex items-center justify-between border-b pb-6">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
          <LucideShieldAlert className="text-rose-500" size={18}/> Compliance Documental (30 días)
        </h4>
        <span className="bg-slate-100 text-slate-500 px-4 py-1 rounded-full text-[9px] font-black uppercase">{vencimientos.length} ALERTAS</span>
      </div>

      <div className="space-y-5">
        {vencimientos.map((v, i) => (
          <div 
            key={i} 
            className={`p-6 rounded-[2.5rem] border-2 flex items-center justify-between gap-6 transition-all hover:shadow-lg group ${
              v.severity === 'RED' ? 'bg-rose-50 border-rose-100' : 
              v.severity === 'YELLOW' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
            }`}
          >
            <div className="flex items-center gap-5 overflow-hidden">
               <div className={`p-4 rounded-2xl shadow-xl shrink-0 ${
                 v.severity === 'RED' ? 'bg-rose-600 text-white animate-pulse' : 
                 v.severity === 'YELLOW' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
               }`}>
                  <LucideCalendar size={20}/>
               </div>
               <div className="overflow-hidden">
                  <h5 className="font-black text-slate-800 uppercase italic text-sm leading-none truncate">{v.docType}</h5>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{v.plate} • Vence: {v.expirationDate}</p>
               </div>
            </div>
            <div className="text-right shrink-0">
               <p className={`text-xl font-black italic tracking-tighter ${v.severity === 'RED' ? 'text-rose-600' : 'text-slate-700'}`}>
                 {v.days < 0 ? 'VENCIDO' : `${v.days} DÍAS`}
               </p>
               <div className="flex items-center justify-end gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  <LucideClock size={10}/> Auditoría
               </div>
            </div>
          </div>
        ))}
        {vencimientos.length === 0 && (
          <div className="py-20 text-center space-y-4">
             <LucideShieldCheck className="mx-auto text-emerald-200" size={64}/>
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Compliance legal al 100%</p>
          </div>
        )}
      </div>
    </div>
  );
};
