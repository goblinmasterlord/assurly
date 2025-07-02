import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Make environment variables available
    __VITE_API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:3000'),
  }
})
