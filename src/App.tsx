// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-800">
            CONTROL DE FLOTA VEHICULAR
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            Sistema de Gestión de Flota
          </h2>
          <p className="text-slate-600 mb-4">
            Bienvenido al sistema de control y gestión de flota vehicular.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800">Vehículos</h3>
              <p className="text-blue-600 text-sm">Gestión de unidades</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800">Mantenimiento</h3>
              <p className="text-green-600 text-sm">Control de servicios</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-medium text-purple-800">Reportes</h3>
              <p className="text-purple-600 text-sm">Análisis y estadísticas</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Nota:</strong> La aplicación está funcionando correctamente en Netlify.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="mt-12 border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 Control de Flota - Sistema de Gestión Vehicular</p>
          <p className="mt-2">Desplegado exitosamente en Netlify</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
