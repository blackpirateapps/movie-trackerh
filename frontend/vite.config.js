import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This tells Vite to build the project into a 'dist' folder
  // at the root of your monorepo, which is what Vercel expects.
  build: {
    outDir: '../dist'
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})

