/**
 * SERVER ONLY. The one HTTP surface for `GET|POST /api/turna`, shared by the Vercel function
 * (api/turna.ts) and the Vite dev/preview middleware (vitePlugin.ts) so both environments emit
 * identical status codes, bodies and headers.
 *
 *   handleTurnaHttp  pure: ({ method, url, body }) -> { status, headers, body }
 *   serveTurnaNode   thin Node adapter: reads req.query / req.body when a platform pre-parsed them,
 *                    otherwise the URL search params / a streamed JSON body capped at 16 KiB.
 *                    Vercel's `req.body` is a lazy getter that throws for malformed JSON; that throw
 *                    is mapped to 400 invalid_json so dev and prod answer identically. A POST without
 *                    Content-Type is never pre-parsed by Vercel (the stream stays untouched), so it is
 *                    read from the stream in both environments; Content-Length above the cap is 413.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { TurnaFailure } from '../../lib/turna/types';
import { TurnaQueryError } from '../../lib/turna/urls';
import { runTurnaQuery, toQuery } from './pipeline';
import type { PipelineDeps, TurnaOutcome } from './pipeline';

import { turnaMetrics } from './metrics';
import type { TurnaMetrics } from './metrics';

export const STATS_QUERY_KEY = 'stats';

export const ALLOW_HEADER = 'GET, POST, OPTIONS';
export const CONTENT_TYPE_JSON = 'application/json; charset=utf-8';
export const CACHE_CONTROL_PUBLIC = 'public, max-age=0, s-maxage=600, stale-while-revalidate=300';
export const CACHE_CONTROL_PRIVATE = 'private, no-store';
export const CACHE_CONTROL_NO_STORE = 'no-store';
export const MAX_BODY_BYTES = 16 * 1024;
export const INVALID_JSON_MESSAGE = 'Geçersiz JSON gövdesi.';

export interface TurnaHttpRequest {
  method: string;
  url: URL;
  /** POST payload: a parsed object, a raw JSON string/Buffer, or undefined. */
  body?: unknown;
}

export interface TurnaHttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function failureResponse(
  status: number,
  errorCode: string,
  error: string,
  extraHeaders: Record<string, string> = {},
): TurnaHttpResponse {
  const payload: TurnaFailure = { success: false, error, errorCode };
  return {
    status,
    headers: { 'Content-Type': CONTENT_TYPE_JSON, 'Cache-Control': CACHE_CONTROL_NO_STORE, ...extraHeaders },
    body: JSON.stringify(payload),
  };
}

type ParsedBody = { ok: true; value: Record<string, unknown> } | { ok: false; message: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseBody(body: unknown): ParsedBody {
  if (body === undefined || body === null) return { ok: true, value: {} };
  let text: string | null = null;
  if (typeof body === 'string') text = body;
  else if (body instanceof Uint8Array) text = Buffer.from(body).toString('utf8');
  if (text !== null) {
    if (text.trim() === '') return { ok: true, value: {} };
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, message: INVALID_JSON_MESSAGE };
    }
    if (!isPlainObject(parsed)) return { ok: false, message: 'JSON gövdesi bir nesne olmalı.' };
    return { ok: true, value: parsed };
  }
  if (isPlainObject(body)) return { ok: true, value: body };
  return { ok: false, message: 'JSON gövdesi bir nesne olmalı.' };
}

function outcomeToResponse(outcome: TurnaOutcome, refresh: boolean): TurnaHttpResponse {
  if (!outcome.body.success) {
    const headers: Record<string, string> = {};
    if (outcome.retryAfterSeconds !== undefined) headers['Retry-After'] = String(outcome.retryAfterSeconds);
    return failureResponse(outcome.status, outcome.body.errorCode, outcome.body.error, headers);
  }
  const success = outcome.body;
  return {
    status: 200,
    headers: {
      'Content-Type': CONTENT_TYPE_JSON,
      'Cache-Control': refresh ? CACHE_CONTROL_PRIVATE : CACHE_CONTROL_PUBLIC,
      'X-Turna-Fetched-Via': success.fetchedVia,
      'X-Turna-Scraped-At': success.scrapedAt,
    },
    body: JSON.stringify(success),
  };
}

/** Pure handler: no sockets, no globals beyond the injected pipeline deps. */
export async function handleTurnaHttp(req: TurnaHttpRequest, deps: Partial<PipelineDeps> = {}): Promise<TurnaHttpResponse> {
  const method = req.method.toUpperCase();
  if (method === 'OPTIONS') {
    return { status: 204, headers: { Allow: ALLOW_HEADER, 'Cache-Control': CACHE_CONTROL_NO_STORE }, body: '' };
  }
  if (method !== 'GET' && method !== 'POST') {
    return failureResponse(405, 'method_not_allowed', 'Yalnızca GET ve POST desteklenir.', { Allow: ALLOW_HEADER });
  }

  const metrics: TurnaMetrics = deps.metrics ?? turnaMetrics;
  const startedAt = Date.now();
  const observe = (out: TurnaHttpResponse, kind: string | null, refresh: boolean): TurnaHttpResponse => {
    let errorCode: string | null = null;
    let fetchedVia: string | null = null;
    if (out.status >= 200 && out.status < 300) {
      fetchedVia = out.headers['X-Turna-Fetched-Via'] ?? null;
    } else {
      try {
        const parsed = JSON.parse(out.body) as { errorCode?: unknown };
        errorCode = typeof parsed.errorCode === 'string' ? parsed.errorCode : null;
      } catch {
        errorCode = null;
      }
    }
    metrics.record({ kind, status: out.status, errorCode, fetchedVia, refresh, latencyMs: Date.now() - startedAt });
    return out;
  };

  let raw: Record<string, unknown>;
  if (method === 'GET') {
    raw = Object.fromEntries(req.url.searchParams.entries());
    // Read-only counters: answered locally, never reaches Turna, never cached, not counted as a request.
    const stats = raw[STATS_QUERY_KEY];
    if (stats === '1' || stats === 'true') {
      return {
        status: 200,
        headers: { 'Content-Type': CONTENT_TYPE_JSON, 'Cache-Control': CACHE_CONTROL_NO_STORE },
        body: JSON.stringify(metrics.snapshot()),
      };
    }
  } else {
    const parsed = parseBody(req.body);
    if (!parsed.ok) return failureResponse(400, 'invalid_json', parsed.message);
    raw = parsed.value;
  }

  const rawKind = typeof raw.kind === 'string' ? raw.kind.trim().toLowerCase() : null;
  let query;
  try {
    query = toQuery(raw);
  } catch (err) {
    if (err instanceof TurnaQueryError) return observe(failureResponse(400, err.errorCode, err.message), rawKind, false);
    return observe(failureResponse(500, 'internal_error', describe(err)), rawKind, false);
  }

  try {
    const outcome = await runTurnaQuery(query, deps);
    return observe(outcomeToResponse(outcome, query.refresh === true), query.kind, query.refresh === true);
  } catch (err) {
    return observe(failureResponse(500, 'internal_error', describe(err)), query.kind, query.refresh === true);
  }
}

// ---------------------------------------------------------------------------
// Node adapter
// ---------------------------------------------------------------------------

/** IncomingMessage plus the fields Vercel pre-populates. */
export type NodeTurnaRequest = IncomingMessage & { query?: unknown; body?: unknown };

export function requestUrl(req: NodeTurnaRequest): URL {
  const hostHeader = typeof req.headers.host === 'string' && req.headers.host ? req.headers.host : 'localhost';
  let url: URL;
  try {
    url = new URL(req.url ?? '/', `http://${hostHeader}`);
  } catch {
    url = new URL(req.url ?? '/', 'http://localhost');
  }
  // Platforms such as Vercel pre-parse the query; merge anything the raw URL did not carry.
  if (isPlainObject(req.query)) {
    for (const [key, value] of Object.entries(req.query)) {
      if (url.searchParams.has(key)) continue;
      const v = Array.isArray(value) ? value[0] : value;
      if (typeof v === 'string') url.searchParams.set(key, v);
    }
  }
  return url;
}

type BodyRead = { tooLarge: false; text: string } | { tooLarge: true };

function readRequestBody(req: IncomingMessage, maxBytes: number): Promise<BodyRead> {
  if (req.readableEnded) return Promise.resolve({ tooLarge: false, text: '' });
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;
    req.on('data', (chunk: Buffer | string) => {
      if (settled) return;
      const buf = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
      total += buf.length;
      if (total > maxBytes) {
        settled = true;
        resolve({ tooLarge: true });
        req.resume();
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve({ tooLarge: false, text: Buffer.concat(chunks).toString('utf8') });
    });
    req.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

function payloadTooLarge(): TurnaHttpResponse {
  return failureResponse(413, 'payload_too_large', `İstek gövdesi ${MAX_BODY_BYTES / 1024} KiB sınırını aşıyor.`);
}

/** Content-Length as a number when the header is present and numeric, else null. */
function declaredContentLength(req: IncomingMessage): number | null {
  const raw = req.headers['content-length'];
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (typeof text !== 'string' || !/^\d+$/.test(text.trim())) return null;
  return Number(text.trim());
}

type PreParsedBody = { ok: true; value: unknown } | { ok: false };

/**
 * Vercel installs `req.body` as a lazy getter that throws `ApiError(400, 'Invalid JSON')` for a
 * malformed application/json payload. Reading it in isolation lets that throw become 400
 * invalid_json (the same answer the streamed path gives) instead of a generic 500.
 */
function readPreParsedBody(req: NodeTurnaRequest): PreParsedBody {
  try {
    return { ok: true, value: req.body };
  } catch {
    return { ok: false };
  }
}

function exceedsCap(body: unknown): boolean {
  if (typeof body === 'string') return Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES;
  if (body instanceof Uint8Array) return body.byteLength > MAX_BODY_BYTES;
  return false;
}

export function writeTurnaResponse(res: ServerResponse, out: TurnaHttpResponse): void {
  res.statusCode = out.status;
  for (const [key, value] of Object.entries(out.headers)) res.setHeader(key, value);
  if (out.status === 204 || out.body === '') {
    res.end();
    return;
  }
  res.setHeader('Content-Length', String(Buffer.byteLength(out.body, 'utf8')));
  res.end(out.body);
}

/** Node adapter used by api/turna.ts (Vercel) and the Vite middleware. */
export async function serveTurnaNode(req: NodeTurnaRequest, res: ServerResponse, deps: Partial<PipelineDeps> = {}): Promise<void> {
  let out: TurnaHttpResponse;
  try {
    const method = (req.method ?? 'GET').toUpperCase();
    const url = requestUrl(req);
    let body: unknown;
    if (method === 'POST') {
      // The cap applies before any body is touched, on both the pre-parsed and the streamed path.
      const declared = declaredContentLength(req);
      if (declared !== null && declared > MAX_BODY_BYTES) {
        writeTurnaResponse(res, payloadTooLarge());
        return;
      }
      const pre = readPreParsedBody(req);
      if (!pre.ok) {
        writeTurnaResponse(res, failureResponse(400, 'invalid_json', INVALID_JSON_MESSAGE));
        return;
      }
      // Platforms only pre-parse when a Content-Type was sent; without one Vercel leaves the stream
      // untouched (and exposes an empty string), so both environments read the stream here.
      const hasContentType = req.headers['content-type'] !== undefined;
      if (hasContentType && pre.value !== undefined) {
        if (exceedsCap(pre.value)) {
          writeTurnaResponse(res, payloadTooLarge());
          return;
        }
        body = pre.value;
      } else {
        const read = await readRequestBody(req, MAX_BODY_BYTES);
        if (read.tooLarge) {
          writeTurnaResponse(res, payloadTooLarge());
          return;
        }
        body = read.text;
      }
    }
    out = await handleTurnaHttp({ method, url, body }, deps);
  } catch (err) {
    out = failureResponse(500, 'internal_error', describe(err));
  }
  writeTurnaResponse(res, out);
}
