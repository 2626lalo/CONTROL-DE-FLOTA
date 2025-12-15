import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno correctamente
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // CONFIGURACIÓN DE BUILD PARA NETLIFY (IMPORTANTE)
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            pdf: ['jspdf', 'jspdf-autotable'],
          }
        }
      }
    },
    
    // Servidor de desarrollo
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    
    plugins: [react()],
    
    // Variables de entorno (usa VITE_ prefix para Netlify)
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    
    // Resolución de imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),  // CORREGIDO: apunta a ./src
        '@components': path.resolve(__dirname, './src/components'),
        '@services': path.resolve(__dirname, './src/services'),
        '@types': path.resolve(__dirname, './src/types'),
      }
    },
    
    // Optimizaciones para Netlify
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      exclude: ['@google/genai'],
    },
  };
});
