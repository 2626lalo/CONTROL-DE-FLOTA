
import React, { useState } from 'react';
import { useApp } from '../context/FleetContext';
import { LucideCar, LucideLoader, LucideShieldAlert, LucideMail, LucideLock, LucideChevronRight, LucideX, LucideCheckCircle2 } from 'lucide-react';

export const LoginScreen = () => {
  const { login, register, addNotification } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [showGoogleSelector, setShowGoogleSelector] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const googleAccounts = [
    { email: 'alewilczek@gmail.com', name: 'Ale Wilczek', role: 'Main Admin' },
    { email: 'admin@fleetpro.com', name: 'Soporte FleetPro', role: 'Support Admin' },
    { email: 'operaciones@empresa.com', name: 'Manager Operativo', role: 'Fleet Manager' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const success = await register(formData.email, formData.password, formData.name, formData.phone);
        if (success) {
            setIsRegister(false);
            addNotification("Solicitud de acceso enviada correctamente.", "success");
        } else setError("El email ya se encuentra registrado.");
      } else {
        const result = await login(formData.email, formData.password);
        if (!result.success) setError(result.message || "Credenciales incorrectas.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelect = (email: string) => {
    setLoading(true);
    setShowGoogleSelector(false);
    addNotification(`Iniciando sesión con ${email}...`, "warning");
    setTimeout(async () => {
        // Simulación de bypass de contraseña para cuentas conocidas en entorno de demo/backup
        const pass = email === 'alewilczek@gmail.com' ? '12305' : 'admin';
        await login(email, pass);
        setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6 relative overflow-hidden">
      {/* Background Decor */}
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
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Elige el perfil para ingresar a FleetPro</p>
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
                    <button onClick={() => { setShowGoogleSelector(false); setIsRegister(true); }} className="w-full p-4 text-[9px] font-black uppercase text-blue-600 hover:bg-blue-50 rounded-2xl transition-all mt-2">Gestionar otra cuenta</button>
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
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-4">Gestión Estratégica de Activos</p>
        </div>

        <div className="space-y-6">
          <button 
            onClick={() => setShowGoogleSelector(true)}
            className="w-full py-5 bg-white text-slate-900 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 border border-slate-200"
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-5 h-5" alt="G"/>
            Ingresar vía Google Workspace
          </button>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <span className="relative bg-[#020617] px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">O credenciales locales</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <input 
                type="text" 
                placeholder="Nombre completo" 
                className="w-full bg-slate-950/50 border border-white/10 px-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required
              />
            )}
            
            <div className="relative">
              <LucideMail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18}/>
              <input 
                type="email" 
                placeholder="Usuario Corporativo" 
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
            
            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase text-center justify-center p-3 bg-rose-400/10 rounded-xl border border-rose-400/20">
                <LucideShieldAlert size={14}/> {error}
              </div>
            )}
            
            <button disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
              {loading ? <LucideLoader className="animate-spin" size={18}/> : (isRegister ? 'Crear Registro' : 'Iniciar Sesión')}
            </button>
            
            <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }} className="w-full text-center text-slate-500 hover:text-white font-black uppercase text-[9px] tracking-[0.25em] mt-4 transition-colors">
              {isRegister ? '¿Ya eres parte? Ir al Login' : '¿Sin acceso? Solicitar credenciales'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
