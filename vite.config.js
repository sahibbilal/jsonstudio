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
        'tool-converter': path.resolve(__dirname, 'src/tools/converter/index.jsx'),
        'tool-diff-merge': path.resolve(__dirname, 'src/tools/diff-merge/index.jsx'),
        'tool-array-converter': path.resolve(__dirname, 'src/tools/array-converter/index.jsx'),
        'tool-query-extractor': path.resolve(__dirname, 'src/tools/query-extractor/index.jsx'),
        'tool-schema-generator': path.resolve(__dirname, 'src/tools/schema-generator/index.jsx'),
        'tool-mock-data': path.resolve(__dirname, 'src/tools/mock-data/index.jsx'),
        'global-settings': path.resolve(__dirname, 'src/global-settings.jsx'),
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

