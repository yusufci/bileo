/**
 * Browser client for `GET /api/turna`. Resolves to a LiveSearchState that is never
 * `idle` or `loading`; the caller owns those two transitions.
 */
import type { LiveSearchState } from '../../types';
import type { TurnaQuery } from './types';
import { toRouteItems } from './adapter';
import { parseTurnaResponse } from './guard';
import { findPlaceBySlug } from './places';
import { isCityKind, slugifyTr } from './urls';

export const TURNA_API_PATH = '/api/turna';
/**
 * Must exceed the server's worst case, otherwise a slow first attempt that the server's retry
 * rescues is thrown away here as a network error while the server still caches the page.
 * Server side (src/server/turna/fetch.ts): robots.txt up to 5 s, host-gate wait, two attempts of
 * 10 s inside a 22 s budget plus up to 1.2 s backoff, then the optional history-store timeouts
 * (3 x 1.5 s). That is about 28 s, under Vercel's 30 s maxDuration.
 */
export const TURNA_CLIENT_TIMEOUT_MS = 28000;

type ErrorState = Extract<LiveSearchState, { status: 'error' }>;

export interface FetchTurnaOptions {
  /** Caller-owned cancellation (a new search aborts the previous one). */
  signal?: AbortSignal;
  /** Ask the server to bypass its HTML cache (server-side throttled). */
  refresh?: boolean;
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
  /** Display names used only when Turna's own text is empty. */
  fromCity?: string;
  toCity?: string;
  /** Injectable clock for tests. */
  now?: () => Date;
}

/** Lower-case slugified copy of the query so identical searches share one cache key. City kinds (hotel, car) keep only `city`. */
export function canonicalTurnaQuery(query: TurnaQuery): TurnaQuery {
  if (isCityKind(query.kind)) {
    return { kind: query.kind, city: slugifyTr(query.city ?? query.to ?? query.from ?? '') };
  }
  return { kind: query.kind, from: slugifyTr(query.from ?? ''), to: slugifyTr(query.to ?? '') };
}

/** `/api/turna?kind=..&from=..&to=..[&refresh=1]`, or `kind=hotel|car&city=..`, with params in a fixed order. */
export function buildTurnaUrl(query: TurnaQuery, refresh = false): string {
  const canonical = canonicalTurnaQuery(query);
  const params: string[] = [`kind=${encodeURIComponent(canonical.kind)}`];
  if (isCityKind(canonical.kind)) {
    params.push(`city=${encodeURIComponent(canonical.city ?? '')}`);
  } else {
    params.push(`from=${encodeURIComponent(canonical.from ?? '')}`);
    params.push(`to=${encodeURIComponent(canonical.to ?? '')}`);
  }
  if (refresh) params.push('refresh=1');
  return `${TURNA_API_PATH}?${params.join('&')}`;
}

/** Seconds from a Retry-After header (delta-seconds or HTTP-date); undefined when absent/unparseable. */
export function parseRetryAfter(header: string | null | undefined, now: () => Date = () => new Date()): number | undefined {
  if (!header) return undefined;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const at = Date.parse(trimmed);
  if (Number.isNaN(at)) return undefined;
  return Math.max(0, Math.ceil((at - now().getTime()) / 1000));
}

function errorState(
  query: TurnaQuery | null,
  httpStatus: number | null,
  errorCode: string,
  message: string,
  retryAfterSeconds?: number,
): ErrorState {
  const state: ErrorState = { status: 'error', query, httpStatus, errorCode, message };
  if (retryAfterSeconds !== undefined) state.retryAfterSeconds = retryAfterSeconds;
  return state;
}

interface CombinedSignal {
  signal: AbortSignal;
  timedOut: () => boolean;
  dispose: () => void;
}

/** Combine the caller's signal with the client timeout; works without AbortSignal.any/timeout. */
function withTimeout(external: AbortSignal | undefined, timeoutMs: number): CombinedSignal {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener('abort', onExternalAbort, { once: true });
  }
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    dispose: () => {
      clearTimeout(timer);
      external?.removeEventListener('abort', onExternalAbort);
    },
  };
}

function cityLabel(slug: string | undefined): string {
  if (!slug) return '';
  return findPlaceBySlug(slug)?.cityName ?? slug;
}

/**
 * Fetch one Turna landing-page result and map it to a LiveSearchState:
 * HTTP/JSON failures -> `error` (errorCode from the body when present, `retryAfterSeconds` from
 * Retry-After), zero items -> `facts-only`, otherwise `ok` for ANY kind. For flight/bus `routes`
 * holds the adapted RouteItem rows; for hotel/car `routes` is `[]` and the offers stay in
 * `result.items` (narrow on `kind`) for their own result screens.
 */
export async function fetchTurna(query: TurnaQuery, opts: FetchTurnaOptions = {}): Promise<LiveSearchState> {
  const canonical = canonicalTurnaQuery(query);
  const url = buildTurnaUrl(canonical, opts.refresh === true);
  const now = opts.now ?? (() => new Date());
  const fetchImpl: typeof fetch | undefined =
    opts.fetchImpl ?? (typeof fetch === 'function' ? (input, init) => fetch(input, init) : undefined);
  if (!fetchImpl) {
    return errorState(canonical, null, 'network', 'Bu ortamda ağ isteği yapılamıyor.');
  }

  const combined = withTimeout(opts.signal, TURNA_CLIENT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      signal: combined.signal,
    });
  } catch {
    combined.dispose();
    if (opts.signal?.aborted) {
      return errorState(canonical, null, 'aborted', 'Arama iptal edildi.');
    }
    if (combined.timedOut()) {
      return errorState(
        canonical,
        null,
        'network',
        `Turna.com yanıtı ${Math.round(TURNA_CLIENT_TIMEOUT_MS / 1000)} saniye içinde alınamadı; tekrar deneyin.`,
      );
    }
    return errorState(canonical, null, 'network', 'Sunucuya ulaşılamadı; bağlantınızı kontrol edin.');
  }
  combined.dispose();

  const retryAfterSeconds = parseRetryAfter(res.headers.get('Retry-After'), now);
  const fallbackCode = res.ok ? 'invalid_response' : `http_${res.status}`;

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return errorState(canonical, res.status, fallbackCode, 'Sunucu yanıtı okunamadı.', retryAfterSeconds);
  }

  const parsed = parseTurnaResponse(json);
  if (!parsed) {
    return errorState(canonical, res.status, fallbackCode, 'Turna yanıtı doğrulanamadı.', retryAfterSeconds);
  }
  if (parsed.response.success === false) {
    return errorState(canonical, res.status, parsed.response.errorCode, parsed.response.error, retryAfterSeconds);
  }
  if (!res.ok) {
    return errorState(canonical, res.status, fallbackCode, `Sunucu ${res.status} durum kodu döndürdü.`, retryAfterSeconds);
  }

  const result = parsed.response;
  const receivedAt = now().toISOString();
  if (result.items.length === 0) {
    return { status: 'facts-only', query: canonical, result, receivedAt };
  }

  const ctx = {
    fromCity: opts.fromCity ?? cityLabel(canonical.from),
    toCity: opts.toCity ?? cityLabel(canonical.to),
  };
  // Hotel/car offers are counted in nonRouteItems (not dropped) and simply yield routes = [].
  const { routes, dropped } = toRouteItems(result, ctx);
  return {
    status: 'ok',
    query: canonical,
    result,
    routes,
    droppedItems: parsed.dropped + dropped,
    receivedAt,
  };
}
