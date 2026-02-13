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
      // Lógica de Registro
      if (!name || !lastName || !email || !password) {
        setMessage({ text: 'Todos los campos son obligatorios', type: 'error' });
        return;
      }
      
      const result = await register(emailLower, password, name, lastName, "S/D");
      if (result.success) {
        setMessage({ 
          text: 'Cuenta creada con éxito. Aguarde a que el administrador autorice su acceso y asigne su rango.', 
          type: 'success' 
        });
        setIsRegister(false);
        setPassword(''); // Limpiar pass por seguridad
      } else {
        setMessage({ text: result.message || 'Error al registrar', type: 'error' });
      }
    } else {
      // Lógica de Login
      const user = users.find(u => u.email.toLowerCase() === emailLower);
      
      // Caso especial: Admin Maestro
      if (emailLower === 'alewilczek@gmail.com' && password === 'Joaquin4') {
        await login(emailLower, password);
        navigate('/');
        return;
      }

      if (!user) {
        setMessage({ text: 'El usuario no existe. Regístrese para solicitar acceso.', type: 'error' });
        return;
      }

      if (!user.approved && user.email !== 'alewilczek@gmail.com') {
        setMessage({ text: 'Su cuenta aún no ha sido aprobada por el administrador.', type: 'info' });
        return;
      }

      const result = await login(emailLower, password);
      if (result.success) {
        navigate('/');
      } else {
        setMessage({ text: 'Credenciales incorrectas.', type: 'error' });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-lg">FP</div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                {isRegister ? 'Solicitud de Acceso' : 'Control de Flota'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise Management System</p>
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

          <button type="submit" className="w-full bg-slate-900 hover:bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">
            {isRegister ? 'Enviar Registro' : 'Ingresar al Sistema'}
          </button>

          <button 
            type="button"
            onClick={() => { setIsRegister(!isRegister); setMessage(null); }}
            className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors pt-2"
          >
            {isRegister ? '¿Ya tiene cuenta? Inicie Sesión' : '¿No tiene cuenta? Regístrese aquí'}
          </button>
        </form>

        {!isRegister && (
            <div className="mt-8 pt-8 border-t border-slate-100">
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mb-2">Acceso Administrador Principal</p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-600">alewilczek@gmail.com</p>
                    <p className="text-[10px] font-black text-blue-600">Joaquin4</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};