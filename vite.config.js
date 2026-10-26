import { defineConfig } from 'vite'
import { execSync } from 'child_process'

function generateChangelog() {
  try {
    execSync('node scripts/generate-changelog.js', { stdio: 'inherit' })
  } catch (e) {
    console.warn('Failed to generate changelog:', e.message)
  }
}

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/index.html',
        login: 'src/pages/login.html',
        article: 'src/pages/article.html',
        category: 'src/pages/category.html',
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  plugins: [
    {
      name: 'generate-changelog',
      buildStart() {
        generateChangelog()
      }
    }
  ]
})