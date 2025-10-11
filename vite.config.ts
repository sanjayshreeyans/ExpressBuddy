import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        // Enable Fast Refresh for instant HMR
        fastRefresh: true,
      }),
    ],

    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        // Polyfills for Node.js modules (similar to craco config)
        buffer: 'buffer',
        process: 'process/browser',
        util: 'util',
        stream: 'stream-browserify',
        path: 'path-browserify',
      },
    },

    // Define environment variables
    define: {
      'process.env': env,
      global: 'globalThis',
    },

    // Server configuration
    server: {
      port: 3000,
      open: true,
      host: true, // Listen on all addresses for network access
      https: false, // Can be enabled if needed
      hmr: {
        overlay: true,
      },
    },

    // Build configuration
    build: {
      outDir: 'build',
      sourcemap: mode === 'development',
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-select',
              '@radix-ui/react-label',
              '@radix-ui/react-radio-group',
            ],
            'google-genai': ['@google/genai'],
            'supabase': ['@supabase/supabase-js'],
            // Add more chunks as needed
          },
        },
      },
      // Minification
      minify: 'esbuild',
      target: 'esnext',
    },

    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@google/genai',
        'eventemitter3',
        'lodash',
        'zustand',
      ],
      // Pre-bundle these for faster cold starts
      esbuildOptions: {
        target: 'esnext',
      },
    },

    // CSS configuration
    css: {
      preprocessorOptions: {
        scss: {
          // Add SCSS global imports if needed
        },
      },
    },
  };
});
