
import React from 'react';
import { LucideCreditCard, LucideCalendar, LucideShieldAlert, LucideCheckCircle, LucideCamera } from 'lucide-react';
// FIX: Added 'format' to the date-fns import list to resolve "Cannot find name 'format'" error on line 62
import { differenceInDays, parseISO, format } from 'date-fns';

interface Props {
  driverId: string;
}

export const LicenciasConductor: React.FC<Props> = ({ driverId }) => {
  // En un sistema real, esto vendría de Firestore. Simulamos datos dinámicos.
  const mockLicense = {
    numero: 'DNI-' + driverId.substring(0, 8),
    clase: 'PROFESIONAL E1',
    vencimiento: '2025-12-15',
    status: 'vigente'
  };

  const daysToExpire = differenceInDays(parseISO(mockLicense.vencimiento), new Date());
  const severity = daysToExpire < 15 ? 'RED' : daysToExpire < 30 ? 'YELLOW' : 'GREEN';

  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 animate-fadeIn">
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <LucideCreditCard className="text-blue-600" size={24}/>
          <h4 className="text-xl font-black text-slate-800 uppercase italic">Licencia de Conducir</h4>
        </div>
        <button className="p-3 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm">
          <LucideCamera size={20}/>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
             <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Categoría / Clase</p>
                <p className="text-lg font-black text-slate-800 uppercase italic mt-1">{mockLicense.clase}</p>
             </div>
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm font-black text-xs">E1</div>
          </div>
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nro de Documento</p>
             <p className="text-lg font-black text-slate-800 uppercase italic mt-1">{mockLicense.numero}</p>
          </div>
        </div>

        <div className={`p-8 rounded-[3rem] border-2 flex flex-col justify-between transition-all group ${
          severity === 'RED' ? 'bg-rose-50 border-rose-200' : severity === 'YELLOW' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
           <div className="flex justify-between items-center">
              <LucideCalendar className={`${severity === 'RED' ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} size={28}/>
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                severity === 'RED' ? 'bg-rose-600 text-white' : 'bg-white'
              }`}>
                {severity === 'RED' ? 'CRÍTICO' : 'COMPLIANCE OK'}
              </span>
           </div>
           <div>
              <p className={`text-[10px] font-black uppercase mt-6 ${severity === 'RED' ? 'text-rose-700' : 'text-slate-500'}`}>Vencimiento Legal</p>
              <h5 className="text-3xl font-black italic tracking-tighter text-slate-800 mt-2">{format(parseISO(mockLicense.vencimiento), 'dd/MM/yyyy')}</h5>
              <div className="flex items-center gap-2 mt-4">
                 {severity === 'RED' ? <LucideShieldAlert className="text-rose-600" size={14}/> : <LucideCheckCircle className="text-emerald-600" size={14}/>}
                 <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">
                   {daysToExpire < 0 ? 'VENCIDO' : `FALTAN ${daysToExpire} DÍAS`}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
