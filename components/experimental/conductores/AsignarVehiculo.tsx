
import React, { useState, useMemo } from 'react';
import { LucideCar, LucideUser, LucideCalendar, LucideCheck, LucideX, LucideGauge, LucideLoader2, LucideAlertTriangle } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { db } from '../../../firebaseConfig';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { VehicleStatus } from '../../../types';

interface Props {
  onClose: () => void;
  selectedDriverId?: string;
}

export const AsignarVehiculo: React.FC<Props> = ({ onClose, selectedDriverId }) => {
  const { vehicles, registeredUsers, addNotification } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    driverId: selectedDriverId || '',
    vehiclePlate: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    startKm: 0,
    tipo: 'PERMANENTE'
  });

  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => v.status === VehicleStatus.ACTIVE);
  }, [vehicles]);

  const selectedVehicleData = useMemo(() => {
    return vehicles.find(v => v.plate === formData.vehiclePlate);
  }, [vehicles, formData.vehiclePlate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverId || !formData.vehiclePlate) {
      addNotification("Complete los campos obligatorios", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Verificar si el vehículo ya tiene una asignación activa
      const q = query(
        collection(db, 'asignaciones'),
        where('vehiclePlate', '==', formData.vehiclePlate),
        where('active', '==', true)
      );
      const activeSnap = await getDocs(q);
      
      if (!activeSnap.empty) {
        addNotification("La unidad ya tiene un conductor asignado activamente", "error");
        setIsSubmitting(false);
        return;
      }

      // 2. Crear asignación
      await addDoc(collection(db, 'asignaciones'), {
        ...formData,
        startKm: selectedVehicleData?.currentKm || 0,
        timestamp: new Date().toISOString(),
        active: true
      });

      // 3. Vincular en el vehículo
      const vehicleRef = doc(db, 'vehicles', formData.vehiclePlate);
      await updateDoc(vehicleRef, {
        conductorAsignado: formData.driverId,
        updatedAt: new Date().toISOString()
      });

      addNotification("Asignación confirmada y sincronizada en flota", "success");
      onClose();
    } catch (err) {
      console.error(err);
      addNotification("Error al procesar la vinculación", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn border-t-[12px] border-indigo-600 flex flex-col">
        <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
               <LucideCar size={24}/>
             </div>
             <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Vincular Unidad Patrimonial</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Gestión de Activos y Recursos Humanos</p>
             </div>
           </div>
           <button onClick={onClose} className="text-white hover:text-rose-500 transition-all p-2"><LucideX size={28}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Conductor Designado</label>
                <div className="relative">
                  <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <select 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold uppercase text-xs outline-none focus:ring-4 focus:ring-indigo-100" 
                    value={formData.driverId} 
                    onChange={e => setFormData({...formData, driverId: e.target.value})} 
                    required
                    disabled={!!selectedDriverId}
                  >
                    <option value="">SELECCIONE...</option>
                    {registeredUsers.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                  </select>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Unidad Operativa</label>
                <div className="relative">
                  <LucideCar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <select className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold uppercase text-xs outline-none focus:ring-4 focus:ring-indigo-100" value={formData.vehiclePlate} onChange={e => setFormData({...formData, vehiclePlate: e.target.value})} required>
                    <option value="">SELECCIONE UNIDAD...</option>
                    {availableVehicles.map(v => <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>)}
                  </select>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha de Entrega</label>
                <div className="relative">
                  <LucideCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <input type="date" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Asignación</label>
                <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase outline-none" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                    <option value="PERMANENTE">PERMANENTE (POOL)</option>
                    <option value="REEMPLAZO">REEMPLAZO TEMPORAL</option>
                    <option value="LOGISTICA">VIAJE PUNTUAL</option>
                </select>
             </div>
          </div>

          {selectedVehicleData && (
            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600"><LucideGauge size={24}/></div>
                    <div>
                        <p className="text-[9px] font-black text-blue-400 uppercase">Kilometraje de Auditoría</p>
                        <h4 className="text-xl font-black text-blue-900 italic">{(selectedVehicleData.currentKm || 0).toLocaleString()} KM</h4>
                    </div>
                </div>
                <LucideAlertTriangle className="text-blue-300" size={32}/>
            </div>
          )}

          <div className="p-8 bg-slate-50 border-t flex gap-4 mt-8">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancelar</button>
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30"
            >
              {isSubmitting ? <LucideLoader2 className="animate-spin" size={24}/> : <LucideCheck size={24}/>} 
              Confirmar Vinculación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
