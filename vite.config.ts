import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    // Configuración CRÍTICA: Especifica los puntos de entrada
    rollupOptions: {
      input: {
        main: './index.html', // Tu HTML está en raíz
        app: './index.tsx'    // Tu punto de entrada está en raíz
      }
    }
  },
  // También especifica la carpeta pública si usas assets
  publicDir: 'public'
})
