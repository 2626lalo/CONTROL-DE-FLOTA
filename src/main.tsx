import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Manejar errores globales de Google AI y otros
window.addEventListener('error', (event) => {
  console.error('Error global capturado:', event.error);
  
  // Si es un error de Google AI API Key, prevenimos que rompa la app
  if (event.error?.message?.includes('API Key') || 
      event.error?.message?.includes('@google/genai') ||
      event.error?.message?.includes('GoogleGenerativeAI')) {
    console.warn('Google AI no está configurado o hay un error con la API. La aplicación continuará sin funcionalidades de IA.');
    event.preventDefault(); // Evita que el error se propague
  }
});

// También atrapar promesas rechazadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rechazada:', event.reason);
  
  if (event.reason?.message?.includes('API Key') || 
      event.reason?.message?.includes('@google/genai')) {
    console.warn('Error de Google AI en promesa rechazada');
    event.preventDefault();
  }
});

// Inicializar React
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
