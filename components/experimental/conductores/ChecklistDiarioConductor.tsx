
import React, { useState } from 'react';
import { LucideClipboardCheck, LucideCheck, LucideAlertTriangle, LucideCamera, LucidePenTool, LucideSave, LucideTruck, LucideGauge } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { db } from '../../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export const ChecklistDiarioConductor: React.FC = () => {
  const { user, addNotification } = useApp();
  const [km, setKm] = useState(0);
  const [plate, setPlate] = useState('');
  const [items, setItems] = useState([
    { id: 'luces', label: 'Luces y Señalización', status: 'OK' },
    { id: 'frenos', label: 'Sistema de Frenos', status: 'OK' },
    { id: 'neumaticos', label: 'Estado Neumáticos', status: 'OK' },
    { id: 'fluidos', label: 'Niveles (Agua/Aceite)', status: 'OK' },
    { id: 'limpieza', label: 'Limpieza e Higiene', status: 'OK' },
  ]);

  const toggleStatus = (id: string) => {
    setItems(items.map(it => it.id === id ? { ...it, status: it.status === 'OK' ? 'NOVEDAD' : 'OK' } : it));
  };

  const handleSave = async () => {
    if (!plate || !km) {
        addNotification("Patente y KM son requeridos", "error");
        return;
    }

    try {
      await addDoc(collection(db, 'checklistsConductores'), {
        userId: user?.id,
        userName: user?.nombre,
        vehiclePlate: plate,
        kilometraje: km,
        items,
        fecha: new Date().toISOString(),
        novedades: items.some(i => i.status === 'NOVEDAD')
      });
      addNotification("Checklist diario enviado correctamente", "success");
      setPlate(''); setKm(0);
    } catch (err) {
      addNotification("Error al guardar inspección", "error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-fadeIn">
      <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-6">
           <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-xl"><LucideClipboardCheck size={32}/></div>
           <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Mi Control Diario</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Seguridad en Operación v1.0</p>
           </div>
        </div>
        <LucideTruck className="absolute -right-10 -bottom-10 opacity-5" size={240}/>
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
         <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><LucideTruck size={10}/> Patente Unidad</label>
               <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg uppercase outline-none focus:ring-4 focus:ring-blue-100" placeholder="ABC 123" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><LucideGauge size={10}/> KM Auditado</label>
               <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg outline-none focus:ring-4 focus:ring-blue-100" value={km || ''} onChange={e => setKm(Number(e.target.value))} />
            </div>
         </div>

         <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-2 mb-6">Estado de Sistemas Críticos</h4>
            {items.map(it => (
              <button 
                key={it.id} 
                onClick={() => toggleStatus(it.id)}
                className={`w-full p-6 rounded-[2rem] border-2 flex justify-between items-center transition-all ${
                  it.status === 'OK' ? 'bg-slate-50 border-slate-100 hover:border-emerald-200' : 'bg-rose-50 border-rose-200 shadow-lg'
                }`}
              >
                <span className={`font-black uppercase text-xs italic ${it.status === 'OK' ? 'text-slate-700' : 'text-rose-700'}`}>{it.label}</span>
                <div className={`p-2 rounded-xl flex items-center gap-2 ${it.status === 'OK' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-600 text-white shadow-lg shadow-rose-200 animate-pulse'}`}>
                   {it.status === 'OK' ? <LucideCheck size={18}/> : <LucideAlertTriangle size={18}/>}
                   <span className="text-[8px] font-black">{it.status}</span>
                </div>
              </button>
            ))}
         </div>

         <div className="pt-8 border-t flex flex-col gap-4">
            <button onClick={handleSave} className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-3xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95">
               <LucideSave size={24}/> Enviar Reporte Diario
            </button>
            <p className="text-[8px] font-black text-slate-300 uppercase text-center tracking-[0.3em]">Certificación Digital FleetPro Cloud</p>
         </div>
      </div>
    </div>
  );
};
