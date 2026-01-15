import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // IMPORTANTE: Para Cloud Run, la base es la raíz
  
  // Configuración de construcción CRÍTICA
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // Desactiva sourcemaps para producción
    
    // Configuración de Rollup para encontrar el punto de entrada
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  
  // Configuración del servidor de desarrollo
  server: {
    port: 3000,
    open: true
  },
  
  // Configuración de resolución de rutas
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
