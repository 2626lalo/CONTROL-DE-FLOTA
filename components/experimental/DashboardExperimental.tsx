import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '../../context/FirebaseContext';
import { useApp } from '../../context/FleetContext';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Users, Clock, AlertCircle, CheckCircle, XCircle,
  Wrench, FileText, Calendar, Download, Filter,
  TrendingUp, Activity, PieChart as PieIcon, BarChart3,
  ChevronRight, RefreshCw, MapPin, ShieldAlert, 
  Info, CheckCircle2, AlertTriangle, Zap, DollarSign
} from 'lucide-react';
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export const DashboardExperimental: React.FC = () => {
  const { userData } = useFirebase();
  const { addNotification, vehicles, serviceRequests } = useApp();
  const navigate = useNavigate();

  // Estados de Datos
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de UI
  const [selectedExpiration, setSelectedExpiration] = useState<any | null>(null);

  // 1. CARGA DE DATOS REALES (onSnapshot para tiempo real)
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al refrescar datos:", error);
      addNotification("Error al sincronizar con la nube", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Suscripción para usuarios (el dashboard principal ya maneja vehicles/requests)
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 2. LÓGICA DE APROBACIÓN
  const handleApproveUser = async (userId: string) => {
    const confirmApprove = window.confirm("¿Está seguro de aprobar el acceso de este usuario al sistema?");
    if (!confirmApprove) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        approved: true,
        estado: 'activo',
        updatedAt: new Date().toISOString()
      });
      addNotification("Usuario autorizado correctamente", "success");
    } catch (error) {
      console.error("Error approving user:", error);
      addNotification("Error al procesar la aprobación", "error");
    }
  };

  // 3. NAVEGACIÓN DE SERVICIOS
  const handleServiceClick = (serviceId: string) => {
    navigate(`/test-sector?id=${serviceId}`);
  };

  // 4. GESTIÓN DE VENCIMIENTOS
  const handleExpirationClick = (v: any) => {
    setSelectedExpiration(v);
  };

  // 5. PROCESAMIENTO DE DATOS PARA GRÁFICOS (REALS)
  const chartData = useMemo(() => {
    const ccCounts: Record<string, number> = {};
    users.forEach(u => {
      const cc = (u.costCenter || u.centroCosto?.nombre || 'SIN ASIGNAR').toUpperCase();
      ccCounts[cc] = (ccCounts[cc] || 0) + 1;
    });
    const pieData = Object.entries(ccCounts).map(([name, value]) => ({ name, value }));

    const statusData = [
      { name: 'Aprobados', value: users.filter(u => u.approved).length },
      { name: 'Pendientes', value: users.filter(u => !u.approved).length }
    ];

    return { pieData, statusData };
  }, [users]);

  const alerts = useMemo(() => {
    return vehicles.flatMap(v => 
      (v.documents || []).map(d => {
        const diff = differenceInDays(parseISO(d.expirationDate), startOfDay(new Date()));
        return {
          plate: v.plate,
          docType: d.type,
          expirationDate: d.expirationDate,
          days: diff,
          severity: diff < 0 ? 'RED' : diff <= 15 ? 'YELLOW' : 'GREEN'
        };
      })
    ).filter(d => d.days <= 30)
     .sort((a, b) => a.days - b.days);
  }, [vehicles]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <RefreshCw className="animate-spin text-blue-600" size={48} />
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic text-center px-4">Iniciando Dashboard Pro...</p>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-20 px-2 md:px-0">
      {/* MODAL VENCIMIENTO - ADAPTADO A MÓVIL */}
      {selectedExpiration && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-t-[8px] md:border-t-[12px] border-rose-600 animate-fadeIn">
            <div className="p-6 md:p-10 space-y-6 md:space-y-8">
              <div className="flex justify-between items-start">
                <div className="p-3 md:p-4 bg-rose-50 text-rose-600 rounded-2xl shadow-inner">
                  <ShieldAlert size={24} className="md:w-8 md:h-8"/>
                </div>
                <button onClick={() => setSelectedExpiration(null)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                  <XCircle size={20} className="md:w-6 md:h-6"/>
                </button>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Vencimiento Crítico</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Alerta de Compliance Documental</p>
              </div>
              <div className="bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 space-y-3 md:space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Unidad</span>
                  <span className="text-xs md:text-sm font-black text-slate-800">{selectedExpiration.plate}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Documento</span>
                  <span className="text-xs md:text-sm font-black text-slate-800">{selectedExpiration.docType}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Fecha Límite</span>
                  <span className="text-xs md:text-sm font-black text-rose-600">{format(parseISO(selectedExpiration.expirationDate), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Estado</span>
                  <span className={`text-[8px] md:text-[10px] font-black uppercase px-2 md:px-3 py-1 rounded-lg ${selectedExpiration.days < 0 ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                    {selectedExpiration.days < 0 ? 'VENCIDO' : `VENCE EN ${selectedExpiration.days} DÍAS`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setSelectedExpiration(null); navigate('/mantenimiento-predictivo'); }}
                  className="w-full py-4 md:py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] md:text-xs shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
                >
                  <Calendar size={16} className="md:w-[18px] md:h-[18px]"/> Programar Servicio
                </button>
                <button onClick={() => setSelectedExpiration(null)} className="w-full py-3 text-slate-400 font-black uppercase text-[9px] md:text-[10px]">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER - ADAPTADO A MÓVIL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 px-2 md:px-0">
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="text-blue-600" size={18}/>
            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">Fleet Intelligence v3.5</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Dashboard Pro</h1>
        </div>
        <button 
          onClick={fetchData} 
          disabled={refreshing}
          className="w-full md:w-auto p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3 min-h-[48px]"
        >
          <RefreshCw size={18} className={`${refreshing ? 'animate-spin text-blue-600' : ''}`}/>
          <span className="text-[10px] font-black uppercase tracking-widest">Actualizar Datos</span>
        </button>
      </div>

      {/* KPIS RÁPIDOS - RESPONSIVE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Usuarios Cloud', val: users.length, icon: Users, color: 'blue' },
          { label: 'Servicios Activos', val: serviceRequests.filter(r => r.stage !== 'FINALIZADO').length, icon: Wrench, color: 'indigo' },
          { label: 'Alertas Compliance', val: alerts.length, icon: AlertTriangle, color: 'rose' },
          { label: 'Unidades Flota', val: vehicles.length, icon: Car, color: 'emerald' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
              <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <div className={`p-2.5 md:p-3 rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600 group-hover:scale-110 transition-transform`}><kpi.icon size={18}/></div>
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-slate-800 mt-4 md:mt-6 tracking-tighter">{kpi.val}</h3>
          </div>
        ))}
      </div>

      {/* ANALÍTICA - RESPONSIVE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3.5rem] border border-slate-100 shadow-sm h-[350px] md:h-[450px] flex flex-col">
          <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 md:mb-10 flex items-center gap-3 border-b pb-4">
            <PieIcon size={14} className="text-blue-600"/> Usuarios por C. Costo
          </h4>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* FIX: Removed unsupported responsive props md:innerRadius and md:outerRadius */}
                <Pie data={chartData.pieData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none" cornerRadius={10}>
                  {chartData.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3.5rem] border border-slate-100 shadow-sm h-[350px] md:h-[450px] flex flex-col">
          <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 md:mb-10 flex items-center gap-3 border-b pb-4">
            <BarChart3 size={14} className="text-indigo-600"/> Estado de Autorizaciones
          </h4>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* USUARIOS PENDIENTES - ADAPTADO A MÓVIL */}
        <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-black text-slate-800 uppercase italic text-xs md:text-sm flex items-center gap-3">
              <Users size={18} className="text-blue-600"/> Solicitudes Pendientes
            </h2>
            <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-[8px] font-black">{users.filter(u => !u.approved).length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {users.filter(u => !u.approved).map(user => (
              <div key={user.id} className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                   <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0">{user.nombre?.charAt(0)}</div>
                   <div className="overflow-hidden">
                      <p className="text-xs font-black text-slate-800 uppercase italic truncate">{user.nombre} {user.apellido}</p>
                      <p className="text-[10px] text-slate-400 font-bold truncate">{user.email}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleApproveUser(user.id)}
                  className="w-full sm:w-auto bg-emerald-600 text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <CheckCircle size={14}/> Aprobar
                </button>
              </div>
            ))}
            {users.filter(u => !u.approved).length === 0 && (
              <div className="py-16 md:py-20 text-center text-slate-200 font-black uppercase text-[10px] italic tracking-widest">
                 Sin solicitudes pendientes
              </div>
            )}
          </div>
        </div>

        {/* SERVICIOS RECIENTES - ADAPTADO A MÓVIL */}
        <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b bg-slate-50/50">
            <h2 className="font-black text-slate-800 uppercase italic text-xs md:text-sm flex items-center gap-3">
              <Activity size={18} className="text-indigo-600"/> Servicios Recientes
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {serviceRequests.slice(0, 5).map(req => (
              <div key={req.id} onClick={() => handleServiceClick(req.id)} className="p-4 md:p-6 flex justify-between items-center hover:bg-blue-50/50 transition-all cursor-pointer group gap-4">
                <div className="flex items-center gap-4 md:gap-5 overflow-hidden">
                   <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0"><Wrench size={16}/></div>
                   <div className="overflow-hidden">
                      <p className="text-xs md:text-sm font-black text-slate-800 uppercase italic leading-none truncate">{req.vehiclePlate}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 truncate">{req.specificType}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                   <span className="hidden xs:inline-block px-2.5 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-lg border border-blue-100">{req.stage}</span>
                   <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-600 transition-all"/>
                </div>
              </div>
            ))}
            {serviceRequests.length === 0 && (
               <div className="py-16 md:py-20 text-center text-slate-200 font-black uppercase text-[10px] italic tracking-widest">
                  Sin actividad de servicios
               </div>
            )}
          </div>
        </div>
      </div>

      {/* ALERTAS DE CUMPLIMIENTO - RESPONSIVE BANNER */}
      {alerts.length > 0 && (
        <div className="bg-rose-50 border-l-[8px] md:border-l-[12px] border-rose-600 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden group animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 relative z-10 text-center sm:text-left">
            <div className="p-4 md:p-5 bg-rose-600 text-white rounded-2xl shadow-xl animate-pulse">
              <ShieldAlert size={28}/>
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-rose-950 uppercase italic tracking-tighter text-xl md:text-2xl leading-none">Riesgo Operativo</h3>
              <p className="text-[9px] md:text-[10px] font-bold text-rose-700 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2">
                <Info size={12}/> {alerts.length} alertas detectadas
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleExpirationClick(alerts[0])}
            className="mt-6 md:mt-0 w-full md:w-auto px-10 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all shadow-xl min-h-[48px] relative z-10"
          >
            Ver Alertas
          </button>
          <AlertCircle className="absolute -right-8 -bottom-8 text-rose-600 opacity-5 group-hover:scale-110 transition-transform duration-700" size={240}/>
        </div>
      )}
    </div>
  );
};