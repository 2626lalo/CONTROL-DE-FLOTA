
import React, { useMemo } from 'react';
import { LucideDollarSign, LucideTrendingUp, LucideBriefcase, LucideArrowUpRight } from 'lucide-react';
import { Vehicle } from '../../../types';

interface Props {
  mantenimientos: any[];
  vehicles: Vehicle[];
}

export const CostosMantenimiento: React.FC<Props> = ({ mantenimientos, vehicles }) => {
  const stats = useMemo(() => {
    const total = mantenimientos.reduce((acc, curr) => acc + (curr.costo || 0), 0);
    const avgPerVehicle = vehicles.length > 0 ? total / vehicles.length : 0;
    
    // Agrupar por vehículo
    const costsByPlate: Record<string, number> = {};
    mantenimientos.forEach(m => {
      costsByPlate[m.vehiclePlate] = (costsByPlate[m.vehiclePlate] || 0) + (m.costo || 0);
    });

    const topSpenders = Object.entries(costsByPlate)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return { total, avgPerVehicle, topSpenders };
  }, [mantenimientos, vehicles]);

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-64 group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Inversión OpEx Total</p>
            <h3 className="text-5xl font-black italic tracking-tighter leading-none">${stats.total.toLocaleString()}</h3>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
            <LucideTrendingUp size={16}/> Sincronizado con Tesorería
          </div>
          <LucideDollarSign className="absolute -right-8 -bottom-8 opacity-5 text-white group-hover:scale-110 transition-transform duration-700" size={240}/>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-64">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gasto Medio por Activo</p>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">${Math.round(stats.avgPerVehicle).toLocaleString()}</h3>
          </div>
          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
             <p className="text-[9px] font-bold text-blue-600 leading-relaxed uppercase">Métrica basada en el universo total de {vehicles.length} unidades registradas en flota.</p>
          </div>
        </div>

        <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden h-64 group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Eficiencia Presupuestaria</p>
            <h3 className="text-4xl font-black italic tracking-tighter">94.2%</h3>
          </div>
          <LucideBriefcase className="absolute -right-8 -bottom-8 opacity-10 text-white" size={180}/>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-4 flex items-center gap-3">
          <LucideArrowUpRight className="text-indigo-600" size={18}/> Top 5 Activos por Inversión Acumulada
        </h4>
        <div className="space-y-8">
          {stats.topSpenders.map(([plate, cost], idx) => {
            const perc = (cost / stats.total) * 100;
            return (
              <div key={plate} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[10px] shadow-lg">0{idx+1}</span>
                    <span className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">{plate}</span>
                  </div>
                  <span className="text-lg font-black text-slate-900">${cost.toLocaleString()}</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200 shadow-inner">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-lg shadow-indigo-100"
                    style={{ width: `${perc}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
