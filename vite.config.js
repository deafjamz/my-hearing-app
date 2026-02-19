import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Stamps a unique build version into sw.js so the cache busts on every deploy.
// Replaces __BUILD_VERSION__ placeholder with a short timestamp hash.
function swVersionPlugin() {
  return {
    name: 'sw-version',
    writeBundle(options) {
      const outDir = options.dir || path.resolve(__dirname, 'dist');
      const swPath = path.resolve(outDir, 'sw.js');
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8');
        const version = Date.now().toString(36);
        content = content.replace('__BUILD_VERSION__', version);
        fs.writeFileSync(swPath, content);
        console.log(`[sw-version] Stamped sw.js with cache version: soundsteps-${version}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), swVersionPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-motion': ['framer-motion'],
          'vendor-charts': ['recharts'],
          'vendor-router': ['react-router-dom'],
        }
      }
    }
  }
})