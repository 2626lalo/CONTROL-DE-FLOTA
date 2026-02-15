import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '../context/FirebaseContext';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Users, Clock, AlertCircle, CheckCircle, XCircle,
  Wrench, FileText, Calendar, Download, Filter,
  TrendingUp, Activity, PieChart, BarChart3
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const DashboardAdmin: React.FC = () => {
  const { userData, loading: authLoading } = useFirebase();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (userData?.role !== 'ADMIN') return;
      
      try {
        setLoading(true);
        // Sincronización con colecciones reales de Firestore
        const [usersSnap, vehiclesSnap, servicesSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'vehicles')),
          getDocs(collection(db, 'requests')) // Usamos 'requests' según FleetContext
        ]);

        setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setVehicles(vehiclesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setServiceRequests(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData]);

  const handleApproval = async (userId: string, approved: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        approved,
        estado: approved ? 'activo' : 'inactivo'
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved, estado: approved ? 'activo' : 'inactivo' } : u));
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  // Cálculos de KPIs Estratégicos
  const totalVehicles = vehicles.length;
  const totalUsers = users.length;
  const approvedUsers = users.filter(u => u.approved).length;
  const pendingUsers = users.filter(u => !u.approved).length;
  const activeServices = serviceRequests.filter(s => 
    s.stage !== 'FINALIZADO' && s.stage !== 'CANCELADO'
  ).length;

  // Calcular vencimientos próximos (ej. seguros, VTV, contratos)
  const upcomingExpirations = vehicles.filter(v => {
    const dateStr = v.adminData?.fechaFinContrato || v.adminData?.fechaVencimiento;
    if (!dateStr) return false;
    const expirationDate = new Date(dateStr);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const daysUntil = diffTime / (1000 * 60 * 60 * 24);
    return daysUntil > 0 && daysUntil < 30;
  }).length;

  // Listas de Acción Rápida
  const pendingUsersList = users
    .filter(u => !u.approved)
    .sort((a, b) => new Date(b.fechaRegistro || 0).getTime() - new Date(a.fechaRegistro || 0).getTime())
    .slice(0, 5);

  const recentServices = serviceRequests
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <Activity className="text-blue-600 animate-spin mb-4" size={48} />
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Cargando Panel Ejecutivo...</p>
    </div>
  );

  if (userData?.role !== 'ADMIN') return (
    <div className="p-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
      <XCircle className="mx-auto text-rose-200 mb-6" size={64}/>
      <h2 className="text-2xl font-black text-slate-800 uppercase italic">Acceso Restringido</h2>
      <p className="text-slate-400 font-bold text-xs mt-2">Módulo exclusivo para Nivel de Administración 1.</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      {/* Header Ejecutivo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl">
            <BarChart3 size={32}/>
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">
              Panel de Control Ejecutivo
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <Activity size={12} className="text-blue-600"/> Monitoreo Global de Flota e Identidades
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-100 px-5 py-2.5 rounded-full border border-slate-200 shadow-sm">
            Sincronizado: {new Date().toLocaleTimeString()}
          </span>
          <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-colors shadow-sm active:scale-95">
            <Download size={20}/>
          </button>
        </div>
      </div>

      {/* Grid de KPIs Estratégicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Vehículos', val: totalVehicles, icon: Car, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'Usuarios Activos', val: approvedUsers, icon: Users, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'Pendientes Alta', val: pendingUsers, icon: Clock, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600' },
          { label: 'Servicios Activos', val: activeServices, icon: Wrench, color: 'purple', bg: 'bg-purple-50', text: 'text-purple-600' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className={`p-4 ${kpi.bg} ${kpi.text} rounded-2xl group-hover:scale-110 transition-transform shadow-inner`}>
                <kpi.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                <p className="text-3xl font-black text-slate-800 mt-1">{kpi.val}</p>
              </div>
            </div>
            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] ${kpi.text} group-hover:scale-125 transition-transform duration-700`}>
              <kpi.icon size={120} />
            </div>
          </div>
        ))}
      </div>

      {/* Tablas de Gestión Inmediata */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Usuarios pendientes */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-7 border-b flex justify-between items-center bg-slate-50/50">
            <h2 className="font-black text-slate-800 uppercase italic text-sm flex items-center gap-3">
              <Users size={18} className="text-blue-600"/> Solicitudes de Alta
            </h2>
            <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter">{pendingUsers} pendientes</span>
          </div>
          <div className="p-7 flex-1">
            {pendingUsersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-200">
                <CheckCircle size={56} className="mb-4 opacity-10"/>
                <p className="text-[10px] font-black uppercase tracking-widest italic">Todo el personal está autorizado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <tr>
                      <th className="pb-4">Email Corporativo</th>
                      <th className="pb-4">Nombre / Perfil</th>
                      <th className="pb-4">Fecha</th>
                      <th className="pb-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pendingUsersList.map(user => (
                      <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 text-[11px] font-medium text-slate-500 truncate max-w-[120px]">{user.email}</td>
                        <td className="py-4 text-[11px] font-black text-slate-800 uppercase italic">{user.nombre} {user.apellido}</td>
                        <td className="py-4 text-[10px] text-slate-400 font-bold">
                          {user.fechaRegistro ? format(parseISO(user.fechaRegistro), 'dd/MM/yyyy') : '---'}
                        </td>
                        <td className="py-4 text-right">
                          <button 
                             onClick={() => handleApproval(user.id, true)}
                             className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                          >
                            <CheckCircle size={14}/> Aprobar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex justify-center">
            <button onClick={() => navigate('/users-management')} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline italic">Ver Directorio Maestro</button>
          </div>
        </div>

        {/* Servicios recientes */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-7 border-b flex justify-between items-center bg-slate-50/50">
            <h2 className="font-black text-slate-800 uppercase italic text-sm flex items-center gap-3">
              <TrendingUp size={18} className="text-emerald-600"/> Monitor de Servicios
            </h2>
          </div>
          <div className="p-7 flex-1">
            {recentServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-200">
                <FileText size={56} className="mb-4 opacity-10"/>
                <p className="text-[10px] font-black uppercase tracking-widest italic">Sin actividad de servicio reportada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <tr>
                      <th className="pb-4">Unidad</th>
                      <th className="pb-4">Tipo Gestión</th>
                      <th className="pb-4 text-center">Estado</th>
                      <th className="pb-4 text-right">Apertura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentServices.map(service => (
                      <tr key={service.id} className="group hover:bg-blue-50/30 transition-all cursor-pointer" onClick={() => navigate(`/test-sector`)}>
                        <td className="py-4 text-[11px] font-black text-slate-800 uppercase italic tracking-tighter">{service.vehiclePlate}</td>
                        <td className="py-4 text-[10px] font-bold text-slate-500 uppercase truncate max-w-[100px]">{service.specificType}</td>
                        <td className="py-4 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-[8px] font-black border uppercase italic ${
                            service.stage === 'FINALIZADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            service.stage === 'CANCELADO' ? 'bg-rose-50 text-red-700 border-rose-100' :
                            'bg-blue-50 text-blue-700 border-blue-100 shadow-sm'
                          }`}>
                            {service.stage}
                          </span>
                        </td>
                        <td className="py-4 text-[10px] text-slate-400 text-right font-black tracking-tighter">
                          {service.createdAt ? format(parseISO(service.createdAt), 'dd/MM/yy') : '---'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex justify-center">
            <button onClick={() => navigate('/test-sector')} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline italic">Ir a Mesa de Control</button>
          </div>
        </div>
      </div>

      {/* Alertas de Compliance Documental */}
      {upcomingExpirations > 0 && (
        <div className="bg-rose-50 border-l-[12px] border-rose-600 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl animate-fadeIn relative overflow-hidden group">
          <div className="flex items-center gap-6 relative z-10">
            <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-xl animate-pulse">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="font-black text-rose-950 uppercase italic tracking-tighter text-xl leading-none">Riesgo Documental Detectado</h3>
              <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest mt-2 flex items-center gap-2">
                <ShieldAlert size={12}/> {upcomingExpirations} activos requieren renovación inmediata en los próximos 30 días
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/vehicles')}
            className="mt-6 md:mt-0 px-10 py-5 bg-rose-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-rose-700 transition-all active:scale-95 shadow-2xl flex items-center gap-3"
          >
            Sincronizar Legajos <LucideChevronRight size={16}/>
          </button>
          <AlertCircle className="absolute -right-8 -bottom-8 text-rose-600 opacity-5 group-hover:scale-110 transition-transform duration-700" size={240}/>
        </div>
      )}
    </div>
  );
};

// Icons not imported initially
const ShieldAlert = AlertCircle;
const LucideChevronRight = ChevronRight;
import { ChevronRight } from 'lucide-react';
