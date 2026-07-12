import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DatHex 2.0',
        short_name: 'DatHex',
        description: 'Windows Winget Mass Upgrader',
        theme_color: '#0f111a',
        background_color: '#0f111a',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn.iconscout.com/icon/free/png-256/free-terminal-3-461623.png',
            sizes: '256x256',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
