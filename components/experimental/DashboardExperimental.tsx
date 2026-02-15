
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
    // Redirigimos a la mesa de control con el ID seleccionado
    navigate(`/test-sector?id=${serviceId}`);
  };

  // 4. GESTIÓN DE VENCIMIENTOS
  const handleExpirationClick = (v: any) => {
    setSelectedExpiration(v);
  };

  // 5. PROCESAMIENTO DE DATOS PARA GRÁFICOS (REALS)
  const chartData = useMemo(() => {
    // Gráfico de torta: Usuarios por Centro de Costo
    const ccCounts: Record<string, number> = {};
    users.forEach(u => {
      const cc = (u.costCenter || u.centroCosto?.nombre || 'SIN ASIGNAR').toUpperCase();
      ccCounts[cc] = (ccCounts[cc] || 0) + 1;
    });
    const pieData = Object.entries(ccCounts).map(([name, value]) => ({ name, value }));

    // Gráfico de barras: Estado de Usuarios
    const statusData = [
      { name: 'Aprobados', value: users.filter(u => u.approved).length },
      { name: 'Pendientes', value: users.filter(u => !u.approved).length }
    ];

    return { pieData, statusData };
  }, [users]);

  // Vencimientos detectados en flota
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
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">Iniciando Dashboard Pro...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* MODAL VENCIMIENTO */}
      {selectedExpiration && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-t-[12px] border-rose-600 animate-fadeIn">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl shadow-inner">
                  <ShieldAlert size={32}/>
                </div>
                <button onClick={() => setSelectedExpiration(null)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                  <XCircle size={24}/>
                </button>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Vencimiento Crítico</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Alerta de Compliance Documental</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Unidad</span>
                  <span className="text-sm font-black text-slate-800">{selectedExpiration.plate}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Documento</span>
                  <span className="text-sm font-black text-slate-800">{selectedExpiration.docType}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Fecha Límite</span>
                  <span className="text-sm font-black text-rose-600">{format(parseISO(selectedExpiration.expirationDate), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Estado</span>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${selectedExpiration.days < 0 ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                    {selectedExpiration.days < 0 ? 'VENCIDO' : `VENCE EN ${selectedExpiration.days} DÍAS`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setSelectedExpiration(null); navigate('/mantenimiento-predictivo'); }}
                  className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
                >
                  <Calendar size={18}/> Programar Renovación / Servicio
                </button>
                <button onClick={() => setSelectedExpiration(null)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px]">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="text-blue-600" size={20}/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Experimental Fleet Intelligence v3.5</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Dashboard Pro</h1>
        </div>
        <button 
          onClick={fetchData} 
          disabled={refreshing}
          className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm transition-all active:scale-95 flex items-center gap-3"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin text-blue-600' : ''}/>
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Actualizar Datos</span>
        </button>
      </div>

      {/* KPIS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Usuarios Cloud', val: users.length, icon: Users, color: 'blue' },
          { label: 'Servicios Activos', val: serviceRequests.filter(r => r.stage !== 'FINALIZADO').length, icon: Wrench, color: 'indigo' },
          { label: 'Alertas Compliance', val: alerts.length, icon: AlertTriangle, color: 'rose' },
          { label: 'Unidades Flota', val: vehicles.length, icon: Car, color: 'emerald' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <div className={`p-3 rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600 group-hover:scale-110 transition-transform`}><kpi.icon size={20}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 mt-6 tracking-tighter">{kpi.val}</h3>
          </div>
        ))}
      </div>

      {/* ANALÍTICA REAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm h-[450px] flex flex-col">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-3 border-b pb-4">
            <PieIcon size={14} className="text-blue-600"/> Usuarios por Centro de Costo
          </h4>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData.pieData} 
                  innerRadius={80} 
                  outerRadius={110} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                  cornerRadius={10}
                >
                  {chartData.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontVariant: 'small-caps', fontWeight: '900' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm h-[450px] flex flex-col">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-3 border-b pb-4">
            <BarChart3 size={14} className="text-indigo-600"/> Estado de Autorizaciones Cloud
          </h4>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* USUARIOS PENDIENTES */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-black text-slate-800 uppercase italic text-sm flex items-center gap-3">
              <Users size={18} className="text-blue-600"/> Solicitudes de Alta Pendientes
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {users.filter(u => !u.approved).map(user => (
              <div key={user.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm">{user.nombre?.charAt(0)}</div>
                   <div>
                      <p className="text-xs font-black text-slate-800 uppercase italic">{user.nombre} {user.apellido}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleApproveUser(user.id)}
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle size={14}/> Aprobar
                </button>
              </div>
            ))}
            {users.filter(u => !u.approved).length === 0 && (
              <div className="py-20 text-center text-slate-200 font-black uppercase text-[10px] italic tracking-widest">
                 No hay solicitudes pendientes
              </div>
            )}
          </div>
        </div>

        {/* SERVICIOS RECIENTES */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50">
            <h2 className="font-black text-slate-800 uppercase italic text-sm flex items-center gap-3">
              <Activity size={18} className="text-indigo-600"/> Monitor de Servicios Recientes
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {serviceRequests.slice(0, 5).map(req => (
              <div key={req.id} onClick={() => handleServiceClick(req.id)} className="p-6 flex justify-between items-center hover:bg-blue-50/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-5">
                   <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Wrench size={18}/></div>
                   <div>
                      <p className="text-sm font-black text-slate-800 uppercase italic leading-none">{req.vehiclePlate}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5">{req.specificType}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-lg border border-blue-100">{req.stage}</span>
                   <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-600 transition-all"/>
                </div>
              </div>
            ))}
            {serviceRequests.length === 0 && (
               <div className="py-20 text-center text-slate-200 font-black uppercase text-[10px] italic tracking-widest">
                  Sin actividad de servicios
               </div>
            )}
          </div>
        </div>
      </div>

      {/* ALERTAS DE CUMPLIMIENTO */}
      {alerts.length > 0 && (
        <div className="bg-rose-50 border-l-[12px] border-rose-600 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden group animate-fadeIn">
          <div className="flex items-center gap-8 relative z-10">
            <div className="p-5 bg-rose-600 text-white rounded-[1.5rem] shadow-xl animate-pulse">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h3 className="font-black text-rose-950 uppercase italic tracking-tighter text-2xl leading-none">Riesgo Operativo Detectado</h3>
              <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest mt-2 flex items-center gap-2">
                <Info size={14}/> {alerts.length} documentos caducados o próximos a vencer en los próximos 30 días
              </p>
            </div>
          </div>
          <div className="mt-8 md:mt-0 flex gap-4 relative z-10 w-full md:w-auto">
             <button 
                onClick={() => handleExpirationClick(alerts[0])}
                className="flex-1 md:flex-none px-10 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all shadow-xl"
             >
                Ver Alertas
             </button>
          </div>
          <AlertCircle className="absolute -right-8 -bottom-8 text-rose-600 opacity-5 group-hover:scale-110 transition-transform duration-700" size={240}/>
        </div>
      )}
    </div>
  );
};
