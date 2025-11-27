import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Écoute sur toutes les interfaces réseau
    port: 5173, // Port du frontend
    strictPort: true, // Force l'utilisation de ce port
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Backend Spring Boot
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    host: '0.0.0.0', // Pour le mode preview (build)
    port: 5173
  }
});