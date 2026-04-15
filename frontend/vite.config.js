import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: process.env.PORT ? Number(process.env.PORT) : 4173,
    host: true,
    allowedHosts: ['frontend-production-925d3.up.railway.app'],
  }
})
