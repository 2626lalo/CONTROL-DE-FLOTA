
import React, { useState, useEffect } from 'react';
import { LucideDollarSign, LucidePlus, LucideTrash2, LucideCheck, LucideX, LucideFileText } from 'lucide-react';
import { BudgetItem } from '../../types';

interface Props {
  onSave: (items: BudgetItem[], total: number) => void;
  onCancel: () => void;
  defaultAmount?: number;
}

export const CargarPresupuestoExperimental: React.FC<Props> = ({ onSave, onCancel, defaultAmount }) => {
  const [items, setItems] = useState<BudgetItem[]>([
    { descripcion: '', cantidad: 1, precioUnitario: defaultAmount || 0, total: defaultAmount || 0 }
  ]);

  const addItem = () => {
    setItems([...items, { descripcion: '', cantidad: 1, precioUnitario: 0, total: 0 }]);
  };

  const removeItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const updateItem = (idx: number, field: keyof BudgetItem, val: any) => {
    const newList = [...items];
    const item = { ...newList[idx] };
    
    if (field === 'cantidad') item.cantidad = Number(val);
    if (field === 'precioUnitario') item.precioUnitario = Number(val);
    if (field === 'descripcion') item.descripcion = String(val).toUpperCase();
    
    item.total = item.cantidad * item.precioUnitario;
    newList[idx] = item;
    setItems(newList);
  };

  const grandTotal = items.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="bg-white rounded-[4rem] shadow-2xl p-12 space-y-10 animate-fadeIn border-t-[12px] border-purple-600 max-w-4xl w-full max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center shrink-0 border-b pb-8">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-purple-600 text-white rounded-[1.5rem] shadow-xl shadow-purple-100">
            <LucideFileText size={32}/>
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Nueva Cotización</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Detalle de Trabajos y Repuestos</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-4 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm"><LucideX size={24}/></button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-4">
        {items.map((it, idx) => (
          <div key={idx} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row gap-6 items-end animate-fadeIn relative group transition-all hover:bg-white hover:border-purple-200 hover:shadow-xl">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción de Tarea / Material</label>
              <input 
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white font-black uppercase text-xs outline-none focus:border-purple-400 transition-all"
                value={it.descripcion}
                onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                placeholder="DETALLE TÉCNICO..."
              />
            </div>
            <div className="w-full md:w-32 space-y-2">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Cantidad</label>
              <input 
                type="number"
                onFocus={e => e.target.select()}
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white font-black text-center text-lg outline-none focus:border-purple-400 transition-all"
                value={it.cantidad}
                onChange={e => updateItem(idx, 'cantidad', e.target.value)}
              />
            </div>
            <div className="w-full md:w-48 space-y-2">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Unitario ($)</label>
              <div className="relative">
                <LucideDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={16}/>
                <input 
                  type="number"
                  onFocus={e => e.target.select()}
                  className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-slate-100 bg-white font-black text-right text-lg outline-none focus:border-purple-400 transition-all"
                  value={it.precioUnitario}
                  onChange={e => updateItem(idx, 'precioUnitario', e.target.value)}
                />
              </div>
            </div>
            <button onClick={() => removeItem(idx)} className="p-4 bg-white text-rose-300 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm group-hover:bg-rose-50 group-hover:text-rose-600"><LucideTrash2 size={20}/></button>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-slate-100 space-y-10 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <button onClick={addItem} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-2xl active:scale-95">
            <LucidePlus size={20}/> Añadir Renglón
          </button>
          <div className="text-right p-8 bg-slate-950 rounded-[2.5rem] shadow-2xl relative overflow-hidden min-w-[300px]">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 relative z-10">Total de Inversión</p>
            <p className="text-5xl font-black text-emerald-400 italic tracking-tighter relative z-10">${grandTotal.toLocaleString()}</p>
            <LucideDollarSign className="absolute -right-6 -bottom-6 text-white opacity-5" size={160}/>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-6 bg-slate-50 text-slate-400 rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest hover:bg-slate-100 transition-all border border-slate-100">Cancelar</button>
          <button 
            onClick={() => onSave(items, grandTotal)}
            disabled={grandTotal <= 0}
            className="flex-[2] bg-purple-600 text-white py-6 rounded-[1.8rem] font-black uppercase text-xs tracking-[0.2em] shadow-3xl hover:bg-purple-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
          >
            <LucideCheck size={24}/> Publicar para Auditoría
          </button>
        </div>
      </div>
    </div>
  );
};
