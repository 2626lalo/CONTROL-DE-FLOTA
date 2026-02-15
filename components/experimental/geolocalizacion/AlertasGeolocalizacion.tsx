import React, { useEffect, useState } from 'react';
import { LucideShieldAlert, LucideClock, LucideCar, LucideChevronRight, LucideCheckCircle2, LucideActivity } from 'lucide-react';
import { db } from '../../../firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot, addDoc, getDocs, where } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';
import pointInPolygon from 'point-in-polygon';

export const AlertasGeolocalizacion: React.FC = () => {
  const [eventos, setEventos] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'eventosGeocerca'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Helper para verificar geocercas (sería invocado por el orquestador de ubicaciones)
  // En este demo lo dejamos como visualizador de historial
  
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <h4 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <LucideActivity className="text-rose-500 animate-pulse" size={28}/> Monitor de Cumplimiento
          </h4>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 italic">Alertas de Geoperímetros en Tiempo Real</p>
        </div>
        <div className="relative z-10 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4">
           <LucideShieldAlert className="text-rose-400" size={24}/>
           <div>
             <p className="text-[8px] font-black text-slate-400 uppercase">Alertas hoy</p>
             <p className="text-xl font-black italic">{eventos.filter(e => format(parseISO(e.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}</p>
           </div>
        </div>
        <LucideShieldAlert className="absolute -right-8 -bottom-8 opacity-5 text-white group-hover:scale-110 transition-transform duration-1000" size={200}/>
      </div>

      <div className="space-y-4">
        {eventos.map(ev => (
          <div key={ev.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all border-l-8 border-l-rose-500">
             <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl shadow-lg ${ev.tipoEvento === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <LucideCar size={24}/>
                </div>
                <div>
                   <h5 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter leading-none">{ev.vehiclePlate}</h5>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-1.5 flex items-center gap-2">
                     {/* FIX: Corrected icon names to LucideCheckCircle2 and LucideShieldAlert to match imported names */}
                     {ev.tipoEvento === 'entrada' ? <LucideCheckCircle2 size={12} className="text-emerald-500"/> : <LucideShieldAlert size={12} className="text-rose-500"/>}
                     Evento de {ev.tipoEvento} detectado
                   </p>
                   <div className="flex items-center gap-4 text-[8px] font-black text-slate-400 uppercase mt-3 tracking-widest">
                      <div className="flex items-center gap-1.5"><LucideClock size={10}/> {format(parseISO(ev.timestamp), 'HH:mm:ss')} HS</div>
                      <div className="flex items-center gap-1.5 font-black text-blue-500">ID: {ev.geocercaId.substring(0,8)}</div>
                   </div>
                </div>
             </div>
             <button className="p-4 bg-slate-50 text-slate-200 rounded-2xl group-hover:text-blue-600 group-hover:bg-blue-50 transition-all active:scale-95 shadow-sm">
                <LucideChevronRight size={20}/>
             </button>
          </div>
        ))}
        
        {eventos.length === 0 && (
          <div className="py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
             <LucideCheckCircle2 size={64} className="mx-auto text-emerald-100 mb-6"/>
             <h4 className="text-xl font-black text-slate-300 uppercase italic tracking-widest">Compliance OK</h4>
             <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">No se han registrado violaciones de geocerca en el periodo actual.</p>
          </div>
        )}
      </div>
    </div>
  );
};