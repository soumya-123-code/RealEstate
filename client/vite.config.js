import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Development → local API. Production preview can still override via VITE_SOCKET_URL.
  const defaultLocalApi = 'http://localhost:8800'
  const defaultProdApi = 'https://api.suretreaven.com'

  const apiTarget =
    env.VITE_SOCKET_URL ||
    (mode === 'production' ? defaultProdApi : defaultLocalApi)

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Used when VITE_API_URL is relative (e.g. /api).
        // With an absolute VITE_API_URL the browser calls the API host directly.
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: apiTarget.startsWith('https'),
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
          secure: apiTarget.startsWith('https'),
        },
        // Socket.IO must be proxied to the API server during local development.
        // Without this, the client connects to Vite (5173) instead of Socket.IO (8800).
        '/socket.io': {
          target: apiTarget,
          changeOrigin: true,
          secure: apiTarget.startsWith('https'),
          ws: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['react-icons', 'framer-motion'],
            maps: ['leaflet', 'react-leaflet'],
          },
        },
      },
    },
  }
})
