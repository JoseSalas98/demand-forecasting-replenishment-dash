import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './': rutas relativas para servir el sitio desde /<repo>/ en GitHub Pages
export default defineConfig({
  base: './',
  plugins: [react()],
});
