import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
    }
  },
  optimizeDeps: {
    include: ['crypto-browserify']
  },
  build: {
    rollupOptions: {
      external: [
        'kubo-rpc-client',
        'fs', 
        'path',
        'stream',
        'events',
        'vm'
      ],
      output: {
        globals: {
          'kubo-rpc-client': 'KuboRpcClient',
          'fs': 'fs',
          'path': 'path',
          'stream': 'stream',
          'events': 'events',
          'vm': 'vm'
        }
      }
    }
  }
})