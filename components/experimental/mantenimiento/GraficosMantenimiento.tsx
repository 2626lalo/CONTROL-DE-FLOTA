
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { LucidePieChart } from 'lucide-react';

interface Props {
  mantenimientos: any[];
}

export const GraficosMantenimiento: React.FC<Props> = ({ mantenimientos }) => {
  const data = React.useMemo(() => {
    const categories: Record<string, number> = {};
    mantenimientos.forEach(m => {
      categories[m.tipo] = (categories[m.tipo] || 0) + (m.costo || 0);
    });
    return Object.entries(categories).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [mantenimientos]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm h-full flex flex-col min-h-[400px]">
      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 border-b pb-4 mb-8">
        <LucidePieChart className="text-blue-600" size={18}/> Inversión por Segmento Técnico
      </h4>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={70}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              cornerRadius={10}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontVariant: 'small-caps', fontWeight: '900' }}
              formatter={(val: number) => `$${val.toLocaleString()}`}
            />
            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '30px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
