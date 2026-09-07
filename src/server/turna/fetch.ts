/**
 * SERVER ONLY. Direct-only, hardened HTML acquisition for turna.com landing pages.
 *
 * Port of nexora-panel/lib/turna/fetch.ts without the CRW engine strategies (bileo's deployment
 * has no engine). What is kept verbatim: BROWSER_HEADERS, looksBlocked, hasStructuredData.
 * What is added (spec section 3):
 *   - URL allowlist (assertAllowedTurnaUrl) and a best-effort robots.txt check before any call
 *   - positive cache that preserves the real fetch time, negative cache for deterministic failures
 *   - in-flight coalescing, per-host minimum interval with jitter, queue-depth fast-fail,
 *     per-minute rolling budget
 *   - Akamai block cooldown with stale-cache fallback
 *   - redirect / 404 / missing JSON-LD detection with honest error codes; redirects are never
 *     followed (`redirect: 'manual'`), so no request can leave the allowlisted landing page
 *   - retry only on transient failures, per-attempt timeout, total time budget (which also covers
 *     the robots.txt fetch and the host-gate wait), body size cap
 * All mutable state lives in one injectable TurnaRuntimeState; all side effects go through
 * injectable deps so tests never touch the network or the wall clock.
 */
import type { ResolvedTurnaTarget } from '../../lib/turna/urls';
import { isAllowedLandingUrl } from '../../lib/turna/urls';
import { ROBOTS_TIMEOUT_MS, checkRobots, createRobotsState } from './robots';
import type { RobotsState } from './robots';

// ---------------------------------------------------------------------------
// Constants and copy
// ---------------------------------------------------------------------------

export const MAX_CACHE_ENTRIES = 64;
/** More than this many requests already waiting for the host gate -> rate_limited fast-fail. */
export const MAX_HOST_QUEUE = 4;
export const FETCH_ATTEMPTS = 2;
export const ATTEMPT_TIMEOUT_MS = 10_000;
export const TOTAL_BUDGET_MS = 22_000;

export interface HostTimeouts {
  attemptTimeoutMs: number;
  totalBudgetMs: number;
}

/**
 * Slow hosts get a longer leash, but every total stays under the Vercel function limit (30 s) and the
 * browser client timeout (28 s). enuygun answers a route page in about 12 s, which the default 10 s
 * attempt would cut off; a 24 s attempt inside a 26 s budget leaves room for the robots.txt read.
 */
export const HOST_TIMEOUTS: Readonly<Record<string, HostTimeouts>> = {
  'www.enuygun.com': { attemptTimeoutMs: 24_000, totalBudgetMs: 26_000 },
  'www.flixbus.com.tr': { attemptTimeoutMs: 24_000, totalBudgetMs: 26_000 },
};

export function hostTimeouts(host: string): HostTimeouts {
  return HOST_TIMEOUTS[host.toLowerCase()] ?? { attemptTimeoutMs: ATTEMPT_TIMEOUT_MS, totalBudgetMs: TOTAL_BUDGET_MS };
}

/**
 * robots.txt read timeout for slow hosts. enuygun and flixbus answer every request in about 12.5 s, so the default
 * 5 s read always timed out there and the check fell open with a warning (seen live on flixbus, 2026-09-07). 12 s plus
 * one 12.5 s page fetch still fits the 26 s host budget; the parsed rules are then cached for 24 h.
 */
export const ROBOTS_TIMEOUT_SLOW_MS = 12_000;

/** 12 s for hosts with a raised per-host attempt timeout, the 5 s default for everyone else. */
export function robotsTimeoutMs(host: string): number {
  return hostTimeouts(host).attemptTimeoutMs > ATTEMPT_TIMEOUT_MS ? ROBOTS_TIMEOUT_SLOW_MS : ROBOTS_TIMEOUT_MS;
}
export const BODY_CAP_BYTES = 6 * 1024 * 1024;
export const BACKOFF_BASE_MS = 800;
export const BACKOFF_JITTER_MS = 400;
export const GATE_JITTER_MS = 300;
export const BUDGET_WINDOW_MS = 60_000;
export const RATE_LIMITED_RETRY_AFTER_S = 2;

export const REFRESH_THROTTLED_WARNING = 'Yenileme sınırı: dakikada bir';
export const BLOCKED_STALE_WARNING = 'Turna erişimi engelli; önbellek gösteriliyor';

export const BROWSER_HEADERS: Record<string, string> = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'upgrade-insecure-requests': '1',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
};

/** Akamai wall / empty shell detection. */
export function looksBlocked(html: string): boolean {
  if (html.length < 5_000) return true;
  return /<title>\s*Access Denied\s*<\/title>|errors\.edgesuite\.net|Reference&#32;&#35;/i.test(html.slice(0, 4_000));
}

/** JSON-LD or schema.org microdata: both are structured data a landing page publishes for search engines. */
export function hasStructuredData(html: string): boolean {
  return /application\/ld\+json/i.test(html) || /itemtype="https?:\/\/schema\.org\//i.test(html);
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export type TurnaFetchErrorCode =
  | 'blocked'
  | 'route_not_found'
  | 'no_structured_data'
  | 'upstream_unavailable'
  | 'rate_limited'
  | 'robots_disallowed'
  | 'invalid_query';

export interface TurnaFetchErrorInit {
  /** Upstream HTTP status when a response was received. */
  httpStatus?: number;
  retryAfterSeconds?: number;
  warnings?: string[];
}

export class TurnaFetchError extends Error {
  readonly errorCode: TurnaFetchErrorCode;
  readonly httpStatus?: number;
  readonly retryAfterSeconds?: number;
  readonly warnings: string[];

  constructor(errorCode: TurnaFetchErrorCode, message: string, init: TurnaFetchErrorInit = {}) {
    super(message);
    this.name = 'TurnaFetchError';
    this.errorCode = errorCode;
    if (init.httpStatus !== undefined) this.httpStatus = init.httpStatus;
    if (init.retryAfterSeconds !== undefined) this.retryAfterSeconds = init.retryAfterSeconds;
    this.warnings = init.warnings ?? [];
  }
}

// ---------------------------------------------------------------------------
// Configuration and dependencies
// ---------------------------------------------------------------------------

export interface FetchConfig {
  cacheTtlMs: number;
  minIntervalMs: number;
  blockCooldownMs: number;
  refreshMinMs: number;
  negCacheTtlMs: number;
  maxFetchesPerMin: number;
  respectRobots: boolean;
}

export const FETCH_DEFAULTS: Readonly<FetchConfig> = {
  cacheTtlMs: 600_000,
  minIntervalMs: 1_200,
  blockCooldownMs: 300_000,
  refreshMinMs: 60_000,
  negCacheTtlMs: 60_000,
  maxFetchesPerMin: 20,
  respectRobots: true,
};

export type EnvLike = Record<string, string | undefined>;

function envNumber(env: EnvLike, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function envFlag(env: EnvLike, key: string, fallback: boolean): boolean {
  const raw = env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  return !/^(0|false|off|no)$/i.test(raw.trim());
}

/** Read TURNA_* variables; malformed or missing values fall back to FETCH_DEFAULTS. */
export function readFetchConfig(env: EnvLike): FetchConfig {
  return {
    cacheTtlMs: envNumber(env, 'TURNA_CACHE_TTL_MS', FETCH_DEFAULTS.cacheTtlMs),
    minIntervalMs: envNumber(env, 'TURNA_MIN_INTERVAL_MS', FETCH_DEFAULTS.minIntervalMs),
    blockCooldownMs: envNumber(env, 'TURNA_BLOCK_COOLDOWN_MS', FETCH_DEFAULTS.blockCooldownMs),
    refreshMinMs: envNumber(env, 'TURNA_REFRESH_MIN_MS', FETCH_DEFAULTS.refreshMinMs),
    negCacheTtlMs: envNumber(env, 'TURNA_NEG_CACHE_TTL_MS', FETCH_DEFAULTS.negCacheTtlMs),
    maxFetchesPerMin: envNumber(env, 'TURNA_MAX_FETCHES_PER_MIN', FETCH_DEFAULTS.maxFetchesPerMin),
    respectRobots: envFlag(env, 'TURNA_RESPECT_ROBOTS', FETCH_DEFAULTS.respectRobots),
  };
}

export interface FetchDeps {
  fetchImpl: typeof fetch;
  /** Epoch milliseconds. */
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  /** Uniform [0, 1). */
  random: () => number;
  env: EnvLike;
}

export function defaultFetchDeps(): FetchDeps {
  return {
    fetchImpl: (input, init) => fetch(input, init),
    now: () => Date.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    random: () => Math.random(),
    env: process.env,
  };
}

// ---------------------------------------------------------------------------
// Runtime state
// ---------------------------------------------------------------------------

export interface CacheEntry {
  html: string;
  /** Epoch milliseconds of the upstream fetch that produced this HTML. */
  fetchedAt: number;
}

export interface NegativeEntry {
  errorCode: 'route_not_found' | 'no_structured_data';
  message: string;
  httpStatus?: number;
  until: number;
}

export interface HostGate {
  /** Epoch ms at which the last upstream request was (virtually) released; null before the first. */
  lastAt: number | null;
  /** Requests currently sleeping until their slot. */
  waiting: number;
}

/** Sliding one-minute window of upstream request timestamps (per instance). */
export class RollingBudget {
  private stamps: number[] = [];

  private prune(now: number, windowMs: number): void {
    const cutoff = now - windowMs;
    while (this.stamps.length > 0 && this.stamps[0] <= cutoff) this.stamps.shift();
  }

  tryConsume(now: number, limit: number, windowMs = BUDGET_WINDOW_MS): boolean {
    this.prune(now, windowMs);
    if (this.stamps.length >= limit) return false;
    this.stamps.push(now);
    return true;
  }

  retryAfterSeconds(now: number, windowMs = BUDGET_WINDOW_MS): number {
    this.prune(now, windowMs);
    if (this.stamps.length === 0) return RATE_LIMITED_RETRY_AFTER_S;
    return Math.max(RATE_LIMITED_RETRY_AFTER_S, Math.ceil((this.stamps[0] + windowMs - now) / 1000));
  }

  get size(): number {
    return this.stamps.length;
  }
}

export interface TurnaRuntimeState {
  cache: Map<string, CacheEntry>;
  negative: Map<string, NegativeEntry>;
  inflight: Map<string, Promise<FetchedPage>>;
  lastRefreshAt: Map<string, number>;
  hostGates: Map<string, HostGate>;
  blockedUntil: Map<string, number>;
  budget: RollingBudget;
  robots: RobotsState;
}

export function createRuntimeState(): TurnaRuntimeState {
  return {
    cache: new Map(),
    negative: new Map(),
    inflight: new Map(),
    lastRefreshAt: new Map(),
    hostGates: new Map(),
    blockedUntil: new Map(),
    budget: new RollingBudget(),
    robots: createRobotsState(),
  };
}

type GlobalWithState = typeof globalThis & { __bileoTurna?: TurnaRuntimeState };

/** Process-wide state: survives warm serverless invocations and Vite config reloads. */
export function defaultRuntimeState(): TurnaRuntimeState {
  const g = globalThis as GlobalWithState;
  if (!g.__bileoTurna) g.__bileoTurna = createRuntimeState();
  return g.__bileoTurna;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface FetchedPage {
  html: string;
  via: 'direct' | 'cache';
  /** ISO timestamp of the upstream fetch that produced `html` (preserved on cache hits). */
  fetchedAt: string;
  latencyMs: number;
  warnings: string[];
}

export interface FetchTurnaHtmlOptions {
  refresh?: boolean;
  deps?: Partial<FetchDeps>;
  state?: TurnaRuntimeState;
  /** Replaces the Turna landing-page allowlist for other sources (src/server/sources/registry.ts). Same strictness expected. */
  allow?: (url: string) => boolean;
}

/** Every outbound page fetch must pass the landing-page allowlist. */
export function assertAllowedTurnaUrl(url: string): void {
  if (!isAllowedLandingUrl(url)) {
    throw new TurnaFetchError('invalid_query', `İzin verilmeyen adres: ${url}`);
  }
}

export async function fetchTurnaHtml(
  target: Pick<ResolvedTurnaTarget, 'url'>,
  opts: FetchTurnaHtmlOptions = {},
): Promise<FetchedPage> {
  const deps: FetchDeps = { ...defaultFetchDeps(), ...opts.deps };
  const state = opts.state ?? defaultRuntimeState();
  const cfg = readFetchConfig(deps.env);
  const url = target.url;
  if (opts.allow) {
    if (!opts.allow(url)) throw new TurnaFetchError('invalid_query', `İzin verilmeyen adres: ${url}`);
  } else {
    assertAllowedTurnaUrl(url);
  }

  const started = deps.now();
  const host = new URL(url).host;
  const warnings: string[] = [];

  // Refresh bypasses the cache read but is throttled per URL.
  let refresh = opts.refresh === true;
  if (refresh) {
    const last = state.lastRefreshAt.get(url);
    if (last !== undefined && started - last < cfg.refreshMinMs) {
      refresh = false;
      warnings.push(REFRESH_THROTTLED_WARNING);
    }
  }

  const cached = state.cache.get(url);
  if (!refresh) {
    if (cached && started - cached.fetchedAt < cfg.cacheTtlMs) {
      return fromCache(cached, started, deps, warnings);
    }
    const negative = state.negative.get(url);
    if (negative && negative.until > started) {
      throw new TurnaFetchError(negative.errorCode, negative.message, { httpStatus: negative.httpStatus, warnings });
    }
  }

  // Active block cooldown: serve stale cache when we have it, otherwise fail honestly.
  const blockedUntil = state.blockedUntil.get(host) ?? 0;
  if (blockedUntil > started) {
    if (cached) {
      return fromCache(cached, started, deps, [...warnings, BLOCKED_STALE_WARNING]);
    }
    const retryAfterSeconds = Math.max(1, Math.ceil((blockedUntil - started) / 1000));
    throw new TurnaFetchError('blocked', blockedMessage(retryAfterSeconds), { retryAfterSeconds, warnings });
  }

  // Concurrent identical URLs share one upstream promise.
  let shared = state.inflight.get(url);
  if (!shared) {
    if (refresh) state.lastRefreshAt.set(url, started);
    shared = fetchUpstream(url, host, state, cfg, deps).finally(() => {
      state.inflight.delete(url);
    });
    state.inflight.set(url, shared);
  }
  const page = await shared;
  return { ...page, latencyMs: deps.now() - started, warnings: [...warnings, ...page.warnings] };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function blockedMessage(retryAfterSeconds: number): string {
  return `Turna.com erişimi geçici olarak engellendi; ${retryAfterSeconds} saniye sonra tekrar deneyin.`;
}

function fromCache(entry: CacheEntry, started: number, deps: FetchDeps, warnings: string[]): FetchedPage {
  return {
    html: entry.html,
    via: 'cache',
    fetchedAt: new Date(entry.fetchedAt).toISOString(),
    latencyMs: deps.now() - started,
    warnings,
  };
}

function storeInCache(state: TurnaRuntimeState, url: string, html: string, fetchedAt: number): void {
  if (!state.cache.has(url) && state.cache.size >= MAX_CACHE_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestAt = Number.POSITIVE_INFINITY;
    for (const [key, entry] of state.cache) {
      if (entry.fetchedAt < oldestAt) {
        oldestAt = entry.fetchedAt;
        oldestKey = key;
      }
    }
    if (oldestKey !== null) state.cache.delete(oldestKey);
  }
  state.cache.set(url, { html, fetchedAt });
}

function rememberNegative(
  state: TurnaRuntimeState,
  cfg: FetchConfig,
  url: string,
  now: number,
  errorCode: NegativeEntry['errorCode'],
  message: string,
  httpStatus?: number,
): TurnaFetchError {
  const entry: NegativeEntry = { errorCode, message, until: now + cfg.negCacheTtlMs };
  if (httpStatus !== undefined) entry.httpStatus = httpStatus;
  state.negative.set(url, entry);
  return new TurnaFetchError(errorCode, message, { httpStatus });
}

function blockHost(state: TurnaRuntimeState, cfg: FetchConfig, host: string, now: number, httpStatus?: number): TurnaFetchError {
  const until = now + cfg.blockCooldownMs;
  state.blockedUntil.set(host, until);
  const retryAfterSeconds = Math.max(1, Math.ceil(cfg.blockCooldownMs / 1000));
  return new TurnaFetchError('blocked', blockedMessage(retryAfterSeconds), { httpStatus, retryAfterSeconds });
}

function describeNetworkError(err: unknown, attemptTimeoutMs: number = ATTEMPT_TIMEOUT_MS): string {
  if (err instanceof Error) {
    if (err.name === 'TimeoutError') return `zaman aşımı (${attemptTimeoutMs / 1000} s)`;
    if (err.name === 'AbortError') return 'istek iptal edildi';
    const cause = (err as Error & { cause?: unknown }).cause;
    const code = cause && typeof cause === 'object' && 'code' in cause ? String((cause as { code: unknown }).code) : '';
    return code ? `${err.message} (${code})` : err.message;
  }
  return String(err);
}

function safePathname(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

/** Per-host politeness gate: queue-depth fast-fail, rolling budget, minimum interval plus jitter. */
async function acquireHostSlot(host: string, state: TurnaRuntimeState, cfg: FetchConfig, deps: FetchDeps): Promise<void> {
  let gate = state.hostGates.get(host);
  if (!gate) {
    gate = { lastAt: null, waiting: 0 };
    state.hostGates.set(host, gate);
  }
  if (gate.waiting > MAX_HOST_QUEUE) {
    throw new TurnaFetchError('rate_limited', 'Çok fazla eş zamanlı Turna isteği; birkaç saniye sonra tekrar deneyin.', {
      retryAfterSeconds: RATE_LIMITED_RETRY_AFTER_S,
    });
  }
  const now = deps.now();
  if (!state.budget.tryConsume(now, cfg.maxFetchesPerMin)) {
    const retryAfterSeconds = state.budget.retryAfterSeconds(now);
    throw new TurnaFetchError(
      'rate_limited',
      `Dakikalık Turna istek sınırına ulaşıldı; ${retryAfterSeconds} saniye sonra tekrar deneyin.`,
      { retryAfterSeconds },
    );
  }
  const readyAt = gate.lastAt === null ? now : gate.lastAt + cfg.minIntervalMs + Math.floor(deps.random() * GATE_JITTER_MS);
  const waitMs = Math.max(0, readyAt - now);
  gate.lastAt = Math.max(now, readyAt);
  if (waitMs > 0) {
    gate.waiting += 1;
    try {
      await deps.sleep(waitMs);
    } finally {
      gate.waiting -= 1;
    }
  }
}

async function readBodyCapped(res: Response, maxBytes: number): Promise<string> {
  const declared = Number(res.headers?.get?.('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new TurnaFetchError('upstream_unavailable', 'Turna yanıtı 6 MB sınırını aştı.', { httpStatus: res.status });
  }
  const body = res.body;
  if (!body || typeof body.getReader !== 'function') {
    const text = await res.text();
    if (Buffer.byteLength(text, 'utf8') > maxBytes) {
      throw new TurnaFetchError('upstream_unavailable', 'Turna yanıtı 6 MB sınırını aştı.', { httpStatus: res.status });
    }
    return text;
  }
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let total = 0;
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new TurnaFetchError('upstream_unavailable', 'Turna yanıtı 6 MB sınırını aştı.', { httpStatus: res.status });
    }
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}

async function discardBody(res: Response): Promise<void> {
  try {
    if (res.body && typeof res.body.cancel === 'function') await res.body.cancel();
  } catch {
    // Nothing to do: the connection is dropped either way.
  }
}

async function fetchUpstream(
  url: string,
  host: string,
  state: TurnaRuntimeState,
  cfg: FetchConfig,
  deps: FetchDeps,
): Promise<FetchedPage> {
  const started = deps.now();
  const timeouts = hostTimeouts(host);
  const deadline = started + timeouts.totalBudgetMs;
  const warnings: string[] = [];

  if (cfg.respectRobots) {
    const verdict = await checkRobots(url, state.robots, { fetchImpl: deps.fetchImpl, now: deps.now, headers: BROWSER_HEADERS, timeoutMs: robotsTimeoutMs(host) });
    if (!verdict.allowed) {
      throw new TurnaFetchError('robots_disallowed', `robots.txt bu adresi yasaklıyor: ${url}`, { warnings });
    }
    if (verdict.warning) warnings.push(verdict.warning);
  }

  const targetPath = new URL(url).pathname;
  const budgetExceeded = `toplam süre bütçesi (${timeouts.totalBudgetMs / 1000} s) aşıldı`;
  let lastReason = 'bilinmeyen hata';

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    if (deadline - deps.now() <= 0) {
      lastReason = budgetExceeded;
      break;
    }

    // The host-gate wait counts against the same budget: the per-attempt timeout is derived only
    // after the slot is acquired, so robots + gate + attempts can never overrun the deadline.
    await acquireHostSlot(host, state, cfg, deps);
    const remaining = deadline - deps.now();
    if (remaining <= 0) {
      lastReason = budgetExceeded;
      break;
    }

    let res: Response;
    try {
      res = await deps.fetchImpl(url, {
        method: 'GET',
        headers: BROWSER_HEADERS,
        // Never follow: a 3xx is handled below as route_not_found so the fetcher cannot be steered
        // onto a non-allowlisted path (a dated search page or a private API path) by the upstream.
        redirect: 'manual',
        signal: AbortSignal.timeout(Math.min(timeouts.attemptTimeoutMs, remaining)),
      });
    } catch (err) {
      lastReason = describeNetworkError(err, timeouts.attemptTimeoutMs);
      warnings.push(`direct: ${lastReason}`);
      if (attempt < FETCH_ATTEMPTS) await deps.sleep(BACKOFF_BASE_MS + Math.floor(deps.random() * BACKOFF_JITTER_MS));
      continue;
    }

    const status = res.status;
    const now = deps.now();

    if (status >= 300 && status < 400) {
      // Turna redirects unknown routes to its homepage; any redirect means "no landing page here".
      await discardBody(res);
      throw rememberNegative(
        state,
        cfg,
        url,
        now,
        'route_not_found',
        'Turna.com bu rota sayfasını başka bir sayfaya yönlendirdi; rota bulunamadı.',
        status,
      );
    }
    if (status === 403) {
      await discardBody(res);
      throw blockHost(state, cfg, host, now, status);
    }
    if (status === 404) {
      await discardBody(res);
      throw rememberNegative(state, cfg, url, now, 'route_not_found', 'Turna.com bu rota için sayfa yayımlamıyor (HTTP 404).', status);
    }
    if (status === 429 || status >= 500) {
      await discardBody(res);
      lastReason = `HTTP ${status}`;
      warnings.push(`direct: ${lastReason}`);
      if (attempt < FETCH_ATTEMPTS) await deps.sleep(BACKOFF_BASE_MS + Math.floor(deps.random() * BACKOFF_JITTER_MS));
      continue;
    }
    if (status !== 200) {
      await discardBody(res);
      throw new TurnaFetchError('upstream_unavailable', `Turna.com beklenmeyen yanıt verdi (HTTP ${status}).`, { httpStatus: status, warnings });
    }

    // Belt and braces: with redirect 'manual' the final URL should always equal the request URL.
    const finalPath = safePathname(res.url) ?? targetPath;
    if (finalPath !== targetPath) {
      await discardBody(res);
      throw rememberNegative(
        state,
        cfg,
        url,
        now,
        'route_not_found',
        'Turna.com bu rota sayfasını başka bir sayfaya yönlendirdi; rota bulunamadı.',
        status,
      );
    }

    // The per-attempt timeout also covers the body download; an abort here is transient too.
    let html: string;
    try {
      html = await readBodyCapped(res, BODY_CAP_BYTES);
    } catch (err) {
      if (err instanceof TurnaFetchError) throw err;
      lastReason = describeNetworkError(err);
      warnings.push(`direct: ${lastReason}`);
      if (attempt < FETCH_ATTEMPTS) await deps.sleep(BACKOFF_BASE_MS + Math.floor(deps.random() * BACKOFF_JITTER_MS));
      continue;
    }
    if (looksBlocked(html)) {
      throw blockHost(state, cfg, host, now, status);
    }
    if (!hasStructuredData(html)) {
      throw rememberNegative(state, cfg, url, now, 'no_structured_data', 'Turna sayfası yapısal veri (JSON-LD) içermiyor.', status);
    }

    const fetchedAt = deps.now();
    storeInCache(state, url, html, fetchedAt);
    state.negative.delete(url);
    return { html, via: 'direct', fetchedAt: new Date(fetchedAt).toISOString(), latencyMs: fetchedAt - started, warnings };
  }

  throw new TurnaFetchError('upstream_unavailable', `Turna.com yanıt vermedi (${FETCH_ATTEMPTS} deneme): ${lastReason}`, { warnings });
}
