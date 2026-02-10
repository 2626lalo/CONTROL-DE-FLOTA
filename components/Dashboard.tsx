import React, { useMemo, useState } from 'react';
import { useApp } from '../context/FleetContext';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  LucideCar, LucideTrendingUp, LucideShieldCheck, 
  LucideRefreshCw, LucideAlertTriangle, LucideHistory,
  LucideChevronRight, LucideBriefcase, LucideShield,
  LucideSparkles, LucideLoader2, LucideX, LucideLayoutDashboard
} from 'lucide-react';
import { VehicleStatus, ServiceStage, UserRole } from '../types';
import { getFleetHealthReport, isAiAvailable } from '../services/geminiService';

export const Dashboard = () => {
  const { vehicles, serviceRequests, isDataLoading, refreshData, auditLogs, user } = useApp();
  const navigate = useNavigate();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERVISOR;

  const metrics = useMemo(() => {
    const totalInvestment = vehicles.reduce((acc, v) => acc + (v.purchaseValue || 0), 0);
    const totalOpEx = serviceRequests
      .filter(r => r.stage === ServiceStage.FINISHED || r.stage === ServiceStage.DELIVERY)
      .reduce((acc, r) => acc + (r.totalCost || 0), 0);
    const availability = vehicles.length > 0 
      ? Math.round((vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length / vehicles.length) * 100) 
      : 0;

    return { totalInvestment, totalOpEx, availability };
  }, [vehicles, serviceRequests]);

  const handleAiHealthReport = async () => {
    setIsGeneratingReport(true);
    try {
      const fleetSummary = vehicles.map(v => 
        `Unidad ${v.plate}: ${v.status}, KM ${v.currentKm}`
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
    { label: 'Unidades', val: vehicles.length, icon: LucideCar, color: 'blue', path: '/vehicles' },
    { label: 'CapEx Total', val: `$${metrics.totalInvestment.toLocaleString()}`, icon: LucideBriefcase, color: 'indigo', path: '/reports' },
    { label: 'Alertas', val: vehicles.filter(v => (v.nextServiceKm - v.currentKm) < 1500).length, icon: LucideAlertTriangle, color: 'rose', path: '/vehicles' },
    { label: 'Operatividad', val: `${metrics.availability}%`, icon: LucideShieldCheck, color: 'emerald', path: '/reports' },
  ];

  return (
    <div className="space-y-8 md:space-y-10 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LucideLayoutDashboard className="text-blue-600" size={20}/>
            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">OPERATIONS HUB</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Fleet Manager Pro</h1>
          <p className="text-slate-500 font-bold mt-2 text-xs">Bienvenido, <span className="text-blue-600 font-black">{user?.name}</span></p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {isAdmin && isAiAvailable() && (
             <button 
              onClick={handleAiHealthReport} 
              disabled={isGeneratingReport}
              className="flex-1 md:flex-none px-6 py-4 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isGeneratingReport ? <LucideLoader2 className="animate-spin" size={16}/> : <LucideSparkles size={16}/>}
              Auditoría IA
            </button>
          )}
          <button 
            onClick={() => refreshData()} 
            disabled={isDataLoading} 
            className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400"
          >
            <LucideRefreshCw size={20} className={isDataLoading ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {aiReport && (
        <div className="bg-indigo-50 border-2 border-indigo-200 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] animate-fadeIn relative overflow-hidden shadow-xl">
           <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg"><LucideSparkles size={24}/></div>
                 <h3 className="text-lg md:text-2xl font-black text-indigo-950 uppercase italic tracking-tighter leading-tight">Reporte Estratégico IA</h3>
              </div>
              <button onClick={() => setAiReport(null)} className="p-2 bg-white text-indigo-400 rounded-lg shadow-md"><LucideX size={16}/></button>
           </div>
           <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-indigo-100 shadow-inner relative z-10">
                <p className="text-indigo-900 font-bold text-xs md:text-sm leading-relaxed whitespace-pre-wrap italic">{aiReport}</p>
           </div>
           <LucideShield className="absolute -right-10 -bottom-10 opacity-5 text-indigo-500" size={240}/>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s, i) => (
          <button 
            key={i} 
            onClick={() => navigate(s.path)}
            className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all text-left w-full relative overflow-hidden"
          >
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-4 leading-none">{s.val}</h3>
              </div>
              <div className={`p-3 md:p-4 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all`}>
                <s.icon size={22} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        <div className="lg:col-span-2 bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-8 md:mb-12">
              <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <LucideTrendingUp className="text-blue-600" size={16}/> Evolución de Gastos
              </h3>
              <p className="text-lg md:text-2xl font-black text-slate-800 italic">${metrics.totalOpEx.toLocaleString()}</p>
           </div>
           <div className="h-[300px] md:h-[380px]">
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
                 <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                 <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                 <Area type="monotone" dataKey="c" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorC)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-950 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 text-white shadow-2xl overflow-hidden relative group">
          <h3 className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-8 md:mb-10">
            <LucideHistory className="text-blue-500" size={16}/> Logs de Auditoría
          </h3>
          <div className="space-y-6 max-h-[350px] md:h-[420px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex gap-4">
                <div className="w-0.5 bg-blue-600/30 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-white uppercase italic truncate">{log.action}</p>
                  <p className="text-[7px] text-slate-600 font-black uppercase mt-1">{log.userName.split(' ')[0]} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};