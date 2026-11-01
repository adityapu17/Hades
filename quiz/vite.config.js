import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served by Hades at /quiz/ (Cloudflare static assets).
// The root `npm run build` builds Hades first, then this app into ../dist/quiz.
export default defineConfig({
  plugins: [react()],
  base: '/quiz/',
  build: { outDir: '../dist/quiz', emptyOutDir: true },
})
