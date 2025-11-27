import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Custom plugin to fix wagmi safe connector typo
function fixSafeGlobalThisImports() {
  return {
    name: 'fix-safe-globalThis-imports',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id.startsWith('@safe-globalThis/')) {
        const fixedId = id.replace('@safe-globalThis/', '@safe-global/')
        return this.resolve(fixedId, undefined, { skipSelf: true })
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    fixSafeGlobalThisImports(),
    react(),
    nodePolyfills({
      // Enable polyfills for specific globals and modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Enable polyfills for these Node.js modules
      protocolImports: true,
    }),
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      util: 'util/',
      // Fix wagmi safe connector typos
      '@safe-globalThis/safe-apps-provider': '@safe-global/safe-apps-provider',
      '@safe-globalThis/safe-apps-sdk': '@safe-global/safe-apps-sdk',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined,
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
  },
})