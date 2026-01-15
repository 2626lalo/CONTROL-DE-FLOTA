import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Manejo de errores globales para Google AI
window.addEventListener('error', (event) => {
  console.error('Error global:', event.error);
  
  // Si es el error de Google AI API Key, prevenimos que la app se caiga
  if (event.error?.message?.includes('API Key')) {
    console.warn('Google AI no está configurado. Continuando sin esta funcionalidad.');
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada no manejada:', event.reason);
  
  if (event.reason?.message?.includes('API Key')) {
    console.warn('Google AI no está configurado (en promesa).');
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
