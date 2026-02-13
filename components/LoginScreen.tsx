import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Obtener usuarios de localStorage
      const users = JSON.parse(localStorage.getItem('fp_users') || '[]');
      console.log('Usuarios en localStorage:', users);
      
      // Buscar usuario por email
      const user = users.find((u: any) => u.email === email);
      console.log('Usuario encontrado:', user);
      
      // Validar (contraseña fija para pruebas)
      if (user && password === 'Test123!') {
        console.log('Login exitoso');
        localStorage.setItem('fp_currentUser', JSON.stringify(user));
        // Nota: Para que el AuthGuard detecte el cambio sin recargar, 
        // idealmente se debería llamar a la función login del contexto.
        // Forzamos una recarga o navegación para asegurar que el estado se inicialice.
        window.location.href = '/';
      } else {
        setError('Email o contraseña incorrectos');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleLogin} className="bg-white p-12 rounded-3xl shadow-xl w-96">
        <h2 className="text-3xl font-black mb-8 text-center">CONTROL DE FLOTA</h2>
        
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}
        
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full p-4 mb-4 border rounded-xl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input 
          type="password" 
          placeholder="Contraseña" 
          className="w-full p-4 mb-6 border rounded-xl"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-black hover:bg-blue-700 transition-all"
        >
          INGRESAR
        </button>
        
        <p className="text-xs text-center mt-4 text-slate-400">
          Usá: admin@controlflota.com / Test123!
        </p>
      </form>
    </div>
  );
};