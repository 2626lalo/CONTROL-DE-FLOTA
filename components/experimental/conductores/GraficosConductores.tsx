
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LucidePieChart, LucideCheckCircle2, LucideUsers } from 'lucide-react';

interface Props {
  asignaciones: any[];
  fullHeight?: boolean;
}

export const GraficosConductores: React.FC<Props> = ({ asignaciones, fullHeight }) => {
  const dataCompliance = [
    { name: 'CHECKLIST OK', value: 85 },
    { name: 'CON NOVEDADES', value: 10 },
    { name: 'SIN REGISTRO', value: 5 },
  ];

  const dataLicense = [
    { name: 'VIGENTES', value: 92 },
    { name: 'POR VENCER', value: 5 },
    { name: 'VENCIDAS', value: 3 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className={`grid grid-cols-1 ${fullHeight ? '' : 'lg:grid-cols-2'} gap-8 animate-fadeIn`}>
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col h-[400px]">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3 border-b pb-4">
          <LucideCheckCircle2 className="text-blue-600" size={18}/> Cumplimiento Checklist Semanal
        </h4>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataCompliance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col h-[400px]">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3 border-b pb-4">
          <LucidePieChart className="text-indigo-600" size={18}/> Estado Legal Flota Humana
        </h4>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataLicense}
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                cornerRadius={10}
              >
                {dataLicense.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '30px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
