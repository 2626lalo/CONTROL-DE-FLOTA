
import React, { useState } from 'react';
import { LucideCar, LucideUser, LucideArrowLeft, LucideShieldCheck, LucideActivity, LucideInfo } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { UserRole, VehicleStatus } from '../../../types';
import { db } from '../../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

// FIX: Declare google global variable to avoid TypeScript errors
declare const google: any;

interface Props {
  // FIX: Using any for route to resolve google namespace existence error
  route: any;
  onCancel: () => void;
  onConfirm: () => void;
}

export const AsignarRuta: React.FC<Props> = ({ route, onCancel, onConfirm }) => {
  const { vehicles, registeredUsers, addNotification } = useApp();
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedVehicle || !selectedDriver) {
      addNotification("Vehículo y Conductor son obligatorios", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const leg = route.legs[0];
      await addDoc(collection(db, 'rutasPlanificadas'), {
        origen: leg.start_address,
        destino: leg.end_address,
        distancia: leg.distance?.text,
        distanciaValor: leg.distance?.value,
        tiempo: leg.duration?.text,
        tiempoValor: leg.duration?.value,
        vehiclePlate: selectedVehicle,
        conductorId: selectedDriver,
        fecha: new Date().toISOString(),
        estado: 'PENDIENTE',
        overview_polyline: route.overview_polyline
      });
      onConfirm();
    } catch (e) {
      addNotification("Error al guardar planificación", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-white z-40 p-12 flex flex-col animate-fadeIn">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onCancel} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all shadow-sm"><LucideArrowLeft size={24}/></button>
          <div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Asignación Logística</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Vinculación de Activos y Recursos</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
           <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideCar size={14}/> Vehículo Operativo</h4>
              <div className="space-y-4">
                 <select 
                   className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black uppercase text-xs outline-none focus:ring-4 focus:ring-blue-100"
                   value={selectedVehicle}
                   onChange={e => setSelectedVehicle(e.target.value)}
                 >
                    <option value="">Elegir Unidad...</option>
                    {vehicles.filter(v => v.status === VehicleStatus.ACTIVE).map(v => (
                      <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>
                    ))}
                 </select>
                 {selectedVehicle && (
                   <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 animate-fadeIn">
                      <p className="text-[9px] font-bold text-blue-600 uppercase italic leading-tight">Consumo estimado para esta unidad: 12L/100km</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideUser size={14}/> Conductor Designado</h4>
              <div className="space-y-4">
                 <select 
                   className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black uppercase text-xs outline-none focus:ring-4 focus:ring-indigo-100"
                   value={selectedDriver}
                   onChange={e => setSelectedDriver(e.target.value)}
                 >
                    <option value="">Elegir Personal...</option>
                    {registeredUsers.filter(u => u.role === UserRole.USER).map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                    ))}
                 </select>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="p-10 bg-slate-950 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-full min-h-[400px]">
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                    <LucideShieldCheck className="text-emerald-400" size={32}/>
                    <h4 className="text-xl font-black uppercase italic tracking-tighter">Validación de Despacho</h4>
                 </div>
                 <div className="space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                       <span>Distancia Total:</span>
                       <span className="text-white italic">{route.legs[0].distance?.text}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                       <span>Tiempo Conducción:</span>
                       <span className="text-white italic">{route.legs[0].duration?.text}</span>
                    </div>
                 </div>
              </div>

              <button 
                onClick={handleConfirm}
                disabled={isLoading || !selectedVehicle || !selectedDriver}
                className="relative z-10 w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30"
              >
                {isLoading ? 'Sincronizando...' : 'Confirmar y Despachar'}
              </button>
              <LucideActivity className="absolute -right-12 -bottom-12 opacity-5" size={240}/>
           </div>
        </div>
      </div>
    </div>
  );
};
