/// <reference types="vitest/config" />
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: '/impossible-solution/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        menu: resolve(projectRoot, "index.html"),
        hub: resolve(projectRoot, "hub.html"),
        console: resolve(projectRoot, "console.html"),
      },
    },
  },
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
  },
})
