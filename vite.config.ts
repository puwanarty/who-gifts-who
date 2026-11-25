/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Served as a GitHub Pages project page at /who-gifts-who/.
  base: '/who-gifts-who/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
