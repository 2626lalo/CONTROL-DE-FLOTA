import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from '../context/FleetContext';

export const LoginScreen = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);
  
  const navigate = useNavigate();
  const { users, login, register } = useFleet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const emailLower = email.toLowerCase().trim();

    if (isRegister) {
      // LÓGICA DE REGISTRO
      if (!name || !lastName || !email || !password) {
        setMessage({ text: 'Todos los campos son obligatorios', type: 'error' });
        return;
      }
      
      const result = await register(emailLower, password, name, lastName, "S/D");
      if (result.success) {
        setMessage({ 
          text: 'Cuenta creada con éxito. Aguarde a que el administrador autorice su acceso y asigne su rango de usuario.', 
          type: 'success' 
        });
        setIsRegister(false);
        setPassword('');
      } else {
        setMessage({ text: result.message || 'Error al registrar usuario', type: 'error' });
      }
    } else {
      // LÓGICA DE LOGIN
      const userFound = users.find(u => u.email.toLowerCase() === emailLower);
      
      // Acceso Maestro (Bypass)
      if (emailLower === 'alewilczek@gmail.com' && password === 'Joaquin4') {
        await login(emailLower, password);
        navigate('/dashboard');
        return;
      }

      if (!userFound) {
        setMessage({ text: 'El usuario no existe. Regístrese para solicitar acceso.', type: 'info' });
        setIsRegister(true);
        return;
      }

      if (!userFound.approved) {
        setMessage({ 
          text: 'Su cuenta está pendiente de aprobación por el administrador. Por favor, aguarde a que se le asigne un rango.', 
          type: 'info' 
        });
        return;
      }

      const result = await login(emailLower, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setMessage({ text: 'Credenciales incorrectas. Verifique sus datos.', type: 'error' });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                {isRegister ? 'SOLICITAR ACCESO' : 'CONTROL DE FLOTA'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise System</p>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-2xl text-[11px] font-bold text-center border ${
            message.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 
            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
            'bg-blue-50 border-blue-100 text-blue-600'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Nombre" 
                className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-blue-50 font-bold text-xs uppercase"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input 
                type="text" 
                placeholder="Apellido" 
                className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-blue-50 font-bold text-xs uppercase"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          )}

          <input 
            type="email" 
            placeholder="Email Corporativo" 
            className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-blue-50 font-bold text-xs"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input 
            type="password" 
            placeholder="Contraseña" 
            className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-blue-50 font-bold text-xs"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">
            {isRegister ? 'ENVIAR SOLICITUD' : 'INGRESAR'}
          </button>

          <button 
            type="button"
            onClick={() => { setIsRegister(!isRegister); setMessage(null); }}
            className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors pt-2"
          >
            {isRegister ? '¿Ya tiene cuenta? Inicie Sesión' : '¿No tiene cuenta? Regístrese aquí'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mb-2">Acceso de Prueba</p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-600">admin@controlflota.com</p>
                <p className="text-[10px] font-black text-blue-600">Test123!</p>
            </div>
        </div>
      </div>
    </div>
  );
};