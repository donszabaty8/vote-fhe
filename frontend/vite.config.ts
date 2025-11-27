import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Plugin to stub out safe-global packages that have typos in wagmi
function stubSafeGlobal() {
  const stubModule = `
    export default {};
    export const SafeAppProvider = class {};
  `;

  return {
    name: 'stub-safe-global',
    resolveId(id: string) {
      if (id === '@safe-globalThis/safe-apps-provider' ||
          id === '@safe-globalThis/safe-apps-sdk') {
        return id;
      }
    },
    load(id: string) {
      if (id === '@safe-globalThis/safe-apps-provider' ||
          id === '@safe-globalThis/safe-apps-sdk') {
        return stubModule;
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    stubSafeGlobal(),
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