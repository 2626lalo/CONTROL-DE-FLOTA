
import React, { useState } from 'react';
import { 
  LucideWarehouse, LucidePlus, LucideSearch, LucideFilter, 
  LucideBox, LucideWrench, LucideCpu, LucideShieldCheck, 
  LucideTrendingUp, LucideDollarSign, LucideCalendar, 
  LucideMoreVertical, LucideTrash2, LucideEdit3
} from 'lucide-react';

export const BienesDeUso = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Se inicializa vacío para producción
  const mockBienes: any[] = [];

  const stats = [
    { label: 'Total Activos', val: 0, icon: LucideBox, color: 'blue' },
    { label: 'En Servicio', val: 0, icon: LucideShieldCheck, color: 'emerald' },
    { label: 'Patrimonio Total', val: '$0', icon: LucideDollarSign, color: 'indigo' },
    { label: 'Pendiente Revisión', val: 0, icon: LucideWrench, color: 'rose' },
  ];

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LucideWarehouse className="text-blue-600" size={24}/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Inventory Management</span>
          </div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Bienes de Uso</h1>
          <p className="text-slate-500 font-bold mt-2 text-xs uppercase tracking-widest">Control patrimonial de equipos y herramientas industriales</p>
        </div>
        <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-3">
          <LucidePlus size={20}/> Nuevo Activo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <div className={`p-3 rounded-xl bg-${s.color}-50 text-${s.color}-600 group-hover:scale-110 transition-transform`}><s.icon size={20}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 mt-6 tracking-tighter">{s.val}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full max-w-lg">
            <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Buscar por ID, nombre o ubicación..." 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm uppercase"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-blue-600 transition-all border border-slate-100"><LucideFilter size={20}/></button>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {['TODOS', 'MAQUINARIA', 'IT', 'HERRAMIENTAS'].map(cat => (
                <button key={cat} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${cat === 'TODOS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{cat}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] border-b">
              <tr>
                <th className="px-8 py-5">Identificador / Bien</th>
                <th className="px-8 py-5">Categoría</th>
                <th className="px-8 py-5">Asignación Actual</th>
                <th className="px-8 py-5">Valor Neto</th>
                <th className="px-8 py-5 text-center">Estado</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockBienes.map(bien => (
                <tr key={bien.id} className="hover:bg-blue-50/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                        {bien.categoria === 'IT' ? <LucideCpu size={20}/> : <LucideBox size={20}/>}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase italic tracking-tight">{bien.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1.5">{bien.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-white border border-slate-200 text-[9px] font-black uppercase text-slate-500 rounded-lg">{bien.categoria}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <LucideWarehouse size={14} className="text-blue-500"/>
                      <span className="text-[10px] font-bold uppercase text-slate-600">{bien.asignado}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-800 italic">${bien.valor.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      bien.estado === 'Operativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                    }`}>
                      {bien.estado}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-all"><LucideEdit3 size={18}/></button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 transition-all"><LucideTrash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {mockBienes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <LucideBox size={48} className="mx-auto text-slate-100 mb-4"/>
                    <p className="text-slate-300 font-black uppercase text-xs tracking-widest italic">No hay activos registrados en el inventario</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Ciclo de Amortización</h4>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Proyección Gerencial de Activos</p>
            <div className="space-y-6">
              <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/10">
                <div className="h-full bg-blue-500 rounded-full w-0 shadow-lg shadow-blue-500/50"></div>
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                <span>Depreciación Acumulada: 0%</span>
                <span className="text-white">Valor Residual: $0</span>
              </div>
            </div>
          </div>
          <LucideTrendingUp className="absolute -right-10 -bottom-10 opacity-5" size={260}/>
        </div>

        <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-6">
            <h4 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-3"><LucideCalendar className="text-blue-600"/> Próxima Auditoría Patrimonial</h4>
            <div>
              <p className="text-4xl font-black text-slate-900 leading-none">S/D</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Relevamiento Físico Pendiente</p>
            </div>
          </div>
          <div className="p-8 bg-blue-50 text-blue-600 rounded-[2rem] shadow-inner">
            <LucideShieldCheck size={48}/>
          </div>
        </div>
      </div>
    </div>
  );
};
