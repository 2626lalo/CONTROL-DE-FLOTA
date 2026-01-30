import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LucideLayoutDashboard, LucideCar, LucideClipboardCheck, 
  LucideLogOut, LucideUsers, LucideWifiOff,
  LucideBarChart3, LucideSearch, LucideFileText, LucideFlaskConical,
  LucideShieldCheck
} from 'lucide-react';
import { useApp } from '../context/FleetContext';
import { UserRole } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isOnline, vehicles } = useApp();
  const [globalSearch, setGlobalSearch] = useState('');
  const navigate = useNavigate();

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch) return;
    const found = vehicles.find(v => v.plate.toLowerCase().includes(globalSearch.toLowerCase()));
    if (found) {
      navigate(`/vehicles/detail/${found.plate}`);
      setGlobalSearch('');
    }
  };

  const navItems = [
    { to: '/', icon: LucideLayoutDashboard, label: 'Dashboard' },
    { to: '/vehicles', icon: LucideCar, label: 'Flota' },
    { to: '/checklist', icon: LucideClipboardCheck, label: 'Inspecciones' },
    { to: '/documentation', icon: LucideFileText, label: 'Documentación' },
    { to: '/reports', icon: LucideBarChart3, label: 'Reportes' },
  ];

  if (user?.role === UserRole.ADMIN) {
    navItems.push({ to: '/users-management', icon: LucideShieldCheck, label: 'Usuarios' });
    navItems.push({ to: '/users', icon: LucideUsers, label: 'Administración' });
    navItems.push({ to: '/test-sector', icon: LucideFlaskConical, label: 'Gestión de Servicios' });
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 fixed h-full z-10 shadow-2xl border-r border-white/5">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white shadow-lg text-xs">GF</div>
            <h2 className="text-lg font-bold text-white tracking-tight uppercase">FleetPro</h2>
          </div>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Enterprise v19.3.0-STABLE</p>
        </div>

        <div className="px-4 mt-6">
          <form onSubmit={handleGlobalSearch} className="relative">
            <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
            <input 
              type="text" 
              placeholder="Buscar Patente..." 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs focus:bg-slate-800 outline-none uppercase font-bold text-white"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </form>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar text-slate-400">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 hover:text-white'}`
              }
            >
              <item.icon size={20} />
              <span className="font-bold text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg">
                {user?.nombre ? user.nombre.charAt(0) : '?'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-black truncate text-white">{user?.nombre} {user?.apellido}</p>
                <p className="text-[10px] text-slate-500 truncate font-bold uppercase">{user?.role}</p>
              </div>
            </div>
            <button onClick={logout} className="flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 w-full py-2 rounded-lg transition-colors text-[10px] font-black uppercase tracking-wider border border-red-500/20">
              <LucideLogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10">
        <div className="max-w-7xl mx-auto">
          {!isOnline && (
            <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3 rounded-2xl flex items-center gap-3 animate-fadeIn">
              <LucideWifiOff size={18} />
              <div className="text-xs font-bold uppercase tracking-widest">Modo Offline - Datos Sincronizados Localmente</div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};