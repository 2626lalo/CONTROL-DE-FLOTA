
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'  // Importa App.tsx de la misma carpeta
import './index.css'     // Importa los estilos

// Esto es importante: encuentra el div con id="root"
const rootElement = document.getElementById('root')

// Si no encuentra el elemento, muestra error
if (!rootElement) {
  throw new Error('No se encontró el elemento con id="root" en index.html')
}

// Monta la aplicación React
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
