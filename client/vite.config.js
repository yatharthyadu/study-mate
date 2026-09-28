import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // All /api requests are proxied to the Express backend (port 5000)
    proxy: { '/api': 'http://localhost:5000' },
  },
});
