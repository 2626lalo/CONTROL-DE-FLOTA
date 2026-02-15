
import React from 'react';
import { LucideDollarSign, LucideFuel, LucideInfo } from 'lucide-react';

interface Props {
  distance: number; // en KM
}

export const CostosRuta: React.FC<Props> = ({ distance }) => {
  // Valores mock para el cálculo, en un sistema real vendrían de config/Firestore
  const PRECIO_COMBUSTIBLE = 950; // ARS/Litro
  const CONSUMO_PROMEDIO = 12; // Litros cada 100km
  
  const litrosNecesarios = (distance * CONSUMO_PROMEDIO) / 100;
  const costoTotal = litrosNecesarios * PRECIO_COMBUSTIBLE;

  return (
    <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-blue-200 pb-3">
        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
          <LucideDollarSign size={14}/> Proyección de Costos
        </h4>
        <LucideInfo size={14} className="text-blue-300"/>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[7px] font-black text-slate-400 uppercase">Combustible Est.</p>
          <p className="text-sm font-black text-slate-700 italic">{litrosNecesarios.toFixed(1)} <span className="text-[8px] not-italic">LTS</span></p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[7px] font-black text-slate-400 uppercase">Inversión OpEx</p>
          <p className="text-xl font-black text-blue-600 italic tracking-tighter">${costoTotal.toLocaleString()}</p>
        </div>
      </div>

      <div className="pt-2">
        <p className="text-[7px] text-slate-400 font-medium italic">
          * Basado en consumo medio de 12L/100km y precio YPF Mendoza.
        </p>
      </div>
    </div>
  );
};
