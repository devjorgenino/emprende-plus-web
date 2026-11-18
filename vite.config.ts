import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api/bcv': {
        target: 'https://bcv.today',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bcv/, ''),
      },
      '/api/dolarapi': {
        target: 'https://ve.dolarapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dolarapi/, ''),
      },
      '/api/dolarflow': {
        target: 'https://dolarflow.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dolarflow/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});