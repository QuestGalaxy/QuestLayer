import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      // Expose env vars to the widget build
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_PROJECT_ID': JSON.stringify(env.VITE_PROJECT_ID),
      'import.meta.env.VITE_REOWN_PROJECT_ID': JSON.stringify(env.VITE_REOWN_PROJECT_ID || ''),
      'import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID': JSON.stringify(env.VITE_WALLET_CONNECT_PROJECT_ID)
    },
    plugins: [react()],
    base: '/',
    build: {
      lib: {
        entry: path.resolve(__dirname, 'widget-runtime.tsx'),
        name: 'QuestLayerWidget',
        fileName: () => 'widget-runtime.js',
        formats: ['es']
      },
      rollupOptions: {
        // Externalize dependencies if you want a smaller bundle, 
        // BUT for a standalone widget, we usually bundle everything (React, etc.)
        // so it doesn't conflict with host or require host to provide them.
        external: [], 
      },
      outDir: 'dist',
      emptyOutDir: false // Don't wipe dist if you have other builds
    }
  };
});
