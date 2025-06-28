import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: mode === 'extension' ? {
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        options: resolve(__dirname, 'options.html'),
        content: resolve(__dirname, 'src/content/content.ts'),
        background: resolve(__dirname, 'src/background/background.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Manter nomes específicos para scripts da extensão
          if (chunkInfo.name === 'content') return 'content.js';
          if (chunkInfo.name === 'background') return 'background.js';
          return '[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          // Manter estrutura de CSS
          if (assetInfo.name?.endsWith('.css')) {
            return 'src/styles/[name].[ext]';
          }
          return '[name].[ext]';
        },
        format: 'iife', // Usar IIFE em vez de ES modules
        inlineDynamicImports: true // Inline imports para evitar problemas
      }
    },
    target: 'es2017', // Target mais compatível
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false
  } : undefined,
  publicDir: mode === 'extension' ? false : 'public'
}))