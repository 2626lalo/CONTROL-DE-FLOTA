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
  LucideCrown, LucideGhost, LucideGlobe, LucideSend, LucideRotateCcw,
  LucideUser, LucideUserCheck, LucideFingerprint, LucideUserCog,
  LucideCar, LucideClipboardCheck, LucideLockKeyhole, LucideLayers,
  LucideChevronUp, LucideVerified
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
        { label: 'Reseteos Pendientes', val: stats.resetRequests, icon: LucideKey, color: 'rose' },
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
            {stats.resetRequests > 0 && (
                <div className="p-5 bg-rose-600/20 border border-rose-500/30 rounded-2xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-4">
                        <LucideKey className="text-rose-400"/>
                        <div><p className="text-sm font-bold text-white">Reseteo de Claves</p><p className="text-[10px] text-rose-300/60 uppercase">Usuarios bloqueados por olvido</p></div>
                    </div>
                    <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full">{stats.resetRequests}</span>
                </div>
            )}
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
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm uppercase relative">
                      {u.nombre.charAt(0)}
                      {u.resetRequested && (
                        <div className="absolute -top-1 -right-1 bg-rose-600 text-white p-0.5 rounded-full border-2 border-white animate-bounce">
                          <LucideAlertTriangle size={8}/>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-800 text-sm leading-none uppercase italic">{u.nombre} {u.apellido}</p>
                        {u.resetRequested && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[7px] font-black uppercase rounded">RESETEO</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-600 rounded-lg">{u.costCenter || u.centroCosto?.nombre || 'S/A'}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-black uppercase text-slate-500">{u.role}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    u.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                    u.estado === 'bloqueado' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    'bg-slate-50 text-slate-600 border-slate-200'
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

// --- COMPONENTE DE PERMISOS GRANULARES ---
const PermissionsManager: React.FC<{ user: User, onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
  const [localUser, setLocalUser] = useState<User>(user);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
      setLocalUser(user);
      setIsModified(false);
  }, [user]);

  const sections = [
    { id: 'dashboard', label: 'Dashboard Operativo', icon: LucideLayoutDashboard },
    { id: 'flota', label: 'Gestión de Activos', icon: LucideCar },
    { id: 'inspecciones', label: 'Auditoría de Campo', icon: LucideClipboardCheck },
    { id: 'documentacion', label: 'Dossier Legal', icon: LucideFileText },
    { id: 'reportes', label: 'Business Intelligence', icon: LucideZap },
    { id: 'servicios', label: 'Mesa de Servicios', icon: LucideWrench },
    { id: 'usuarios', label: 'Control de Accesos', icon: LucideShield },
  ] as const;

  const applyLevelTemplate = (level: 1 | 2 | 3) => {
    let newPerms: Permission[] = [];
    sections.forEach(sec => {
      if (level === 1) {
        newPerms.push({ id: `PERM-${sec.id}-${Date.now()}`, seccion: sec.id as any, ver: true, crear: ['inspecciones', 'servicios'].includes(sec.id), editar: false, eliminar: false });
      } else if (level === 2) {
        newPerms.push({ id: `PERM-${sec.id}-${Date.now()}`, seccion: sec.id as any, ver: true, crear: true, editar: true, eliminar: false });
      } else if (level === 3) {
        newPerms.push({ id: `PERM-${sec.id}-${Date.now()}`, seccion: sec.id as any, ver: true, crear: true, editar: true, eliminar: true });
      }
    });
    setLocalUser({ ...localUser, level, permissions: newPerms });
    setIsModified(true);
  };

  const togglePermission = (sectionId: string, action: keyof Permission) => {
    let newPerms = [...(localUser.permissions || [])];
    const index = newPerms.findIndex(p => p.seccion === sectionId);
    
    if (index > -1) {
      newPerms[index] = { ...newPerms[index], [action]: !newPerms[index][action] };
    } else {
      newPerms.push({
        id: `PERM-${Date.now()}`,
        seccion: sectionId as any,
        ver: action === 'ver',
        crear: action === 'crear',
        editar: action === 'editar',
        eliminar: action === 'eliminar'
      });
    }
    setLocalUser({ ...localUser, permissions: newPerms });
    setIsModified(true);
  };

  const handleConfirmChanges = () => {
      onUpdate(localUser);
      setIsModified(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"><LucideLayers size={20}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuración Rápida</p>
                    <h4 className="text-sm font-black text-slate-800 uppercase italic">Aplicar Plantillas de Nivel</h4>
                </div>
            </div>
            <div className="flex gap-3">
                {[
                    { l: 1, label: 'Nivel 1: Operativo', color: 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50' },
                    { l: 2, label: 'Nivel 2: Supervisor', color: 'bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white' },
                    { l: 3, label: 'Nivel 3: Gerencial', color: 'bg-slate-900 text-white border-slate-800 hover:bg-blue-600' }
                ].map(p => (
                    <button 
                        key={p.l} 
                        onClick={() => applyLevelTemplate(p.l as any)}
                        className={`px-6 py-3 rounded-xl border font-black uppercase text-[9px] tracking-widest transition-all shadow-sm ${localUser.level === p.l ? 'ring-4 ring-blue-100 border-blue-500 scale-105' : ''} ${p.color}`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <LucideShieldCheck className="text-blue-600" size={24}/>
                    <h4 className="text-sm font-black text-slate-800 uppercase italic">Matriz de Acceso Personalizada</h4>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                    <LucideVerified size={12}/>
                    <span className="text-[8px] font-black uppercase tracking-widest">Nivel de Acceso {localUser.level} Activo</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 border-b">
                        <tr>
                            <th className="px-8 py-4">Módulo de Sistema</th>
                            <th className="px-8 py-4 text-center">Visualizar</th>
                            <th className="px-8 py-4 text-center">Crear</th>
                            <th className="px-8 py-4 text-center">Editar</th>
                            <th className="px-8 py-4 text-center">Eliminar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sections.map(sec => {
                            const perm = (localUser.permissions || []).find(p => p.seccion === sec.id);
                            return (
                                <tr key={sec.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <sec.icon size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors"/>
                                            <span className="text-[10px] font-bold text-slate-700 uppercase">{sec.label}</span>
                                        </div>
                                    </td>
                                    {(['ver', 'crear', 'editar', 'eliminar'] as const).map(action => (
                                        <td key={action} className="px-8 py-5 text-center">
                                            <button 
                                                onClick={() => togglePermission(sec.id, action)}
                                                className={`p-2.5 rounded-xl transition-all ${perm?.[action] ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'bg-slate-50 text-slate-200 border border-transparent hover:text-slate-400'}`}
                                            >
                                                {perm?.[action] ? <LucideCheck size={16}/> : <LucideX size={16}/>}
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                    onClick={handleConfirmChanges}
                    disabled={!isModified}
                    className={`px-12 py-5 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all transform active:scale-95 flex items-center gap-3 ${isModified ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed grayscale opacity-50'}`}
                >
                    <LucideSave size={20}/> Confirmar y Sincronizar Permisos de Kernel
                </button>
            </div>
        </div>
    </div>
  );
};

export const UserManagement = () => {
  const { registeredUsers, updateUser, deleteUser, addNotification, logAudit, user, impersonate, costCenters, addCostCenter, removeCostCenter } = useApp();
  const [activeTab, setActiveTab] = useState<UserTab>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftUser, setDraftUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [tempPass, setTempPass] = useState('');
  const [showCCDropdown, setShowCCDropdown] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  
  const [selectedUserIdForPerms, setSelectedUserIdForPerms] = useState<string>('');

  const isMainAdmin = user?.email === MASTER_EMAIL;

  const stats = useMemo(() => {
    const visibleUsers = registeredUsers.filter(u => u.email !== MASTER_EMAIL);
    return {
      total: visibleUsers.length,
      activos: visibleUsers.filter(u => u.estado === 'activo').length,
      pendientes: visibleUsers.filter(u => u.estado === 'pendiente' || !u.approved).length,
      resetRequests: visibleUsers.filter(u => u.resetRequested).length,
      suspendidos: visibleUsers.filter(u => u.estado === 'suspendido').length,
    };
  }, [registeredUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return registeredUsers
      .filter(u => u.email !== MASTER_EMAIL)
      .filter(u => 
        u.nombre.toLowerCase().includes(term) || 
        u.apellido?.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
  }, [registeredUsers, searchQuery]);

  const selectedUserForPerms = useMemo(() => {
    return registeredUsers.find(u => u.id === selectedUserIdForPerms);
  }, [registeredUsers, selectedUserIdForPerms]);

  const handleApproveUser = (target: User) => {
    updateUser({ ...target, approved: true, estado: 'activo', resetRequested: false });
    addNotification(`Usuario ${target.nombre} habilitado`, "success");
  };

  const handleSaveDraft = () => {
    if (!draftUser) return;
    
    // VALIDACIÓN: Teléfono numérico
    const isNumeric = /^\d+$/.test(draftUser.telefono || '');
    if (!isNumeric && draftUser.telefono) {
        setPhoneError('El teléfono debe contener solo números');
        addNotification("Error de validación: El teléfono debe ser numérico", "error");
        return;
    }
    setPhoneError('');

    const finalUser = { 
        ...draftUser, 
        resetRequested: false, 
        costCenter: draftUser.costCenter,
        centroCosto: { ...draftUser.centroCosto, nombre: draftUser.costCenter || 'S/A' }
    };
    updateUser(finalUser);
    if (draftUser.costCenter) addCostCenter(draftUser.costCenter);
    setShowDetailModal(false);
    addNotification("Ficha de usuario sincronizada y actualizada", "success");
  };

  const handleManualReset = () => {
    if (!draftUser || !tempPass) return;
    updateUser({ 
        ...draftUser, 
        password: tempPass, 
        resetRequested: false, 
        estado: 'activo', 
        approved: true 
    });
    setTempPass('');
    setShowDetailModal(false);
    addNotification(`Contraseña de ${draftUser.nombre} blanqueada a: ${tempPass}`, "success");
  };

  const handleDeleteUser = () => {
    if (!draftUser) return;
    if (confirm(`¿Está seguro de eliminar permanentemente el acceso de ${draftUser.nombre}? Esta acción es irreversible.`)) {
        deleteUser(draftUser.id);
        setShowDetailModal(false);
        addNotification("Usuario eliminado del sistema", "warning");
    }
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
           { id: 'PENDING', label: 'Pendientes / Alertas', icon: LucideSmartphone, count: stats.pendientes + stats.resetRequests },
           { id: 'PERMISSIONS', label: 'Kernel de Permisos', icon: LucideLockKeyhole },
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
                onSelectUser={(u) => { setDraftUser(u); setShowDetailModal(true); setTempPass(''); setPhoneError(''); }} 
                isMainAdmin={isMainAdmin}
                onImpersonate={impersonate}
            />
        )}
        {activeTab === 'PENDING' && (
            <div className="space-y-10">
                <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Solicitudes de Alta</h4>
                    <PendingView 
                        users={registeredUsers.filter(u => (!u.approved || u.estado === 'pendiente') && !u.resetRequested)} 
                        onApprove={handleApproveUser} 
                        onReject={deleteUser} 
                    />
                </section>
                {stats.resetRequests > 0 && (
                    <section>
                        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 ml-2">⚠️ Solicitudes de Reseteo Crítico</h4>
                        <div className="bg-rose-50 border border-rose-200 rounded-[2.5rem] divide-y divide-rose-100 overflow-hidden">
                            {registeredUsers.filter(u => u.resetRequested).map(u => (
                                <div key={u.id} className="p-8 flex justify-between items-center">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-rose-600 text-white rounded-2xl animate-pulse"><LucideKey size={24}/></div>
                                        <div>
                                            <p className="font-black text-rose-900 uppercase italic leading-none">{u.nombre}</p>
                                            <p className="text-[10px] text-rose-600 font-bold mt-1.5">{u.email}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setDraftUser(u); setShowDetailModal(true); setTempPass('Reset2025!'); }} className="px-8 py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                                        <LucideRotateCcw size={14}/> Blanquear Clave
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        )}
        {activeTab === 'PERMISSIONS' && (
            <div className="space-y-10">
                {isMainAdmin ? (
                    <div className="space-y-10">
                        <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Administrador de Kernel</h3>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-2">Configuración de niveles de acceso empresarial</p>
                                
                                <div className="mt-8 max-w-lg relative group">
                                    <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18}/>
                                    <select 
                                        className="w-full pl-12 pr-6 py-4 bg-white/10 border border-white/20 rounded-2xl font-black uppercase text-xs outline-none focus:bg-white focus:text-blue-900 transition-all appearance-none cursor-pointer"
                                        value={selectedUserIdForPerms}
                                        onChange={e => setSelectedUserIdForPerms(e.target.value)}
                                    >
                                        <option value="" className="text-slate-900">Seleccionar Usuario para Auditar...</option>
                                        {registeredUsers.filter(u => u.email !== MASTER_EMAIL).map(u => (
                                            <option key={u.id} value={u.id} className="text-slate-900">{u.nombre} {u.apellido} ({u.email})</option>
                                        ))}
                                    </select>
                                    <LucideChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" size={16}/>
                                </div>
                            </div>
                            <LucideCrown className="absolute -right-12 -bottom-12 opacity-10" size={240}/>
                        </div>

                        {selectedUserForPerms ? (
                            <PermissionsManager key={selectedUserForPerms.id} user={selectedUserForPerms} onUpdate={updateUser} />
                        ) : (
                            <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                                <LucideUserCog size={64} className="mx-auto text-slate-100 mb-8"/>
                                <h4 className="font-black text-slate-300 uppercase italic tracking-tighter text-xl">Ningún Usuario Seleccionado</h4>
                                <p className="text-slate-200 font-black uppercase text-[9px] tracking-[0.4em] mt-2">Elija una identidad arriba para desplegar su matriz de kernel</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 animate-pulse">
                        <LucideLock size={64} className="mx-auto text-slate-100 mb-8"/>
                        <h4 className="font-black text-slate-300 uppercase italic tracking-tighter text-xl">Módulo de Kernel Restringido</h4>
                        <p className="text-slate-200 font-black uppercase text-[9px] tracking-[0.4em] mt-2">Sólo el administrador principal posee privilegios de nivel 1</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {showDetailModal && draftUser && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col border-t-[12px] border-blue-600">
                <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-xl"><LucideUserCog size={32}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">{draftUser.nombre} {draftUser.apellido}</h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{draftUser.email}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowDetailModal(false)} className="text-white hover:text-rose-500 transition-colors p-2"><LucideX/></button>
                </div>
                
                <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {draftUser.resetRequested ? (
                        <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-200 space-y-6">
                            <div className="flex items-center gap-4 text-rose-700">
                                <LucideShieldAlert size={40}/>
                                <div><p className="font-black uppercase text-sm">Protocolo de Reseteo Activo</p><p className="text-[10px] font-bold opacity-70 leading-relaxed">El usuario declaró pérdida de credenciales. Se requiere asignación de clave temporal.</p></div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nueva Clave Temporal</label>
                                <input 
                                    className="w-full px-6 py-4 bg-white border-2 border-rose-200 rounded-2xl font-black text-xl text-rose-600 outline-none shadow-inner"
                                    value={tempPass}
                                    onChange={e => setTempPass(e.target.value)}
                                    placeholder="ClaveTemporal123!"
                                />
                            </div>
                            <button onClick={handleManualReset} disabled={!tempPass} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-rose-700 disabled:opacity-30 flex items-center justify-center gap-3">
                                <LucideRotateCcw size={18}/> Blanquear y Habilitar Acceso
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideFingerprint size={14} className="text-blue-600"/> Identidad Maestro</h5>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre</p>
                                            <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:bg-white focus:border-blue-500 uppercase" value={draftUser.nombre} onChange={e => setDraftUser({...draftUser, nombre: e.target.value.toUpperCase()})} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Apellido</p>
                                            <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:bg-white focus:border-blue-500 uppercase" value={draftUser.apellido || ''} onChange={e => setDraftUser({...draftUser, apellido: e.target.value.toUpperCase()})} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Teléfono de Contacto</p>
                                            <input className={`w-full p-4 border rounded-xl font-bold text-xs outline-none transition-all ${phoneError ? 'bg-rose-50 border-rose-500' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500'}`} value={draftUser.telefono || ''} onChange={e => setDraftUser({...draftUser, telefono: e.target.value})} />
                                            {phoneError && <p className="text-[8px] font-black text-rose-500 ml-4 uppercase">{phoneError}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideActivity size={14} className="text-emerald-500"/> Estatus y Rol</h5>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Estado Operativo</p>
                                            <select className={`w-full p-4 rounded-xl font-black uppercase text-xs outline-none border transition-all ${draftUser.estado === 'activo' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`} value={draftUser.estado} onChange={e => setDraftUser({...draftUser, estado: e.target.value as UserStatus})}>
                                                <option value="activo">ACTIVO (ACCESO TOTAL)</option>
                                                <option value="inactivo">INACTIVO</option>
                                                <option value="bloqueado">BLOQUEADO (INCUMPLIMIENTO)</option>
                                                <option value="suspendido">SUSPENDIDO TEMPORAL</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Rol Asignado</p>
                                            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black uppercase text-xs outline-none focus:bg-white focus:border-blue-500" value={draftUser.role} onChange={e => setDraftUser({...draftUser, role: e.target.value as UserRole})}>
                                                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1 relative">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Centro de Costo</p>
                                            <div className="relative">
                                                <input 
                                                    type="text"
                                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold uppercase text-xs outline-none focus:bg-white focus:border-blue-500"
                                                    value={draftUser.costCenter || ''}
                                                    placeholder="Escribir o seleccionar..."
                                                    onChange={e => setDraftUser({...draftUser, costCenter: e.target.value.toUpperCase()})}
                                                    onFocus={() => setShowCCDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowCCDropdown(false), 200)}
                                                />
                                                {showCCDropdown && costCenters.length > 0 && (
                                                    <div className="absolute z-[2100] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-fadeIn max-h-40 overflow-y-auto">
                                                        {costCenters.map((cc) => (
                                                            <div key={cc} className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer" onClick={() => setDraftUser({...draftUser, costCenter: cc})}>
                                                                <span className="text-[9px] font-black uppercase text-slate-700">{cc}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
                                <button onClick={handleSaveDraft} className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-xs shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                                    <LucideSave size={20}/> Sincronizar Ficha Maestro
                                </button>
                                <button onClick={handleDeleteUser} className="w-full py-4 text-rose-600 font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
                                    <LucideTrash2 size={16}/> Eliminar Acceso Permanentemente
                                </button>
                            </div>
                        </>
                    )}
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
      <div key={u.id} className="p-8 flex justify-between items-center group hover:bg-slate-50 transition-all">
        <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">{u.nombre.charAt(0)}</div>
            <div>
                <p className="font-black text-slate-800 uppercase italic leading-none">{u.nombre} {u.apellido}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">{u.email}</p>
            </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onApprove(u)} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><LucideCheck size={20}/></button>
          <button onClick={() => onReject(u.id)} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><LucideTrash2 size={20}/></button>
        </div>
      </div>
    ))}
    {users.length === 0 && <div className="p-20 text-center text-slate-200 font-black uppercase text-[10px] italic tracking-[0.3em] flex flex-col items-center gap-4"><LucideCheckCircle size={40} className="opacity-20"/> Sin solicitudes pendientes</div>}
  </div>
);

const PermissionsView = () => (
    <div className="p-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 animate-pulse">
        <LucideLock size={64} className="mx-auto text-slate-100 mb-8"/>
        <h4 className="font-black text-slate-300 uppercase italic tracking-tighter text-xl">Módulo de Kernel Restringido</h4>
        <p className="text-slate-200 font-black uppercase text-[9px] tracking-[0.4em] mt-2">Permisos de grano fino disponibles en la próxima versión</p>
    </div>
);