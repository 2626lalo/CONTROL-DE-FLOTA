import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': JSON.stringify(process.env)
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'tanstack-vendor': ['@tanstack/react-query'],
          'charts-vendor': ['recharts'],
          'maps-vendor': ['@react-google-maps/api'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable'],
          'utils-vendor': ['date-fns', 'xlsx', 'axios']
        }
      }
    }
  }
});