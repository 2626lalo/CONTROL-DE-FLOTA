
import React, { useState, useMemo } from 'react';
import { 
  LucideSearch, LucidePlus, LucideCar, LucideFileText, 
  LucideMapPin, LucideDollarSign, LucideCalendar, LucideTrash2,
  LucideInfo, LucideCheck, LucideX, LucideRefreshCw, LucideClock, LucideHistory,
  // Added missing LucideWrench to fix the error at line 74
  LucideWrench
} from 'lucide-react';
import { Vehicle } from '../../../types';
import { format, parseISO } from 'date-fns';
// Added missing es locale import to fix the error at line 83
import { es } from 'date-fns/locale/es';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

interface Props {
  vehicles: Vehicle[];
  mantenimientos: any[];
}

export const HistorialServiciosVehiculo: React.FC<Props> = ({ vehicles, mantenimientos }) => {
  const [search, setSearch] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('');

  const filteredHistory = useMemo(() => {
    let result = mantenimientos;
    if (selectedPlate) {
      result = result.filter(m => m.vehiclePlate === selectedPlate);
    }
    if (search) {
      const term = search.toUpperCase();
      result = result.filter(m => 
        m.vehiclePlate.includes(term) || 
        m.descripcion?.includes(term) || 
        m.proveedor?.includes(term)
      );
    }
    return result;
  }, [mantenimientos, selectedPlate, search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Confirma la eliminación de este antecedente técnico? Esta acción no se puede deshacer.")) return;
    try {
      await deleteDoc(doc(db, 'mantenimientos', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-8 items-center">
        <div className="relative flex-1 w-full">
          <LucideSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
          <input 
            type="text" 
            placeholder="BUSCAR EN EL HISTORIAL (PATENTE, DESCRIPCIÓN...)" 
            className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black text-xs uppercase outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="w-full lg:w-72 px-8 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest outline-none border-none shadow-xl cursor-pointer"
          value={selectedPlate}
          onChange={e => setSelectedPlate(e.target.value)}
        >
          <option value="">TODAS LAS UNIDADES</option>
          {vehicles.map(v => <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>)}
        </select>
      </div>

      <div className="space-y-12 relative before:absolute before:left-12 before:top-4 before:bottom-4 before:w-1 before:bg-slate-100">
        {filteredHistory.map((m, idx) => (
          <div key={m.id} className="relative pl-24 group">
            <div className="absolute left-8 top-2 w-8 h-8 rounded-2xl bg-white border-4 border-blue-600 shadow-xl z-10 flex items-center justify-center transition-transform group-hover:scale-110">
               {/* Fixed missing LucideWrench name error */}
               <LucideWrench size={14} className="text-blue-600"/>
            </div>
            
            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group-hover:-translate-y-1">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-50 pb-6">
                  <div className="flex items-center gap-6">
                    <span className="px-6 py-2 bg-slate-950 text-white rounded-xl font-black text-xl italic tracking-tighter uppercase">{m.vehiclePlate}</span>
                    <div>
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">{m.tipo}</p>
                       {/* Fixed missing es locale name error */}
                       <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Auditado: {format(parseISO(m.fechaRegistro || m.fecha), "dd 'de' MMMM, yyyy HH:mm'hs'", {locale: es})}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Kilometraje</p>
                       <p className="text-2xl font-black text-slate-800 italic">{m.kilometraje?.toLocaleString()} KM</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Inversión</p>
                       <p className="text-2xl font-black text-emerald-600 italic">${m.costo?.toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleDelete(m.id)} className="p-3 bg-rose-50 text-rose-300 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm"><LucideTrash2 size={20}/></button>
                  </div>
               </div>

               <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 italic font-bold text-slate-600 leading-relaxed shadow-inner">
                  "{m.descripcion}"
               </div>
               
               {m.proveedor && (
                 <div className="mt-6 flex items-center gap-3 text-slate-400 px-6">
                   <LucideHistory size={14}/>
                   <span className="text-[10px] font-black uppercase tracking-widest">Ejecutado por: <span className="text-slate-900">{m.proveedor}</span></span>
                 </div>
               )}
            </div>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 mx-10">
            <LucideHistory size={64} className="mx-auto text-slate-200 mb-6"/>
            <h4 className="text-xl font-black text-slate-300 uppercase italic tracking-widest">Sin antecedentes técnicos</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">No se han registrado intervenciones para los filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
};
