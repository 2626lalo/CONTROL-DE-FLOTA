import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { useApp } from '../context/FleetContext';
import { useFirebase } from '../context/FirebaseContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LucideUserPlus, LucideLogIn, LucideArrowLeft, LucideCheckCircle, LucideShieldCheck, LucideShieldAlert, LucideTimer, LucideKeyRound, LucideShieldQuestion, LucideClock } from 'lucide-react';

export const LoginScreen = () => {
  const { login: fleetLogin } = useApp();
  const { signIn, signUp, logout, resetPassword, db } = useFirebase();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPendingLogin, setIsPendingLogin] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPendingLogin(false);
    setLoading(true);

    try {
      console.log('1️⃣ Intentando login con:', email);
      const userCredential = await signIn(email, password);
      console.log('2️⃣ Login exitoso, UID:', userCredential.user.uid);
      
      console.log('3️⃣ Buscando documento en Firestore...');
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        console.log('4️⃣ Usuario no existe en Firestore');
        await logout();
        setError('Usuario no registrado en el sistema');
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      console.log('5️⃣ Datos de usuario:', userData);
      
      if (!userData || !userData.approved) {
        console.log('6️⃣ Usuario NO aprobado, cerrando sesión');
        await logout();
        setError('Tu cuenta está pendiente de aprobación por el administrador.');
        setIsPendingLogin(true);
        setLoading(false);
        return;
      }
      
      console.log('7️⃣ Usuario aprobado, redirigiendo...');
      // Redirigimos al root ya que App.tsx maneja el dashboard ahí
      navigate('/');
      
    } catch (error: any) {
      console.error('🔥 Error en login:', error.code, error.message);
      setError(error.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (phone && !/^\d+$/.test(phone)) {
      setError('El número de teléfono debe contener solo dígitos numéricos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, { 
        nombre: name.toUpperCase(), 
        apellido: lastName.toUpperCase(), 
        telefono: phone
      });
      
      setSuccess('¡Registro recibido con éxito! Su solicitud ha sido enviada al Administrador Principal. Por normas de seguridad corporativa, deberá esperar a que su identidad sea validada para poder ingresar.');
      setName(''); setLastName(''); setPhone(''); setEmail(''); setPassword('');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess('Se ha enviado un correo electrónico para restablecer su contraseña. Por favor, revise su bandeja de entrada y spam.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud de recuperación.');
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
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn border ${isPendingLogin ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-amber-100 shadow-lg' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
              {isPendingLogin ? <LucideClock size={24} className="shrink-0 animate-pulse text-amber-600"/> : <LucideShieldAlert size={20} className="shrink-0"/>}
              <div className="flex-1">
                {error}
                {isPendingLogin && (
                    <p className="mt-1 text-[9px] font-black opacity-60 uppercase italic tracking-widest border-t border-amber-200 pt-1">
                        Estatus: Pendiente de Aprobación
                    </p>
                )}
              </div>
            </div>
          )}

          {success ? (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-emerald-50 border-2 border-emerald-100 text-emerald-600 p-6 rounded-[2rem] text-sm font-bold flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner animate-pulse"><LucideShieldCheck size={32}/></div>
                    <div>
                        <p className="font-black uppercase tracking-tighter text-lg leading-tight mb-2">Solicitud Procesada</p>
                        <p className="text-xs leading-relaxed opacity-80">{success}</p>
                    </div>
                </div>
                <button 
                    onClick={() => { setMode('LOGIN'); setSuccess(''); setError(''); setIsPendingLogin(false); }}
                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                >
                    <LucideArrowLeft size={18}/> Volver al Inicio
                </button>
            </div>
          ) : (
            <>
              {mode === 'FORGOT' ? (
                <form onSubmit={handleForgotPassword} className="space-y-4 animate-fadeIn">
                  <div className="text-center mb-6">
                    <LucideKeyRound size={48} className="mx-auto text-blue-600 mb-4 opacity-20"/>
                    <h3 className="font-black uppercase italic text-slate-800">Recuperación de Acceso</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Restablecimiento vía Firebase Auth</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Correo Electrónico de su Cuenta</label>
                    <input 
                        type="email" 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="usuario@empresa.com"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><LucideShieldQuestion size={18}/> Enviar Enlace de Recuperación</>}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setMode('LOGIN'); setError(''); }}
                    className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 py-2"
                  >
                    Cancelar y Volver
                  </button>
                </form>
              ) : (
                <form onSubmit={mode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
                  
                  {mode === 'REGISTER' && (
                    <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre</label>
                        <input 
                          type="text" 
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100"
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
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          placeholder="Ej: Pérez"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Teléfono (opcional)</label>
                        <input 
                          type="tel" 
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ej: 2612345678"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Correo Electrónico</label>
                    <input 
                      type="email" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center ml-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
                      {mode === 'LOGIN' && (
                        <button 
                            type="button"
                            onClick={() => setMode('FORGOT')}
                            className="text-[8px] font-black text-blue-600 uppercase hover:underline"
                        >
                            ¿Olvidó su clave?
                        </button>
                      )}
                    </div>
                    <input 
                      type="password" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
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
              )}
              
              <div className="pt-6 border-t border-slate-100 text-center">
                {mode === 'LOGIN' ? (
                  <button 
                    onClick={() => { setMode('REGISTER'); setError(''); setIsPendingLogin(false); }}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    ¿No tienes cuenta? <span className="text-blue-600">Regístrate aquí</span>
                  </button>
                ) : mode === 'REGISTER' ? (
                  <button 
                    onClick={() => { setMode('LOGIN'); setError(''); setIsPendingLogin(false); }}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <LucideArrowLeft size={14}/> Volver al Inicio de Sesión
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="absolute bottom-8 text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] italic">
        Authorized Access Only • FleetPro v37.0-SECURED
      </p>
    </div>
  );
};