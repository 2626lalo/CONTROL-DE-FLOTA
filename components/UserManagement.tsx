import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/FleetContext';
import { 
  LucideUsers, LucideShieldCheck, LucideSearch, LucideUserPlus, 
  LucideLayoutDashboard, LucideCheckCircle, LucideXCircle, LucideAlertTriangle,
  LucideChevronRight, LucideFilter, LucideMail, LucideBuilding, 
  LucideShield, LucideLock, LucideBell, LucideFileText, LucideRefreshCcw, 
  LucideHistory, LucideKey, LucideMessageCircle, LucideSmartphone, 
  LucideMoreHorizontal, LucideClock, LucideShieldAlert, LucideEye, 
  LucideTarget, LucideZap, LucideWrench, LucideInfo, LucideX, 
  LucideChevronDown, LucideSave, LucideCrown, LucideLayers, LucideVerified, 
  LucideUser, LucideFingerprint, LucideUserCog, LucideCar, 
  LucideClipboardCheck, LucideLockKeyhole, LucideTrash2, LucideCheck, LucideAlertCircle,
  LucideActivity, LucideFileSpreadsheet, LucideDownload
} from 'lucide-react';
import { User, UserRole, UserStatus, Permission } from '../types';
// FIX: Import missing date-fns utilities used in exportToExcel to resolve 'Cannot find name' errors on lines 363 and 369.
import { format, parseISO } from 'date-fns';

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
      <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
        <div className="relative w-full max-w-lg">
          <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text" 
            placeholder="Buscar por Nombre, Email o Centro de Costo..." 
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm uppercase"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] border-b">
            <tr>
              <th className="px-8 py-5">Identidad / Perfil</th>
              <th className="px-8 py-5">Centro de Costo</th>
              <th className="px-8 py-5">Rol Principal</th>
              <th className="px-8 py-5 text-center">Estado de Acceso</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-blue-50/30 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm uppercase relative">
                      {u.nombre.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-800 text-sm leading-none uppercase italic">{u.nombre} {u.apellido}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-600 rounded-lg">{u.costCenter || u.centroCosto?.nombre || 'PENDIENTE'}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-black uppercase text-slate-500">{u.role}</span>
                </td>
                <td className="px-8 py-6 text-center">
                   <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    u.approved && u.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                    !u.approved ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {u.approved && u.estado === 'activo' ? 'Autorizado' : !u.approved ? 'Pendiente' : u.estado}
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
    { id: 'flota', label: 'Gestión de Activos / Bienes', icon: LucideCar },
    { id: 'inspecciones', label: 'Auditoría de Campo', icon: LucideClipboardCheck },
    { id: 'documentacion', label: 'Legajos Corporativos', icon: LucideFileText },
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

  return (
    <div className="space-y-8 animate-fadeIn">
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"><LucideLayers size={20}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuración Rápida</p>
                    <h4 className="text-sm font-black text-slate-800 uppercase italic">Aplicar Nivel de Seguridad</h4>
                </div>
            </div>
            <div className="flex gap-3">
                {[
                    { l: 1, label: 'Operativo', color: 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50' },
                    { l: 2, label: 'Supervisor', color: 'bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white' },
                    { l: 3, label: 'Gerencial', color: 'bg-slate-900 text-white border-slate-800 hover:bg-blue-600' }
                ].map(p => (
                    <button key={p.l} onClick={() => applyLevelTemplate(p.l as any)} className={`px-6 py-3 rounded-xl border font-black uppercase text-[9px] tracking-widest transition-all shadow-sm ${localUser.level === p.l ? 'ring-4 ring-blue-100 border-blue-500' : ''} ${p.color}`}>{p.label}</button>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <LucideShieldCheck className="text-blue-600" size={24}/>
                    <h4 className="text-sm font-black text-slate-800 uppercase italic">Matriz de Acceso de Kernel</h4>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                    <LucideVerified size={12}/><span className="text-[8px] font-black uppercase tracking-widest">Estado Sincronizado</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 border-b">
                        <tr><th className="px-8 py-4">Módulo de Sistema</th><th className="px-8 py-4 text-center">Ver</th><th className="px-8 py-4 text-center">Crear</th><th className="px-8 py-4 text-center">Editar</th><th className="px-8 py-4 text-center">Eliminar</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sections.map(sec => {
                            const perm = (localUser.permissions || []).find(p => p.seccion === sec.id);
                            return (
                                <tr key={sec.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5"><div className="flex items-center gap-3"><sec.icon size={16} className="text-slate-400 group-hover:text-blue-50"/><span className="text-[10px] font-bold text-slate-700 uppercase">{sec.label}</span></div></td>
                                    {(['ver', 'crear', 'editar', 'eliminar'] as const).map(action => (
                                        <td key={action} className="px-8 py-5 text-center">
                                            <button onClick={() => togglePermission(sec.id, action)} className={`p-2.5 rounded-xl transition-all ${perm?.[action] ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm border' : 'bg-slate-50 text-slate-200 border border-transparent'}`}>{perm?.[action] ? <LucideCheck size={16}/> : <LucideX size={16}/>}</button>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-end">
                <button onClick={() => onUpdate(localUser)} disabled={!isModified} className={`px-12 py-5 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${isModified ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}><LucideSave size={20}/> Confirmar Protocolo Kernel</button>
            </div>
        </div>
    </div>
  );
};

export const UserManagement = () => {
  const { registeredUsers, updateUser, deleteUser, addNotification, authenticatedUser, impersonate, vehicles } = useApp();
  const [activeTab, setActiveTab] = useState<UserTab>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftUser, setDraftUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [selectedUserIdForPerms, setSelectedUserIdForPerms] = useState<string>('');
  const [showCCDropdown, setShowCCDropdown] = useState(false);

  const isMainAdmin = authenticatedUser?.email === MASTER_EMAIL;

  // VERIFICACIÓN DE AUTORIZACIÓN PARA EXPORTACIÓN:
  // Se autoriza si es el Admin Principal o si en el Kernel se le otorgó permiso 'ver' en la sección 'usuarios'.
  const canExport = useMemo(() => {
    if (isMainAdmin) return true;
    return authenticatedUser?.permissions?.some(p => p.seccion === 'usuarios' && p.ver) || false;
  }, [isMainAdmin, authenticatedUser]);

  const costCenters = useMemo(() => {
    return Array.from(new Set(vehicles.map(v => v.costCenter).filter(Boolean))).sort();
  }, [vehicles]);

  const stats = useMemo(() => {
    const visibleUsers = registeredUsers.filter(u => u.email !== MASTER_EMAIL);
    return {
      total: visibleUsers.length,
      activos: visibleUsers.filter(u => u.estado === 'activo' && u.approved).length,
      pendientes: visibleUsers.filter(u => !u.approved).length,
      resetRequests: visibleUsers.filter(u => u.resetRequested).length,
    };
  }, [registeredUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return registeredUsers.filter(u => u.email !== MASTER_EMAIL).filter(u => u.nombre.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.apellido?.toLowerCase().includes(term));
  }, [registeredUsers, searchQuery]);

  const selectedUserForPerms = useMemo(() => {
    return registeredUsers.find(u => u.id === selectedUserIdForPerms);
  }, [registeredUsers, selectedUserIdForPerms]);

  const handleApproveUser = (target: User) => {
    updateUser({ ...target, approved: true, estado: 'activo' });
    addNotification(`Usuario ${target.nombre} autorizado con éxito`, "success");
  };

  const handleSaveDraft = () => {
    if (!draftUser) return;
    const isNumeric = /^\d+$/.test(draftUser.telefono || '');
    if (!isNumeric && draftUser.telefono) {
        setPhoneError('Solo números');
        return;
    }
    const finalUser: User = { 
        ...draftUser, 
        approved: draftUser.estado === 'activo' ? true : draftUser.approved,
        name: `${draftUser.nombre} ${draftUser.apellido}`.toUpperCase(),
        centroCosto: { id: "0", codigo: "0", nombre: draftUser.costCenter || 'PENDIENTE' }
    };
    updateUser(finalUser);
    setShowDetailModal(false);
    addNotification("Ficha de usuario sincronizada", "success");
  };

  const handleConfirmDelete = () => {
    if (!draftUser) return;
    if (confirm(`¿ELIMINAR USUARIO? 

Esta acción borrará el perfil de ${draftUser.nombre} de Firestore. Sus credenciales de acceso permanecerán en el sistema de seguridad. El usuario deberá loguearse nuevamente para regenerar su perfil.`)) {
        deleteUser(draftUser.id);
        setShowDetailModal(false);
        addNotification("Usuario removido del sistema", "warning");
    }
  };

  const exportToExcel = () => {
    if (!canExport) {
        addNotification("No cuenta con autorización del Administrador Maestro para esta acción", "error");
        return;
    }

    try {
        const dataToExport = registeredUsers.map(u => ({
            ID: u.id,
            NOMBRE: u.nombre,
            APELLIDO: u.apellido || '',
            EMAIL: u.email,
            TELEFONO: u.telefono || '',
            ESTADO: u.estado.toUpperCase(),
            AUTORIZADO: u.approved ? 'SÍ' : 'NO',
            CENTRO_COSTO: u.costCenter || u.centroCosto?.nombre || '',
            ROL: u.role,
            NIVEL: u.level,
            FECHA_REGISTRO: u.fechaRegistro ? format(parseISO(u.fechaRegistro), 'dd/MM/yyyy HH:mm') : ''
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Usuarios_FleetPro");
        XLSX.writeFile(wb, `Reporte_Usuarios_Auditados_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
        addNotification("Registro maestro de usuarios exportado con éxito", "success");
    } catch (error) {
        console.error("Export error:", error);
        addNotification("Error al procesar el archivo Excel", "error");
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Gestión de Usuarios</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Control de Identidades Cloud</p>
        </div>
        {canExport && (
            <button 
                onClick={exportToExcel}
                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
                <LucideFileSpreadsheet size={20}/> Exportar Directorio XLSX
            </button>
        )}
      </div>

      <div className="flex gap-6 border-b border-slate-100 pb-1 overflow-x-auto scrollbar-hide">
         {[
           { id: 'DASHBOARD', label: 'Dashboard', icon: LucideLayoutDashboard },
           { id: 'DIRECTORY', label: 'Directorio', icon: LucideUsers },
           { id: 'PENDING', label: 'Pendientes', icon: LucideSmartphone, count: stats.pendientes },
           { id: 'PERMISSIONS', label: 'Kernel Permisos', icon: LucideLockKeyhole },
         ].map(tab => (
           <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-5 px-6 text-[10px] font-black uppercase shrink-0 flex items-center gap-3 border-b-4 transition-all relative ${activeTab === tab.id ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400'}`}>
            <tab.icon size={18}/> {tab.label}
           </button>
         ))}
      </div>

      <div className="animate-fadeIn">
        {activeTab === 'DASHBOARD' && <DashboardView stats={stats} />}
        {activeTab === 'DIRECTORY' && <MasterListView users={filteredUsers} query={searchQuery} onQueryChange={setSearchQuery} onSelectUser={(u) => { setDraftUser(u); setShowDetailModal(true); setPhoneError(''); }} isMainAdmin={isMainAdmin} onImpersonate={impersonate} />}
        {activeTab === 'PENDING' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                {registeredUsers.filter(u => !u.approved && u.email !== MASTER_EMAIL).map(u => (
                    <div key={u.id} className="p-8 flex justify-between items-center hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-5"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">{u.nombre.charAt(0)}</div><div><p className="font-black uppercase italic leading-none">{u.nombre}</p><p className="text-[10px] text-slate-400 font-bold mt-1">{u.email}</p></div></div>
                    <div className="flex gap-2"><button onClick={() => handleApproveUser(u)} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><LucideCheck size={20}/></button></div>
                    </div>
                ))}
                {registeredUsers.filter(u => !u.approved && u.email !== MASTER_EMAIL).length === 0 && <div className="p-20 text-center text-slate-200 font-black uppercase text-[10px] italic tracking-[0.3em]">Bandeja vacía</div>}
            </div>
        )}
        {activeTab === 'PERMISSIONS' && (
            <div className="space-y-10">
                {isMainAdmin ? (
                    <div className="space-y-10">
                        <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Administrador de Kernel</h3>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-2">Configuración exclusiva de niveles de acceso Nivel 1</p>
                                <div className="mt-8 max-w-lg relative">
                                    <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18}/>
                                    <select className="w-full pl-12 pr-6 py-4 bg-white/10 border border-white/20 rounded-2xl font-black uppercase text-xs outline-none focus:bg-white focus:text-blue-900 transition-all appearance-none cursor-pointer" value={selectedUserIdForPerms} onChange={e => setSelectedUserIdForPerms(e.target.value)}><option value="" className="text-slate-900">SELECCIONE IDENTIDAD PARA AUDITAR...</option>{registeredUsers.filter(u => u.email !== MASTER_EMAIL).map(u => (<option key={u.id} value={u.id} className="text-slate-900">{u.nombre} {u.apellido} ({u.email})</option>))}</select>
                                    <LucideChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" size={16}/>
                                </div>
                            </div>
                            <LucideCrown className="absolute -right-12 -bottom-12 opacity-10" size={240}/>
                        </div>
                        {selectedUserForPerms ? <PermissionsManager key={selectedUserForPerms.id} user={selectedUserForPerms} onUpdate={updateUser} /> : <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100"><LucideLock size={64} className="mx-auto text-slate-100 mb-8"/><h4 className="font-black text-slate-300 uppercase italic tracking-tighter text-xl">Seleccione Identidad</h4></div>}
                    </div>
                ) : (
                    <div className="p-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                        <LucideShieldAlert size={64} className="mx-auto text-rose-100 mb-8"/>
                        <h4 className="font-black text-slate-300 uppercase italic tracking-tighter text-xl">Acceso Denegado al Kernel</h4>
                        <p className="text-slate-200 font-black uppercase text-[9px] tracking-[0.4em] mt-2">Solo el Administrador Principal posee privilegios de Nivel 1</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {showDetailModal && draftUser && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn border-t-[12px] border-blue-600 flex flex-col max-h-[95vh]">
                <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-5"><div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl"><LucideUserCog size={32}/></div><div><h3 className="text-xl font-black uppercase italic leading-none">{draftUser.nombre} {draftUser.apellido}</h3><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{draftUser.email}</p></div></div>
                    <button onClick={() => setShowDetailModal(false)} className="text-white hover:text-rose-500 transition-colors p-2"><LucideX size={24}/></button>
                </div>
                
                <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><LucideFingerprint size={14} className="text-blue-500"/> Identidad Maestro</h5>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Nombre</label>
                                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100" value={draftUser.nombre} onChange={e => setDraftUser({...draftUser, nombre: e.target.value.toUpperCase()})} placeholder="Nombre" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Apellido</label>
                                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100" value={draftUser.apellido || ''} onChange={e => setDraftUser({...draftUser, apellido: e.target.value.toUpperCase()})} placeholder="Apellido" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Email Corporativo</label>
                                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-100" value={draftUser.email} onChange={e => setDraftUser({...draftUser, email: e.target.value})} placeholder="Email" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Teléfono</label>
                                    <input className={`w-full p-4 border rounded-xl font-bold text-xs outline-none transition-all ${phoneError ? 'bg-rose-50 border-rose-500' : 'bg-slate-50 border-slate-200'}`} value={draftUser.telefono || ''} onChange={e => { setPhoneError(''); setDraftUser({...draftUser, telefono: e.target.value}); }} placeholder="Teléfono" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><LucideActivity size={14} className="text-emerald-500"/> Estatus Cloud</h5>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Estado de Acceso</label>
                                    <select className={`w-full p-4 rounded-xl font-black uppercase text-xs border transition-all ${draftUser.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`} value={draftUser.estado} onChange={e => setDraftUser({...draftUser, estado: e.target.value as UserStatus})}>
                                        <option value="activo">ACTIVO (HABILITADO)</option>
                                        <option value="inactivo">INACTIVO</option>
                                        <option value="bloqueado">BLOQUEADO</option>
                                        <option value="pendiente">PENDIENTE</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Rol Operativo</label>
                                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-xs outline-none focus:ring-4 focus:ring-blue-100" value={draftUser.role} onChange={e => setDraftUser({...draftUser, role: e.target.value as UserRole})}>
                                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1 relative">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Centro de Costo</label>
                                    <div className="relative">
                                        <input 
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-xs outline-none focus:ring-4 focus:ring-blue-100"
                                            value={draftUser.costCenter || ''}
                                            placeholder="Buscar o ingresar..."
                                            onChange={e => setDraftUser({...draftUser, costCenter: e.target.value.toUpperCase()})}
                                            onFocus={() => setShowCCDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowCCDropdown(false), 200)}
                                        />
                                        {showCCDropdown && costCenters.length > 0 && (
                                            <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-40 overflow-y-auto custom-scrollbar">
                                                {costCenters.map(cc => (
                                                    <div key={cc} onClick={() => setDraftUser({...draftUser, costCenter: cc})} className="p-3 hover:bg-blue-50 cursor-pointer text-[10px] font-bold uppercase border-b border-slate-50">{cc}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t flex flex-col gap-4 shrink-0">
                    <button onClick={handleSaveDraft} className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-xs shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                        <LucideSave size={20}/> Sincronizar Ficha Maestro
                    </button>
                    {isMainAdmin && (
                        <button onClick={handleConfirmDelete} className="w-full py-4 text-rose-600 font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
                            <LucideTrash2 size={16}/> Eliminar Perfil del Sistema
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
