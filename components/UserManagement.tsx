
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/FleetContext';
import { 
  LucideUsers, LucideShieldCheck, LucideSearch, LucideUserPlus, 
  LucideLayoutDashboard, LucideCheckCircle, LucideXCircle, LucideAlertTriangle,
  LucideChevronRight, LucideFilter, LucideMail, LucideBuilding, 
  LucideShield, LucideLock, LucideBell, LucideFileText, LucideSettings,
  LucideActivity, LucideMoreVertical, LucideTrash2, LucideCheck, 
  LucideDownload, LucideRefreshCcw, LucideHistory, LucideKey,
  LucideMessageCircle, LucideSmartphone, LucideMoreHorizontal, LucideClock,
  // FIX: Added missing LucideShieldAlert import
  LucideShieldAlert
} from 'lucide-react';
import { User, UserRole, UserStatus, Permission } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

type UserTab = 'DASHBOARD' | 'DIRECTORY' | 'PENDING' | 'PERMISSIONS';

export const UserManagement = () => {
  const { registeredUsers, updateUser, deleteUser, addNotification, logAudit, user: currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<UserTab>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Estadísticas del Dashboard
  const stats = useMemo(() => {
    return {
      total: registeredUsers.length,
      activos: registeredUsers.filter(u => u.estado === 'activo').length,
      pendientes: registeredUsers.filter(u => u.estado === 'pendiente' || !u.approved).length,
      suspendidos: registeredUsers.filter(u => u.estado === 'suspendido').length,
      bloqueados: registeredUsers.filter(u => u.estado === 'bloqueado').length,
    };
  }, [registeredUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return registeredUsers.filter(u => 
      u.nombre.toLowerCase().includes(term) || 
      u.apellido?.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term) ||
      u.centroCosto?.nombre.toLowerCase().includes(term)
    );
  }, [registeredUsers, searchQuery]);

  const handleApproveUser = (user: User) => {
    const updated: User = { 
        ...user, 
        estado: 'activo', 
        approved: true,
        actualizadoPor: currentUser?.nombre || 'admin',
        fechaActualizacion: new Date().toISOString()
    };
    updateUser(updated);
    addNotification(`Usuario ${user.nombre} aprobado correctamente`, "success");
    logAudit('USER_APPROVAL', 'USER', user.id, `Aprobación de acceso para ${user.email}`);
  };

  const handleToggleStatus = (user: User, newStatus: UserStatus) => {
    updateUser({ ...user, estado: newStatus, fechaActualizacion: new Date().toISOString() });
    addNotification(`Estado de ${user.nombre} cambiado a ${newStatus}`, "warning");
  };

  const DashboardView = () => (
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
        <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
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

  const MasterListView = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full max-w-lg">
            <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Buscar por Nombre, Email o Centro de Costo..." 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => (
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
                    <button onClick={() => { setSelectedUser(u); setShowDetailModal(true); }} className="p-2 text-slate-300 hover:text-blue-600 transition-all"><LucideMoreHorizontal size={20}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const PendingView = () => (
    <div className="space-y-8 animate-fadeIn">
       <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[3rem] flex items-center gap-6">
          <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-200 animate-pulse"><LucideAlertTriangle size={24}/></div>
          <div>
            <h4 className="text-xl font-black text-amber-900 uppercase italic leading-none">Solicitudes de Acceso Pendientes</h4>
            <p className="text-[10px] text-amber-700 font-bold uppercase mt-2 tracking-widest">Validación obligatoria para el cumplimiento de normas de seguridad ISO 27001</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registeredUsers.filter(u => u.estado === 'pendiente' || !u.approved).map(u => (
            <div key={u.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-amber-400 transition-all">
               <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl font-black italic">{u.nombre.charAt(0)}</div>
                       <div>
                          <h5 className="font-black text-slate-800 uppercase italic text-lg leading-none">{u.nombre} {u.apellido || ''}</h5>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">{u.email}</p>
                       </div>
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-300 bg-slate-50 px-2 py-1 rounded-lg">REG: {format(parseISO(u.fechaRegistro || new Date().toISOString()), 'dd/MM/yy')}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Centro de Costo</p>
                        <p className="text-[10px] font-black text-slate-700 uppercase truncate">{u.centroCosto?.nombre || u.costCenter || 'S/A'}</p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono</p>
                        <p className="text-[10px] font-black text-slate-700 uppercase">{u.telefono || 'N/R'}</p>
                     </div>
                  </div>
               </div>

               <div className="mt-8 pt-6 border-t border-slate-50 flex gap-3">
                  <button onClick={() => handleApproveUser(u)} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                    <LucideCheckCircle size={16}/> Aprobar Acceso
                  </button>
                  <button className="p-4 text-rose-600 bg-rose-50 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"><LucideTrash2 size={18}/></button>
               </div>
            </div>
          ))}
          {registeredUsers.filter(u => u.estado === 'pendiente' || !u.approved).length === 0 && (
             <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3.5rem] border-2 border-dashed border-slate-100">
                <LucideShieldCheck className="mx-auto text-slate-200 mb-4" size={64}/>
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest italic">No hay solicitudes pendientes de validación</p>
             </div>
          )}
       </div>
    </div>
  );

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
        {activeTab === 'DASHBOARD' && <DashboardView />}
        {activeTab === 'DIRECTORY' && <MasterListView />}
        {activeTab === 'PENDING' && <PendingView />}
        {activeTab === 'PERMISSIONS' && (
            <div className="bg-white p-20 text-center rounded-[4rem] border-2 border-dashed border-slate-100">
                <LucideShield size={64} className="mx-auto text-slate-200 mb-4"/>
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest italic">Módulo de Matriz de Permisos Granular en Desarrollo</p>
            </div>
        )}
      </div>

      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
                <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl shadow-xl flex items-center justify-center text-3xl font-black italic">{selectedUser.nombre.charAt(0)}</div>
                        <div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{selectedUser.nombre} {selectedUser.apellido || ''}</h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 italic">{selectedUser.email}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowDetailModal(false)} className="text-white hover:text-rose-500 transition-colors"><LucideXCircle size={32}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LucideSettings size={14}/> Acciones de Estado</h5>
                            <div className="grid grid-cols-1 gap-2">
                                <button onClick={() => handleToggleStatus(selectedUser, 'activo')} className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 transition-all ${selectedUser.estado === 'activo' ? 'bg-emerald-50 text-white' : 'bg-slate-50 text-slate-400'}`}><LucideCheckCircle size={16}/> Activar</button>
                                <button onClick={() => handleToggleStatus(selectedUser, 'suspendido')} className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 transition-all ${selectedUser.estado === 'suspendido' ? 'bg-amber-50 text-white' : 'bg-slate-50 text-slate-400'}`}><LucideAlertTriangle size={16}/> Suspender</button>
                                <button onClick={() => handleToggleStatus(selectedUser, 'bloqueado')} className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 transition-all ${selectedUser.estado === 'bloqueado' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-400'}`}><LucideXCircle size={16}/> Bloquear</button>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase ml-2">Centro de Costo</p><div className="p-4 bg-slate-50 rounded-2xl font-black text-xs uppercase text-slate-700 flex items-center gap-3"><LucideBuilding size={16} className="text-blue-500"/> {selectedUser.centroCosto?.nombre || selectedUser.costCenter || 'S/A'}</div></div>
                                <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase ml-2">Rol Corporativo</p><div className="p-4 bg-slate-50 rounded-2xl font-black text-xs uppercase text-slate-700 flex items-center gap-3"><LucideShield size={16} className="text-indigo-500"/> {selectedUser.role}</div></div>
                            </div>
                            
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><LucideBell size={14}/> Preferencias de Notificación</h5>
                                <div className="grid grid-cols-3 gap-4">
                                    {['email', 'push', 'whatsapp'].map(ch => (
                                        <div key={ch} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                            <p className="text-[8px] font-black uppercase text-slate-500 mb-2">{ch}</p>
                                            <LucideCheckCircle size={20} className="mx-auto text-emerald-400"/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0">
                    <button onClick={() => setShowDetailModal(false)} className="flex-1 py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest border border-slate-200">Cerrar Detalle</button>
                    <button className="flex-[2] bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3"><LucideFileText size={20}/> Descargar Reporte de Actividad</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
