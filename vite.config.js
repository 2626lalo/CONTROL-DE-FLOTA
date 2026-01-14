import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020'  // Mejor compatibilidad
    // ¡ELIMINA el bloque 'rollupOptions' completo!
  },
  publicDir: 'public'
})
