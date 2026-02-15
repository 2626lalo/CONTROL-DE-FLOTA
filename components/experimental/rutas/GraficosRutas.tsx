
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { LucideActivity, LucideTrendingUp, LucideNavigation } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const GraficosRutas: React.FC = () => {
  const dataMock = [
    { name: 'LUN', km: 450 }, { name: 'MAR', km: 380 }, { name: 'MIE', km: 520 },
    { name: 'JUE', km: 410 }, { name: 'VIE', km: 680 }, { name: 'SAB', km: 290 }
  ];

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm h-[450px] flex flex-col">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-3 border-b pb-4">
            <LucideTrendingUp className="text-blue-600" size={18}/> KMs Recorridos Semanales
          </h4>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataMock}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="km" fill="#3b82f6" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group h-[450px]">
           <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Métrica de Eficiencia</p>
              <h3 className="text-5xl font-black italic tracking-tighter text-blue-400">89.4%</h3>
              <p className="text-sm font-bold text-slate-400 uppercase mt-4 max-w-xs">Optimización lograda mediante reordenamiento de paradas inteligentes.</p>
           </div>
           <div className="relative z-10 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
              <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                 <span>Reducción OpEx</span>
                 <span className="text-emerald-400">-$42,500</span>
              </div>
           </div>
           <LucideNavigation className="absolute -right-12 -bottom-12 opacity-5 text-white group-hover:scale-110 transition-transform duration-700" size={240}/>
        </div>
      </div>
    </div>
  );
};
