/**
 * SERVER ONLY. `GET /api/search?kind=bus|flight|hotel&from=&to=&city=&sources=obilet,biletall`
 *
 * One handler module for the Vite dev/preview plugin and the Vercel function (`api/search.ts`).
 * Answers a `SearchEnvelope` (see src/lib/sources/types.ts): per-source success or failure, never a
 * merged row without a `source`. The existing `/api/turna` contract is untouched.
 */
import type { ServerResponse } from 'node:http';
import type { SourceKind, SourceQuery } from '../../lib/sources/types';
import { CACHE_CONTROL_NO_STORE, CONTENT_TYPE_JSON, failureResponse, requestUrl, writeTurnaResponse } from '../turna/http';
import type { NodeTurnaRequest, TurnaHttpRequest, TurnaHttpResponse } from '../turna/http';
import { runSourceSearch } from './search';
import type { SourceSearchDeps } from './search';
import { turnaMetrics } from '../turna/metrics';
import type { TurnaMetrics } from '../turna/metrics';

export const SEARCH_KINDS: readonly SourceKind[] = ['bus', 'flight', 'hotel'];
export const SEARCH_ALLOW_HEADER = 'GET, OPTIONS';
/** Landing pages change slowly; the per-source envelope may sit on the edge for five minutes. */
export const SEARCH_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=300';

function optional(value: string | null): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

/** Query object from the URL, or a 400 response when `kind` is missing or unknown. */
export function parseSearchQuery(url: URL): { ok: true; query: SourceQuery; sources: string[] | undefined } | { ok: false; response: TurnaHttpResponse } {
  const kindRaw = (url.searchParams.get('kind') ?? '').trim().toLowerCase();
  if (!kindRaw) return { ok: false, response: failureResponse(400, 'invalid_query', `'kind' zorunludur: ${SEARCH_KINDS.join(' | ')}.`) };
  if (!(SEARCH_KINDS as readonly string[]).includes(kindRaw)) {
    return { ok: false, response: failureResponse(400, 'invalid_query', `'kind' ${SEARCH_KINDS.join(' | ')} olmalı (alınan: ${kindRaw}).`) };
  }
  const kind = kindRaw as SourceKind;
  const query: SourceQuery = { kind, from: optional(url.searchParams.get('from')), to: optional(url.searchParams.get('to')), city: optional(url.searchParams.get('city')) };
  if (kind === 'hotel' ? !(query.city ?? query.to ?? query.from) : !(query.from && query.to)) {
    return {
      ok: false,
      response: failureResponse(400, 'invalid_query', kind === 'hotel' ? "'city' zorunludur (örn. antalya)." : "'from' ve 'to' zorunludur (örn. istanbul, ankara)."),
    };
  }
  const sourcesRaw = optional(url.searchParams.get('sources'));
  const sources = sourcesRaw ? sourcesRaw.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  return { ok: true, query, sources };
}

export interface SearchHttpDeps extends Partial<SourceSearchDeps> {
  /** Counters to record into; defaults to the process-wide instance shared with /api/turna. */
  metrics?: TurnaMetrics;
}

/** Pure handler: GET only, no sockets. Records the request and every source answer into the shared counters. */
export async function handleSearchHttp(req: TurnaHttpRequest, deps: SearchHttpDeps = {}): Promise<TurnaHttpResponse> {
  const metrics = deps.metrics ?? turnaMetrics;
  const startedAt = Date.now();
  const method = req.method.toUpperCase();
  if (method === 'OPTIONS') return { status: 204, headers: { Allow: SEARCH_ALLOW_HEADER, 'Cache-Control': CACHE_CONTROL_NO_STORE }, body: '' };
  if (method !== 'GET') return failureResponse(405, 'method_not_allowed', 'Yalnızca GET desteklenir.', { Allow: SEARCH_ALLOW_HEADER });
  const parsed = parseSearchQuery(req.url);
  if (!parsed.ok) {
    metrics.record({ kind: 'search', status: parsed.response.status, errorCode: 'invalid_query', latencyMs: Date.now() - startedAt });
    return parsed.response;
  }
  const refresh = ['1', 'true'].includes((req.url.searchParams.get('refresh') ?? '').trim().toLowerCase());
  const { metrics: _ignored, ...searchDeps } = deps;
  void _ignored;
  const envelope = await runSourceSearch(parsed.query, parsed.sources, { ...searchDeps, refresh });
  const anySuccess = envelope.results.some((r) => r.success);
  for (const r of envelope.results) {
    metrics.recordSource(r.success ? { source: r.source, ok: true, fetchedVia: r.fetchedVia, latencyMs: r.latencyMs } : { source: r.source, ok: false, errorCode: r.errorCode });
  }
  metrics.record({ kind: `search:${parsed.query.kind}`, status: 200, fetchedVia: anySuccess ? 'search' : null, refresh, latencyMs: Date.now() - startedAt });
  return {
    status: 200,
    headers: {
      'Content-Type': CONTENT_TYPE_JSON,
      'Cache-Control': anySuccess && !refresh ? SEARCH_CACHE_CONTROL : CACHE_CONTROL_NO_STORE,
    },
    body: JSON.stringify(envelope),
  };
}

/** Node / Vercel adapter (same shape as `serveTurnaNode`). */
export async function serveSearchNode(req: NodeTurnaRequest, res: ServerResponse, deps: Partial<SourceSearchDeps> = {}): Promise<void> {
  const out = await handleSearchHttp({ method: req.method ?? 'GET', url: requestUrl(req) }, deps);
  writeTurnaResponse(res, out);
}
