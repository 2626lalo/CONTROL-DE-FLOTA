import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Usuario principal que DEBE existir siempre
  const MAIN_USER = {
    id: "main-admin",
    email: "alewilczek@gmail.com",
    nombre: "Alejandro",
    apellido: "Wilczek",
    role: "ADMIN",
    approved: true,
    estado: "activo"
  };

  // Al cargar la pantalla, asegurar que el usuario principal existe
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('fp_users') || '[]');
    const mainUserExists = users.some((u: any) => u.email === MAIN_USER.email);
    
    if (!mainUserExists) {
      console.log('Usuario principal no encontrado. Creándolo...');
      users.push(MAIN_USER);
      localStorage.setItem('fp_users', JSON.stringify(users));
      console.log('Usuario principal creado:', MAIN_USER);
    } else {
      console.log('Usuario principal ya existe');
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const users = JSON.parse(localStorage.getItem('fp_users') || '[]');
      console.log('Usuarios:', users);

      const user = users.find((u: any) => 
        u.email?.trim().toLowerCase() === email.trim().toLowerCase()
      );
      console.log('Usuario encontrado:', user);

      if (!user) {
        setError('Usuario no encontrado');
        return;
      }

      // CASO ESPECIAL: Usuario principal
      if (email.trim().toLowerCase() === 'alewilczek@gmail.com') {
        if (password === 'Joaquin4') {
          console.log('✅ Login exitoso - Administrador principal');
          localStorage.setItem('fp_currentUser', JSON.stringify(user));
          // Forzamos recarga para que el FleetContext tome el nuevo usuario del localStorage
          window.location.href = '/dashboard';
        } else {
          setError('❌ Contraseña incorrecta para el administrador. Debe ser Joaquin4');
        }
        return;
      }

      // CASO GENERAL: otros usuarios
      if (password === 'Test123!') {
        console.log('✅ Login exitoso - Usuario secundario');
        localStorage.setItem('fp_currentUser', JSON.stringify(user));
        // Forzamos recarga para que el FleetContext tome el nuevo usuario del localStorage
        window.location.href = '/dashboard';
      } else {
        setError('❌ Contraseña incorrecta');
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
          autoComplete="username"
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
          Usá: alewilczek@gmail.com / Joaquin4
        </p>
      </form>
    </div>
  );
};