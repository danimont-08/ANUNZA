import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        ws: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Función (compatible con rolldown/Vite 8): separa vendors para mejor caché
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]react(-dom|-router-dom)?[\\/]/.test(id)) return 'vendor-react';
            if (id.includes('@supabase')) return 'vendor-supabase';
          }
        },
      },
    },
    // Advertir si algún chunk supera 600 KB
    chunkSizeWarningLimit: 600,
  },
})
