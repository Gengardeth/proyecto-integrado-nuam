// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'   // ← usa el plugin SWC

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../static/frontend',
    emptyOutDir: true,
    manifest: false,
    rollupOptions: {
      input: 'src/main.jsx',                  // ← sin la “/” inicial
      output: {
        entryFileNames: 'assets/index.js',
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name].js'
      }
    }
  },
  server: { port: 5173, strictPort: true }
})
