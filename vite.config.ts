import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { URL } from 'node:url';
import { scrapeTurnaDirect } from './api/utils/scraper';


function turnaLiveScraperPlugin(): Plugin {
  return {
    name: 'turna-live-scraper',
    configureServer(server) {
      // 1. Live Ticket Scraping Route
      server.middlewares.use('/api/live-scrape', async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        try {
          const reqUrl = new URL(req.url || '', `http://${req.headers.host}`);
          const fromCity = reqUrl.searchParams.get('from') || 'İstanbul';
          const toCity = reqUrl.searchParams.get('to') || 'İzmir';
          const type = reqUrl.searchParams.get('type') || 'ucak';
          const date = reqUrl.searchParams.get('date') || '2026-08-28';

          const results = await scrapeTurnaDirect(fromCity, toCity, type, date);
          res.statusCode = 200;
          res.end(JSON.stringify(results));
        } catch (err) {
          res.statusCode = 200;
          res.end(JSON.stringify([]));
        }
      });

      // 2. Real-Time Autocomplete Route (Domestic + International, Worldwide)
      server.middlewares.use('/api/autocomplete', async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        try {
          const reqUrl = new URL(req.url || '', `http://${req.headers.host}`);
          const term = reqUrl.searchParams.get('term') || '';
          const type = reqUrl.searchParams.get('type') || 'flight';

          if (!term.trim()) {
            res.statusCode = 200;
            res.end(JSON.stringify([]));
            return;
          }

          const endpoint = type === 'bus'
            ? `https://www.turna.com/api/proxy/v1/meta/autocomplete/bus?term=${encodeURIComponent(term)}&languageCode=TR`
            : `https://www.turna.com/api/proxy/v1/meta/autocomplete/flight?term=${encodeURIComponent(term)}&languageCode=TR`;

          const turnaRes = await fetch(endpoint, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
              'Accept': 'application/json'
            }
          });

          if (turnaRes.ok) {
            const data = await turnaRes.json();
            res.statusCode = 200;
            res.end(JSON.stringify(data));
          } else {
            res.statusCode = 200;
            res.end(JSON.stringify([]));
          }
        } catch (err) {
          res.statusCode = 200;
          res.end(JSON.stringify([]));
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
