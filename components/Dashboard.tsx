
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/FleetContext';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  LucideCar, LucideDollarSign, LucideTrendingUp, LucideShieldCheck, 
  LucideRefreshCw, LucideAlertTriangle, LucideHistory,
  LucideChevronRight, LucideWrench, LucideBriefcase, LucideShield,
  LucideSparkles, LucideLoader2, LucideX, LucideLayoutDashboard
} from 'lucide-react';
import { VehicleStatus, ServiceStage, UserRole } from '../types';
import { GOLDEN_MASTER_SNAPSHOT } from '../constants';
import { getFleetHealthReport, isAiAvailable } from '../services/geminiService';

export const Dashboard = () => {
  const { vehicles, serviceRequests, isDataLoading, refreshData, auditLogs, user } = useApp();
  const navigate = useNavigate();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // FIX: Replaced non-existent UserRole properties (ADMIN_L2, MANAGER) with SUPERVISOR
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERVISOR;

  const metrics = useMemo(() => {
    const totalInvestment = vehicles.reduce((acc, v) => acc + (v.purchaseValue || 0), 0);
    const totalOpEx = serviceRequests
      .filter(r => r.stage === ServiceStage.FINISHED || r.stage === ServiceStage.DELIVERY)
      .reduce((acc, r) => acc + (r.totalCost || 0), 0);
    const totalKm = vehicles.reduce((acc, v) => acc + v.currentKm, 0);
    const availability = vehicles.length > 0 
      ? Math.round((vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length / vehicles.length) * 100) 
      : 0;

    return { 
      totalInvestment, 
      totalOpEx, 
      cpk: totalKm > 0 ? (totalOpEx / totalKm).toFixed(2) : '0.00', 
      availability 
    };
  }, [vehicles, serviceRequests]);

  const handleAiHealthReport = async () => {
    setIsGeneratingReport(true);
    try {
      const fleetSummary = vehicles.map(v => 
        `Unidad ${v.plate}: ${v.status}, KM ${v.currentKm}, Docs: ${v.documents.length}, Vencimientos proximos: ${v.documents.filter(d => {
          if (!d.expirationDate) return false;
          const diff = (new Date(d.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
          return diff < 30;
        }).length}`
      ).join('; ');
      const report = await getFleetHealthReport(fleetSummary);
      setAiReport(report);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const stats = [
    { 
      label: 'Activos de Flota', 
      val: vehicles.length, 
      icon: LucideCar, 
      color: 'blue',
      path: '/vehicles',
      detail: 'Unidades en inventario'
    },
    { 
      label: 'Inversión CapEx', 
      val: `$${metrics.totalInvestment.toLocaleString()}`, 
      icon: LucideBriefcase, 
      color: 'indigo',
      path: '/reports',
      detail: 'Valor total activos'
    },
    { 
      label: 'Alertas Técnicas', 
      val: vehicles.filter(v => (v.nextServiceKm - v.currentKm) < 1500).length, 
      icon: LucideAlertTriangle, 
      color: 'rose',
      path: '/vehicles',
      detail: 'Servicios por vencer'
    },
    { 
      label: 'Disponibilidad', 
      val: `${metrics.availability}%`, 
      icon: LucideShieldCheck, 
      color: 'emerald',
      path: '/reports',
      detail: 'Tasa de operatividad'
    },
  ];

  return (
    <div className="space-y-10 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LucideLayoutDashboard className="text-blue-600" size={24}/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">OPERATIONS HUB v36.0</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Fleet Manager Pro</h1>
          <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
            Bienvenido, gestor <span className="text-blue-600 font-black">{user?.name}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin && isAiAvailable() && (
             <button 
              onClick={handleAiHealthReport} 
              disabled={isGeneratingReport}
              className="px-8 py-5 bg-indigo-600 text-white rounded-[2rem] shadow-xl hover:bg-indigo-700 transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isGeneratingReport ? <LucideLoader2 className="animate-spin" size={18}/> : <LucideSparkles size={18}/>}
              Auditoría Inteligente IA
            </button>
          )}
          <button 
            onClick={() => refreshData()} 
            disabled={isDataLoading} 
            className="p-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl transition-all text-slate-400 flex items-center gap-2"
          >
            <LucideRefreshCw size={24} className={isDataLoading ? "animate-spin" : ""}/>
            <span className="text-[10px] font-black uppercase hidden md:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {aiReport && (
        <div className="bg-indigo-50 border-2 border-indigo-200 p-10 rounded-[4rem] animate-fadeIn relative overflow-hidden group shadow-2xl shadow-indigo-100">
           <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl"><LucideSparkles size={32}/></div>
                 <div>
                    <h3 className="text-3xl font-black text-indigo-950 uppercase italic tracking-tighter">Reporte Estratégico Fleet Intelligence</h3>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Digital Audit Engine v36.0</p>
                 </div>
              </div>
              <button onClick={() => setAiReport(null)} className="p-3 bg-white text-indigo-400 hover:text-rose-500 rounded-2xl transition-all shadow-md"><LucideX size={20}/></button>
           </div>
           <div className="prose prose-indigo max-w-none relative z-10">
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-indigo-100 shadow-inner">
                <p className="text-indigo-900 font-bold text-sm leading-relaxed whitespace-pre-wrap italic">
                  {aiReport}
                </p>
              </div>
           </div>
           <div className="mt-8 flex justify-between items-center relative z-10">
              <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Generado en tiempo real mediante Gemini 3 Flash • Enterprise Engine</p>
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Análisis de Riesgo Crítico</div>
           </div>
           <LucideShield className="absolute -right-20 -bottom-20 opacity-5 text-indigo-500 group-hover:scale-110 transition-transform duration-1000" size={400}/>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <button 
            key={i} 
            onClick={() => navigate(s.path)}
            className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl hover:border-blue-200 transition-all text-left w-full relative overflow-hidden"
          >
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <h3 className="text-4xl font-black text-slate-900 mt-5 tracking-tighter leading-none">{s.val}</h3>
                <p className="text-[9px] font-bold text-blue-500 uppercase mt-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {s.detail} <LucideChevronRight size={12}/>
                </p>
              </div>
              <div className="p-5 rounded-3xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                <s.icon size={28} />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-12">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
                 <LucideTrendingUp className="text-blue-600" size={20}/> Evolución de Gastos (OpEx Mantenimiento)
              </h3>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase">Total Periodo Actual</p>
                <p className="text-2xl font-black text-slate-800 italic">${metrics.totalOpEx.toLocaleString()}</p>
              </div>
           </div>
           <div className="h-[380px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[
                  { n: 'Ene', c: 4500 }, { n: 'Feb', c: 5200 }, { n: 'Mar', c: 4800 },
                  { n: 'Abr', c: 6100 }, { n: 'May', c: 5500 }, { n: 'Jun', c: metrics.totalOpEx || 4000 },
               ]}>
                 <defs>
                   <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} />
                 <Tooltip 
                    contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', fontWeight: 'black' }}
                    formatter={(value) => [`$${value}`, 'Gasto']} 
                 />
                 <Area type="monotone" dataKey="c" stroke="#3b82f6" strokeWidth={6} fillOpacity={1} fill="url(#colorC)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-950 rounded-[4rem] p-12 text-white shadow-2xl overflow-hidden relative group">
          <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
              <LucideHistory className="text-blue-500" size={20}/> Línea de Tiempo de Auditoría
            </h3>
          </div>
          <div className="space-y-8 max-h-[420px] overflow-y-auto pr-4 custom-scrollbar relative z-10">
            {auditLogs.length > 0 ? auditLogs.slice(0, 15).map((log) => (
              <div key={log.id} className="flex gap-5 group/item transition-all hover:translate-x-1">
                <div className="w-1 bg-blue-600/30 rounded-full group-hover/item:bg-blue-500 transition-all"></div>
                <div className="flex-1">
                  <p className="text-[11px] font-black text-white uppercase tracking-tighter leading-tight italic">{log.action}</p>
                  <p className="text-[8px] text-slate-600 font-black uppercase mt-1.5">{log.userName} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                  <div className="mt-2 p-3 bg-white/5 rounded-2xl border border-white/10 group-hover/item:border-white/10 transition-all">
                     <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{log.details}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-24 opacity-20 italic text-[10px] uppercase tracking-widest font-black">
                Sin actividad archivada
              </div>
            )}
          </div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-600/10 rounded-full blur-[100px] group-hover:bg-blue-600/20 transition-all duration-1000"></div>
        </div>
      </div>
    </div>
  );
};
