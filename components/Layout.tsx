
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LucideLayoutDashboard, LucideCar, LucideClipboardCheck, 
  LucideLogOut, LucideUsers, LucideWifiOff,
  LucideBarChart3, LucideSearch, LucideFileText,
  LucideShieldCheck, LucideGhost, LucideChevronDown, LucideXCircle, LucideUserCircle,
  LucideWrench, LucideMenu, LucideX, LucideWarehouse, LucidePieChart, LucideFlaskConical,
  LucideZap, LucideActivity, LucideUserCheck, LucideMap
} from 'lucide-react';
import { useApp } from '../context/FleetContext';
import { useFirebase } from '../context/FirebaseContext';
import { UserRole } from '../types';

const MASTER_ADMIN = 'alewilczek@gmail.com';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authenticatedUser, impersonatedUser, logout: fleetLogout, vehicles, registeredUsers, impersonate, addNotification } = useApp();
  const { logout, isOnline } = useFirebase();
  const [globalSearch, setGlobalSearch] = useState('');
  const [showImpersonateMenu, setShowImpersonateMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const isMainAdmin = authenticatedUser?.email === MASTER_ADMIN;

  // Lógica de visibilidad de Bienes de Uso (Admin o permiso específico)
  const canSeeBienes = user?.role === UserRole.ADMIN || 
                       user?.permissions?.some(p => p.seccion === 'flota' && p.ver);

  const handleLogout = async () => {
    try {
      await logout(); 
      await fleetLogout(); 
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch) return;
    const found = vehicles.find(v => v.plate.toLowerCase().includes(globalSearch.toLowerCase()));
    if (found) {
      navigate(`/vehicles/detail/${found.plate}`);
      setGlobalSearch('');
      setIsMobileMenuOpen(false);
    } else {
      addNotification(`Unidad ${globalSearch.toUpperCase()} no encontrada.`, "error");
    }
  };

  const navItems = [
    { to: '/', icon: LucideLayoutDashboard, label: 'Dashboard' },
    { to: '/vehicles', icon: LucideCar, label: 'Flota' },
    { to: '/mapa-flota', icon: LucideMap, label: 'Geolocalización' },
  ];

  if (canSeeBienes) {
    navItems.push({ to: '/bienes-de-uso', icon: LucideWarehouse, label: 'Bienes de Uso' });
  }

  // CONDUCTORES Y CHECKLISTS (Control de Roles)
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERVISOR;
  const isConductor = (user as any)?.role === 'CONDUCTOR' || user?.role === UserRole.USER;

  if (isAdmin) {
    navItems.push({ to: '/conductores', icon: LucideUserCheck, label: 'Conductores' });
  } else if (isConductor) {
    navItems.push({ to: '/conductores', icon: LucideClipboardCheck, label: 'Mi Checklist' });
  }

  navItems.push(
    { to: '/checklist', icon: LucideClipboardCheck, label: 'Inspecciones' },
    { to: '/documentation', icon: LucideFileText, label: 'Documentación' },
    { to: '/reports', icon: LucideBarChart3, label: 'Reportes' },
    { to: '/mantenimiento-predictivo', icon: LucideActivity, label: 'Mantenimiento Maestro' },
    { to: '/reportes-experimental', icon: LucidePieChart, label: 'Reportes Maestro' }
  );

  const serviceLabel = user?.role === UserRole.ADMIN ? 'Mesa de Control' : 
                       user?.role === UserRole.USER ? 'Mis Servicios' : 'Gestión de Servicios';
  
  navItems.push({ to: '/test-sector', icon: LucideWrench, label: serviceLabel });
  
  // NUEVA MESA EXPERIMENTAL (Priorizada)
  navItems.push({ to: '/mesa-experimental', icon: LucideZap, label: 'Mesa Experimental' });

  if (user?.role === UserRole.ADMIN) {
    navItems.push({ to: '/admin/dashboard', icon: LucideBarChart3, label: 'Panel Ejecutivo' });
    navItems.push({ to: '/users-management', icon: LucideShieldCheck, label: 'Usuarios' });
    navItems.push({ to: '/users', icon: LucideUsers, label: 'Administración' });
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      {impersonatedUser && (
        <div className="bg-indigo-600 px-4 md:px-8 py-2 text-white flex justify-between items-center z-[60] sticky top-0 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-4">
                <div className="p-1 bg-white/20 rounded-lg animate-pulse"><LucideGhost size={14}/></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                    AUDITANDO COMO: <span className="text-indigo-200">{impersonatedUser.nombre}</span>
                </p>
            </div>
            <button 
                onClick={() => impersonate(null)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all"
            >
                <LucideXCircle size={12}/> Regresar a Master
            </button>
        </div>
      )}

      <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/10 rounded-xl"><LucideMenu size={20}/></button>
          <div className="flex items-center gap-2"><div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-black text-[10px]">FP</div><h2 className="text-sm font-bold tracking-tighter uppercase">FleetPro</h2></div>
        </div>
      </header>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90] md:hidden animate-fadeIn" onClick={closeMobileMenu}></div>}

      <div className="flex-1 flex relative">
        <aside className={`flex flex-col w-64 bg-slate-900 text-slate-300 fixed h-full z-[100] shadow-2xl border-r border-white/5 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-8 border-b border-slate-800 flex justify-between items-center">
            <div><div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white shadow-lg text-xs">GF</div><h2 className="text-lg font-bold text-white tracking-tight uppercase">FleetPro</h2></div><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Enterprise v37.8-CLOUD</p></div>
            <button onClick={closeMobileMenu} className="md:hidden p-2 text-slate-500 hover:text-white"><LucideX size={20}/></button>
          </div>

          <div className="px-4 mt-6">
            <form onSubmit={handleGlobalSearch} className="relative"><LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/><input type="text" placeholder="Patente..." className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs focus:bg-slate-800 outline-none uppercase font-bold text-white" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} /></form>
          </div>

          {isMainAdmin && (
            <div className="px-4 mt-6 relative">
               <button onClick={() => setShowImpersonateMenu(!showImpersonateMenu)} className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${showImpersonateMenu ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/30 border-white/5 text-slate-400 hover:text-white'}`}><div className="flex items-center gap-3"><LucideGhost size={16}/><span className="text-[10px] font-black uppercase">Modo Auditor</span></div><LucideChevronDown size={14} className={`transition-transform ${showImpersonateMenu ? 'rotate-180' : ''}`}/></button>
               {showImpersonateMenu && (
                 <div className="absolute left-4 right-4 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-[110] max-h-64 overflow-y-auto custom-scrollbar animate-fadeIn">
                    {registeredUsers.filter(u => u.email !== authenticatedUser?.email).map(u => (
                        <button key={u.id} onClick={() => { impersonate(u.id); setShowImpersonateMenu(false); closeMobileMenu(); }} className="w-full p-4 hover:bg-indigo-600 text-left transition-colors flex items-center justify-between group">
                            <div><p className="text-[10px] font-black uppercase group-hover:text-white">{u.nombre}</p><p className="text-[8px] text-slate-500 font-bold uppercase group-hover:text-indigo-200">{u.role}</p></div>
                            <LucideUserCircle size={14} className="text-slate-600 group-hover:text-white"/>
                        </button>
                    ))}
                 </div>
               )}
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar text-slate-400">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={closeMobileMenu} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
                <item.icon size={20} /><span className="font-bold text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800/50 p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg">{user?.nombre?.charAt(0)}</div>
                <div className="flex-1 overflow-hidden text-left"><p className="text-sm font-black truncate text-white">{user?.nombre}</p><p className="text-[10px] text-slate-500 truncate font-bold uppercase">{user?.role}</p></div>
              </div>
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 w-full py-2 rounded-lg transition-colors text-[10px] font-black uppercase border border-red-500/20"><LucideLogOut size={14} /> Salir</button>
            </div>
          </div>
        </aside>

        <main className="flex-1 md:ml-64 p-4 md:p-10 transition-all duration-300 w-full max-w-full overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
