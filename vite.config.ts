/// <reference types="vitest/config" />
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  // GitHub Pages serves /impossible-solution/; Vercel builds with BASE_PATH=/.
  base: process.env.BASE_PATH ?? '/impossible-solution/',
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
    // Agent worktrees and linked skills live under .claude/ and bring their own tests.
    exclude: [...configDefaults.exclude, '.claude/**'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
