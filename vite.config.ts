import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const disableCdpTracking = env.DISABLE_CDP_USAGE_TRACKING === 'true' || mode === 'development';
    const disableCdpErrorReporting = env.DISABLE_CDP_ERROR_REPORTING === 'true' || mode === 'development';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        cors: true
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.DISABLE_CDP_USAGE_TRACKING': JSON.stringify(disableCdpTracking ? 'true' : 'false'),
        'process.env.DISABLE_CDP_ERROR_REPORTING': JSON.stringify(disableCdpErrorReporting ? 'true' : 'false')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            browse: path.resolve(__dirname, 'browse.html'),
            leaderboard: path.resolve(__dirname, 'leaderboard.html'),
            builder: path.resolve(__dirname, 'builder.html'),
            dashboard: path.resolve(__dirname, 'dashboard.html'),
            widget: path.resolve(__dirname, 'widget-runtime.js')
          },
          output: {
            entryFileNames: (chunk) => (chunk.name === 'widget' ? 'widget-runtime.js' : 'assets/[name]-[hash].js'),
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash][extname]'
          }
        }
      }
    };
});
