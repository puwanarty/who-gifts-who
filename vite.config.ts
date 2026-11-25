/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Served as a GitHub Pages project page at /who-gifts-who/.
  base: '/who-gifts-who/',
  plugins: [
    react(),
    // Precaches the build and fonts so a refresh still works if the venue's internet drops.
    // The injected plain registration script never reloads the page, so an update
    // deployed before the party takes effect on the next open, not mid-event.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
