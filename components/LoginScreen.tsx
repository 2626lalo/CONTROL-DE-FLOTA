import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/FleetContext';
import { 
  LucideCar, LucideLoader, LucideShieldAlert, LucideMail, 
  LucideLock, LucideChevronRight, LucideX, LucideCheckCircle2, 
  LucideUser, LucideSmartphone, LucideArrowLeft
} from 'lucide-react';

const MASTER_EMAIL = 'alewilczek@gmail.com';
const MASTER_PASS = 'Joaquin4';

export const LoginScreen = () => {
  const { login, register, addNotification } = useApp();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showGoogleSelector, setShowGoogleSelector] = useState(false);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    lastName: '',
    phone: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const googleAccounts = [
    { email: MASTER_EMAIL, name: 'Ale Wilczek', role: 'Administrador Supremo' },
    { email: 'admin@fleetpro.com', name: 'Soporte FleetPro', role: 'Support Admin' },
    { email: 'operaciones@empresa.com', name: 'Manager Operativo', role: 'Fleet Manager' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailInput = formData.email.toLowerCase().trim();
    const passInput = formData.password;

    try {
      if (isRegister) {
        if (!formData.name || !formData.lastName) {
          setError("El nombre y apellido son obligatorios.");
          setLoading(false);
          return;
        }
        const result = await register(emailInput, passInput, formData.name, formData.lastName, formData.phone || "S/D");
        if (result.success) {
            setIsRegister(false);
            addNotification("Cuenta creada. Su acceso está pendiente de aprobación por administración.", "success");
            // Limpiar password para el siguiente paso
            setFormData(prev => ({ ...prev, password: '' }));
            // En el registro, como queda pendiente, no navegamos al dashboard aún, 
            // pero si fuera auto-aprobado (como el master), lo haríamos.
            if (emailInput === MASTER_EMAIL) {
                await login(emailInput, passInput);
                navigate('/');
            }
        } else {
            setError(result.message || "Error al registrar usuario.");
        }
      } else {
        const result = await login(emailInput, passInput);
        
        if (result.success) {
            navigate('/');
        } else {
            if (emailInput === MASTER_EMAIL && passInput === MASTER_PASS) {
                addNotification("Sincronizando administrador principal...", "warning");
                // Auto-registro para el master si falla el login inicial (ej: primer despliegue en Firebase)
                await register(MASTER_EMAIL, MASTER_PASS, "ALE", "WILCZEK", "S/D");
                await login(MASTER_EMAIL, MASTER_PASS);
                navigate('/');
            } else {
                setError(result.message || "Credenciales incorrectas.");
            }
        }
      }
    } catch (e: any) {
        setError(e.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelect = (email: string) => {
    setLoading(true);
    setShowGoogleSelector(false);
    
    setTimeout(async () => {
        const pass = email === MASTER_EMAIL ? MASTER_PASS : 'admin';
        const result = await login(email, pass);
        
        if (result.success) {
            navigate('/');
        } else if (email === MASTER_EMAIL) {
            await register(MASTER_EMAIL, MASTER_PASS, "ALE", "WILCZEK", "S/D");
            await login(MASTER_EMAIL, MASTER_PASS);
            navigate('/');
        }
        setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]"></div>

      {showGoogleSelector && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl animate-fadeIn space-y-6 border border-slate-100">
                <div className="flex justify-between items-center">
                    <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-8 h-8" alt="G"/>
                    <button onClick={() => setShowGoogleSelector(false)} className="text-slate-300 hover:text-rose-500"><LucideX/></button>
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Seleccionar Cuenta</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Acceso Corporativo FleetPro</p>
                </div>
                <div className="space-y-2">
                    {googleAccounts.map(acc => (
                        <button key={acc.email} onClick={() => handleGoogleSelect(acc.email)} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">{acc.name.charAt(0)}</div>
                            <div className="text-left flex-1 overflow-hidden">
                                <p className="text-[11px] font-black text-slate-800 uppercase">{acc.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold truncate">{acc.email}</p>
                            </div>
                            <LucideChevronRight size={14} className="text-slate-200 group-hover:text-blue-600"/>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] p-12 shadow-2xl border border-white/5 animate-fadeIn relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-6 rounded-[2rem] mb-8 bg-blue-600 shadow-2xl shadow-blue-500/30 transform -rotate-6">
            <LucideCar size={44} className="text-white" />
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">FleetPro Enterprise</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-4">Gestión de Activos en la Nube</p>
        </div>

        <div className="space-y-6">
          {!isRegister && (
            <button 
              onClick={() => setShowGoogleSelector(true)}
              className="w-full py-5 bg-white text-slate-900 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 border border-slate-200"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-5 h-5" alt="G"/>
              Ingresar vía Google Workspace
            </button>
          )}

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <span className="relative bg-[#020617] px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
              {isRegister ? 'Registro de Usuario' : 'Acceso Directo'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16}/>
                  <input 
                    type="text" 
                    placeholder="Nombre" 
                    className="w-full bg-slate-950/50 border border-white/10 pl-11 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all text-xs" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required
                  />
                </div>
                <div className="relative">
                  <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16}/>
                  <input 
                    type="text" 
                    placeholder="Apellido" 
                    className="w-full bg-slate-950/50 border border-white/10 pl-11 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all text-xs" 
                    value={formData.lastName} 
                    onChange={e => setFormData({...formData, lastName: e.target.value})} 
                    required
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <LucideMail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18}/>
              <input 
                type="email" 
                placeholder="Email Corporativo" 
                className="w-full bg-slate-950/50 border border-white/10 pl-14 pr-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required
              />
            </div>

            <div className="relative">
              <LucideLock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18}/>
              <input 
                type="password" 
                placeholder="Contraseña" 
                className="w-full bg-slate-950/50 border border-white/10 pl-14 pr-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required
              />
            </div>
            
            {isRegister && (
               <div className="relative">
                <LucideSmartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18}/>
                <input 
                  type="tel" 
                  placeholder="Teléfono / WhatsApp" 
                  className="w-full bg-slate-950/50 border border-white/10 pl-14 pr-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase text-center justify-center p-3 bg-rose-400/10 rounded-xl border border-rose-400/20">
                <LucideShieldAlert size={14}/> {error}
              </div>
            )}
            
            <button disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
              {loading ? <LucideLoader className="animate-spin" size={18}/> : isRegister ? 'Confirmar Registro' : 'Iniciar Sesión'}
            </button>

            <div className="pt-4 text-center">
              <button 
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-400 transition-colors"
              >
                {isRegister ? '¿Ya tiene cuenta? Iniciar Sesión' : '¿No tiene cuenta? Regístrese aquí'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
