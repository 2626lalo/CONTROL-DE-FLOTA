
import React, { useState } from 'react';
import { LucideCar, LucideUser, LucideCalendar, LucideCheck, LucideX, LucideGauge } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { db } from '../../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

interface Props {
  onClose: () => void;
}

export const AsignarVehiculo: React.FC<Props> = ({ onClose }) => {
  const { vehicles, registeredUsers, addNotification } = useApp();
  const [formData, setFormData] = useState({
    driverId: '',
    vehiclePlate: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    startKm: 0,
    tipo: 'PERMANENTE'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverId || !formData.vehiclePlate) return;

    try {
      await addDoc(collection(db, 'asignaciones'), {
        ...formData,
        timestamp: new Date().toISOString(),
        active: true
      });
      addNotification("Asignación registrada exitosamente", "success");
      onClose();
    } catch (err) {
      console.error(err);
      addNotification("Error al procesar asignación", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn border-t-[12px] border-blue-600 flex flex-col">
        <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><LucideCar size={24}/></div>
             <h3 className="text-xl font-black uppercase italic tracking-tighter">Nueva Vinculación de Activo</h3>
           </div>
           <button onClick={onClose} className="text-white hover:text-rose-500 transition-all"><LucideX size={24}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Conductor</label>
                <div className="relative">
                  <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <select className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-blue-100" value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})} required>
                    <option value="">Seleccione...</option>
                    {registeredUsers.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                  </select>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Unidad (Patente)</label>
                <div className="relative">
                  <LucideCar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <select className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-blue-100" value={formData.vehiclePlate} onChange={e => setFormData({...formData, vehiclePlate: e.target.value})} required>
                    <option value="">Seleccione...</option>
                    {vehicles.map(v => <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>)}
                  </select>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha de Inicio</label>
                <div className="relative">
                  <LucideCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <input type="date" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">KM de Entrega</label>
                <div className="relative">
                  <LucideGauge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <input type="number" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg outline-none" value={formData.startKm} onChange={e => setFormData({...formData, startKm: Number(e.target.value)})} />
                </div>
             </div>
          </div>

          <div className="p-8 bg-slate-50 border-t flex gap-4 mt-8">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancelar</button>
            <button type="submit" className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95">
              <LucideCheck size={18}/> Confirmar Asignación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
