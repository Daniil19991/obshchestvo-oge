import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// VITE_BASE — адрес, по которому открывается сайт. Для GitHub Pages это /<имя-репозитория>/
// (его подставляет .github/workflows/deploy.yml), для своего домена — просто /.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
})
