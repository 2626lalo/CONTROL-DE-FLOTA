import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { useApp } from '../context/FleetContext';
import { LucideUserPlus, LucideLogIn, LucideArrowLeft, LucideCheckCircle, LucideShieldCheck } from 'lucide-react';

export const LoginScreen = () => {
  const { register, login } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Usuario principal que DEBE existir siempre
  const MAIN_USER = {
    id: "main-admin",
    email: "alewilczek@gmail.com",
    nombre: "Alejandro",
    apellido: "Wilczek",
    role: UserRole.ADMIN,
    approved: true,
    estado: "activo" as const
  };

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('fp_users') || '[]');
    const mainUserExists = users.some((u: any) => u.email === MAIN_USER.email);
    
    if (!mainUserExists) {
      users.push(MAIN_USER);
      localStorage.setItem('fp_users', JSON.stringify(users));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        // CORRECCIÓN: Usar navigate en lugar de window.location.href para evitar bloqueos de seguridad
        navigate('/');
      } else {
        setError(res.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const res = await register(email, password, name, lastName, phone);
      if (res.success) {
        setSuccess('¡Registro exitoso! Su cuenta está pendiente de aprobación por el administrador.');
        setName(''); setLastName(''); setPhone(''); setEmail(''); setPassword('');
        setTimeout(() => {
          setMode('LOGIN');
          setSuccess('');
        }, 5000);
      } else {
        setError(res.message || 'Error al registrarse');
      }
    } catch (err) {
      setError('Error de conexión al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-white/10 animate-fadeIn">
        
        <div className="bg-slate-900 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-900/20">
            FP
          </div>
          <div>
            <h2 className="text-white font-black text-2xl tracking-tighter uppercase italic">FleetPro Enterprise</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Gestión de Flota Profesional</p>
          </div>
        </div>

        <div className="p-8 md:p-10 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn">
              <LucideShieldCheck size={18} className="shrink-0"/>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn">
              <LucideCheckCircle size={18} className="shrink-0"/>
              {success}
            </div>
          )}

          <form onSubmit={mode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
            
            {mode === 'REGISTER' && (
              <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ej: Juan"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Apellido</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Ej: Pérez"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Teléfono de Contacto</label>
                  <input 
                    type="tel" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+54 9..."
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Correo Electrónico</label>
              <input 
                type="email" 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="usuario@empresa.com"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Contraseña</label>
              <input 
                type="password" 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${loading ? 'bg-slate-200 text-slate-400 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : mode === 'LOGIN' ? (
                <><LucideLogIn size={18}/> Ingresar al Sistema</>
              ) : (
                <><LucideUserPlus size={18}/> Crear mi Cuenta</>
              )}
            </button>
          </form>
          
          <div className="pt-6 border-t border-slate-100 text-center">
            {mode === 'LOGIN' ? (
              <button 
                onClick={() => setMode('REGISTER')}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                ¿No tienes cuenta? <span className="text-blue-600">Regístrate aquí</span>
              </button>
            ) : (
              <button 
                onClick={() => setMode('LOGIN')}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <LucideArrowLeft size={14}/> Volver al Inicio de Sesión
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="absolute bottom-8 text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] italic">
        Authorized Access Only • FleetPro v37.0-SECURED
      </p>
    </div>
  );
};