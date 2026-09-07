/**
 * Live network smoke over TURNA_PRESETS plus the Phase 2 checks (NOT part of `npm test`).
 *
 *   npm run smoke:turna                                              # in-process pipeline: every preset, then the checks
 *   TURNA_SMOKE_ONLY=flight,bus TURNA_SMOKE_LIMIT=3 npm run smoke:turna
 *   TURNA_SMOKE_PRESETS=0 npm run smoke:turna                        # only the checks (Phase 2 and Phase 3)
 *   TURNA_SMOKE_PRESETS=0 TURNA_SMOKE_CHECKS=3 npm run smoke:turna   # only the Phase 3 checks (history, delta, ?stats=1)
 *   TURNA_SMOKE_BASE_URL=http://127.0.0.1:5173 npm run smoke:turna   # go through a running /api/turna instead of in-process
 *
 * Presets print one line each: status, errorCode or item count, fetchedVia, latency. The Phase 2 checks
 * (kind=car&city=istanbul: items > 0, stats present, every dailyPrice > 0; kind=hotel&city=antalya: items > 0,
 * stats null) print PASS, FAIL or SKIP. A documented network error code (blocked, rate_limited,
 * upstream_unavailable, route_not_found, no_structured_data, robots_disallowed) is a SKIP, never a failure, so CI
 * is never network-dependent. The exit code is 1 only when a check FAILS on a successful (HTTP 200) response,
 * which means the live contract changed; everything else exits 0.
 */
import { TURNA_PRESETS } from '../src/lib/turna/types';
import type { TurnaQuery, TurnaSuccess } from '../src/lib/turna/types';
import { buildTurnaUrl } from '../src/lib/turna/client';
import { parseTurnaResponse } from '../src/lib/turna/guard';
import { runTurnaQuery } from '../src/server/turna/pipeline';
import type { TurnaOutcome } from '../src/server/turna/pipeline';
import { handleTurnaHttp } from '../src/server/turna/http';
import type { MetricsSnapshot } from '../src/server/turna/metrics';

const onlyKinds = (process.env.TURNA_SMOKE_ONLY ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const limit = Number(process.env.TURNA_SMOKE_LIMIT ?? '0');
const runPresets = !['0', 'false', 'off', 'no'].includes((process.env.TURNA_SMOKE_PRESETS ?? '1').trim().toLowerCase());
const checksMode = (process.env.TURNA_SMOKE_CHECKS ?? '1').trim().toLowerCase();
const runChecks = !['0', 'false', 'off', 'no'].includes(checksMode);
/** TURNA_SMOKE_CHECKS=2 runs only the Phase 2 checks, =3 only the Phase 3 checks; anything else runs both. */
const runPhase2 = runChecks && checksMode !== '3';
const runPhase3 = runChecks && checksMode !== '2';
const baseUrl = (process.env.TURNA_SMOKE_BASE_URL ?? '').trim().replace(/\/+$/, '');

/** Error codes a live run may legitimately produce when turna.com or the network is not cooperating. */
const NETWORK_ERROR_CODES = new Set(['blocked', 'rate_limited', 'upstream_unavailable', 'route_not_found', 'no_structured_data', 'robots_disallowed']);

interface SmokeResult {
  out: TurnaOutcome;
  /** Items the browser guard refused (HTTP mode only; the in-process body is not re-validated). */
  dropped: number;
  ms: number;
}

/** In-process pipeline by default; with TURNA_SMOKE_BASE_URL the request goes through the real HTTP handler. */
async function run(query: TurnaQuery): Promise<SmokeResult> {
  const startedAt = Date.now();
  if (!baseUrl) {
    const out = await runTurnaQuery(query);
    return { out, dropped: 0, ms: Date.now() - startedAt };
  }
  const url = `${baseUrl}${buildTurnaUrl(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  const parsed = json === null ? null : parseTurnaResponse(json);
  const ms = Date.now() - startedAt;
  if (!parsed) {
    return {
      out: { status: res.status, body: { success: false, error: `Yanıt doğrulanamadı (HTTP ${res.status}): ${text.slice(0, 120)}`, errorCode: 'invalid_response' } },
      dropped: 0,
      ms,
    };
  }
  const out: TurnaOutcome = { status: res.status, body: parsed.response };
  const retry = res.headers.get('Retry-After');
  if (retry && /^\d+$/.test(retry.trim())) out.retryAfterSeconds = Number(retry.trim());
  return { out, dropped: parsed.dropped, ms };
}

function describeFailure(label: string, r: SmokeResult): string {
  if (r.out.body.success) return '';
  const retry = r.out.retryAfterSeconds !== undefined ? ` retryAfter=${r.out.retryAfterSeconds}s` : '';
  return `${label} | HTTP ${r.out.status} ${r.out.body.errorCode}${retry} | ${r.out.body.error} | ${r.ms} ms`;
}

async function sweepPresets(): Promise<void> {
  let presets = TURNA_PRESETS.filter((p) => onlyKinds.length === 0 || onlyKinds.includes(p.kind));
  if (Number.isFinite(limit) && limit > 0) presets = presets.slice(0, limit);

  let ok = 0;
  let failed = 0;
  for (const preset of presets) {
    const query: TurnaQuery = { kind: preset.kind, from: preset.from, to: preset.to, city: preset.city };
    const label = `${preset.kind.padEnd(6)} ${preset.label}`;
    const r = await run(query);
    if (r.out.body.success) {
      ok += 1;
      const b = r.out.body;
      const summary = [label, `HTTP ${r.out.status}`, `items=${b.items.length}`, `via=${b.fetchedVia}`, `scrapedAt=${b.scrapedAt}`, `${r.ms} ms`];
      if (b.stats) summary.push(`min=${b.stats.min} TL`);
      if (b.warnings.length) summary.push(`warnings=${b.warnings.length}`);
      if (r.dropped) summary.push(`guardDropped=${r.dropped}`);
      console.log(summary.join(' | '));
      for (const w of b.warnings) console.log(`    - ${w}`);
    } else {
      failed += 1;
      console.log(describeFailure(label, r));
    }
  }
  console.log(`\n${ok} ok, ${failed} failed, ${presets.length} presets`);
}

// ---------------------------------------------------------------------------
// Phase 2 checks: the contract facts the UI relies on for the Otel and Araç tabs
// ---------------------------------------------------------------------------

interface Check {
  label: string;
  query: TurnaQuery;
  /** Returns the list of contract violations for a successful body (empty = PASS). */
  verify: (body: TurnaSuccess) => string[];
  /** Extra columns for the PASS line. */
  summary: (body: TurnaSuccess) => string[];
}

const CHECKS: Check[] = [
  {
    label: 'check  car istanbul',
    query: { kind: 'car', city: 'istanbul' },
    verify: (b) => {
      const problems: string[] = [];
      if (b.kind !== 'car') problems.push(`kind ${b.kind}`);
      if (b.routeKey !== 'car:istanbul') problems.push(`routeKey ${b.routeKey}`);
      if (b.items.length === 0) problems.push('items is empty');
      if (!b.stats) problems.push('stats is null (cars are priced per day, stats must be present)');
      if (b.stats && b.stats.byDay.length !== 0) problems.push('stats.byDay must be empty for cars');
      if (b.stats && !(b.stats.min > 0)) problems.push(`stats.min ${b.stats.min}`);
      for (const it of b.items) {
        if (it.kind !== 'car') problems.push(`item ${it.id} has kind ${it.kind}`);
        else if (!(Number.isFinite(it.dailyPrice) && it.dailyPrice > 0)) problems.push(`item ${it.id} dailyPrice ${it.dailyPrice}`);
      }
      return problems;
    },
    summary: (b) => {
      const cars = b.items.filter((i) => i.kind === 'car');
      const companies = new Set(cars.map((c) => c.company)).size;
      const withImage = cars.filter((c) => c.imageUrl).length;
      const withLogo = cars.filter((c) => c.companyLogoUrl).length;
      const stats = b.stats ? `min=${b.stats.min} median=${b.stats.median} max=${b.stats.max} TL/gün` : 'stats=null';
      return [`items=${b.items.length}`, stats, `companies=${companies}`, `images=${withImage}/${cars.length}`, `logos=${withLogo}/${cars.length}`];
    },
  },
  {
    label: 'check  hotel antalya',
    query: { kind: 'hotel', city: 'antalya' },
    verify: (b) => {
      const problems: string[] = [];
      if (b.kind !== 'hotel') problems.push(`kind ${b.kind}`);
      if (b.routeKey !== 'hotel:antalya') problems.push(`routeKey ${b.routeKey}`);
      if (b.items.length === 0) problems.push('items is empty');
      if (b.stats !== null) problems.push('stats must be null (hotel pages publish no prices)');
      for (const it of b.items) if (it.kind !== 'hotel') problems.push(`item ${it.id} has kind ${it.kind}`);
      return problems;
    },
    summary: (b) => {
      const hotels = b.items.filter((i) => i.kind === 'hotel');
      const stars = hotels.filter((h) => h.stars != null).length;
      const rich = hotels.filter((h) => h.amenities.length > 0 || h.tags.length > 0).length;
      const images = hotels.filter((h) => h.images.length > 0).length;
      return [`items=${b.items.length}`, 'stats=null', `stars=${stars}/${hotels.length}`, `amenitiesOrTags=${rich}/${hotels.length}`, `images=${images}/${hotels.length}`];
    },
  },
];

/** Returns true when a check FAILED on a successful response (a live contract change). */
async function runPhase2Checks(): Promise<boolean> {
  let contractFailure = false;
  for (const check of CHECKS) {
    const r = await run(check.query);
    if (r.out.body.success) {
      const b = r.out.body;
      const problems = check.verify(b);
      const columns = [check.label, problems.length ? 'FAIL' : 'PASS', `HTTP ${r.out.status}`, ...check.summary(b), `via=${b.fetchedVia}`, `${r.ms} ms`];
      if (r.dropped) columns.push(`guardDropped=${r.dropped}`);
      console.log(columns.join(' | '));
      for (const p of problems) console.log(`    ! ${p}`);
      for (const w of b.warnings) console.log(`    - ${w}`);
      if (problems.length) contractFailure = true;
    } else if (NETWORK_ERROR_CODES.has(r.out.body.errorCode)) {
      console.log(`${describeFailure(`${check.label} | SKIP (network)`, r)}`);
    } else {
      // invalid_query, internal_error, invalid_response: the endpoint itself is wrong, not the network.
      console.log(`${describeFailure(`${check.label} | FAIL`, r)}`);
      contractFailure = true;
    }
  }
  return contractFailure;
}

// ---------------------------------------------------------------------------
// Phase 3 checks: price history + delta envelope and the in-process request counters (?stats=1)
// ---------------------------------------------------------------------------

interface HttpJson {
  status: number;
  json: unknown;
  cacheControl: string | null;
  ms: number;
}

/** GET through the real HTTP handler: in-process `handleTurnaHttp`, or the running server when TURNA_SMOKE_BASE_URL is set. */
async function httpGet(pathAndQuery: string): Promise<HttpJson> {
  const startedAt = Date.now();
  if (!baseUrl) {
    const res = await handleTurnaHttp({ method: 'get', url: new URL(`http://smoke.local${pathAndQuery}`) });
    return { status: res.status, json: res.body ? JSON.parse(res.body) : null, cacheControl: res.headers['Cache-Control'] ?? null, ms: Date.now() - startedAt };
  }
  const res = await fetch(`${baseUrl}${pathAndQuery}`, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, cacheControl: res.headers.get('Cache-Control'), ms: Date.now() - startedAt };
}

const ISO_TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function isMetricsSnapshot(value: unknown): value is MetricsSnapshot {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v.success === true && v.kind === 'metrics' && typeof v.requests === 'number' && typeof v.latencyMs === 'object' && v.latencyMs !== null;
}

/** Returns true when a Phase 3 check FAILED on a successful response. */
async function runPhase3Checks(): Promise<boolean> {
  let contractFailure = false;

  // 1. History and delta ride on a normal route answer; one live (or cached) flight request.
  const flight = await httpGet('/api/turna?kind=flight&from=istanbul&to=ankara');
  const parsed = flight.json === null ? null : parseTurnaResponse(flight.json);
  if (!parsed) {
    console.log(`check  history/delta flight | FAIL | HTTP ${flight.status} | yanıt doğrulanamadı | ${flight.ms} ms`);
    contractFailure = true;
  } else if (parsed.response.success) {
    const b = parsed.response;
    const problems: string[] = [];
    if (!Array.isArray(b.history)) problems.push('history dizi değil');
    for (const h of b.history) {
      if (!ISO_TS.test(h.observedAt)) problems.push(`history.observedAt ISO değil: ${h.observedAt}`);
      if (!(h.minPrice === null || (typeof h.minPrice === 'number' && h.minPrice > 0))) problems.push(`history.minPrice geçersiz: ${String(h.minPrice)}`);
      if (typeof h.count !== 'number' || h.count < 0) problems.push(`history.count geçersiz: ${String(h.count)}`);
    }
    if (b.history.length > 60) problems.push(`history ${b.history.length} nokta (> 60)`);
    if (b.fetchedVia !== 'cache' && b.history.length === 0) problems.push('canlı alımdan sonra history boş (gözlem kaydedilmedi)');
    if (b.delta !== null) {
      if (b.stats === null || b.delta.currentMin !== b.stats.min) problems.push(`delta.currentMin ${b.delta.currentMin} != stats.min ${b.stats?.min ?? 'null'}`);
      if (!(typeof b.delta.previousMin === 'number' && b.delta.previousMin > 0)) problems.push('delta.previousMin geçersiz');
      if (Math.abs(b.delta.change - Math.round((b.delta.currentMin - b.delta.previousMin) * 100) / 100) > 0.011) problems.push('delta.change tutarsız');
      if (!ISO_TS.test(b.delta.previousObservedAt)) problems.push('delta.previousObservedAt ISO değil');
    }
    const deltaCol = b.delta ? `delta=${b.delta.changePct > 0 ? '+' : ''}${b.delta.changePct}%` : 'delta=null (ilk gözlem veya önbellek)';
    console.log([`check  history/delta flight`, problems.length ? 'FAIL' : 'PASS', `HTTP ${flight.status}`, `history=${b.history.length}`, deltaCol, `via=${b.fetchedVia}`, `${flight.ms} ms`].join(' | '));
    for (const p of problems) console.log(`    ! ${p}`);
    if (problems.length) contractFailure = true;
  } else if (NETWORK_ERROR_CODES.has(parsed.response.errorCode)) {
    console.log(`check  history/delta flight | SKIP (network) | HTTP ${flight.status} | ${parsed.response.errorCode} | ${flight.ms} ms`);
  } else {
    console.log(`check  history/delta flight | FAIL | HTTP ${flight.status} | ${parsed.response.errorCode}: ${parsed.response.error} | ${flight.ms} ms`);
    contractFailure = true;
  }

  // 2. The counters must be readable without touching Turna and must have seen the request above.
  const stats = await httpGet('/api/turna?stats=1');
  if (stats.status !== 200 || !isMetricsSnapshot(stats.json)) {
    console.log(`check  stats=1 | FAIL | HTTP ${stats.status} | metrics gövdesi değil | ${stats.ms} ms`);
    return true;
  }
  const m = stats.json;
  const problems: string[] = [];
  if (m.requests < 1) problems.push('requests 0 (yukarıdaki istek sayılmadı)');
  if ((m.byKind.flight ?? 0) < 1) problems.push('byKind.flight 0');
  if (m.latencyMs.samples < 1) problems.push('latency örneği yok');
  if (m.ok + m.failed !== m.requests) problems.push(`ok ${m.ok} + failed ${m.failed} != requests ${m.requests}`);
  if (!ISO_TS.test(m.since)) problems.push('since ISO değil');
  if (stats.cacheControl !== null && stats.cacheControl !== 'no-store') problems.push(`Cache-Control ${stats.cacheControl}`);
  if (m.cacheHitRate !== null && (m.cacheHitRate < 0 || m.cacheHitRate > 1)) problems.push(`cacheHitRate ${m.cacheHitRate}`);
  console.log([`check  stats=1`, problems.length ? 'FAIL' : 'PASS', `HTTP ${stats.status}`, `requests=${m.requests}`, `ok=${m.ok}`, `failed=${m.failed}`, `p95=${m.latencyMs.p95 ?? 'null'} ms`, `${stats.ms} ms`].join(' | '));
  for (const p of problems) console.log(`    ! ${p}`);
  return contractFailure || problems.length > 0;
}

async function main(): Promise<void> {
  console.log(baseUrl ? `mode: HTTP via ${baseUrl}/api/turna` : 'mode: in-process pipeline (runTurnaQuery)');
  if (runPresets) await sweepPresets();
  let contractFailure = false;
  if (runPhase2) {
    console.log('\nPhase 2 checks');
    if (await runPhase2Checks()) contractFailure = true;
  }
  if (runPhase3) {
    console.log('\nPhase 3 checks');
    if (await runPhase3Checks()) contractFailure = true;
  }
  if (runChecks) {
    if (contractFailure) {
      console.log('\nchecks: FAIL (live contract violated)');
      process.exitCode = 1;
    } else {
      console.log('\nchecks: no contract violation (PASS or SKIP only)');
    }
  }
}

main().catch((err: unknown) => {
  console.error('smoke crashed:', err instanceof Error ? err.stack ?? err.message : String(err));
  process.exitCode = 0;
});
