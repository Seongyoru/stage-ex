import { defineConfig } from 'vite';

// Relative base so the same build works on GitHub Pages project sites
// (https://<user>.github.io/<repo>/) and when opened from any sub-path.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
