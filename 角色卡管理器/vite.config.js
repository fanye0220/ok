import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 相对路径，适合GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3000
  }
});