
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { VehicleList } from './components/VehicleList';
import { VehicleForm } from './components/VehicleForm';
import { Checklist as ChecklistComp } from './components/Checklist';
import { ServiceManager } from './components/ServiceManager';
import { AdminUsers } from './components/AdminUsers';
import { User, UserRole, Vehicle, ServiceRequest, Checklist } from './types';
import { INITIAL_VEHICLES, MOCK_USERS, MOCK_CHECKLISTS, MOCK_REQUESTS } from './constants';
import { LucideLayoutDashboard, LucideCar, LucideClipboardCheck, LucideWrench, LucideLogOut, LucideMail, LucideLock, LucideCheckCircle, LucideLoader, LucideUser, LucideArrowRight } from 'lucide-react';

// --- Context ---
interface AppContextType {
  user: User | null;
  registeredUsers: User[];
  login: (email: string, pass: string) => Promise<{success: boolean, message?: string}>;
  register: (email: string, pass: string, name: string) => Promise<boolean>;
  googleLogin: (email: string) => Promise<void>;
  logout: () => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;
  
  vehicles: Vehicle[];
  addVehicle: (v: Vehicle) => void;
  updateVehicle: (v: Vehicle) => void;
  deleteVehicle: (plate: string) => void;
  
  serviceRequests: ServiceRequest[];
  addServiceRequest: (sr: ServiceRequest) => void;
  updateServiceRequest: (sr: ServiceRequest) => void;
  deleteServiceRequest: (id: string) => void;
  
  checklists: Checklist[];
  addChecklist: (c: Checklist) => void;

  // Offline features
  isOnline: boolean;
  isSyncing: boolean;
  
  // Data Refresh
  refreshData: () => Promise<void>;
  isDataLoading: boolean;
}

const AppContext = createContext<AppContextType>({} as AppContextType);
export const useApp = () => useContext(AppContext);

// --- Login Component ---
const LoginScreen = () => {
  const { login, register, googleLogin, isOnline } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!email || !password) return;
    if(isRegistering && !name) return;

    setLoading(true);
    setError('');
    
    // Simulate network delay
    setTimeout(async () => {
        if (isRegistering) {
            const success = await register(email, password, name);
            if (!success) {
                setError("El correo ya está registrado.");
            }
        } else {
            const result = await login(email, password);
            if (!result.success) {
                setError(result.message || "Credenciales inválidas.");
            }
        }
        setLoading(false);
    }, 800);
  };

  const handleGoogleClick = () => {
      // Simulation of Google Auth Flow
      if (!isOnline) {
          alert("La autenticación con Google requiere conexión a internet.");
          return;
      }
      const simEmail = prompt("Simulación Google Auth:\nIngrese el correo de la cuenta Google:", "usuario@gmail.com");
      if (simEmail) {
          setLoading(true);
          setTimeout(() => {
              googleLogin(simEmail);
              setLoading(false);
          }, 1000);
      }
  };

  const handleQuickAccess = async (e: React.MouseEvent) => {
      e.preventDefault();
      setLoading(true);
      // Use the explicit login function to test validation
      const result = await login('alewilczek@gmail.com', 'lalo');
      if (!result.success) {
          setError(result.message || "Error en acceso rápido.");
          setLoading(false);
      }
      // If success, state update in context will trigger redirect
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white relative overflow-hidden">
      {/* Background Decor & Animation */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <style>
            {`
                @keyframes kenburns {
                    0% { transform: scale(1) translate(0, 0); }
                    50% { transform: scale(1.15) translate(-2%, -1%); }
                    100% { transform: scale(1) translate(0, 0); }
                }
            `}
          </style>
          {/* Animated Background Image: Toyota Tacoma / 4x4 in Snow/Mountains */}
          <div 
            className="w-full h-full bg-cover bg-center opacity-50"
            style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1609520505218-7421da4c3729?q=80&w=2574&auto=format&fit=crop')",
                animation: "kenburns 25s ease-in-out infinite alternate"
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/40"></div>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-slate-600 transition-all">
        <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 uppercase drop-shadow-lg">CONTROL DE FLOTA</h1>
            <p className="text-slate-300 font-medium">Gestión de Alta Montaña</p>
            {!isOnline && (
                <span className="inline-block mt-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">Modo Sin Conexión</span>
            )}
        </div>

        {/* Toggle Tabs */}
        <div className="flex bg-slate-700/50 rounded-lg p-1 mb-6">
            <button 
                onClick={() => { setIsRegistering(false); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${!isRegistering ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                Iniciar Sesión
            </button>
            <button 
                onClick={() => { setIsRegistering(true); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${isRegistering ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                Crear Cuenta
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
                <div className="animate-fadeIn">
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nombre Completo</label>
                    <div className="relative">
                        <LucideUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            required
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg py-3 pl-10 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500"
                            placeholder="Juan Perez"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Correo Electrónico</label>
                <div className="relative">
                    <LucideMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="email" 
                        required
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg py-3 pl-10 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500"
                        placeholder="usuario@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Contraseña</label>
                <div className="relative">
                    <LucideLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="password" 
                        required
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg py-3 pl-10 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center font-bold bg-red-400/10 p-2 rounded animate-pulse">{error}</p>}

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold text-lg transition shadow-lg flex justify-center items-center gap-2 mt-4"
            >
                {loading ? <LucideLoader className="animate-spin" /> : (isRegistering ? 'Registrarse' : 'Ingresar')}
            </button>
        </form>

        <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-slate-600 flex-1"></div>
            <span className="text-slate-400 text-xs uppercase font-bold">O continuar con</span>
            <div className="h-px bg-slate-600 flex-1"></div>
        </div>

        <button 
            type="button"
            onClick={handleGoogleClick}
            disabled={!isOnline}
            className={`w-full bg-white text-slate-900 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-sm ${!isOnline ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
        >
             <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
             Google
        </button>
        
        <div className="mt-6 text-center">
            <button onClick={handleQuickAccess} className="text-xs text-slate-400 hover:text-blue-400 transition">
                (Acceso Rápido Admin Demo - Usar Credenciales)
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Pending Approval Screen ---
const PendingScreen = ({ onLogout }: { onLogout: () => void }) => (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg text-center border-t-4 border-yellow-500">
            <div className="mx-auto bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-yellow-600">
                <LucideLock size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Cuenta Pendiente de Aprobación</h1>
            <p className="text-slate-600 mb-6">
                Hola, tu solicitud de registro ha sido recibida. El administrador (<strong>alewilczek@gmail.com</strong>) debe autorizar tu ingreso y asignarte un nivel de acceso antes de que puedas utilizar la aplicación.
            </p>
            <div className="bg-slate-50 p-4 rounded text-sm text-slate-500 mb-6">
                Por favor, aguarda la confirmación.
            </div>
            <button onClick={onLogout} className="text-blue-600 font-bold hover:underline">
                Volver al inicio
            </button>
        </div>
    </div>
);

// --- Main App ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  // OFFLINE & LOADING STATES
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Network Listeners
  useEffect(() => {
      const handleOnline = () => {
          setIsOnline(true);
          handleSync();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, [vehicles, serviceRequests, checklists]);

  // AUTO-SYNC / DB LISTENERS (Real-time updates across tabs)
  useEffect(() => {
      const handleStorageChange = (e: StorageEvent) => {
          // If important keys change in another tab, reload data here to stay in sync
          if (['fp_users', 'fp_vehicles', 'fp_requests', 'fp_checklists'].includes(e.key || '')) {
              refreshData(true); // silent refresh
          }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync Logic (Simulation)
  const handleSync = () => {
      // Find items pending sync
      const pendingVehicles = vehicles.filter(v => v.syncStatus === 'PENDING');
      const pendingChecklists = checklists.filter(c => c.syncStatus === 'PENDING');
      const pendingRequests = serviceRequests.filter(r => r.syncStatus === 'PENDING');

      if (pendingVehicles.length > 0 || pendingChecklists.length > 0 || pendingRequests.length > 0) {
          setIsSyncing(true);
          // Simulate Upload Delay
          setTimeout(() => {
              // Update all pending to SYNCED
              setVehicles(prev => prev.map(v => v.syncStatus === 'PENDING' ? { ...v, syncStatus: 'SYNCED' } : v));
              setChecklists(prev => prev.map(c => c.syncStatus === 'PENDING' ? { ...c, syncStatus: 'SYNCED' } : c));
              setServiceRequests(prev => prev.map(r => r.syncStatus === 'PENDING' ? { ...r, syncStatus: 'SYNCED' } : r));
              
              setIsSyncing(false);
          }, 3000); // 3 seconds sync simulation
      }
  };

  // Central Data Loading Logic
  const refreshData = async (silent = false) => {
      if (!silent) setIsDataLoading(true);
      
      // Simulate network latency for a "database fetch" only on hard refresh
      if (!silent) await new Promise(resolve => setTimeout(resolve, 800));

      // 1. Users
      const savedUsers = localStorage.getItem('fp_users');
      if (savedUsers) {
          setRegisteredUsers(JSON.parse(savedUsers));
      } else {
          setRegisteredUsers(MOCK_USERS);
      }
      
      // 2. Vehicles
      const savedV = localStorage.getItem('fp_vehicles');
      if (savedV) {
          setVehicles(JSON.parse(savedV));
      } else {
          setVehicles(INITIAL_VEHICLES.map(v => ({...v, syncStatus: 'SYNCED'})));
      }
      
      // 3. Requests
      const savedR = localStorage.getItem('fp_requests');
      if (savedR) {
          setServiceRequests(JSON.parse(savedR));
      } else {
          setServiceRequests(MOCK_REQUESTS.map(r => ({...r, syncStatus: 'SYNCED'})));
      }

      // 4. Checklists
      const savedC = localStorage.getItem('fp_checklists');
      if (savedC) {
          setChecklists(JSON.parse(savedC));
      } else {
          setChecklists(MOCK_CHECKLISTS.map(c => ({...c, syncStatus: 'SYNCED'})));
      }

      if (!silent) setIsDataLoading(false);
  };

  // Initial Load on Mount
  useEffect(() => {
      refreshData();
  }, []);

  // Save persistence when state changes (This acts as the "Save to DB")
  useEffect(() => { if(registeredUsers.length > 0) localStorage.setItem('fp_users', JSON.stringify(registeredUsers)); }, [registeredUsers]);
  useEffect(() => { if(vehicles.length > 0) localStorage.setItem('fp_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
  useEffect(() => { if(serviceRequests.length > 0) localStorage.setItem('fp_requests', JSON.stringify(serviceRequests)); }, [serviceRequests]);
  useEffect(() => { if(checklists.length > 0) localStorage.setItem('fp_checklists', JSON.stringify(checklists)); }, [checklists]);

  const login = async (email: string, pass: string): Promise<{success: boolean, message?: string}> => {
    const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    
    if (existingUser) {
        // Validate password strictly
        if (existingUser.password !== pass.trim()) {
             return { success: false, message: "Contraseña incorrecta." };
        }
        setCurrentUser(existingUser);
        refreshData(); // Ensure fresh data on login
        return { success: true };
    } 
    return { success: false, message: "Usuario no encontrado." };
  };

  const register = async (email: string, pass: string, name: string): Promise<boolean> => {
      const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) return false;

      const isSuperAdmin = email.toLowerCase() === 'alewilczek@gmail.com';
      const newUser: User = {
          id: Date.now().toString(),
          email,
          name,
          role: isSuperAdmin ? UserRole.ADMIN : UserRole.GUEST,
          approved: isSuperAdmin,
          password: pass,
          createdAt: new Date().toISOString()
      };
      setRegisteredUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      return true;
  };

  const googleLogin = async (email: string) => {
      const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
          setCurrentUser(existingUser);
          refreshData();
      } else {
          // Auto-Register via Google
          const isSuperAdmin = email.toLowerCase() === 'alewilczek@gmail.com';
          const newUser: User = {
              id: Date.now().toString(),
              email,
              name: email.split('@')[0], // Simulate name from email
              role: isSuperAdmin ? UserRole.ADMIN : UserRole.GUEST,
              approved: isSuperAdmin,
              avatarUrl: `https://ui-avatars.com/api/?name=${email}&background=random`,
              createdAt: new Date().toISOString()
          };
          setRegisteredUsers(prev => [...prev, newUser]);
          setCurrentUser(newUser);
      }
  };

  const logout = () => {
      setCurrentUser(null);
  };

  const updateUser = (updatedUser: User) => {
      setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
      }
  };

  const deleteUser = (id: string) => {
      setRegisteredUsers(prev => prev.filter(u => u.id !== id));
      if (currentUser?.id === id) logout();
  };

  // --- CRUD Proxies to handle Offline Status ---
  const addVehicle = (v: Vehicle) => setVehicles(prev => [...prev, { ...v, syncStatus: isOnline ? 'SYNCED' : 'PENDING' }]);
  
  const updateVehicle = (v: Vehicle) => setVehicles(prev => prev.map(item => item.plate === v.plate ? { ...v, syncStatus: isOnline ? 'SYNCED' : 'PENDING' } : item));
  
  const deleteVehicle = (plate: string) => setVehicles(prev => prev.filter(v => v.plate !== plate));

  const addServiceRequest = (sr: ServiceRequest) => setServiceRequests(prev => [...prev, { ...sr, syncStatus: isOnline ? 'SYNCED' : 'PENDING' }]);
  
  const updateServiceRequest = (sr: ServiceRequest) => setServiceRequests(prev => prev.map(item => item.id === sr.id ? { ...sr, syncStatus: isOnline ? 'SYNCED' : 'PENDING' } : item));

  // NEW: Delete Service Request
  const deleteServiceRequest = (id: string) => setServiceRequests(prev => prev.filter(r => r.id !== id));

  const addChecklist = (c: Checklist) => setChecklists(prev => [...prev, { ...c, syncStatus: isOnline ? 'SYNCED' : 'PENDING' }]);

  return (
    <AppContext.Provider value={{ 
      user: currentUser, registeredUsers, login, register, googleLogin, logout, updateUser, deleteUser,
      vehicles, addVehicle, updateVehicle, deleteVehicle,
      serviceRequests, addServiceRequest, updateServiceRequest, deleteServiceRequest,
      checklists, addChecklist,
      isOnline, isSyncing,
      refreshData, isDataLoading
    }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={!currentUser ? <LoginScreen /> : <Navigate to="/" />} />
          
          {/* Protected Routes Logic */}
          <Route path="/*" element={
              currentUser ? (
                  currentUser.approved ? (
                      <Layout>
                        <ProtectedRoutes />
                      </Layout>
                  ) : (
                      <PendingScreen onLogout={logout} />
                  )
              ) : (
                  <Navigate to="/login" />
              )
          } />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
}

const ProtectedRoutes = () => {
  const { user } = useApp();
  
  const isAdmin = user?.role === UserRole.ADMIN;
  // Allow ADMIN_L2 to see admin screens but restrict actions in components
  const isSuperUser = user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2;
  const isManager = isSuperUser || user?.role === UserRole.MANAGER;

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/vehicles" element={<VehicleList />} />
      <Route path="/vehicles/new" element={isManager ? <VehicleForm /> : <Navigate to="/vehicles" />} />
      <Route path="/vehicles/:plate" element={<VehicleForm />} />
      <Route path="/checklist" element={<ChecklistComp />} />
      <Route path="/service" element={<ServiceManager />} />
      
      {/* Admin Route - Now accessible to ADMIN_L2 as well */}
      <Route path="/users" element={isSuperUser ? <AdminUsers /> : <Navigate to="/" />} />
    </Routes>
  );
};
