import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/claude-certified-architect/' : '/',
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
}))
