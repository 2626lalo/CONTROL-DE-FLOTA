
import React, { useState } from 'react';
import { 
  LucideSearch, LucidePlus, LucideCar, LucideFileText, 
  LucideMapPin, LucideDollarSign, LucideCalendar, LucideTrash2,
  LucideInfo, LucideCheck, LucideX
} from 'lucide-react';
import { Vehicle } from '../../../types';
import { format, parseISO } from 'date-fns';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

interface Props {
  vehicles: Vehicle[];
  mantenimientos: any[];
}

export const HistorialServiciosVehiculo: React.FC<Props> = ({ vehicles, mantenimientos }) => {
  const [selectedPlate, setSelectedPlate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    vehiclePlate: '',
    tipo: 'preventivo',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    kilometraje: 0,
    descripcion: '',
    proveedor: '',
    costo: 0
  });

  const filteredHistory = selectedPlate 
    ? mantenimientos.filter(m => m.vehiclePlate === selectedPlate)
    : mantenimientos;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.vehiclePlate || !newEntry.kilometraje) return;
    
    try {
      await addDoc(collection(db, 'mantenimientos'), {
        ...newEntry,
        fechaRegistro: new Date().toISOString()
      });
      setShowForm(false);
      setNewEntry({...newEntry, descripcion: '', kilometraje: 0, costo: 0});
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar registro?")) {
      await deleteDoc(doc(db, 'mantenimientos', id));
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8">
        <div className="relative flex-1 w-full max-w-xl">
          <LucideSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={22}/>
          <select 
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[1.5rem] font-black text-sm uppercase outline-none focus:ring-4 focus:ring-blue-100 appearance-none transition-all"
            value={selectedPlate}
            onChange={e => setSelectedPlate(e.target.value)}
          >
            <option value="">TODOS LOS VEHÍCULOS</option>
            {vehicles.map(v => <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>)}
          </select>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95"
        >
          <LucidePlus size={20}/> Registrar Intervención
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-fadeIn border-t-[12px] border-blue-600 flex flex-col max-h-[90vh]">
            <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><LucideFileText size={24}/></div>
                 <h3 className="text-xl font-black uppercase italic tracking-tighter">Nuevo Registro de Mantenimiento</h3>
               </div>
               <button onClick={() => setShowForm(false)} className="text-white hover:text-rose-500 transition-all"><LucideX size={24}/></button>
            </div>
            <form onSubmit={handleAdd} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Unidad Patrimonial</label>
                    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase" value={newEntry.vehiclePlate} onChange={e => setNewEntry({...newEntry, vehiclePlate: e.target.value})} required>
                      <option value="">Seleccione...</option>
                      {vehicles.map(v => <option key={v.plate} value={v.plate}>{v.plate}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Servicio</label>
                    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase" value={newEntry.tipo} onChange={e => setNewEntry({...newEntry, tipo: e.target.value})}>
                      <option value="preventivo">PREVENTIVO (KIT SERVICE)</option>
                      <option value="correctivo">REPARACIÓN CORRECTIVA</option>
                      <option value="vtv">VTV / RTO</option>
                      <option value="seguro">SEGURO / PATENTE</option>
                      <option value="otro">OTRO / GESTORÍA</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Kilometraje Auditado</label>
                    <input type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg outline-none" value={newEntry.kilometraje} onChange={e => setNewEntry({...newEntry, kilometraje: Number(e.target.value)})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Inversión Final ($)</label>
                    <input type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg outline-none" value={newEntry.costo} onChange={e => setNewEntry({...newEntry, costo: Number(e.target.value)})} />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción Técnica / Tareas Realizadas</label>
                 <textarea rows={4} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-sm outline-none resize-none" placeholder="DETALLE DE LA INTERVENCIÓN..." value={newEntry.descripcion} onChange={e => setNewEntry({...newEntry, descripcion: e.target.value.toUpperCase()})} />
              </div>
              <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px]">Cancelar</button>
                <button type="submit" className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                  <LucideCheck size={20}/> Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-6">Fecha / Registro</th>
                <th className="px-8 py-6">Unidad</th>
                <th className="px-8 py-6">Tipo Gestión</th>
                <th className="px-8 py-6">Kilometraje</th>
                <th className="px-8 py-6 text-right">Inversión</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-slate-800">{format(parseISO(m.fechaRegistro || m.fecha), 'dd/MM/yyyy HH:mm')}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Sincronizado Cloud</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-lg font-black text-[10px] italic uppercase">{m.vehiclePlate}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase">{m.tipo}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium truncate max-w-xs mt-1 italic">"{m.descripcion}"</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-700 italic">{(m.kilometraje || 0).toLocaleString()} KM</p>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-emerald-600 italic">
                    ${(m.costo || 0).toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => handleDelete(m.id)} className="p-2.5 text-slate-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">
                      <LucideTrash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center font-black text-slate-200 uppercase tracking-widest italic">Sin antecedentes técnicos registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
