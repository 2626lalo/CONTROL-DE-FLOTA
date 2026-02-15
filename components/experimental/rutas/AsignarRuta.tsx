
import React, { useState } from 'react';
import { LucideCar, LucideUser, LucideArrowLeft, LucideShieldCheck, LucideActivity, LucideInfo, LucideCheckCircle2, LucideLoader2 } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { UserRole, VehicleStatus } from '../../../types';
import { db } from '../../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

interface Props {
  route: any;
  onCancel: () => void;
  onConfirm: () => void;
}

export const AsignarRuta: React.FC<Props> = ({ route, onCancel, onConfirm }) => {
  const { vehicles, registeredUsers, addNotification, user: currentUser } = useApp();
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedVehicle || !selectedDriver) {
      addNotification("Complete la unidad y el conductor", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const startLeg = route.legs[0];
      const endLeg = route.legs[route.legs.length - 1];
      
      const totalDist = route.legs.reduce((acc: number, l: any) => acc + (l.distance?.value || 0), 0) / 1000;
      const totalTime = route.legs.reduce((acc: number, l: any) => acc + (l.duration?.value || 0), 0);

      // Guardar en Firestore
      await addDoc(collection(db, 'rutasPlanificadas'), {
        origen: {
            lat: startLeg.start_location.lat(),
            lng: startLeg.start_location.lng(),
            direccion: startLeg.start_address
        },
        destino: {
            lat: endLeg.end_location.lat(),
            lng: endLeg.end_location.lng(),
            direccion: endLeg.end_address
        },
        paradas: route.legs.slice(0, -1).map((l: any) => l.end_address),
        distancia: Math.round(totalDist),
        tiempo: Math.round(totalTime / 60),
        vehiclePlate: selectedVehicle,
        conductorId: selectedDriver,
        creadoPor: currentUser?.id,
        fecha: new Date().toISOString(),
        estado: 'PENDIENTE',
        polyline: route.overview_polyline
      });

      // Simular notificación al conductor
      await addDoc(collection(db, 'notificaciones'), {
        userId: selectedDriver,
        tipo: 'NUEVA_RUTA',
        mensaje: `Se le ha asignado la ruta: ${startLeg.start_address.split(',')[0]} -> ${endLeg.end_address.split(',')[0]}`,
        fecha: new Date().toISOString(),
        leido: false
      });

      onConfirm();
    } catch (e) {
      console.error(e);
      addNotification("Error al procesar el despacho logístico", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-white z-40 p-12 flex flex-col animate-fadeIn">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onCancel} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all shadow-sm"><LucideArrowLeft size={24}/></button>
          <div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Despacho Logístico</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2"><LucideActivity size={14} className="text-blue-500"/> Vinculación de Activos para Misión</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
           <div className="p-10 bg-slate-50 rounded-[3.5rem] border border-slate-200 shadow-inner space-y-8">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Activo Operativo</label>
                    <select 
                      className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black uppercase text-sm outline-none focus:border-blue-600 focus:shadow-xl transition-all appearance-none"
                      value={selectedVehicle}
                      onChange={e => setSelectedVehicle(e.target.value)}
                    >
                        <option value="">ELEGIR UNIDAD...</option>
                        {vehicles.filter(v => v.status === VehicleStatus.ACTIVE).map(v => (
                          <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>
                        ))}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Conductor Designado</label>
                    <select 
                      className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black uppercase text-sm outline-none focus:border-indigo-600 focus:shadow-xl transition-all appearance-none"
                      value={selectedDriver}
                      onChange={e => setSelectedDriver(e.target.value)}
                    >
                        <option value="">ELEGIR PERSONAL...</option>
                        {registeredUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                        ))}
                    </select>
                 </div>
              </div>
           </div>

           <div className="p-8 bg-blue-50 rounded-[3rem] border border-blue-100 flex items-center gap-6">
              <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600"><LucideInfo size={28}/></div>
              <p className="text-[10px] font-bold text-blue-800 uppercase leading-relaxed italic">
                El sistema verificará automáticamente el vencimiento de la VTV y Seguros de la unidad antes de confirmar el despacho.
              </p>
           </div>
        </div>

        <div className="flex flex-col">
           <div className="flex-1 p-10 bg-slate-950 rounded-[4rem] text-white shadow-3xl relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10 space-y-10">
                 <div className="flex items-center gap-6 border-b border-white/10 pb-6">
                    <LucideShieldCheck className="text-emerald-400 animate-pulse" size={40}/>
                    <h4 className="text-2xl font-black uppercase italic tracking-tighter">Validación Kernel</h4>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trayecto Total</span>
                       <span className="text-2xl font-black text-white italic">{Math.round(route.legs.reduce((acc: number, l: any) => acc + (l.distance?.value || 0), 0) / 1000)} KM</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tiempo Motor</span>
                       <span className="text-2xl font-black text-white italic">{route.legs[0].duration?.text}</span>
                    </div>
                 </div>
              </div>

              <button 
                onClick={handleConfirm}
                disabled={isSubmitting || !selectedVehicle || !selectedDriver}
                className="relative z-10 w-full py-8 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? <LucideLoader2 className="animate-spin" size={28}/> : (
                    <span className="flex items-center justify-center gap-4">
                        <LucideCheckCircle2 size={24}/> Confirmar Despacho
                    </span>
                )}
              </button>
              <LucideActivity className="absolute -right-12 -bottom-12 opacity-5 text-white" size={280}/>
           </div>
        </div>
      </div>
    </div>
  );
};
