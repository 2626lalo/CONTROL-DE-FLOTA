import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
    }
  },
  server: {
    port: 3000,
    host: true,
  },
  // Esto asegura que las variables de entorno estén disponibles
  define: {
    'import.meta.env.VITE_GOOGLE_AI_API_KEY': JSON.stringify(process.env.VITE_GOOGLE_AI_API_KEY || '')
  }
});
