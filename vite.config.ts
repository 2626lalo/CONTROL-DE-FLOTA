import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022'
    // ¡NO necesitamos rollupOptions! Vite detecta automáticamente src/main.tsx
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services')
    }
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts', 'lucide-react', 'react-router-dom']
  }
})
