import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const production = mode === 'production';
  const configuredApi = String(env.VITE_API_BASE_URL || '').trim();
  // Production is served behind the store's own /api reverse proxy. Local
  // development URLs and the old MS Store host must never enter its bundle.
  const productionApi = !configuredApi || /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(configuredApi)
    || /ms-store-backend-1\.onrender\.com/i.test(configuredApi) ? '/api' : configuredApi;
  return {
    plugins: [react(), tailwindcss()],
    assetsInclude: ['**/*.PNG', '**/*.MP4'],
    define: {
      ...(production ? {
        'import.meta.env.VITE_DATA_PROVIDER': JSON.stringify('real'),
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(productionApi),
      } : {}),
      'process.env.VITE_API_BASE_URL': JSON.stringify(production ? productionApi : env.VITE_API_BASE_URL),
      'process.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('@barba/core')) return 'transition-vendor';
            if (id.includes('react-router')) return 'router-vendor';
            if (id.includes('framer-motion')) return 'motion-vendor';
            if (id.includes('i18next')) return 'i18n-vendor';
            if (id.includes('zustand')) return 'state-vendor';
            if (id.includes('lucide-react')) return undefined;
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
            if (id.includes('axios')) return 'http-vendor';
            if (id.includes('clsx') || id.includes('tailwind-merge')) return 'ui-vendor';
            return undefined;
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      port: 5173,
    },
  };
});
