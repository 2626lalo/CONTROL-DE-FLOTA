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

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#14b8a6', '#f43f5e'];

export const GraficosReporte: React.FC<Props> = ({ data, type }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { pie: [], bar: [] };

    // 1. Datos para gráfico de Barras: Cantidad por Centro de Costo
    const ccCounts: Record<string, number> = {};
    data.forEach(item => {
      const cc = (item.costCenter || item.centroCosto?.nombre || 'S/N').toUpperCase();
      ccCounts[cc] = (ccCounts[cc] || 0) + 1;
    });
    const barData = Object.entries(ccCounts).map(([name, value]) => ({ name, value }));

    // 2. Datos para gráfico de Torta: Distribución por Estado
    const statusCounts: Record<string, number> = {};
    data.forEach(item => {
      const status = (item.status || item.stage || item.estado || 'S/E').toUpperCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return { pie: pieData, bar: barData };
  }, [data, type]);

  if (chartData.pie.length === 0 && chartData.bar.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-[450px] flex flex-col group hover:shadow-xl transition-all">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2 border-b pb-4">
          <LucidePieChart size={14} className="text-blue-600"/> Distribución por Estatus Operativo
        </h4>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData.pie} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none" cornerRadius={10}>
                {chartData.pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontVariant: 'small-caps', fontWeight: '900' }} 
              />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-[450px] flex flex-col group hover:shadow-xl transition-all">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2 border-b pb-4">
          <LucideBarChart3 size={14} className="text-indigo-600"/> Volumen de Activos por Centro de Costo
        </h4>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.bar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};