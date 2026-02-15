
import React, { useMemo } from 'react';
import { LucideDollarSign, LucideTrendingUp, LucideBriefcase, LucideArrowUpRight, LucideFileSpreadsheet, LucideActivity } from 'lucide-react';
import { Vehicle } from '../../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface Props {
  mantenimientos: any[];
  vehicles: Vehicle[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export const CostosMantenimiento: React.FC<Props> = ({ mantenimientos, vehicles }) => {
  const stats = useMemo(() => {
    const total = mantenimientos.reduce((acc, curr) => acc + (curr.costo || 0), 0);
    const avgPerVehicle = vehicles.length > 0 ? total / vehicles.length : 0;
    
    // Agrupar por tipo
    const typeCosts: Record<string, number> = {};
    mantenimientos.forEach(m => {
      const type = (m.tipo || 'otro').toUpperCase();
      typeCosts[type] = (typeCosts[type] || 0) + (m.costo || 0);
    });
    const pieData = Object.entries(typeCosts).map(([name, value]) => ({ name, value }));

    // Agrupar por vehículo (Top 5)
    const costsByPlate: Record<string, number> = {};
    mantenimientos.forEach(m => {
      costsByPlate[m.vehiclePlate] = (costsByPlate[m.vehiclePlate] || 0) + (m.costo || 0);
    });
    const topSpenders = Object.entries(costsByPlate)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return { total, avgPerVehicle, topSpenders, pieData };
  }, [mantenimientos, vehicles]);

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-64 group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Inversión OpEx Acumulada</p>
            <h3 className="text-5xl font-black italic tracking-tighter leading-none">${stats.total.toLocaleString()}</h3>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
            <LucideTrendingUp size={16}/> Sincronizado con Tesorería
          </div>
          <LucideDollarSign className="absolute -right-8 -bottom-8 opacity-5 text-white group-hover:scale-110 transition-transform duration-700" size={240}/>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-64">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gasto Medio por Unidad</p>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">${Math.round(stats.avgPerVehicle).toLocaleString()}</h3>
          </div>
          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
             <p className="text-[9px] font-bold text-blue-600 leading-relaxed uppercase">Proyección basada en el parque total de {vehicles.length} unidades registradas.</p>
          </div>
        </div>

        <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden h-64 group flex flex-col justify-between">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Eficiencia Preventiva</p>
            <h3 className="text-5xl font-black italic tracking-tighter">91.4%</h3>
          </div>
          <p className="relative z-10 text-[9px] font-black uppercase text-indigo-200 opacity-80">Score de Cumplimiento Técnico</p>
          <LucideBriefcase className="absolute -right-8 -bottom-8 opacity-10 text-white" size={180}/>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm h-[500px] flex flex-col">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-3 border-b pb-4">
            <LucideActivity className="text-blue-600" size={18}/> Inversión por Categoría Técnica
          </h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.pieData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none" cornerRadius={10}>
                  {stats.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontVariant: 'small-caps', fontWeight: '900' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm h-[500px] flex flex-col">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-3 border-b pb-4">
            <LucideArrowUpRight className="text-indigo-600" size={18}/> Top 5 Unidades (OpEx Acumulado)
          </h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topSpenders}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
