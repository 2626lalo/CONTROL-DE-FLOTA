import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { VehicleList } from './components/VehicleList';
// Importación corregida para VehicleForm
import VehicleFormComponent from './components/VehicleForm';
import { Checklist as ChecklistComp } from './components/Checklist';
import { ServiceManager } from './components/ServiceManager';
import { AdminUsers } from './components/AdminUsers';
import { User, UserRole, Vehicle, ServiceRequest, Checklist } from './types';
import { MOCK_USERS } from './constants';
import { 
  LucideLayoutDashboard, 
  LucideCar, 
  LucideClipboardCheck, 
  LucideWrench, 
  LucideLogOut, 
  LucideMail, 
  LucideLock, 
  LucideCheckCircle, 
  LucideLoader, 
  LucideUser, 
  LucideArrowRight,
  LucideShield,
  LucideUsers,
  LucideBell,
  LucideCloud,
  LucideCloudOff
} from 'lucide-react';

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

  // Global Error Notification
  notifyError: (msg: string) => void;
  globalError: string | null;
  clearGlobalError: () => void;
  
  // Google AI API
  googleAI: any | null;
}

const AppContext = createContext<AppContextType>({} as AppContextType);
export const useApp = () => useContext(AppContext);

// --- SAFE PARSE HELPER (Prevents crashes on corrupted LocalStorage) ---
const safeJSONParse = <T,>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        localStorage.removeItem(key);
        return fallback;
    }
};

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
    if(!email || !password) {
      setError("Por favor complete todos los campos");
      return;
    }
    if(isRegistering && !name) {
      setError("Por favor ingrese su nombre");
      return;
    }

    setLoading(true);
    setError('');
    
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
      if (!isOnline) {
          setError("La autenticación con Google requiere conexión a internet.");
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
      const result = await login('alewilczek@gmail.com', 'lalo');
      if (!result.success) {
          setError(result.message || "Error en acceso rápido.");
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-900 text-white relative overflow-hidden">
      {/* Background Decor & Animation */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div 
            className="w-full h-full bg-cover bg-center opacity-60 animate-pulse-slow"
            style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1609520505218-7421da4c3729?q=80&w=2574&auto=format&fit=crop')",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/40"></div>
          
          {/* Animated particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${10 + Math.random() * 20}s`
                }}
              />
            ))}
          </div>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-sm ${isOnline ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
          {isOnline ? <LucideCloud size={16} /> : <LucideCloudOff size={16} />}
          <span className="text-sm font-medium">{isOnline ? 'En línea' : 'Sin conexión'}</span>
        </div>
      </div>

      <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-4 shadow-lg">
              <LucideCar size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
              CONTROL DE FLOTA
            </h1>
            <p className="text-slate-300 font-medium">Gestión de Alta Montaña 4x4</p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex bg-slate-900/50 rounded-xl p-1 mb-8">
            <button 
                onClick={() => { setIsRegistering(false); setError(''); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${!isRegistering ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
                Iniciar Sesión
            </button>
            <button 
                onClick={() => { setIsRegistering(true); setError(''); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${isRegistering ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
                Crear Cuenta
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {isRegistering && (
                <div className="animate-fadeIn">
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Nombre Completo</label>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                        <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10" size={18} />
                        <input 
                            type="text" 
                            required
                            className="relative w-full bg-slate-900/70 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none placeholder:text-slate-500 transition-all duration-300"
                            placeholder="Juan Perez"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Correo Electrónico</label>
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <LucideMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10" size={18} />
                    <input 
                        type="email" 
                        required
                        className="relative w-full bg-slate-900/70 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none placeholder:text-slate-500 transition-all duration-300"
                        placeholder="usuario@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Contraseña</label>
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <LucideLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10" size={18} />
                    <input 
                        type="password" 
                        required
                        className="relative w-full bg-slate-900/70 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none placeholder:text-slate-500 transition-all duration-300"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="animate-shake bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
                    <p className="text-red-400 text-sm text-center font-bold">{error}</p>
                </div>
            )}

            <button 
                type="submit"
                disabled={loading}
                className="relative w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow flex justify-center items-center gap-3 mt-2 overflow-hidden group"
            >
                <span className="relative z-10 flex items-center gap-2">
                    {loading ? <LucideLoader className="animate-spin" size={20} /> : null}
                    {isRegistering ? 'Crear Cuenta' : 'Ingresar al Sistema'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {!isRegistering && !loading && (
                    <LucideArrowRight className="relative z-10 ml-2 group-hover:translate-x-1 transition-transform duration-300" size={20} />
                )}
            </button>
        </form>

        <div className="my-8 flex items-center gap-4">
            <div className="h-px bg-gradient-to-r from-transparent to-slate-700 flex-1"></div>
            <span className="text-slate-400 text-xs uppercase font-bold bg-slate-900/50 px-3 py-1 rounded-full">O continuar con</span>
            <div className="h-px bg-gradient-to-r from-slate-700 to-transparent flex-1"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <button 
                type="button"
                onClick={handleGoogleClick}
                disabled={!isOnline}
                className={`flex items-center justify-center gap-3 py-3 rounded-xl font-medium transition-all duration-300 ${
                    !isOnline 
                        ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' 
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
                }`}
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm">Google</span>
            </button>
            
            <button 
                onClick={handleQuickAccess}
                disabled={loading}
                className="flex items-center justify-center gap-3 py-3 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 hover:from-emerald-900/40 hover:to-emerald-800/40 text-emerald-300 border border-emerald-800/30 hover:border-emerald-700/50"
            >
                <LucideShield size={16} />
                <span className="text-sm">Acceso Rápido</span>
            </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-xs text-slate-400">
                {isRegistering ? '¿Ya tienes una cuenta?' : '¿Primera vez en el sistema?'}
                <button 
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="ml-2 text-blue-400 hover:text-blue-300 font-bold transition-colors duration-300"
                >
                    {isRegistering ? 'Inicia sesión aquí' : 'Regístrate aquí'}
                </button>
            </p>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-20">
        <p className="text-xs text-slate-500">Sistema de Gestión de Flota 4x4 • Versión 2.0</p>
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

// --- Pending Approval Screen ---
const PendingScreen = ({ onLogout }: { onLogout: () => void }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-gray-200 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center border-t-4 border-yellow-500">
            <div className="mx-auto bg-gradient-to-br from-yellow-100 to-amber-100 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <LucideLock size={48} className="text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Cuenta Pendiente de Aprobación</h1>
            <p className="text-slate-600 mb-6 text-lg">
                Hola, tu solicitud de registro ha sido recibida exitosamente. 
                <span className="block mt-2 font-semibold text-slate-800">
                    El administrador del sistema debe autorizar tu ingreso antes de que puedas acceder.
                </span>
            </p>
            
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200 mb-8">
                <div className="flex items-center justify-center gap-3 mb-3">
                    <LucideUsers className="text-yellow-600" size={20} />
                    <h3 className="font-bold text-slate-800">Proceso de Aprobación</h3>
                </div>
                <p className="text-slate-600 text-sm">
                    El administrador principal (<strong className="text-slate-900">alewilczek@gmail.com</strong>) revisará tu solicitud y te asignará un nivel de acceso adecuado.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-200 rounded-full"></div>
                </div>
            </div>
            
            <div className="space-y-4">
                <button 
                    onClick={onLogout} 
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-bold hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow hover:shadow-lg"
                >
                    Volver al Inicio de Sesión
                </button>
                
                <p className="text-sm text-slate-500">
                    ¿Necesitas ayuda? Contacta al administrador del sistema.
                </p>
            </div>
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
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Google AI - Inicialización segura
  const [googleAI, setGoogleAI] = useState<any | null>(null);

  const notifyError = (msg: string) => {
      console.error(msg);
      setGlobalError(msg);
      setTimeout(() => setGlobalError(null), 5000);
  };

  const clearGlobalError = () => setGlobalError(null);

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
  }, []);

  // AUTO-SYNC / DB LISTENERS (Real-time updates across tabs)
  useEffect(() => {
      const handleStorageChange = (e: StorageEvent) => {
          if (['fp_users', 'fp_vehicles', 'fp_requests', 'fp_checklists'].includes(e.key || '')) {
              refreshData(true);
          }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync Logic (Simulation)
  const handleSync = () => {
      const pendingVehicles = vehicles.filter(v => v.syncStatus === 'PENDING');
      const pendingChecklists = checklists.filter(c => c.syncStatus === 'PENDING');
      const pendingRequests = serviceRequests.filter(r => r.syncStatus === 'PENDING');

      if (pendingVehicles.length > 0 || pendingChecklists.length > 0 || pendingRequests.length > 0) {
          setIsSyncing(true);
          setTimeout(() => {
              setVehicles(prev => prev.map(v => v.syncStatus === 'PENDING' ? { ...v, syncStatus: 'SYNCED' } : v));
              setChecklists(prev => prev.map(c => c.syncStatus === 'PENDING' ? { ...c, syncStatus: 'SYNCED' } : c));
              setServiceRequests(prev => prev.map(r => r.syncStatus === 'PENDING' ? { ...r, syncStatus: 'SYNCED' } : r));
              
              setIsSyncing(false);
          }, 3000);
      }
  };

  // Central Data Loading Logic
  const refreshData = async (silent = false) => {
      if (!silent) setIsDataLoading(true);
      
      try {
          if (!silent) await new Promise(resolve => setTimeout(resolve, 800));

          const savedUsers = safeJSONParse<User[]>('fp_users', []);
          if (savedUsers.length > 0) {
              setRegisteredUsers(savedUsers);
          } else {
              setRegisteredUsers(MOCK_USERS);
          }
          
          const savedV = safeJSONParse<Vehicle[]>('fp_vehicles', []);
          if (savedV.length > 0) {
              setVehicles(savedV);
          } else {
              setVehicles([]);
          }
          
          const savedR = safeJSONParse<ServiceRequest[]>('fp_requests', []);
          if (savedR.length > 0) {
              setServiceRequests(savedR);
          } else {
              setServiceRequests([]);
          }

          const savedC = safeJSONParse<Checklist[]>('fp_checklists', []);
          if (savedC.length > 0) {
              setChecklists(savedC);
          } else {
              setChecklists([]);
          }
      } catch (err) {
          console.error("Error refreshing data:", err);
          notifyError("Error al cargar datos. Se han usado valores por defecto.");
      } finally {
          if (!silent) setIsDataLoading(false);
      }
  };

  // Initialize Google AI
  useEffect(() => {
    const initializeGoogleAI = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
        
        if (!apiKey) {
          console.warn('Google AI API key no configurada');
          return;
        }

        const { GoogleGenerativeAI } = await import('@google/genai');
        const genAI = new GoogleGenerativeAI(apiKey);
        
        setGoogleAI(genAI);
        console.log('Google AI inicializado correctamente');
      } catch (error) {
        console.warn('Error inicializando Google AI:', error);
      }
    };

    if (isOnline) {
      initializeGoogleAI();
    }
  }, [isOnline]);

  // Initial Load on Mount
  useEffect(() => {
      refreshData();
  }, []);

  // Save persistence when state changes
  useEffect(() => { 
      if(registeredUsers.length > 0) localStorage.setItem('fp_users', JSON.stringify(registeredUsers)); 
  }, [registeredUsers]);
  
  useEffect(() => { 
      localStorage.setItem('fp_vehicles', JSON.stringify(vehicles)); 
  }, [vehicles]);
  
  useEffect(() => { 
      localStorage.setItem('fp_requests', JSON.stringify(serviceRequests)); 
  }, [serviceRequests]);
  
  useEffect(() => { 
      localStorage.setItem('fp_checklists', JSON.stringify(checklists)); 
  }, [checklists]);

  const login = async (email: string, pass: string): Promise<{success: boolean, message?: string}> => {
    try {
        const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        
        if (existingUser) {
            if (existingUser.password !== pass.trim()) {
                 return { success: false, message: "Contraseña incorrecta." };
            }
            setCurrentUser(existingUser);
            refreshData();
            return { success: true };
        } 
        return { success: false, message: "Usuario no encontrado." };
    } catch (err) {
        notifyError("Error en proceso de login.");
        return { success: false, message: "Error inesperado." };
    }
  };

  const register = async (email: string, pass: string, name: string): Promise<boolean> => {
      try {
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
              createdAt: new Date().toISOString(),
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
          };
          
          setRegisteredUsers(prev => [...prev, newUser]);
          setCurrentUser(newUser);
          
          return true;
      } catch (e) {
          notifyError("Error al registrar usuario.");
          return false;
      }
  };

  const googleLogin = async (email: string) => {
      try {
          const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (existingUser) {
              setCurrentUser(existingUser);
              refreshData();
          } else {
              const isSuperAdmin = email.toLowerCase() === 'alewilczek@gmail.com';
              const newUser: User = {
                  id: Date.now().toString(),
                  email,
                  name: email.split('@')[0],
                  role: isSuperAdmin ? UserRole.ADMIN : UserRole.GUEST,
                  approved: isSuperAdmin,
                  avatarUrl: `https://ui-avatars.com/api/?name=${email}&background=random`,
                  createdAt: new Date().toISOString()
              };
              setRegisteredUsers(prev => [...prev, newUser]);
              setCurrentUser(newUser);
          }
      } catch (e) {
          notifyError("Error en login con Google.");
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

  // --- Vehicle CRUD ---
  const addVehicle = (v: Vehicle) => {
    setVehicles(prev => [...prev, { ...v, syncStatus: isOnline ? 'SYNCED' : 'PENDING' }]);
  };
  
  const updateVehicle = (v: Vehicle) => {
    setVehicles(prev => prev.map(item => item.plate === v.plate ? { ...v, syncStatus: isOnline ? 'SYNCED' : 'PENDING' } : item));
  };
  
  const deleteVehicle = (plate: string) => {
    setVehicles(prev => prev.filter(v => v.plate !== plate));
  };

  // --- Service Request CRUD ---
  const addServiceRequest = (sr: ServiceRequest) => {
    setServiceRequests(prev => [...prev, { ...sr, syncStatus: isOnline ? 'SYNCED' : 'PENDING' }]);
  };
  
  const updateServiceRequest = (sr: ServiceRequest) => {
    setServiceRequests(prev => prev.map(item => item.id === sr.id ? { ...sr, syncStatus: isOnline ? 'SYNCED' : 'PENDING' } : item));
  };

  const deleteServiceRequest = (id: string) => {
    setServiceRequests(prev => prev.filter(r => r.id !== id));
  };

  // --- Checklist CRUD ---
  const addChecklist = (c: Checklist) => {
    setChecklists(prev => [...prev, { ...c, syncStatus: isOnline ? 'SYNCED' : 'PENDING' }]);
  };

  return (
    <AppContext.Provider value={{ 
      user: currentUser, 
      registeredUsers, 
      login, 
      register, 
      googleLogin, 
      logout, 
      updateUser, 
      deleteUser,
      vehicles, 
      addVehicle, 
      updateVehicle, 
      deleteVehicle,
      serviceRequests, 
      addServiceRequest, 
      updateServiceRequest, 
      deleteServiceRequest,
      checklists, 
      addChecklist,
      isOnline, 
      isSyncing,
      refreshData, 
      isDataLoading,
      notifyError, 
      globalError, 
      clearGlobalError,
      googleAI
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

// --- Protected Routes Component ---
const ProtectedRoutes = () => {
  const { user } = useApp();
  
  const isAdmin = user?.role === UserRole.ADMIN;
  const isSuperUser = user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2;
  const isManager = isSuperUser || user?.role === UserRole.MANAGER;

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/vehicles" element={<VehicleList />} />
      <Route path="/vehicles/new" element={isManager ? <VehicleFormComponent /> : <Navigate to="/vehicles" />} />
      <Route path="/vehicles/:plate" element={<VehicleFormComponent />} />
      <Route path="/checklist" element={<ChecklistComp />} />
      <Route path="/service" element={<ServiceManager />} />
      
      {/* Admin Route - Now accessible to ADMIN_L2 as well */}
      <Route path="/users" element={isSuperUser ? <AdminUsers /> : <Navigate to="/" />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
