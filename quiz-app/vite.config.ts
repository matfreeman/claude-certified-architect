import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/claude-certified-architect/',
  server: { port: 5173 }
})
