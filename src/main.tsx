// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Capturar errores globales
window.addEventListener('error', (event) => {
  console.error('Error global capturado:', event.error);
  // Si es el error de Google AI, prevenimos que la app se caiga
  if (event.error?.message?.includes('API Key')) {
    console.warn('Google AI API Key no configurada. La aplicación continuará sin esta funcionalidad.');
    event.preventDefault(); // Esto previene que el error se propague y rompa la app
  }
});

// También capturar promesas rechazadas no manejadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada no manejada:', event.reason);
  // Si es un error de Google AI, lo manejamos
  if (event.reason?.message?.includes('API Key')) {
    console.warn('Google AI API Key no configurada (en promesa).');
    event.preventDefault(); // Previene que el error se propague
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
