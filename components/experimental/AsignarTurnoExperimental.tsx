import React, { useState } from 'react';
import { LucideCalendar, LucideClock, LucideCheck, LucideX, LucideUser, LucideMap } from 'lucide-react';
import { User, UserRole } from '../../types';
import { MapaServicio } from './MapaServicio';

interface Props {
  onConfirm: (data: any) => void;
  onCancel: () => void;
  providers: User[];
  plate: string;
}

export const AsignarTurnoExperimental: React.FC<Props> = ({ onConfirm, onCancel, providers, plate }) => {
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '09:00',
    nombreTaller: '',
    direccionTaller: '',
    providerId: '',
    comentarios: ''
  });

  const isValid = formData.fecha && formData.nombreTaller && formData.providerId;

  return (
    <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-fadeIn border-t-[12px] border-amber-500 flex flex-col md:flex-row max-h-[90vh]">
      <div className="w-full md:w-1/2 p-10 space-y-8 overflow-y-auto custom-scrollbar border-r border-slate-100">
        <div className="flex justify-between items-center border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-100">
              <LucideCalendar size={28}/>
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Agendar Turno</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Unidad: {plate}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha Pactada</label>
            <input 
              type="date" 
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-amber-400 focus:bg-white transition-all shadow-inner" 
              value={formData.fecha} 
              onChange={e => setFormData({...formData, fecha: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Hora</label>
            <input 
              type="time" 
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-amber-400 focus:bg-white transition-all shadow-inner" 
              value={formData.hora} 
              onChange={e => setFormData({...formData, hora: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Proveedor Responsable</label>
          <div className="relative">
            <LucideUser className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
            <select 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-[10px] outline-none appearance-none focus:border-amber-400 focus:bg-white transition-all"
              value={formData.providerId}
              onChange={e => setFormData({...formData, providerId: e.target.value})}
            >
              <option value="">SELECCIONE PROVEEDOR...</option>
              {providers.filter(p => p.role === UserRole.PROVIDER).map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Instrucciones / Notas</label>
          <textarea 
            rows={4} 
            className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-xs outline-none focus:border-amber-400 focus:bg-white transition-all resize-none shadow-inner"
            placeholder="NOTAS PARA EL CHOFER O EL TALLER..."
            value={formData.comentarios}
            onChange={e => setFormData({...formData, comentarios: e.target.value})}
          />
        </div>

        <div className="pt-8 flex gap-4">
          <button type="button" onClick={onCancel} className="flex-1 py-5 rounded-2xl font-black uppercase text-[10px] text-slate-400 tracking-widest hover:bg-slate-50 transition-all border border-slate-100">Cancelar</button>
          <button 
            type="button" 
            disabled={!isValid}
            onClick={() => onConfirm(formData)} 
            className="flex-[2] bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30"
          >
            <LucideCheck size={20}/> Confirmar Turno
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 p-10 flex flex-col">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><LucideMap size={16} className="text-amber-500"/> Localización del Servicio</h4>
        <MapaServicio 
          address={formData.direccionTaller} 
          setAddress={(v) => setFormData({...formData, direccionTaller: v})}
          name={formData.nombreTaller}
          setName={(v) => setFormData({...formData, nombreTaller: v})}
        />
      </div>
    </div>
  );
};