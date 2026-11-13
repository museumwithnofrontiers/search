import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { defineViewerConfig } from '@museumwnf/viewer-core/vite'

// The shape every website's vite.config.js needs — the data-package alias,
// the optimizeDeps split that keeps a single copy of Vue in dev, and the
// Vitest environment — from viewer-core's own `./vite` entry.
const viewerConfig = defineViewerConfig({
  dataPackage: '@museumwnf/__DATASET__-data',
  plugins: [vue()],
})

export default defineConfig({
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets
  // BASE_PATH accordingly. Local dev and root deployments use /.
  base: process.env.BASE_PATH ?? '/',
  ...viewerConfig,
})