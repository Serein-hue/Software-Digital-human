import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  build: {
    outDir: '../docs/app',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        operation: resolve(__dirname, 'operation/index.html'),
        bigscreen: resolve(__dirname, 'bigscreen/index.html'),
        'digital-human': resolve(__dirname, 'digital-human/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/tts': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
