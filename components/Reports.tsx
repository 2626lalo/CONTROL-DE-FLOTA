
import React, { useMemo } from 'react';
import { useApp } from '../context/FleetContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  LucideBarChart3, LucideTrendingUp, LucideDollarSign, LucideTruck, 
  LucideZap, LucideActivity, LucideDownload, LucideWrench
} from 'lucide-react';
import { ServiceStage } from '../types';

export const Reports = () => {
  const { vehicles, serviceRequests, checklists } = useApp();

  const stats = useMemo(() => {
    const totalInvestment = vehicles.reduce((acc, v) => acc + (v.purchaseValue || 0), 0);
    const totalMaintenanceCost = serviceRequests
      .filter(r => r.stage === ServiceStage.DELIVERY)
      .reduce((acc, r) => acc + (r.totalCost || 0), 0);
    
    const activeVehicles = vehicles.filter(v => v.status === 'ACTIVO').length;
    const availabilityRate = vehicles.length > 0 ? (activeVehicles / vehicles.length) * 100 : 0;

    const categoryDistribution = Array.from(new Set(serviceRequests.map(r => r.category))).map(cat => ({
      name: cat,
      value: serviceRequests.filter(r => r.category === cat).reduce((acc, r) => acc + (r.totalCost || 0), 0)
    })).filter(d => d.value > 0);

    return { totalInvestment, totalMaintenanceCost, availabilityRate, categoryDistribution };
  }, [vehicles, serviceRequests]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LucideActivity className="text-blue-600" size={24}/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Analytics v2.5</span>
          </div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Fleet Intelligence</h1>
        </div>
        <button className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-4 hover:bg-blue-600 transition-all transform active:scale-95">
          <LucideDownload size={22}/> Exportar Informe Gerencial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'TCO (CapEx + OpEx)', val: `$${(stats.totalInvestment + stats.totalMaintenanceCost).toLocaleString()}`, icon: LucideDollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'OPEX Mantenimiento', val: `$${stats.totalMaintenanceCost.toLocaleString()}`, icon: LucideWrench, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Disponibilidad Media', val: `${stats.availabilityRate.toFixed(1)}%`, icon: LucideZap, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex justify-between items-center group hover:shadow-2xl transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <h3 className="text-4xl font-black text-slate-800 mt-2 tracking-tighter">{kpi.val}</h3>
            </div>
            <div className={`p-5 rounded-3xl ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform`}>
              <kpi.icon size={28} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-12 flex items-center gap-4">
            <LucideTrendingUp size={20} className="text-blue-600"/> Evolución de Gastos Operativos
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: 'Ene', cost: 4500 },
                { month: 'Feb', cost: 5200 },
                { month: 'Mar', cost: 4800 },
                { month: 'Abr', cost: 6100 },
                { month: 'May', cost: 5500 },
                { month: 'Jun', cost: stats.totalMaintenanceCost / 2 }
              ]}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                <Area type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-12 flex items-center gap-4">
            <LucideTruck size={20} className="text-emerald-600"/> Distribución de OPEX por Categoría
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={stats.categoryDistribution} 
                  innerRadius={100} 
                  outerRadius={140} 
                  paddingAngle={8} 
                  dataKey="value" 
                  stroke="none" 
                  cornerRadius={15}
                >
                  {stats.categoryDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', paddingTop: '30px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};