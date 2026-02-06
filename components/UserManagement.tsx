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
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <LucideLock className="text-rose-400"/>
                <div><p className="text-sm font-bold">Intentos Fallidos</p><p className="text-[10px] text-slate-500 uppercase">Posible intrusión o clave olvidada</p></div>
              </div>
              <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full">3</span>
            </div>
          </div>
        </div>
        <LucideShieldAlert className="absolute -right-10 -bottom-10 opacity-5" size={260}/>
      </div>

      <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm">
        <h4 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter mb-8 flex items-center gap-3"><LucideHistory className="text-blue-600"/> Actividad Reciente</h4>
        <div className="space-y-6">
          {[
            { u: 'Juan Pérez', a: 'Registro aprobado', t: '10 min' },
            { u: 'María Gómez', a: 'Cambio de permisos', t: '25 min' },
            { u: 'Sistema', a: 'Backup automático', t: '1 h' },
          ].map((log, i) => (
            <div key={i} className="flex gap-4 group">
              <div className="w-1 bg-blue-100 group-hover:bg-blue-600 transition-all rounded-full"></div>
              <div><p className="text-[11px] font-black text-slate-800 uppercase leading-none">{log.u}</p><p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{log.a} • {log.t}</p></div>
            </div>
          ))}
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
        <div className="flex gap-3">
           <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-blue-600 transition-all border border-slate-100"><LucideFilter size={20}/></button>
           <button className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3"><LucideDownload size={18}/> Exportar</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] border-b">
            <tr>
              <th className="px-8 py-5">Identidad / Perfil</th>
              <th className="px-8 py-5">Centro de Costo</th>
              <th className="px-8 py-5">Rol Principal</th>
              <th className="px-8 py-5">Último Acceso</th>
              <th className="px-8 py-5 text-center">Estado</th>
              <th className="px-8 py-5">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-blue-50/30 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm">
                      {u.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm leading-none uppercase italic">{u.nombre} {u.apellido || ''}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-600 rounded-lg">{u.centroCosto?.nombre || u.costCenter || 'S/A'}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                     <LucideShield size={14} className="text-blue-500"/>
                     <span className="text-[10px] font-black uppercase text-slate-500">{u.role}</span>
                     <span className="text-[8px] font-bold text-slate-300">NV {u.level || 1}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{u.ultimoAcceso ? format(parseISO(u.ultimoAcceso), 'dd/MM/yy HH:mm') : 'NUNCA'}</p>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    u.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                    u.estado === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {u.estado || 'activo'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isMainAdmin && u.email !== 'alewilczek@gmail.com' && (
                        <button 
                            onClick={() => onImpersonate(u.id)}
                            className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            title="Tomar Control del Usuario"
                        >
                            <LucideGhost size={16}/>
                        </button>
                    )}
                    <button onClick={() => onSelectUser(u)} className="p-2.5 text-slate-400 hover:text-blue-600 transition-all"><LucideMoreHorizontal size={20}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const PendingView = ({ users, onApprove, onReject }: { users: User[], onApprove: (u: User) => void, onReject: (id: string) => void }) => (
  <div className="space-y-8 animate-fadeIn">
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-50">
        <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-widest">Solicitudes de Acceso Pendientes</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Validación de identidad para nuevos registros</p>
      </div>
      <div className="divide-y divide-slate-50">
        {users.map(u => (
          <div key={u.id} className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-slate-50/50 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                {u.nombre.charAt(0)}
              </div>
              <div>
                <h4 className="font-black text-slate-800 uppercase italic leading-none">{u.nombre} {u.apellido || ''}</h4>
                <p className="text-xs text-slate-500 font-bold mt-2">{u.email}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{u.centroCosto?.nombre || u.costCenter || 'S/A'}</span>
                  <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{u.role}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => onApprove(u)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2">
                <LucideCheck size={16}/> Aprobar Acceso
              </button>
              <button onClick={() => onReject(u.id)} className="px-6 py-3 bg-white text-rose-600 border border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all">
                Rechazar
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <LucideShieldCheck size={48} className="mx-auto text-slate-100"/>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No hay solicitudes pendientes de validación</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const PermissionsView = () => {
    const modules = [
        { id: 'dashboard', label: 'Dashboard Central', icon: LucideLayoutDashboard },
        { id: 'flota', label: 'Gestión de Flota', icon: LucideTarget },
        { id: 'inspecciones', label: 'Inspecciones Técnicas', icon: LucideShieldCheck },
        { id: 'documentacion', label: 'Legajos Legales', icon: LucideFileText },
        { id: 'reportes', label: 'Business Intelligence', icon: LucideActivity },
        { id: 'servicios', label: 'Mesa de Servicios', icon: LucideWrench },
        { id: 'usuarios', label: 'Admin Usuarios', icon: LucideUsers },
    ];
    const roles = Object.values(UserRole);
    
    // ESTADO PARA LA MATRIZ FUNCIONAL
    const [matrix, setMatrix] = useState<Record<string, boolean>>({});
    const { addNotification, logAudit } = useApp();

    const togglePermission = (modId: string, role: UserRole, level: number) => {
        const key = `${modId}-${role}-${level}`;
        setMatrix(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveMatrix = () => {
        logAudit('UPDATE_PERMISSIONS_MATRIX', 'USER', 'SYSTEM', 'Actualización global de plantillas de acceso jerárquico');
        addNotification("Matriz de seguridad publicada exitosamente", "success");
    };

    return (
        <div className="space-y-12 animate-fadeIn">
            <div className="bg-indigo-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="relative z-10">
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Matriz de Permisos Dinámica</h3>
                    <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-0">Control Supremo de Accesos v2.5 • Enterprise Engine</p>
                </div>
                <button 
                    onClick={handleSaveMatrix}
                    className="relative z-10 px-8 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-3"
                >
                    <LucideSend size={20}/> Publicar Matriz de Seguridad
                </button>
                <LucideKey className="absolute -right-10 -bottom-10 opacity-10" size={240}/>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 text-white">
                            <tr>
                                <th className="px-10 py-8 text-xs font-black uppercase italic tracking-widest border-r border-white/5">Módulo de Sistema</th>
                                {roles.map(role => (
                                    <th key={role} className="px-6 py-8 text-center min-w-[200px]">
                                        <p className="text-[10px] font-black uppercase tracking-tighter text-blue-400">{role}</p>
                                        <div className="flex justify-center gap-1.5 mt-2">
                                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">NV 1-3 CONTROL</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {modules.map(mod => (
                                <tr key={mod.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-10 py-8 border-r border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><mod.icon size={20}/></div>
                                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{mod.label}</span>
                                        </div>
                                    </td>
                                    {roles.map(role => (
                                        <td key={`${mod.id}-${role}`} className="px-6 py-8 text-center">
                                            <div className="flex justify-center gap-3">
                                                {[1,2,3].map(level => {
                                                    const isActive = matrix[`${mod.id}-${role}-${level}`] ?? true;
                                                    return (
                                                        <button 
                                                            key={level} 
                                                            onClick={() => togglePermission(mod.id, role, level)}
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${
                                                                !isActive ? 'bg-slate-100 border-slate-200 text-slate-300' :
                                                                level === 3 ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-lg shadow-emerald-100' : 
                                                                level === 2 ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-lg shadow-indigo-100' : 
                                                                'bg-blue-50 border-blue-200 text-blue-600 shadow-lg shadow-blue-100'
                                                            } hover:scale-110 active:scale-90`}
                                                            title={`Nivel ${level}: ${isActive ? 'ACTIVO' : 'RESTRINGIDO'}`}
                                                        >
                                                            <LucideZap size={14} className={isActive ? 'animate-pulse' : ''}/>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="p-8 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[2.5rem] flex items-center gap-6">
                <LucideInfo className="text-blue-500" size={32}/>
                <p className="text-xs font-bold text-blue-800 leading-relaxed uppercase">Nota Administrativa: Los cambios en la matriz son instantáneos para las nuevas sesiones. Las sesiones activas requerirán re-autenticación para aplicar los nuevos perfiles de seguridad.</p>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

export const UserManagement = () => {
  const { registeredUsers, updateUser, deleteUser, addNotification, logAudit, authenticatedUser, vehicles, impersonate } = useApp();
  const [activeTab, setActiveTab] = useState<UserTab>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Gestión de modal con borrador (Draft)
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [draftUser, setDraftUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const MAIN_ADMIN_EMAIL = 'alewilczek@gmail.com';
  const isMainAdmin = authenticatedUser?.email === MAIN_ADMIN_EMAIL;
  
  // NIVELES DE PODER
  const userLevel = authenticatedUser?.level || 1;
  const isLevel2 = userLevel >= 2;
  const isLevel3 = userLevel >= 3 || isMainAdmin;

  const canEditBase = isMainAdmin || (authenticatedUser?.role === UserRole.ADMIN && isLevel2);

  const stats = useMemo(() => {
    const visibleUsers = registeredUsers.filter(u => isMainAdmin || u.email !== MAIN_ADMIN_EMAIL);
    return {
      total: visibleUsers.length,
      activos: visibleUsers.filter(u => u.estado === 'activo').length,
      pendientes: visibleUsers.filter(u => u.estado === 'pendiente' || !u.approved).length,
      suspendidos: visibleUsers.filter(u => u.estado === 'suspendido').length,
      bloqueados: visibleUsers.filter(u => u.estado === 'bloqueado').length,
    };
  }, [registeredUsers, isMainAdmin]);

  const filteredUsers = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return registeredUsers
      .filter(u => isMainAdmin || u.email !== MAIN_ADMIN_EMAIL)
      .filter(u => 
        u.nombre.toLowerCase().includes(term) || 
        u.apellido?.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term) ||
        u.centroCosto?.nombre.toLowerCase().includes(term)
      );
  }, [registeredUsers, searchQuery, isMainAdmin]);

  const centrosCosto = useMemo(() => {
    const names = Array.from(new Set(vehicles.map(v => v.costCenter).filter(Boolean)));
    return (names as string[]).map(n => ({ id: `cc-${n}`, nombre: n, codigo: n.substring(0,3).toUpperCase() }));
  }, [vehicles]);

  const handleApproveUser = (user: User) => {
    const updated: User = { 
        ...user, 
        estado: 'bloqueado', 
        approved: true,
        actualizadoPor: authenticatedUser?.nombre || 'admin',
        fechaActualizacion: new Date().toISOString()
    };
    updateUser(updated);
    addNotification(`Usuario ${user.nombre} aprobado (Estado: Bloqueado por Seguridad)`, "success");
    logAudit('USER_APPROVAL', 'USER', user.id, `Aprobación de acceso inicial para ${user.email}`);
  };

  const handleSelectUserDetail = (u: User) => {
    setSelectedUser(u);
    setDraftUser(JSON.parse(JSON.stringify(u))); // Clon profundo para el borrador
    setShowDetailModal(true);
  };

  // Detectar si hay cambios pendientes en el borrador
  const hasPendingChanges = useMemo(() => {
    return JSON.stringify(selectedUser) !== JSON.stringify(draftUser);
  }, [selectedUser, draftUser]);

  const handleSaveDraft = () => {
    if (!draftUser || !canEditBase) return;
    updateUser(draftUser);
    setSelectedUser(draftUser);
    addNotification(`Cambios aplicados para ${draftUser.nombre}`, "success");
    logAudit('USER_UPDATE', 'USER', draftUser.id, `Actualización manual de perfil por administrador`);
  };

  const updateDraft = (updates: Partial<User>) => {
    if (!draftUser) return;
    setDraftUser({ ...draftUser, ...updates });
  };

  const handleUpdatePreference = (field: string, val: boolean) => {
    if (!draftUser || !canEditBase) return;
    updateDraft({ 
        notificaciones: { ...draftUser.notificaciones, [field]: val } 
    });
  };

  const downloadActivityReport = () => {
    addNotification(`Generando reporte de actividad para ${draftUser?.nombre}...`, "success");
  };

  const handleImpersonateUser = (id: string) => {
    if (!isMainAdmin) return;
    impersonate(id);
    addNotification("Iniciando modo auditoría remota", "warning");
  };

  // REGLA DE ROLES DISPONIBLES SEGÚN NIVEL
  const availableRoles = useMemo(() => {
    const allRoles = Object.values(UserRole);
    if (isMainAdmin) return allRoles;
    if (userLevel === 2) return allRoles.filter(r => r !== UserRole.ADMIN);
    if (userLevel >= 3) return allRoles;
    return [];
  }, [userLevel, isMainAdmin]);

  // REGLA DE NIVELES DISPONIBLES
  const isLvlDisabled = (lvl: number) => {
    if (isMainAdmin) return false;
    if (lvl === 3) return true; // Solo Main Admin asigna NV3
    return false;
  };

  const isTargetMainAdmin = draftUser?.email === MAIN_ADMIN_EMAIL;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LucideShieldCheck className="text-blue-600" size={24}/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">ADMINISTRATIVE ACCESS CONTROL</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Gestión de Usuarios</h1>
        </div>
        <button className="px-8 py-5 bg-blue-600 text-white rounded-[2rem] shadow-xl hover:bg-blue-700 transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-3">
           <LucideUserPlus size={20}/> Nuevo Usuario
        </button>
      </div>

      <div className="flex gap-6 border-b border-slate-100 pb-1 overflow-x-auto scrollbar-hide">
         {[
           { id: 'DASHBOARD', label: 'Estadísticas', icon: LucideLayoutDashboard },
           { id: 'DIRECTORY', label: 'Directorio Maestro', icon: LucideUsers },
           { id: 'PENDING', label: 'Aprobaciones', icon: LucideSmartphone, count: stats.pendientes },
           { id: 'PERMISSIONS', label: 'Plantillas de Permisos', icon: LucideKey },
         ].map(tab => (
           <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-5 px-6 text-[10px] font-black uppercase tracking-widest shrink-0 flex items-center gap-3 border-b-4 transition-all relative ${activeTab === tab.id ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
           >
            <tab.icon size={18}/> {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full animate-bounce">{tab.count}</span>
            )}
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
                onSelectUser={handleSelectUserDetail} 
                isMainAdmin={isMainAdmin}
                onImpersonate={handleImpersonateUser}
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
            <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
                <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl shadow-xl flex items-center justify-center text-3xl font-black italic">{draftUser.nombre.charAt(0)}</div>
                        <div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{draftUser.nombre} {draftUser.apellido || ''}</h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 italic">{draftUser.email}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowDetailModal(false)} className="text-white hover:text-rose-500 transition-colors"><LucideX size={32}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                    {isTargetMainAdmin ? (
                        <div className="py-20 text-center space-y-6">
                            <LucideCrown size={64} className="mx-auto text-amber-500 animate-bounce"/>
                            <h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Perfil de Administrador Supremo</h4>
                            <p className="max-w-md mx-auto text-xs font-bold text-slate-400 uppercase leading-relaxed tracking-widest">Este usuario posee el control total del kernel del sistema. Sus atributos son inmutables para garantizar la integridad operativa de FleetPro.</p>
                            <div className="flex justify-center gap-4">
                                <span className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full font-black text-[10px] uppercase">Estado: Activo Permanente</span>
                                <span className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-full font-black text-[10px] uppercase">Nivel: Master (NV 3)</span>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LucideSettings size={14}/> Acciones de Estado</h5>
                                <div className="grid grid-cols-1 gap-2">
                                    <button disabled={!canEditBase} onClick={() => updateDraft({ estado: 'activo' })} className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 transition-all ${draftUser.estado === 'activo' ? 'bg-emerald-600 text-white shadow-lg scale-[1.02]' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:opacity-50'}`}><LucideCheckCircle size={16}/> Activar</button>
                                    <button disabled={!canEditBase} onClick={() => updateDraft({ estado: 'suspendido' })} className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 transition-all ${draftUser.estado === 'suspendido' ? 'bg-amber-600 text-white shadow-lg scale-[1.02]' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:opacity-50'}`}><LucideAlertTriangle size={16}/> Suspender</button>
                                    <button disabled={!canEditBase} onClick={() => updateDraft({ estado: 'bloqueado' })} className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 transition-all ${draftUser.estado === 'bloqueado' ? 'bg-rose-600 text-white shadow-lg scale-[1.02]' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:opacity-50'}`}><LucideXCircle size={16}/> Bloquear</button>
                                </div>
                                
                                <div className="space-y-4 border-t pt-4">
                                    <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><LucideKey size={14}/> Ajuste de Nivel</h5>
                                    <div className="flex gap-2">
                                        {[1,2,3].map(lvl => (
                                            <button 
                                                key={lvl} 
                                                disabled={!canEditBase || isLvlDisabled(lvl)}
                                                onClick={() => updateDraft({ level: lvl as any })}
                                                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${draftUser.level === lvl ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-50'}`}
                                            >NV {lvl}</button>
                                        ))}
                                    </div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Solo el Administrador Principal otorga NV 3</p>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase ml-2">Centro de Costo</p>
                                        <div className="relative group">
                                            <LucideBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={16}/>
                                            <select 
                                                disabled={!canEditBase}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 appearance-none disabled:opacity-70"
                                                value={draftUser.centroCosto?.nombre || draftUser.costCenter || ''}
                                                onChange={e => {
                                                    const cc = centrosCosto.find(c => c.nombre === e.target.value);
                                                    if (cc) updateDraft({ centroCosto: cc, costCenter: cc.nombre });
                                                }}
                                            >
                                                <option value="">SELECCIONE CC...</option>
                                                {centrosCosto.map(cc => <option key={cc.id} value={cc.nombre}>{cc.nombre}</option>)}
                                            </select>
                                            <LucideChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14}/>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase ml-2">Rol Corporativo</p>
                                        <div className="relative group">
                                            <LucideShield className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16}/>
                                            <select 
                                                disabled={!canEditBase}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 appearance-none disabled:opacity-70"
                                                value={draftUser.role}
                                                onChange={e => updateDraft({ role: e.target.value as UserRole })}
                                            >
                                                {availableRoles.map(role => <option key={role} value={role}>{role.toUpperCase()}</option>)}
                                            </select>
                                            <LucideChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14}/>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><LucideBell size={14}/> Preferencias de Notificación</h5>
                                    <div className="grid grid-cols-3 gap-4">
                                        {['email', 'push', 'whatsapp'].map(ch => {
                                            const isActive = (draftUser.notificaciones as any)[ch];
                                            return (
                                                <button 
                                                    key={ch} 
                                                    disabled={!canEditBase}
                                                    onClick={() => handleUpdatePreference(ch, !isActive)}
                                                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${isActive ? 'bg-indigo-600 border-indigo-400 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 opacity-50'}`}
                                                >
                                                    <p className="text-[8px] font-black uppercase">{ch}</p>
                                                    {isActive ? <LucideCheckCircle size={20} className="text-white"/> : <LucideXCircle size={20}/>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 border-t flex flex-col md:flex-row gap-4 shrink-0">
                    <div className="flex-1 flex gap-4">
                      <button onClick={() => setShowDetailModal(false)} className="flex-1 py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest border border-slate-200 hover:bg-white transition-all">Cerrar Detalle</button>
                      <button onClick={downloadActivityReport} className="flex-1 bg-white text-slate-700 py-5 rounded-2xl border border-slate-200 font-black uppercase text-[9px] tracking-widest shadow-sm hover:shadow-xl transition-all flex items-center justify-center gap-3"><LucideFileText size={16}/> Actividad</button>
                    </div>
                    
                    <div className="flex-[2] flex gap-4">
                        {isMainAdmin && !isTargetMainAdmin && (
                            <button 
                                onClick={() => handleImpersonateUser(draftUser.id)}
                                className="flex-1 bg-indigo-100 text-indigo-700 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                            >
                                <LucideGhost size={20}/> Tomar Control del Usuario
                            </button>
                        )}
                        
                        {hasPendingChanges && canEditBase && !isTargetMainAdmin && (
                            <button 
                                onClick={handleSaveDraft}
                                className="flex-1 bg-emerald-600 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-emerald-200 flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all active:scale-95 animate-fadeIn"
                            >
                                <LucideSave size={20}/> Confirmar y Sincronizar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};