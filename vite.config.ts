import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'node:child_process';
import { URL } from 'node:url';
import path from 'node:path';

function turnaLiveScraperPlugin(): Plugin {
  return {
    name: 'turna-live-scraper',
    configureServer(server) {
      server.middlewares.use('/api/live-scrape', async (req, res) => {
        try {
          const reqUrl = new URL(req.url || '', `http://${req.headers.host}`);
          const fromCity = reqUrl.searchParams.get('from') || 'İstanbul';
          const toCity = reqUrl.searchParams.get('to') || 'İzmir';
          const type = reqUrl.searchParams.get('type') || 'ucak';
          const date = reqUrl.searchParams.get('date') || '';

          const scriptPath = path.resolve(__dirname, 'tools', 'turna_live_api.py');
          const pythonProc = spawn('python', [
            scriptPath,
            '--from', fromCity,
            '--to', toCity,
            '--type', type,
            '--date', date
          ]);

          let stdoutData = '';
          let stderrData = '';

          pythonProc.stdout.on('data', (chunk) => {
            stdoutData += chunk;
          });

          pythonProc.stderr.on('data', (chunk) => {
            stderrData += chunk;
          });

          pythonProc.on('close', (code) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (code === 0 && stdoutData.trim()) {
              res.statusCode = 200;
              res.end(stdoutData);
            } else {
              res.statusCode = 200;
              res.end(JSON.stringify([]));
            }
          });
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), turnaLiveScraperPlugin()],
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
});
