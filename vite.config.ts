import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { turnaApiPlugin } from './src/server/turna/vitePlugin';

/** Server-side keys read through process.env by src/server/turna/{fetch,history}.ts. */
const SERVER_ENV_PREFIXES = ['TURNA_', 'DATABASE_URL', 'PG', 'DB_SSL'];

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite exposes only VITE_* to the client and never writes .env values into process.env, while
  // Vercel injects the dashboard environment into process.env. Bridge the server-side keys so a
  // .env file configures `vite dev` / `vite preview` exactly like production; shell values win.
  const serverEnv = loadEnv(mode, process.cwd(), SERVER_ENV_PREFIXES);
  for (const [key, value] of Object.entries(serverEnv)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    // turnaApiPlugin serves /api/turna in `vite dev` and `vite preview` with the same handler module
    // that api/turna.ts deploys on Vercel (src/server/turna/http.ts).
    plugins: [react(), turnaApiPlugin()],
    server: {
      port: 5173,
      host: true,
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-confetti': ['canvas-confetti'],
          },
        },
      },
    },
  };
});
