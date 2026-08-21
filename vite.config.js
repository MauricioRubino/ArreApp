import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { apiDevServer } from './vite-api-plugin.js'

// Las variables de .env.local (NOTION_TOKEN, etc.) no llevan prefijo
// VITE_ a propósito: se cargan acá para que las funciones de api/ las
// vean en desarrollo, y nunca llegan al bundle del navegador.
try {
  process.loadEnvFile('.env.local')
} catch {
  // Sin .env.local se usan las variables del entorno, si las hay.
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevServer()],
})
