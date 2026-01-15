import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  
  // IMPORTANTE: Configurar explícitamente el root
  root: '.',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022', // Usa el mismo target que tu script
    
    // CONFIGURACIÓN CRÍTICA: Puntos de entrada personalizados
    rollupOptions: {
      input: {
        // Esto le dice a Vite: "usa mi index.html y mi index.tsx"
        main: path.resolve(__dirname, 'index.html'),
        entry: path.resolve(__dirname, 'index.tsx') // Punto de entrada React
      },
      
      // Asegurar que React sepa que está en la raíz
      preserveEntrySignatures: 'strict'
    }
  },
  
  // Ayuda a Vite a encontrar tus componentes
  resolve: {
    alias: {
      // Si tienes componentes en carpeta components
      '@components': path.resolve(__dirname, 'components'),
      '@services': path.resolve(__dirname, 'services')
    }
  },
  
  // Optimización para tu proyecto
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts']
  }
})
