import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  // Set base path for GitHub Pages - update 'photo-app' to match your repository name
  base: process.env.NODE_ENV === 'production' ? '/photo-app/' : '/',
  
  plugins: [react(), basicSsl()],
  
  server: {
    host: '0.0.0.0', // Allow access from other devices on network
    port: 8443,
    https: true
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
