import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  },
  server: {
    port: 3000,
    host: true,
  },
  // Hacer que las variables de entorno estén disponibles en el cliente
  define: {
    'process.env': {},
    'import.meta.env.VITE_GOOGLE_AI_API_KEY': JSON.stringify(process.env.VITE_GOOGLE_AI_API_KEY || '')
  }
});
