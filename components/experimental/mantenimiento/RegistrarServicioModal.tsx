
import React, { useState } from 'react';
import { 
  LucideX, LucideSave, LucideCar, LucideWrench, LucideGauge, 
  LucideDollarSign, LucideCalendar, LucideUser, LucideFileText, 
  LucideCamera, LucideCheck,
  // Added missing LucidePlus and LucideRefreshCw to fix errors at line 173 and 190
  LucidePlus, LucideRefreshCw 
} from 'lucide-react';
import { db } from '../../../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useApp } from '../../../context/FleetContext';
import { Vehicle } from '../../../types';
import { format } from 'date-fns';

interface Props {
  vehicles: Vehicle[];
  onClose: () => void;
}

export const RegistrarServicioModal: React.FC<Props> = ({ vehicles, onClose }) => {
  const { user, addNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehiclePlate: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    kilometraje: 0,
    tipo: 'preventivo',
    descripcion: '',
    proveedor: '',
    costo: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehiclePlate || formData.kilometraje <= 0) {
      addNotification("Complete los datos obligatorios", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Guardar en colección mantenimientos
      await addDoc(collection(db, 'mantenimientos'), {
        ...formData,
        registradoPor: user?.id || 'sys',
        fechaRegistro: new Date().toISOString()
      });
      
      // 2. Actualizar vehículo (Kernel de KM)
      const vehicle = vehicles.find(v => v.plate === formData.vehiclePlate);
      if (vehicle) {
        const vehicleRef = doc(db, 'vehicles', vehicle.plate);
        const interval = vehicle.serviceIntervalKm || 10000;
        
        await updateDoc(vehicleRef, {
          currentKm: formData.kilometraje,
          nextServiceKm: formData.kilometraje + interval,
          updatedAt: new Date().toISOString()
        });
      }

      addNotification("Intervención técnica registrada y sincronizada", "success");
      onClose();
    } catch (error) {
      console.error("Error saving maintenance:", error);
      addNotification("Fallo al guardar en Cloud", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn border-t-[12px] border-blue-600 flex flex-col max-h-[95vh]">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
              <LucideWrench size={32}/>
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Registro Técnico Maestro</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Ingreso de Intervención en Tiempo Real</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-rose-500 transition-all p-2"><LucideX size={32}/></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Vincular Unidad Patrimonial</label>
              <div className="relative">
                <LucideCar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                <select 
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-sm outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
                  value={formData.vehiclePlate}
                  onChange={e => setFormData({...formData, vehiclePlate: e.target.value})}
                  required
                >
                  <option value="">SELECCIONE PATENTE...</option>
                  {vehicles.map(v => <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Gestión</label>
              <select 
                className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-xs outline-none focus:border-blue-600 focus:bg-white transition-all"
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value})}
              >
                <option value="preventivo">MANTENIMIENTO PREVENTIVO (KIT)</option>
                <option value="correctivo">REPARACIÓN CORRECTIVA / FALLA</option>
                <option value="vtv">VTV / RTO / LEGAL</option>
                <option value="seguro">SEGURO / PATENTES</option>
                <option value="otro">OTRO / GESTORÍA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kilometraje Auditado</label>
              <div className="relative">
                <LucideGauge className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                <input 
                  type="number" 
                  onFocus={e => e.target.select()}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-2xl outline-none focus:ring-4 focus:ring-blue-100"
                  value={formData.kilometraje}
                  onChange={e => setFormData({...formData, kilometraje: Number(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha Efectiva</label>
              <div className="relative">
                <LucideCalendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                <input 
                  type="date"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100"
                  value={formData.fecha}
                  onChange={e => setFormData({...formData, fecha: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Inversión Final ($)</label>
              <div className="relative">
                <LucideDollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" size={18}/>
                <input 
                  type="number"
                  onFocus={e => e.target.select()}
                  className="w-full pl-12 pr-6 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black text-2xl text-emerald-700 outline-none"
                  value={formData.costo}
                  onChange={e => setFormData({...formData, costo: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Informe de Tareas / Observaciones</label>
            <textarea 
              rows={4} 
              className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-bold text-sm outline-none focus:border-blue-600 focus:bg-white transition-all resize-none shadow-inner"
              placeholder="DETALLE TÉCNICO DE LA INTERVENCIÓN..."
              value={formData.descripcion}
              onChange={e => setFormData({...formData, descripcion: e.target.value.toUpperCase()})}
            />
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideCamera size={14}/> Adjuntos y Evidencia</h4>
            <div className="flex gap-4">
              <label className="w-24 h-24 bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-all text-slate-400 group">
                {/* Fixed missing LucidePlus name error */}
                <LucidePlus size={24} className="group-hover:scale-110 transition-transform"/>
                <input type="file" className="hidden" />
              </label>
              <div className="flex-1 flex items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 italic text-[10px] text-slate-400 font-bold uppercase">
                Suba fotos de la factura, comprobante de pago o reporte del taller.
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-5 rounded-2xl font-black uppercase text-[11px] text-slate-400 tracking-widest">Cancelar</button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
          >
            {/* Fixed missing LucideRefreshCw name error */}
            {loading ? <LucideRefreshCw className="animate-spin" size={24}/> : <LucideCheck size={24}/>} 
            Publicar Registro Maestro
          </button>
        </div>
      </div>
    </div>
  );
};
