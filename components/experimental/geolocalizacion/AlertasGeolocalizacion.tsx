
import React from 'react';
import { LucideShieldAlert, LucideClock, LucideCar, LucideChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export const AlertasGeolocalizacion: React.FC = () => {
  const mockAlerts = [
    { id: 1, plate: 'ABC-123', event: 'Salida de Geocerca: BASE MENDOZA', time: new Date().toISOString(), severity: 'HIGH' },
    { id: 2, plate: 'XYZ-789', event: 'Exceso Velocidad: 115 KM/H', time: new Date().toISOString(), severity: 'MEDIUM' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between px-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <LucideShieldAlert size={16} className="text-rose-600 animate-pulse"/> Eventos Críticos
        </h4>
      </div>

      <div className="space-y-4">
        {mockAlerts.map(alert => (
          <div key={alert.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
             <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl shadow-lg ${alert.severity === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                  <LucideCar size={20}/>
                </div>
                <div>
                   <h5 className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{alert.plate}</h5>
                   <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{alert.event}</p>
                   <div className="flex items-center gap-2 text-[8px] font-black text-slate-300 uppercase mt-2 tracking-widest">
                      <LucideClock size={10}/> {format(new Date(alert.time), 'HH:mm')} HS
                   </div>
                </div>
             </div>
             <button className="p-3 bg-slate-50 text-slate-200 rounded-xl group-hover:text-blue-600 transition-colors"><LucideChevronRight/></button>
          </div>
        ))}
      </div>
    </div>
  );
};
