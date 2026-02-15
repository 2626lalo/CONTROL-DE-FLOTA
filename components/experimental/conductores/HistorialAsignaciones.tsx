
import React from 'react';
// FIX: Added LucideX to the imports from lucide-react to resolve the error on line 69.
import { LucideHistory, LucideCar, LucideCalendar, LucideGauge, LucideTrash2, LucideCheckCircle2, LucideDownload, LucideInfo, LucideX } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { db } from '../../../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useApp } from '../../../context/FleetContext';

interface Props {
  asignaciones: any[];
}

export const HistorialAsignaciones: React.FC<Props> = ({ asignaciones }) => {
  const { addNotification } = useApp();

  const handleFinalizar = async (id: string, plate: string) => {
    if (!window.confirm("¿Confirma la devolución de la unidad?")) return;

    try {
      const ref = doc(db, 'asignaciones', id);
      await updateDoc(ref, {
        active: false,
        fechaFin: new Date().toISOString().split('T')[0]
      });

      // Actualizar vehículo
      const vehicleRef = doc(db, 'vehicles', plate);
      await updateDoc(vehicleRef, {
        conductorAsignado: null
      });

      addNotification("Asignación finalizada correctamente", "success");
    } catch (e) {
      addNotification("Error al procesar baja", "error");
    }
  };

  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 animate-fadeIn">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg"><LucideHistory size={24}/></div>
          <h4 className="text-xl font-black text-slate-800 uppercase italic">Bitácora Integral de Flota</h4>
        </div>
        <button className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm">
           <LucideDownload size={20}/>
        </button>
      </div>

      <div className="space-y-10 relative before:absolute before:left-8 before:top-2 before:bottom-2 before:w-1 before:bg-slate-100">
        {asignaciones.map((a, idx) => (
          <div key={idx} className="relative pl-20 group">
            <div className={`absolute left-[1.35rem] top-1.5 w-5 h-5 rounded-full z-10 border-4 border-white shadow-md transition-all ${a.active ? 'bg-emerald-500 animate-pulse ring-8 ring-emerald-50' : 'bg-slate-200'}`}></div>
            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 hover:shadow-2xl transition-all group-hover:scale-[1.01] group-hover:border-blue-200">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl shadow-xl transition-colors ${a.active ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white opacity-40'}`}>
                    <LucideCar size={28}/>
                  </div>
                  <div>
                    <h5 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{a.vehiclePlate}</h5>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest italic">{a.tipo}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {a.active && (
                        <button onClick={() => handleFinalizar(a.id, a.vehiclePlate)} className="flex-1 md:flex-none px-6 py-3 bg-rose-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                            <LucideX size={14}/> Finalizar Vínculo
                        </button>
                    )}
                    <span className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border ${a.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {a.active ? <LucideCheckCircle2 size={12}/> : <LucideHistory size={12}/>}
                        {a.active ? 'ACTUAL' : 'CERRADO'}
                    </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-slate-50 rounded-xl text-slate-400"><LucideCalendar size={18}/></div>
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inicio Gestión</p>
                     <p className="text-[12px] font-black text-slate-700">{format(parseISO(a.fechaInicio), "dd 'de' MMM, yyyy", {locale: es}).toUpperCase()}</p>
                   </div>
                </div>
                {a.fechaFin && (
                  <div className="flex items-center gap-4 animate-fadeIn">
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400"><LucideCalendar size={18}/></div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Devolución</p>
                      <p className="text-[12px] font-black text-slate-700">{format(parseISO(a.fechaFin), "dd 'de' MMM, yyyy", {locale: es}).toUpperCase()}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><LucideGauge size={18}/></div>
                   <div>
                     <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Odómetro de Entrega</p>
                     <p className="text-[14px] font-black text-slate-800 italic">{a.startKm?.toLocaleString()} KM</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {asignaciones.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <LucideInfo size={64} className="mx-auto text-slate-100" />
            <p className="text-slate-300 font-black uppercase italic tracking-widest text-[10px]">Sin registros históricos de flota humana</p>
          </div>
        )}
      </div>
    </div>
  );
};