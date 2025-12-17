import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'assets/js/build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'tool-beautifier': path.resolve(__dirname, 'src/tools/beautifier/index.jsx'),
        'tool-validator': path.resolve(__dirname, 'src/tools/validator/index.jsx'),
        'tool-viewer': path.resolve(__dirname, 'src/tools/viewer/index.jsx'),
        // Add other tools as they are created:
        // 'tool-converter': path.resolve(__dirname, 'src/tools/converter/index.jsx'),
        // 'tool-diff-merge': path.resolve(__dirname, 'src/tools/diff-merge/index.jsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        format: 'es',
        manualChunks: undefined,
      },
    },
    sourcemap: false,
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});

