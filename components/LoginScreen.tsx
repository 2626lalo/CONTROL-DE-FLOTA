import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useFirebase } from '../context/FirebaseContext';
import { 
  LucideLock, LucideMail, LucideShieldAlert, LucideLoader2, 
  LucideChevronRight, LucideInfo, LucideArrowLeft, LucideKeyRound,
  LucideUserPlus, LucideUser, LucideSmartphone, LucideArrowRight
} from 'lucide-react';

export const LoginScreen = () => {
  const [mode, setMode] = useState<'LOGIN' | 'FORGOT' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para Registro
  const [regNombre, setRegNombre] = useState('');
  const [regApellido, setRegApellido] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const auth = getAuth();
  const { signUp, user: firebaseUser } = useFirebase();
  const MASTER_ADMIN = 'alewilczek@gmail.com';

  // Verificación reactiva si el AuthGuard detecta un estatus no autorizado
  useEffect(() => {
    if (firebaseUser && mode === 'LOGIN' && !loading) {
      const checkStatus = async () => {
        if (firebaseUser.email === MASTER_ADMIN) return;
        const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (!docSnap.exists()) {
          setError('Acceso Denegado: Su usuario no se encuentra registrado en el sistema.');
          await signOut(auth);
        } else {
            const data = docSnap.data();
            if (data.estado === 'bloqueado' || data.estado === 'inactivo' || data.estado === 'suspendido') {
                setError(`Su estatus de acceso ha cambiado a [${data.estado.toUpperCase()}]. Por favor, comuníquese con un administrador.`);
                await signOut(auth);
            } else if (data.approved !== true) {
                setError('Su solicitud aún se encuentra pendiente de revisión por el administrador.');
                await signOut(auth);
            }
        }
      };
      checkStatus();
    }
  }, [firebaseUser, mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const isMaster = email.toLowerCase() === MASTER_ADMIN.toLowerCase();

      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists() && !isMaster) {
        setError('Acceso Denegado: Su usuario no se encuentra registrado.');
        await signOut(auth);
        setLoading(false);
        return;
      }
      
      if (!isMaster) {
          const data = userDoc.data();
          if (data?.estado !== 'activo' || data?.approved !== true) {
             const statusMsg = data?.estado === 'bloqueado' || data?.estado === 'inactivo' 
                ? `Su estatus de acceso ha cambiado a [${data.estado.toUpperCase()}]. Por favor, comuníquese con un administrador.`
                : 'Su solicitud aún se encuentra pendiente de revisión.';
             setError(statusMsg);
             await signOut(auth);
             setLoading(false);
             return;
          }
      }
      
      navigate('/');
      
    } catch (error: any) {
      console.error('🔥 Login Error:', error.code);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Credenciales incorrectas o el usuario no existe.');
      } else {
        setError('Error de comunicación con el servidor de seguridad.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
        await signUp(email, password, {
            nombre: regNombre,
            apellido: regApellido,
            telefono: regPhone
        });
        await signOut(auth);
        setInfo('Solicitud de registro enviada con éxito. Aguarde la autorización del administrador.');
        setMode('LOGIN');
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            setError('Este correo ya está registrado.');
        } else {
            setError('Error al procesar el registro. Intente nuevamente.');
        }
    } finally {
        setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo('Protocolo de recuperación enviado. Revise su bandeja de entrada.');
      setTimeout(() => setMode('LOGIN'), 6000);
    } catch (error: any) {
      setError('No se pudo procesar el restablecimiento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-900/10 rounded-full blur-[120px]"></div>

      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn border border-white/10 relative z-10 flex flex-col">
        <div className="bg-slate-900 p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-2xl shadow-xl">FP</div>
          <h2 className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none">FleetPro Enterprise</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Gestión de Personal Autorizado</p>
        </div>

        <div className="p-10 space-y-8 flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-start gap-3 animate-fadeIn">
              <LucideShieldAlert className="text-rose-600 shrink-0 mt-0.5" size={20}/>
              <p className="text-[11px] font-bold text-rose-700 leading-relaxed uppercase">{error}</p>
            </div>
          )}

          {info && (
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-start gap-3 animate-fadeIn">
              <LucideInfo className="text-blue-600 shrink-0 mt-0.5" size={20}/>
              <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase">{info}</p>
            </div>
          )}

          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Corporativo</label>
                  <div className="relative">
                    <LucideMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                    <input type="email" placeholder="usuario@cookins.ar" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading}/>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
                    <button type="button" onClick={() => setMode('FORGOT')} className="text-[9px] font-black text-blue-600 uppercase hover:underline">Recuperar</button>
                  </div>
                  <div className="relative">
                    <LucideLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                    <input type="password" placeholder="••••••••" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading}/>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95">
                {loading ? <LucideLoader2 className="animate-spin" size={20}/> : <>INGRESAR AL SISTEMA <LucideChevronRight size={18}/></>}
              </button>
            </form>
          )}

          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre</label>
                  <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 text-sm uppercase" value={regNombre} onChange={e => setRegNombre(e.target.value.toUpperCase())} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Apellido</label>
                  <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 text-sm uppercase" value={regApellido} onChange={e => setRegApellido(e.target.value.toUpperCase())} required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Corporativo</label>
                <input type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Teléfono</label>
                <input type="tel" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 text-sm" value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nueva Contraseña</label>
                <input type="password" placeholder="Mínimo 8 caracteres" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all">
                {loading ? <LucideLoader2 className="animate-spin" size={20}/> : <>ENVIAR SOLICITUD <LucideArrowRight size={18}/></>}
              </button>
            </form>
          )}

          {mode === 'FORGOT' && (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-2">
                <LucideKeyRound className="mx-auto text-blue-600 mb-4" size={48}/>
                <h3 className="text-lg font-black text-slate-800 uppercase italic">Recuperar Acceso</h3>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Registrado</label>
                <input type="email" placeholder="usuario@cookins.ar" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading}/>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                {loading ? <LucideLoader2 className="animate-spin" size={20}/> : 'ENVIAR CÓDIGO'}
              </button>
            </form>
          )}
        </div>

        <div className="bg-slate-50 p-8 border-t border-slate-100 space-y-4">
           {mode !== 'REGISTER' ? (
             <button type="button" onClick={() => { setMode('REGISTER'); setError(''); setInfo(''); }} className="w-full py-4 bg-white border border-blue-200 text-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                <LucideUserPlus size={16}/> ¿No tiene cuenta? Registrarse
             </button>
           ) : (
             <button type="button" onClick={() => { setMode('LOGIN'); setError(''); setInfo(''); }} className="w-full py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">
                <LucideArrowLeft size={16}/> Volver al Login
             </button>
           )}
           <p className="text-[9px] font-bold text-slate-400 uppercase text-center tracking-widest opacity-60">
             Cloud Enterprise FleetPro v37.6
           </p>
        </div>
      </div>
    </div>
  );
};