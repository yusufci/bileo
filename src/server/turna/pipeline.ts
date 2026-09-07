/**
 * SERVER ONLY. Query -> resolve -> fetch -> JSON-LD -> offers/facts -> stats -> history -> TurnaResponse.
 *
 * Lifted from nexora-panel/app/api/turna/route.ts handle() with three corrections:
 *   - `kind` is required (no default); a missing or unknown kind is `invalid_query`
 *   - `scrapedAt` is the time the HTML was actually fetched (the cache entry's fetchedAt on hits)
 *   - fetch failures carry the error code -> HTTP status map of the spec (section 2)
 * History-store calls are bounded by STORE_TIMEOUT_MS and only ever produce warnings.
 *
 * Phase 2: `kind=car` (`/arac-kiralama/sehir/{city}`, routeKey `car:{city}`) and the rich hotel list both
 * come from the page's RSC payload, so the raw HTML is handed to `parseOffers` alongside the JSON-LD
 * blocks. Cars are priced per day, so `stats` is present for them (`byDay` stays empty).
 */
import { computeStats } from '../../lib/turna/analytics';
import type { TurnaFailure, TurnaKind, TurnaQuery, TurnaResponse, TurnaSuccess } from '../../lib/turna/types';
import { TURNA_KINDS } from '../../lib/turna/types';
import { KIND_LIST_LABEL, resolveTurnaTarget, TurnaQueryError } from '../../lib/turna/urls';
import type { ResolvedTurnaTarget } from '../../lib/turna/urls';
import { fetchTurnaHtml, TurnaFetchError, RATE_LIMITED_RETRY_AFTER_S } from './fetch';
import type { FetchedPage } from './fetch';
import { createHistoryStore } from './history';
import type { TurnaHistoryStore } from './history';
import type { TurnaMetrics } from './metrics';
import { extractJsonLd, extractTitle, parseFacts, parseOffers } from './parse';

export const KINDS: readonly TurnaKind[] = TURNA_KINDS;

/** errorCode -> HTTP status (spec section 2). Unknown codes fall back to 502. */
export const STATUS_BY_ERROR_CODE: Readonly<Record<string, number>> = {
  invalid_query: 400,
  invalid_json: 400,
  robots_disallowed: 403,
  route_not_found: 404,
  method_not_allowed: 405,
  payload_too_large: 413,
  rate_limited: 429,
  internal_error: 500,
  no_structured_data: 502,
  upstream_unavailable: 502,
  blocked: 503,
};

export const STORE_TIMEOUT_MS = 1500;

export const WARNING_NO_JSONLD = 'Sayfada JSON-LD bloğu bulunamadı.';
export const WARNING_NO_OFFERS = 'Landing sayfasında yapısal teklif (offer) bulunamadı; yalnızca rota bilgileri döndürüldü.';

export interface PipelineDeps {
  fetchPage: (target: ResolvedTurnaTarget, opts: { refresh?: boolean }) => Promise<FetchedPage>;
  store: TurnaHistoryStore;
  now: () => Date;
  storeTimeoutMs: number;
  /** Request counters used by the HTTP layer only; defaults to the process-wide instance. */
  metrics?: TurnaMetrics;
}

export interface TurnaOutcome {
  status: number;
  body: TurnaResponse;
  retryAfterSeconds?: number;
}

let defaultStore: TurnaHistoryStore | null = null;

function getDefaultStore(): TurnaHistoryStore {
  if (!defaultStore) defaultStore = createHistoryStore();
  return defaultStore;
}

export function defaultPipelineDeps(): PipelineDeps {
  return {
    fetchPage: (target, opts) => fetchTurnaHtml(target, opts),
    store: getDefaultStore(),
    now: () => new Date(),
    storeTimeoutMs: STORE_TIMEOUT_MS,
  };
}

export function failure(status: number, errorCode: string, error: string, retryAfterSeconds?: number): TurnaOutcome {
  const body: TurnaFailure = { success: false, error, errorCode };
  const out: TurnaOutcome = { status, body };
  if (retryAfterSeconds !== undefined) out.retryAfterSeconds = retryAfterSeconds;
  return out;
}

const first = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v);

const optionalString = (v: unknown): string | undefined => {
  const x = first(v);
  return typeof x === 'string' && x.trim() ? x.trim() : undefined;
};

/** Normalise raw request parameters. Throws TurnaQueryError; `kind` is required. */
export function toQuery(raw: Record<string, unknown>): TurnaQuery {
  const kindRaw = first(raw.kind);
  if (kindRaw === undefined || kindRaw === null || kindRaw === '') {
    throw new TurnaQueryError(`'kind' zorunludur: ${KIND_LIST_LABEL}.`);
  }
  const kind = String(kindRaw).trim().toLowerCase();
  if (!(KINDS as readonly string[]).includes(kind)) {
    throw new TurnaQueryError(`'kind' ${KIND_LIST_LABEL} olmalı (alınan: ${String(kindRaw)}).`);
  }
  const refreshRaw = first(raw.refresh);
  const query: TurnaQuery = {
    kind: kind as TurnaKind,
    refresh: refreshRaw === true || refreshRaw === 'true' || refreshRaw === '1',
  };
  const from = optionalString(raw.from);
  const to = optionalString(raw.to);
  const city = optionalString(raw.city);
  if (from !== undefined) query.from = from;
  if (to !== undefined) query.to = to;
  if (city !== undefined) query.city = city;
  return query;
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  if (!Number.isFinite(ms) || ms <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} ${ms} ms içinde tamamlanmadı`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function runTurnaQuery(query: TurnaQuery, deps: Partial<PipelineDeps> = {}): Promise<TurnaOutcome> {
  const fetchPage = deps.fetchPage ?? ((target, opts) => fetchTurnaHtml(target, opts));
  const store = deps.store ?? getDefaultStore();
  const now = deps.now ?? (() => new Date());
  const storeTimeoutMs = deps.storeTimeoutMs ?? STORE_TIMEOUT_MS;
  const started = now().getTime();

  let target: ResolvedTurnaTarget;
  try {
    target = resolveTurnaTarget(query);
  } catch (err) {
    if (err instanceof TurnaQueryError) return failure(400, err.errorCode, err.message);
    return failure(500, 'internal_error', describe(err));
  }

  let page: FetchedPage;
  try {
    page = await fetchPage(target, { refresh: query.refresh === true });
  } catch (err) {
    if (err instanceof TurnaFetchError) {
      const status = STATUS_BY_ERROR_CODE[err.errorCode] ?? 502;
      const retryAfter = err.retryAfterSeconds ?? (status === 429 ? RATE_LIMITED_RETRY_AFTER_S : undefined);
      return failure(status, err.errorCode, err.message, retryAfter);
    }
    if (err instanceof TurnaQueryError) return failure(400, err.errorCode, err.message);
    return failure(500, 'internal_error', describe(err));
  }

  const blocks = extractJsonLd(page.html);
  // The HTML is needed for the RSC payload (hotel `initialHotels`, car `cars`); JSON-LD alone has no car offers.
  const items = parseOffers(target.kind, blocks, page.html);
  const facts = parseFacts(blocks);
  const stats = computeStats(items);
  const warnings = [...page.warnings];
  if (blocks.length === 0) warnings.push(WARNING_NO_JSONLD);
  if (items.length === 0 && target.kind !== 'ferry') warnings.push(WARNING_NO_OFFERS);

  // Cache hits carry no new information: only a fresh fetch becomes an observation.
  let observationId: string | null = null;
  if (page.via === 'direct') {
    try {
      const rec = await withTimeout(
        store.record({
          routeKey: target.routeKey,
          kind: target.kind,
          sourceUrl: target.url,
          fetchedVia: page.via,
          latencyMs: page.latencyMs,
          items,
          stats,
          facts,
        }),
        storeTimeoutMs,
        'Gözlem kaydı',
      );
      observationId = rec.id;
    } catch (err) {
      warnings.push(`Gözlem kaydedilemedi: ${describe(err)}`);
    }
  }

  let history: TurnaSuccess['history'] = [];
  let delta: TurnaSuccess['delta'] = null;
  try {
    history = await withTimeout(store.history(target.routeKey), storeTimeoutMs, 'Geçmiş sorgusu');
    delta = await withTimeout(store.delta(target.routeKey, observationId, stats?.min ?? null), storeTimeoutMs, 'Fark sorgusu');
  } catch (err) {
    warnings.push(`Geçmiş okunamadı: ${describe(err)}`);
  }

  const body: TurnaSuccess = {
    success: true,
    kind: target.kind,
    query,
    routeKey: target.routeKey,
    sourceUrl: target.url,
    pageTitle: extractTitle(page.html),
    fetchedVia: page.via,
    latencyMs: now().getTime() - started,
    scrapedAt: page.fetchedAt,
    items,
    facts,
    stats,
    history,
    delta,
    warnings,
  };
  return { status: 200, body };
}
