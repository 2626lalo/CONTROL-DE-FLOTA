import React from 'react'
import ReactDOM from 'react-dom/client'
import { TestComponent } from './test'  // ← Importar componente de prueba
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestComponent />
  </React.StrictMode>
)
