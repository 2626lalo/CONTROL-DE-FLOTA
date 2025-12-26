import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',  // O 'es2019' para mayor compatibilidad
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
