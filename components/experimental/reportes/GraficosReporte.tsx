import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { LucidePieChart, LucideBarChart3 } from 'lucide-react';

interface Props {
  data: any[];
  type: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export const GraficosReporte: React.FC<Props> = ({ data, type }) => {
  const chartData = useMemo(() => {
    if (type === 'VEHICULOS') {
      const counts: any = {};
      data.forEach(v => counts[v.status] = (counts[v.status] || 0) + 1);
      return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }
    if (type === 'SERVICIOS') {
      const counts: any = {};
      data.forEach(s => counts[s.stage] = (counts[s.stage] || 0) + 1);
      return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }
    return [];
  }, [data, type]);

  if (chartData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-[400px] flex flex-col">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
          <LucidePieChart size={14} className="text-blue-600"/> Distribución de Estatus
        </h4>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              {/* FIX: Replaced invalid 'shadow' property with 'boxShadow' and used a valid CSS value to resolve TypeScript error on line 44 */}
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-[400px] flex flex-col">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
          <LucideBarChart3 size={14} className="text-indigo-600"/> Analítica de Volumen
        </h4>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
