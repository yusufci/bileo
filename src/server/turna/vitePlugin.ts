/**
 * SERVER ONLY (Vite config time). Mounts the shared Turna handler at /api/turna for `vite dev`
 * and `vite preview`, so local development answers with exactly the codes and headers that the
 * Vercel function (api/turna.ts) produces. Every other /api path answers 404 here as well, because
 * in production no other function exists (the legacy scraper and autocomplete endpoints are gone).
 */
import type { ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';
import { CONTENT_TYPE_JSON, CACHE_CONTROL_NO_STORE, serveTurnaNode } from './http';
import { serveSearchNode } from '../sources/http';

export const TURNA_API_MOUNT = '/api';
export const TURNA_API_SUBPATH = '/turna';
export const SEARCH_API_SUBPATH = '/search';

export function apiMiddleware(req: Connect.IncomingMessage, res: ServerResponse): void {
  const path = (req.url ?? '').split('?')[0];
  if (path === TURNA_API_SUBPATH || path === `${TURNA_API_SUBPATH}/`) {
    void serveTurnaNode(req, res);
    return;
  }
  if (path === SEARCH_API_SUBPATH || path === `${SEARCH_API_SUBPATH}/`) {
    void serveSearchNode(req, res);
    return;
  }
  res.statusCode = 404;
  res.setHeader('Content-Type', CONTENT_TYPE_JSON);
  res.setHeader('Cache-Control', CACHE_CONTROL_NO_STORE);
  res.end(JSON.stringify({ success: false, error: 'Bu API yolu yok.', errorCode: 'not_found' }));
}

export function turnaApiPlugin(): Plugin {
  return {
    name: 'bileo-turna-api',
    configureServer(server) {
      server.middlewares.use(TURNA_API_MOUNT, apiMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(TURNA_API_MOUNT, apiMiddleware);
    },
  };
}
