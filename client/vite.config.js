import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-ui';
            if (id.includes('jspdf') || id.includes('xlsx')) return 'vendor-export';
            if (id.includes('axios')) return 'vendor-api';
            return 'vendor';
          }
        }
      }
    }
  }
})

