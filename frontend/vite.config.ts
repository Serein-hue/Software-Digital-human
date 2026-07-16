import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  build: {
    outDir: '../docs/app',
    emptyOutDir: true,
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
    },
  },
})
