
import React, { useMemo } from 'react';
import { LucideArrowLeft, LucideUser, LucideCreditCard, LucideHistory, LucideCheckCircle2, LucideShieldAlert, LucideMail, LucideSmartphone, LucideInfo } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { LicenciasConductor } from './LicenciasConductor';
import { HistorialAsignaciones } from './HistorialAsignaciones';

interface Props {
  driverId: string;
  onBack: () => void;
  asignaciones: any[];
}

export const FichaConductor: React.FC<Props> = ({ driverId, onBack, asignaciones }) => {
  const { registeredUsers } = useApp();
  const driver = registeredUsers.find(u => u.id === driverId);

  const driverAsignaciones = useMemo(() => 
    asignaciones.filter(a => a.driverId === driverId),
  [asignaciones, driverId]);

  const currentAsignacion = driverAsignaciones.find(a => !a.fechaFin);

  if (!driver) return null;

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex items-center gap-6">
        <button onClick={onBack} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-400 hover:text-slate-800 transition-all active:scale-95">
          <LucideArrowLeft size={24}/>
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{driver.nombre} {driver.apellido}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Perfil Operativo del Colaborador</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* PANEL LATERAL: INFO PERSONAL */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white font-black text-5xl shadow-2xl mb-8 relative">
                 {driver.nombre.charAt(0)}
                 <div className="absolute -bottom-2 -right-2 p-3 bg-emerald-500 text-white rounded-2xl shadow-lg">
                    <LucideCheckCircle2 size={24}/>
                 </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic">{driver.nombre} {driver.apellido}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{driver.role}</p>
              
              <div className="mt-10 w-full space-y-4">
                 <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <LucideMail className="text-blue-600" size={18}/>
                    <span className="text-[10px] font-bold text-slate-600 truncate">{driver.email}</span>
                 </div>
                 <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <LucideSmartphone className="text-blue-600" size={18}/>
                    <span className="text-[10px] font-bold text-slate-600">{driver.telefono || 'Sin teléfono'}</span>
                 </div>
              </div>
           </div>

           {/* ESTADO VEHÍCULO ACTUAL */}
           <div className={`p-8 rounded-[3rem] border-2 transition-all shadow-lg ${currentAsignacion ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
              <div className="flex justify-between items-start mb-6">
                 <div className={`p-3 rounded-2xl ${currentAsignacion ? 'bg-white/10' : 'bg-slate-100'}`}>
                    <LucideUser size={24}/>
                 </div>
                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${currentAsignacion ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {currentAsignacion ? 'VINCULADO' : 'DISPONIBLE'}
                 </span>
              </div>
              <h4 className="text-sm font-black uppercase italic tracking-widest opacity-80">Unidad Asignada</h4>
              <p className="text-3xl font-black italic tracking-tighter mt-4 uppercase">
                 {currentAsignacion ? currentAsignacion.vehiclePlate : 'SIN ACTIVO'}
              </p>
           </div>
        </div>

        {/* PANEL CENTRAL: LICENCIAS Y ASIGNACIONES */}
        <div className="lg:col-span-2 space-y-10">
           <LicenciasConductor driverId={driverId} />
           <HistorialAsignaciones asignaciones={driverAsignaciones} />
        </div>
      </div>
    </div>
  );
};
