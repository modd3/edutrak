import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Ensure Vite treats this as a SPA (single-page application)
  appType: 'spa',
  
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },

  // Preview server config (used by `npm run preview`)
  preview: {
    port: 4173,
    host: true,
  },
});
