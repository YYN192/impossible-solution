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
  // Other agents' worktrees live inside this folder; don't reload on their edits.
  server: { watch: { ignored: ['**/.claude/worktrees/**'] } },
  build: {
    rollupOptions: {
      input: {
        menu: resolve(projectRoot, "index.html"),
        mission: resolve(projectRoot, "mission.html"),
        hub: resolve(projectRoot, "hub.html"),
        console: resolve(projectRoot, "console.html"),
      },
    },
  },
  test: {
    // Threads avoid fork-pool temporary-file renames blocked by Windows sandboxes.
    pool: 'threads',
    maxWorkers: 4,
    environment: 'jsdom',
    passWithNoTests: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
