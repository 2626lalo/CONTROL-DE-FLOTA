import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/FleetContext';
import { 
  LucideUsers, LucideShieldCheck, LucideSearch, LucideUserPlus, 
  LucideLayoutDashboard, LucideCheckCircle, LucideXCircle, LucideAlertTriangle,
  LucideChevronRight, LucideFilter, LucideMail, LucideBuilding, 
  LucideShield, LucideLock, LucideBell, LucideFileText, LucideSettings,
  LucideActivity, LucideMoreVertical, LucideTrash2, LucideCheck, 
  LucideDownload, LucideRefreshCcw, LucideHistory, LucideKey,
  LucideMessageCircle, LucideSmartphone, LucideMoreHorizontal, LucideClock,
  LucideShieldAlert, LucideEye, LucideEyeOff, LucideTarget, LucideZap,
  LucideWrench, LucideInfo, LucideX, LucideChevronDown, LucideSave,
  LucideCrown, LucideGhost, LucideGlobe, LucideSend
} from 'lucide-react';
import { User, UserRole, UserStatus, Permission } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

type UserTab = 'DASHBOARD' | 'DIRECTORY' | 'PENDING' | 'PERMISSIONS';

const MASTER_EMAIL = 'alewilczek@gmail.com';

// --- SUB-COMPONENTES ---

const DashboardView = ({ stats }: { stats: any }) => (
  <div className="space-y-10 animate-fadeIn">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { label: 'Usuarios Totales', val: stats.total, icon: LucideUsers, color: 'blue' },
        { label: 'Acceso Activo', val: stats.activos, icon: LucideCheckCircle, color: 'emerald' },
        { label: 'Pendientes de Alta', val: stats.pendientes, icon: LucideClock, color: 'amber' },
        { label: 'Bajas / Suspendidos', val: stats.suspendidos, icon: LucideAlertTriangle, color: 'rose' },
      ].map((s, i) => (
        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            <div className={`p-3 rounded-xl bg-${s.color}-50 text-${s.color}-600`}><s.icon size={20}/></div>
          </div>
          <h3 className="text-4xl font-black text-slate-800 mt-6">{s.val}</h3>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="relative z-10">
          <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Alertas de Compliance</h4>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Auditoría de Acceso en Tiempo Real</p>
          <div className="space-y-4">
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <LucideUserPlus className="text-amber-400"/>
                <div><p className="text-sm font-bold">Nuevos Registros</p><p className="text-[10px] text-slate-500 uppercase">Esperando validación de identidad</p></div>
              </div>
              <span className="bg-amber-500 text-slate-900 font-black text-xs px-3 py-1 rounded-full">{stats.pendientes}</span>
            </div>
          </div>
        </div>
        <LucideShieldAlert className="absolute -right-10 -bottom-10 opacity-5" size={260}/>
      </div>
      <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm">
        <h4 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter mb-8 flex items-center gap-3"><LucideHistory className="text-blue-600"/> Actividad Reciente</h4>
        <div className="space-y-6">
          <p className="text-slate-300 text-[10px] font-black uppercase italic text-center py-10">Sin actividad registrada en la sesión actual</p>
        </div>
      </div>
    </div>
  </div>
);

const MasterListView = ({ 
    users, 
    query, 
    onQueryChange, 
    onSelectUser, 
    isMainAdmin, 
    onImpersonate 
}: { 
    users: User[], 
    query: string, 
    onQueryChange: (v: string) => void, 
    onSelectUser: (u: User) => void,
    isMainAdmin: boolean,
    onImpersonate: (id: string) => void
}) => (
  <div className="space-y-8 animate-fadeIn">
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative w-full max-w-lg">
          <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text" 
            placeholder="Buscar por Nombre, Email o Centro de Costo..." 
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] border-b">
            <tr>
              <th className="px-8 py-5">Identidad / Perfil</th>
              <th className="px-8 py-5">Centro de Costo</th>
              <th className="px-8 py-5">Rol Principal</th>
              <th className="px-8 py-5 text-center">Estado</th>
              <th className="px-8 py-5">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-blue-50/30 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm uppercase">
                      {u.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm leading-none uppercase italic">{u.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-600 rounded-lg">{u.centroCosto?.nombre || u.costCenter || 'S/A'}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-black uppercase text-slate-500">{u.role}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    u.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {u.estado || 'activo'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                   <button onClick={() => onSelectUser(u)} className="p-2.5 text-slate-400 hover:text-blue-600 transition-all"><LucideMoreHorizontal size={20}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const UserManagement = () => {
  const { registeredUsers, updateUser, deleteUser, addNotification, logAudit, user, impersonate } = useApp();
  const [activeTab, setActiveTab] = useState<UserTab>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftUser, setDraftUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isMainAdmin = user?.email === MASTER_EMAIL;

  const stats = useMemo(() => {
    // El Master Admin ya viene filtrado desde el Context, pero reforzamos aquí
    const visibleUsers = registeredUsers.filter(u => u.email !== MASTER_EMAIL);
    return {
      total: visibleUsers.length,
      activos: visibleUsers.filter(u => u.estado === 'activo').length,
      pendientes: visibleUsers.filter(u => u.estado === 'pendiente' || !u.approved).length,
      suspendidos: visibleUsers.filter(u => u.estado === 'suspendido').length,
    };
  }, [registeredUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return registeredUsers
      .filter(u => u.email !== MASTER_EMAIL)
      .filter(u => 
        u.nombre.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term)
      );
  }, [registeredUsers, searchQuery]);

  const handleApproveUser = (target: User) => {
    updateUser({ ...target, approved: true, estado: 'activo' });
    addNotification(`Usuario ${target.nombre} habilitado`, "success");
  };

  const handleSaveDraft = () => {
    if (!draftUser) return;
    updateUser(draftUser);
    setShowDetailModal(false);
    addNotification("Perfil actualizado", "success");
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Gestión de Usuarios</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Control de Accesos Corporativo</p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-slate-100 pb-1 overflow-x-auto scrollbar-hide">
         {[
           { id: 'DASHBOARD', label: 'Dashboard', icon: LucideLayoutDashboard },
           { id: 'DIRECTORY', label: 'Directorio', icon: LucideUsers },
           { id: 'PENDING', label: 'Pendientes', icon: LucideSmartphone, count: stats.pendientes },
           { id: 'PERMISSIONS', label: 'Permisos', icon: LucideKey },
         ].map(tab => (
           <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-5 px-6 text-[10px] font-black uppercase tracking-widest shrink-0 flex items-center gap-3 border-b-4 transition-all relative ${activeTab === tab.id ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
           >
            <tab.icon size={18}/> {tab.label}
           </button>
         ))}
      </div>

      <div className="animate-fadeIn">
        {activeTab === 'DASHBOARD' && <DashboardView stats={stats} />}
        {activeTab === 'DIRECTORY' && (
            <MasterListView 
                users={filteredUsers} 
                query={searchQuery} 
                onQueryChange={setSearchQuery} 
                onSelectUser={(u) => { setDraftUser(u); setShowDetailModal(true); }} 
                isMainAdmin={isMainAdmin}
                onImpersonate={impersonate}
            />
        )}
        {activeTab === 'PENDING' && (
            <PendingView 
                users={registeredUsers.filter(u => !u.approved || u.estado === 'pendiente')} 
                onApprove={handleApproveUser} 
                onReject={deleteUser} 
            />
        )}
        {activeTab === 'PERMISSIONS' && <PermissionsView />}
      </div>

      {showDetailModal && draftUser && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn flex flex-col">
                <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-black uppercase italic">{draftUser.nombre}</h3>
                    <button onClick={() => setShowDetailModal(false)} className="text-white hover:text-rose-500 transition-colors"><LucideX/></button>
                </div>
                <div className="p-10 space-y-6">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Rol Asignado</p>
                        <select className="w-full p-4 bg-slate-50 border rounded-xl font-bold uppercase text-xs" value={draftUser.role} onChange={e => setDraftUser({...draftUser, role: e.target.value as UserRole})}>
                            {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSaveDraft} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">Guardar Cambios</button>
                    <button onClick={() => { deleteUser(draftUser.id); setShowDetailModal(false); }} className="w-full py-4 text-rose-600 font-black uppercase text-[10px]">Eliminar Usuario</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const PendingView = ({ users, onApprove, onReject }: { users: User[], onApprove: (u: User) => void, onReject: (id: string) => void }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
    {users.map(u => (
      <div key={u.id} className="p-8 flex justify-between items-center">
        <div>
          <p className="font-black text-slate-800 uppercase italic">{u.nombre}</p>
          <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onApprove(u)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><LucideCheck/></button>
          <button onClick={() => onReject(u.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl"><LucideTrash2/></button>
        </div>
      </div>
    ))}
    {users.length === 0 && <div className="p-20 text-center text-slate-200 font-black uppercase text-xs italic tracking-widest">Sin solicitudes</div>}
  </div>
);

const PermissionsView = () => (
    <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
        <LucideLock size={48} className="mx-auto text-slate-100 mb-4"/>
        <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Configuración de perfiles restringida al kernel</p>
    </div>
);
