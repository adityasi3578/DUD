import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async () => {
  const plugins = [react()];

  if (process.env.NODE_ENV !== 'production' && process.env.REPL_ID) {
    const runtimeErrorModal = await import('@replit/vite-plugin-runtime-error-modal');
    const cartographer = await import('@replit/vite-plugin-cartographer');
    plugins.push(runtimeErrorModal.default(), cartographer.cartographer());
  }

  return {
    base: '/DUD/',
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'client', 'src'),
        '@shared': path.resolve(__dirname, 'shared'),
        '@assets': path.resolve(__dirname, 'attached_assets')
      }
    },
    root: path.resolve(__dirname, 'client'),
    build: {
      outDir: path.resolve(__dirname, 'dist/public'),
      emptyOutDir: true
    },
    server: {
      fs: {
        strict: true,
        deny: ['**/.*']
      }
    }
  };
});
