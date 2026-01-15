import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// CONFIGURACIÓN EXPLÍCITA Y FORZADA
export default defineConfig({
  plugins: [
    react({
      // Forzar el uso del plugin React para TypeScript
      jsxRuntime: 'automatic',
      babel: {
        parserOpts: {
          plugins: ['typescript', 'jsx']
        }
      }
    })
  ],
  base: '/',
  
  // Configuración explícita para TypeScript
  esbuild: {
    jsx: 'automatic',
    loader: 'tsx'
  },
  
  // Forzar resolución de TypeScript
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  
  build: {
    outDir: 'dist',
    target: 'es2022',
    
    // Configuración Rollup explícita
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
})
