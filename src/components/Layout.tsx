
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LucideLayoutDashboard, LucideCar, LucideClipboardCheck, LucideWrench, LucideLogOut, LucideMenu, LucideX, LucideUsers, LucideWifiOff, LucideRefreshCw, LucideAlertCircle } from 'lucide-react';
import { useApp } from '../App';
import { UserRole } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isOnline, isSyncing, globalError, clearGlobalError } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', icon: LucideLayoutDashboard, label: 'Dashboard' },
    { to: '/vehicles', icon: LucideCar, label: 'Flota' },
    { to: '/checklist', icon: LucideClipboardCheck, label: 'Checklist' },
    { to: '/service', icon: LucideWrench, label: 'Servicios' },
  ];

  // Show Users menu if current user is Admin or Admin Level 2
  if (user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2) {
      navItems.push({ to: '/users', icon: LucideUsers, label: 'Usuarios' });
  }

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 fixed h-full z-10 transition-colors duration-500">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-blue-500 tracking-tight uppercase">CONTROL DE FLOTA</h2>
          <p className="text-xs text-slate-500 mt-1">
              {user?.role === 'ADMIN' ? 'ADMINISTRADOR' : 
               user?.role === 'ADMIN_L2' ? 'ADMIN (NIVEL 2)' : 
               user?.role} (ACCESO)
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {user?.name.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
             </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 w-full px-2"
          >
            <LucideLogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-20 flex justify-between items-center p-4 shadow-md transition-colors duration-500">
        <h2 className="text-lg font-bold text-blue-500 uppercase">CONTROL DE FLOTA</h2>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <LucideX /> : <LucideMenu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900 z-10 pt-20 px-4 space-y-4">
           {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-4 rounded-lg text-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
            >
              <item.icon size={24} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button onClick={logout} className="flex items-center gap-3 px-4 py-4 text-red-400 w-full mt-8 border-t border-slate-700">
             <LucideLogOut size={24} /> Cerrar Sesión
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 mt-16 md:mt-0 overflow-y-auto relative flex flex-col">
        
        {/* Offline / Syncing Banners */}
        {!isOnline && (
            <div className="mb-4 bg-yellow-500 text-slate-900 px-4 py-3 rounded-lg shadow-md flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2 font-bold">
                    <LucideWifiOff size={20} />
                    <span>Modo Sin Conexión</span>
                </div>
                <p className="text-xs md:text-sm">Los cambios (fotos, registros) se guardarán localmente y se subirán al conectar.</p>
            </div>
        )}
        
        {isOnline && isSyncing && (
            <div className="mb-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-md flex items-center justify-center gap-2 animate-pulse">
                <LucideRefreshCw className="animate-spin" size={20} />
                <span className="font-bold">Conexión restaurada. Sincronizando registros pendientes...</span>
            </div>
        )}

        {/* Global Error Toast */}
        {globalError && (
            <div className="fixed bottom-6 right-6 z-[100] bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 animate-bounce-in max-w-md">
                <LucideAlertCircle size={24} className="shrink-0"/>
                <div className="flex-1">
                    <h4 className="font-bold text-sm uppercase">Atención</h4>
                    <p className="text-sm">{globalError}</p>
                </div>
                <button onClick={clearGlobalError} className="hover:bg-red-700 p-1 rounded"><LucideX size={18}/></button>
            </div>
        )}

        {children}
      </main>
    </div>
  );
};
