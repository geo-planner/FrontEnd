import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // wymagane żeby Vite był dostępny spoza kontenera
    watch: {
      usePolling: true,  // wymagane na Windows — Docker nie przekazuje zdarzeń inotify
    },
  },
})
