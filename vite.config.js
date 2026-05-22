import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true
    },
    cors: true,
    headers: {
      'Cache-Control': 'no-store'
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'react/jsx-runtime'],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Force cache busting with timestamps
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: (assetInfo) => {
          // Keep images in their original structure with hash
          if (/\.(png|jpe?g|svg|gif|webp)$/.test(assetInfo.name)) {
            return `assets/images/[name]-[hash]-${Date.now()}[extname]`;
          }
          return `assets/[name]-[hash]-${Date.now()}[extname]`;
        },
        manualChunks: undefined
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    // Copy public folder properly
    copyPublicDir: true
  }
})
