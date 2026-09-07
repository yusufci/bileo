/**
 * Browser client for `GET /api/search` (multi-source landing-page results). Validates the envelope
 * item by item so a changed upstream layout can never inject a row without a `source`, a price or a
 * clock into the UI. No Node imports.
 */
import type {
  SearchEnvelope,
  SourceBusTrip,
  SourceFailure,
  SourceFlight,
  SourceHotel,
  SourceId,
  SourceKind,
  SourceOffer,
  SourceQuery,
  SourceResult,
  SourceRouteFacts,
  SourceSuccess,
} from './types';
import { isSourceId } from './types';

export const SEARCH_API_PATH = '/api/search';
export const SEARCH_CLIENT_TIMEOUT_MS = 28_000;
const KINDS: readonly SourceKind[] = ['bus', 'flight', 'hotel'];
const CLOCK_RE = /^\d{2}:\d{2}$/;

export function buildSearchUrl(query: SourceQuery, sources?: readonly SourceId[], refresh = false): string {
  const params = new URLSearchParams();
  params.set('kind', query.kind);
  if (query.kind === 'hotel') {
    const city = query.city ?? query.to ?? query.from;
    if (city) params.set('city', city);
  } else {
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);
  }
  if (sources && sources.length > 0) params.set('sources', sources.join(','));
  if (refresh) params.set('refresh', '1');
  return `${SEARCH_API_PATH}?${params.toString()}`;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isNullableStr = (v: unknown): v is string | null => v === null || typeof v === 'string';
const isPositive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const isNullableNumber = (v: unknown): v is number | null => v === null || (typeof v === 'number' && Number.isFinite(v));
const isHttps = (v: unknown): v is string => isStr(v) && /^https:\/\//.test(v);
const isNullableClock = (v: unknown): v is string | null => v === null || (isStr(v) && /^([01]\d|2[0-3]):[0-5]\d$/.test(v));
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

export function isSourceBusTrip(v: unknown): v is SourceBusTrip {
  return (
    isObj(v) && v.kind === 'bus' && isSourceId(v.source) && isStr(v.id) && isStr(v.company) && isNullableStr(v.companyLogoUrl) &&
    typeof v.fromCity === 'string' && typeof v.toCity === 'string' && isNullableStr(v.fromStop) && isNullableStr(v.toStop) &&
    isStr(v.departureTime) && CLOCK_RE.test(v.departureTime) && isStr(v.arrivalTime) && CLOCK_RE.test(v.arrivalTime) &&
    isNullableNumber(v.durationMinutes) && isPositive(v.price) && v.currency === 'TRY' && isNullableStr(v.seatLayout) && (v.date === null || (isStr(v.date) && /^\d{4}-\d{2}-\d{2}$/.test(v.date))) && isHttps(v.sourceUrl)
  );
}

export function isSourceFlight(v: unknown): v is SourceFlight {
  return (
    isObj(v) && v.kind === 'flight' && isSourceId(v.source) && isStr(v.id) && isStr(v.airline) && isNullableStr(v.airlineCode) &&
    isNullableStr(v.fromCode) && isStr(v.fromName) && isNullableStr(v.toCode) && isStr(v.toName) &&
    isStr(v.departureTime) && CLOCK_RE.test(v.departureTime) && isStr(v.arrivalTime) && CLOCK_RE.test(v.arrivalTime) &&
    isNullableNumber(v.durationMinutes) && isPositive(v.price) && v.currency === 'TRY' && (v.date === null || (isStr(v.date) && /^\d{4}-\d{2}-\d{2}$/.test(v.date))) && isHttps(v.sourceUrl)
  );
}

export function isSourceHotel(v: unknown): v is SourceHotel {
  return (
    isObj(v) && v.kind === 'hotel' && isSourceId(v.source) && isStr(v.id) && isStr(v.name) && isHttps(v.url) && isNullableStr(v.image) &&
    isNullableNumber(v.stars) && isNullableNumber(v.rating) && isPositive(v.ratingBest) && isNullableNumber(v.reviewCount) &&
    isNullableStr(v.city) && isNullableStr(v.street) && isNullableNumber(v.latitude) && isNullableNumber(v.longitude) &&
    isNullableStr(v.description) && Array.isArray(v.amenities) && v.amenities.every((a) => typeof a === 'string') && isHttps(v.sourceUrl) &&
    !('price' in v)
  );
}

/** Route facts (flixbus): a starting price at most, clocks only as first/last departure, never a timetable. */
export function isSourceRouteFacts(v: unknown): v is SourceRouteFacts {
  return (
    isObj(v) && v.kind === 'route' && isSourceId(v.source) && isStr(v.id) && isStr(v.fromCity) && isStr(v.toCity) &&
    (v.lowPrice === null || isPositive(v.lowPrice)) && v.currency === 'TRY' && isNullableNumber(v.offerCount) &&
    isNullableNumber(v.durationMinutes) && isNullableNumber(v.distanceKm) && isNullableClock(v.firstDeparture) && isNullableClock(v.lastDeparture) &&
    isStrArray(v.departureStops) && isStrArray(v.arrivalStops) && isNullableStr(v.operatorName) && isNullableStr(v.operatorLogoUrl) &&
    v.hasTimetable === false && isHttps(v.sourceUrl) && !('price' in v) && !('departureTime' in v)
  );
}

function isOfferOfKind(kind: SourceKind, v: unknown): v is SourceOffer {
  // Bus queries may answer with route facts from sources that publish no timetable (flixbus).
  return kind === 'bus' ? isSourceBusTrip(v) || isSourceRouteFacts(v) : kind === 'flight' ? isSourceFlight(v) : isSourceHotel(v);
}

export interface ParsedEnvelope {
  envelope: SearchEnvelope;
  /** Items the guard refused across all sources (already removed from `envelope`). */
  dropped: number;
}

/** Validates and normalises a `/api/search` body; null when the envelope itself is malformed. */
export function parseSearchEnvelope(json: unknown): ParsedEnvelope | null {
  if (!isObj(json) || json.success !== true) return null;
  const kind = json.kind;
  if (!isStr(kind) || !(KINDS as readonly string[]).includes(kind)) return null;
  if (!Array.isArray(json.results) || !Array.isArray(json.requested) || !isStr(json.generatedAt)) return null;
  const query = isObj(json.query) ? json.query : {};
  let dropped = 0;
  const results: SourceResult[] = [];
  for (const raw of json.results) {
    if (!isObj(raw) || !isStr(raw.source)) return null;
    if (raw.success === false) {
      if (!isStr(raw.errorCode) || !isStr(raw.error)) return null;
      const failure: SourceFailure = { success: false, source: raw.source as SourceId, errorCode: raw.errorCode, error: raw.error };
      if (typeof raw.retryAfterSeconds === 'number' && Number.isFinite(raw.retryAfterSeconds)) failure.retryAfterSeconds = raw.retryAfterSeconds;
      results.push(failure);
      continue;
    }
    if (raw.success !== true || !isSourceId(raw.source) || raw.kind !== kind || !isStr(raw.routeKey) || !isHttps(raw.sourceUrl)) return null;
    if ((raw.fetchedVia !== 'direct' && raw.fetchedVia !== 'cache') || !isStr(raw.scrapedAt) || !Array.isArray(raw.items)) return null;
    const items: SourceOffer[] = [];
    for (const item of raw.items) {
      if (isOfferOfKind(kind as SourceKind, item) && item.source === raw.source) items.push(item);
      else dropped += 1;
    }
    let minPrice: number | null = null;
    for (const item of items) {
      // Route facts carry a starting price (lowPrice) instead of a per-departure price.
      const price = 'price' in item ? item.price : 'lowPrice' in item ? item.lowPrice : null;
      if (price !== null) minPrice = minPrice === null ? price : Math.min(minPrice, price);
    }
    const success: SourceSuccess = {
      success: true,
      source: raw.source,
      kind: kind as SourceKind,
      routeKey: raw.routeKey,
      sourceUrl: raw.sourceUrl,
      fetchedVia: raw.fetchedVia,
      scrapedAt: raw.scrapedAt,
      latencyMs: typeof raw.latencyMs === 'number' ? raw.latencyMs : 0,
      items,
      minPrice,
      warnings: Array.isArray(raw.warnings) ? raw.warnings.filter((w): w is string => typeof w === 'string') : [],
    };
    results.push(success);
  }
  const cheapestBySource: Record<string, number | null> = {};
  for (const r of results) if (r.success) cheapestBySource[r.source] = r.minPrice;
  return {
    envelope: {
      success: true,
      kind: kind as SourceKind,
      query: { from: isStr(query.from) ? query.from : undefined, to: isStr(query.to) ? query.to : undefined, city: isStr(query.city) ? query.city : undefined },
      requested: json.requested.filter(isSourceId),
      results,
      cheapestBySource,
      generatedAt: json.generatedAt,
    },
    dropped,
  };
}

export type SearchClientState =
  | { status: 'ok'; envelope: SearchEnvelope; dropped: number; receivedAt: string }
  | { status: 'error'; httpStatus: number | null; errorCode: string; message: string };

export interface FetchSearchOptions {
  signal?: AbortSignal;
  sources?: readonly SourceId[];
  refresh?: boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: () => Date;
}

/** Runs the multi-source search. Never throws for transport or contract problems; aborts surface as `aborted`. */
export async function fetchSearch(query: SourceQuery, opts: FetchSearchOptions = {}): Promise<SearchClientState> {
  const fetchImpl = opts.fetchImpl ?? (typeof fetch === 'function' ? (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init) : undefined);
  if (!fetchImpl) return { status: 'error', httpStatus: null, errorCode: 'no_fetch', message: 'Bu ortamda fetch yok.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? SEARCH_CLIENT_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  opts.signal?.addEventListener('abort', onOuterAbort);
  try {
    const res = await fetchImpl(buildSearchUrl(query, opts.sources, opts.refresh === true), { headers: { Accept: 'application/json' }, signal: controller.signal });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!res.ok) {
      const code = isObj(body) && isStr(body.errorCode) ? body.errorCode : `http_${res.status}`;
      const message = isObj(body) && isStr(body.error) ? body.error : `Arama servisi ${res.status} döndürdü.`;
      return { status: 'error', httpStatus: res.status, errorCode: code, message };
    }
    const parsed = parseSearchEnvelope(body);
    if (!parsed) return { status: 'error', httpStatus: res.status, errorCode: 'invalid_response', message: 'Arama yanıtı doğrulanamadı.' };
    return { status: 'ok', envelope: parsed.envelope, dropped: parsed.dropped, receivedAt: (opts.now ?? (() => new Date()))().toISOString() };
  } catch (err) {
    if (opts.signal?.aborted) return { status: 'error', httpStatus: null, errorCode: 'aborted', message: 'Arama iptal edildi.' };
    if (controller.signal.aborted) return { status: 'error', httpStatus: null, errorCode: 'timeout', message: 'Arama servisi zamanında yanıt vermedi.' };
    return { status: 'error', httpStatus: null, errorCode: 'network_error', message: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onOuterAbort);
  }
}
