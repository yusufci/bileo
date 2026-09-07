// Turna.com scraper integration suite (spec: TURNA_INTEGRATION.md sections 7 and 10).
// Groups: A urls, B parse, C analytics, D fetch hardening, E pipeline + HTTP contract,
// F history store, G guard + adapter + format + client, H local places autocomplete,
// I static guards, J SearchResults SSR (route, hotel and car screens, logo chain, ProvenanceStrip),
// K hotel and car (Phase 2: RSC payload, city kinds, logos), L Phase 2 UI static guards and pure helpers.
// Offline by construction: every fetch is injected.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import type { ServerResponse } from 'node:http';
import { describe, it, expect } from './test_framework';
import {
  page,
  flight,
  rscScripts,
  FLIGHT_PAGE,
  FLIGHT_PAGE_TITLE,
  BUS_PAGE,
  BUS_FACTS_ONLY_PAGE,
  HOTEL_PAGE,
  HOTEL_PAGE_RSC_HTML,
  HOTEL_PAGE_RSC_TITLE,
  HOTEL_RSC_ITEMS,
  CAR_PAGE_HTML,
  CAR_PAGE_TITLE,
  CAR_RSC_ITEMS,
  FERRY_PAGE,
  BLOCKED_PAGE,
  BLOCKED_PAGE_LONG,
  HOMEPAGE_PAGE,
  HOMEPAGE_TITLE,
  PRIVATE_API_URL,
  DATED_SEARCH_URL,
  DATED_SEARCH_SEGMENT,
  ROBOTS_ALLOW,
  ROBOTS_DENY_ALL,
  EMPTY_FACTS,
  SAMPLE_FLIGHT_OFFERS,
  SAMPLE_BUS_OFFERS,
  SAMPLE_CAR_OFFERS,
  PHASE1_HOTEL_WIRE,
  STRING_PRICE_OFFER,
  successEnvelope,
  asWireJson,
  fakeFetch,
  htmlResponse,
  jsonResponse,
  timeoutError,
  erroringBodyResponse,
} from './fixtures/turna_fixtures';
import type { FakeFetch, FetchScenario } from './fixtures/turna_fixtures';
import {
  slugifyTr,
  resolveTurnaTarget,
  TurnaQueryError,
  TURNA_ORIGIN,
  TURNA_CDN,
  KIND_PATH,
  KIND_LIST_LABEL,
  CITY_KINDS,
  isCityKind,
  isAllowedLandingUrl,
  airlineLogoUrl,
  busCompanyLogoUrl,
} from '../lib/turna/urls';
import { TURNA_PRESETS, TURNA_KINDS } from '../lib/turna/types';
import type { BusOffer, CarOffer, FlightOffer, HotelOffer, PriceStats, TurnaKind, TurnaOffer, TurnaSuccess } from '../lib/turna/types';
import { computeStats } from '../lib/turna/analytics';
import {
  isoClockHHMM,
  bileoDuration,
  parseBileoDurationMinutes,
  formatTrDate,
  formatDayChip,
  formatTrClock,
  priceTL,
  stripParenCode,
  isIsoDate,
} from '../lib/turna/format';
import {
  transportTypeToKind,
  kindToTransportType,
  airportNameByCode,
  isUnambiguousAirportCode,
  airportTerminalLabel,
  toRouteItems,
  SEARCH_KINDS,
  isSearchKind,
  searchKindToTurnaKind,
  turnaKindToSearchKind,
  turnaKindLabelTr,
} from '../lib/turna/adapter';
import { parseTurnaResponse, validateTurnaOffer } from '../lib/turna/guard';
import { fetchTurna, buildTurnaUrl, canonicalTurnaQuery, parseRetryAfter, TURNA_API_PATH } from '../lib/turna/client';
import {
  searchPlaces,
  searchPlacesForKind,
  findPlaceBySlug,
  popularCities,
  FERRY_STOPS,
  EXTRA_DISTRICTS,
  CAR_CITIES,
  findCarCity,
  readRecentSearches,
  writeRecentSearch,
  clearRecentSearches,
  RECENT_SEARCHES_KEY,
  RECENT_SEARCHES_MAX,
} from '../lib/turna/places';
import type { RecentSearch } from '../lib/turna/places';
import {
  extractJsonLd,
  extractTitle,
  extractRscText,
  extractRscArray,
  parseDurationMinutes,
  formatDuration,
  parseTrDateTime,
  parsePrice,
  stableId,
  decodeEntities,
  stripTags,
  parseFlights,
  parseBuses,
  parseHotels,
  parseCars,
  parseOffers,
  parseFacts,
} from '../server/turna/parse';
import {
  fetchTurnaHtml,
  createRuntimeState,
  TurnaFetchError,
  FETCH_DEFAULTS,
  readFetchConfig,
  RollingBudget,
  assertAllowedTurnaUrl,
  looksBlocked,
  hasStructuredData,
  REFRESH_THROTTLED_WARNING,
  BLOCKED_STALE_WARNING,
  MAX_CACHE_ENTRIES,
  MAX_HOST_QUEUE,
  FETCH_ATTEMPTS,
  BACKOFF_BASE_MS,
  RATE_LIMITED_RETRY_AFTER_S,
  TOTAL_BUDGET_MS,
  BROWSER_HEADERS,
} from '../server/turna/fetch';
import type { FetchDeps } from '../server/turna/fetch';
import { parseRobotsTxt, isPathAllowed, checkRobots, createRobotsState, ROBOTS_FETCH_FAILED_WARNING } from '../server/turna/robots';
import { toQuery, runTurnaQuery, STATUS_BY_ERROR_CODE, WARNING_NO_JSONLD, WARNING_NO_OFFERS } from '../server/turna/pipeline';
import type { PipelineDeps } from '../server/turna/pipeline';
import {
  handleTurnaHttp,
  serveTurnaNode,
  ALLOW_HEADER,
  CONTENT_TYPE_JSON,
  CACHE_CONTROL_PUBLIC,
  CACHE_CONTROL_PRIVATE,
  CACHE_CONTROL_NO_STORE,
  MAX_BODY_BYTES,
  INVALID_JSON_MESSAGE,
} from '../server/turna/http';
import type { NodeTurnaRequest } from '../server/turna/http';
import { apiMiddleware, turnaApiPlugin, TURNA_API_MOUNT } from '../server/turna/vitePlugin';
import {
  NoopHistoryStore,
  MemoryHistoryStore,
  MEMORY_HISTORY_LIMIT,
  PgHistoryStore,
  historyEnabled,
  createHistoryStore,
  TURNA_HISTORY_DDL,
  INSERT_OBSERVATION_SQL,
  INSERT_OFFER_SQL,
  SELECT_HISTORY_SQL,
  SELECT_PREVIOUS_SQL,
} from '../server/turna/history';
import type { TurnaHistoryStore, ObservationInput, PgPoolLike } from '../server/turna/history';
import { POPULAR_ROUTES } from '../data/mockData';
import { TURNA_SCRAPED_ROUTES } from '../data/turnaScrapedRoutes';
import type { LiveSearchState, RouteItem, SearchFilterState, SearchKind } from '../types';
import type { SearchResultsProps } from '../components/SearchResults';
import type { ProvenanceStripProps } from '../components/results/ProvenanceStrip';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const rel = (...parts: string[]): string => path.resolve(ROOT, ...parts);
const readText = (file: string): string => fs.readFileSync(file, 'utf8');
const HEX12 = /^[0-9a-f]{12}$/;
/** U+2013 en dash and U+2014 em dash, built from escapes so this file passes its own guard. */
const DASHES = new RegExp('[\\u2013\\u2014]');

const FLIGHT_TARGET = resolveTurnaTarget({ kind: 'flight', from: 'istanbul', to: 'ankara' });
const BUS_TARGET = resolveTurnaTarget({ kind: 'bus', from: 'istanbul', to: 'ankara' });
const FERRY_TARGET = resolveTurnaTarget({ kind: 'ferry', from: 'yalova', to: 'yenikapi' });
const CLOCK_START = Date.UTC(2026, 8, 6, 10, 0, 0);
const FETCHED_AT_ISO = '2026-09-06T10:00:00.000Z';

function walkFiles(dir: string, filter: (file: string) => boolean = () => true): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, filter));
    else if (filter(full)) out.push(full);
  }
  return out;
}

const isCodeFile = (file: string): boolean => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file);

/** Module specifiers of every static import, dynamic import and require in a source text. */
function importSpecifiers(source: string): string[] {
  const specs: string[] = [];
  const patterns = [
    /\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) for (const m of source.matchAll(re)) specs.push(m[1]);
  return specs;
}

function linesContaining(source: string, needle: string | RegExp): number[] {
  const hits: number[] = [];
  source.split(/\r?\n/).forEach((line, i) => {
    if (typeof needle === 'string' ? line.includes(needle) : needle.test(line)) hits.push(i + 1);
  });
  return hits;
}

async function rejectsWithFetchError(promise: Promise<unknown>): Promise<TurnaFetchError> {
  let caught: unknown = null;
  let rejected = false;
  try {
    await promise;
  } catch (err) {
    rejected = true;
    caught = err;
  }
  if (!rejected) throw new Error('Expected a TurnaFetchError rejection, but the promise resolved');
  if (!(caught instanceof TurnaFetchError)) {
    throw new Error(`Expected a TurnaFetchError, got ${caught instanceof Error ? `${caught.name}: ${caught.message}` : String(caught)}`);
  }
  return caught;
}

function throwsQueryError(fn: () => unknown): TurnaQueryError {
  try {
    fn();
  } catch (err) {
    if (err instanceof TurnaQueryError) return err;
    throw new Error(`Expected a TurnaQueryError, got ${String(err)}`);
  }
  throw new Error('Expected a TurnaQueryError, but the function returned normally');
}

interface FetchHarness {
  deps: FetchDeps;
  fake: FakeFetch;
  sleeps: number[];
  advance: (ms: number) => void;
  now: () => number;
}

/** Injected deps: fake fetch, frozen clock, recorded sleeps, zero jitter, robots disabled unless asked. */
function harness(scenario: FetchScenario, env: Record<string, string | undefined> = {}): FetchHarness {
  const fake = fakeFetch(scenario);
  const sleeps: number[] = [];
  let clock = CLOCK_START;
  const deps: FetchDeps = {
    fetchImpl: fake.fetchImpl,
    now: () => clock,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    random: () => 0,
    env: { TURNA_RESPECT_ROBOTS: '0', ...env },
  };
  return {
    deps,
    fake,
    sleeps,
    advance: (ms) => {
      clock += ms;
    },
    now: () => clock,
  };
}

const okPage: FetchScenario = (call) => htmlResponse(FLIGHT_PAGE, { url: call.url });

function pageStub(html: string, via: 'direct' | 'cache' = 'direct', fetchedAt = FETCHED_AT_ISO): PipelineDeps['fetchPage'] {
  return async () => ({ html, via, fetchedAt, latencyMs: 5, warnings: [] });
}

function failingPage(error: Error): PipelineDeps['fetchPage'] {
  return async () => {
    throw error;
  };
}

interface StoreSpy extends TurnaHistoryStore {
  records: ObservationInput[];
  historyCalls: string[];
  deltaCalls: Array<[string, string | null, number | null]>;
}

function spyStore(): StoreSpy {
  const spy: StoreSpy = {
    records: [],
    historyCalls: [],
    deltaCalls: [],
    async record(input) {
      spy.records.push(input);
      return { id: `obs_${spy.records.length}`, observedAt: FETCHED_AT_ISO };
    },
    async history(routeKey) {
      spy.historyCalls.push(routeKey);
      return [];
    },
    async delta(routeKey, currentId, currentMin) {
      spy.deltaCalls.push([routeKey, currentId, currentMin]);
      return null;
    },
  };
  return spy;
}

function expectSuccess(body: TurnaSuccess | { success: false; error: string; errorCode: string }): TurnaSuccess {
  if (!body.success) throw new Error(`Expected a TurnaSuccess body, got failure ${body.errorCode}: ${body.error}`);
  return body;
}

function expectLive<S extends LiveSearchState['status']>(state: LiveSearchState, status: S): Extract<LiveSearchState, { status: S }> {
  if (state.status !== status) throw new Error(`Expected live state '${status}' but got '${state.status}': ${JSON.stringify(state)}`);
  return state as Extract<LiveSearchState, { status: S }>;
}

// ---------------------------------------------------------------------------
// A. URLs
// ---------------------------------------------------------------------------

function registerUrlTests(): void {
  describe('Turna A: URL resolution and landing-page allowlist', () => {
    it('A.1 slugifyTr maps Turkish letters to turna.com URL segments', () => {
      expect(slugifyTr('İstanbul')).toBe('istanbul');
      expect(slugifyTr('Çeşme')).toBe('cesme');
      expect(slugifyTr('Şanlıurfa')).toBe('sanliurfa');
      expect(slugifyTr('Kahramanmaraş')).toBe('kahramanmaras');
      expect(slugifyTr('IĞDIR')).toBe('igdir');
      expect(slugifyTr('Gökçeada')).toBe('gokceada');
      expect(slugifyTr('Ağrı')).toBe('agri');
      expect(slugifyTr('Yenikapı')).toBe('yenikapi');
      expect(slugifyTr('Muğla')).toBe('mugla');
    });

    it('A.2 slugifyTr trims, lower-cases, collapses separators and strips diacritics', () => {
      expect(slugifyTr('  Ankara  ')).toBe('ankara');
      expect(slugifyTr('ISTANBUL')).toBe('istanbul');
      expect(slugifyTr('İstanbul Avrupa')).toBe('istanbul-avrupa');
      expect(slugifyTr('Kadıköy/İstanbul')).toBe('kadikoy-istanbul');
      expect(slugifyTr('Élan')).toBe('elan');
      expect(slugifyTr('')).toBe('');
      expect(slugifyTr('---')).toBe('');
    });

    it('A.3 resolveTurnaTarget builds the flight landing page from display names', () => {
      const target = resolveTurnaTarget({ kind: 'flight', from: 'İstanbul', to: 'Ankara' });
      expect(target.url).toBe(`${TURNA_ORIGIN}/${KIND_PATH.flight}/istanbul-ankara`);
      expect(target.url).toBe('https://www.turna.com/ucak-bileti/istanbul-ankara');
      expect(target.routeKey).toBe('flight:istanbul-ankara');
      expect(target.label).toBe('istanbul → ankara');
      expect(target.slugs).toEqual({ from: 'istanbul', to: 'ankara' });
      expect(target.kind).toBe('flight');
    });

    it('A.4 resolveTurnaTarget covers bus, ferry and hotel (city from city/to/from fallbacks)', () => {
      expect(resolveTurnaTarget({ kind: 'bus', from: 'istanbul', to: 'bursa' }).url).toBe('https://www.turna.com/otobus-bileti/istanbul-bursa');
      expect(resolveTurnaTarget({ kind: 'ferry', from: 'Yalova', to: 'Yenikapı' }).url).toBe('https://www.turna.com/feribot-bileti/yalova-yenikapi');
      const hotel = resolveTurnaTarget({ kind: 'hotel', city: 'Çeşme' });
      expect(hotel.url).toBe('https://www.turna.com/otel/cesme');
      expect(hotel.routeKey).toBe('hotel:cesme');
      expect(hotel.slugs).toEqual({ city: 'cesme' });
      expect(resolveTurnaTarget({ kind: 'hotel', to: 'Antalya' }).url).toBe('https://www.turna.com/otel/antalya');
      expect(resolveTurnaTarget({ kind: 'hotel', from: 'Bodrum' }).url).toBe('https://www.turna.com/otel/bodrum');
    });

    it('A.5 resolveTurnaTarget rejects identical endpoints, short or missing slugs and unknown kinds', () => {
      const same = throwsQueryError(() => resolveTurnaTarget({ kind: 'flight', from: 'İstanbul', to: 'istanbul' }));
      expect(same.errorCode).toBe('invalid_query');
      expect(same.message).toBe("'from' ve 'to' aynı olamaz.");
      expect(throwsQueryError(() => resolveTurnaTarget({ kind: 'bus', from: 'a', to: 'ankara' })).message).toContain("'from'");
      expect(throwsQueryError(() => resolveTurnaTarget({ kind: 'bus', from: 'istanbul' })).message).toContain("'to'");
      expect(throwsQueryError(() => resolveTurnaTarget({ kind: 'hotel' })).message).toContain("'city'");
      expect(throwsQueryError(() => resolveTurnaTarget({ kind: 'flight', from: 'x'.repeat(61), to: 'ankara' })).message).toContain('geçersiz');
      const kind = throwsQueryError(() => resolveTurnaTarget({ kind: 'train' as unknown as 'bus', from: 'a1', to: 'b2' }));
      expect(kind.message).toContain('flight | bus | hotel | ferry');
      expect(kind.name).toBe('TurnaQueryError');
      expect(kind instanceof Error).toBeTruthy();
    });

    it('A.6 every TURNA_PRESETS entry resolves to an allowed landing URL of its kind', () => {
      expect(TURNA_PRESETS).toHaveLength(20);
      expect(TURNA_PRESETS.filter((p) => p.kind === 'car').map((p) => p.city)).toEqual(['istanbul', 'ankara', 'izmir', 'antalya']);
      for (const preset of TURNA_PRESETS) {
        const target = resolveTurnaTarget({ kind: preset.kind, from: preset.from, to: preset.to, city: preset.city });
        expect(target.kind).toBe(preset.kind);
        expect(target.url.startsWith(`${TURNA_ORIGIN}/${KIND_PATH[preset.kind]}/`)).toBeTruthy();
        expect(isAllowedLandingUrl(target.url)).toBeTruthy();
        expect(target.routeKey.startsWith(`${preset.kind}:`)).toBeTruthy();
      }
      const ferryPresets = TURNA_PRESETS.filter((p) => p.kind === 'ferry');
      expect(ferryPresets.map((p) => `${p.from}-${p.to}`)).toEqual(['yalova-yenikapi', 'pendik-yalova']);
    });

    it('A.7 KIND_PATH is the five public landing families', () => {
      expect(KIND_PATH).toEqual({ flight: 'ucak-bileti', bus: 'otobus-bileti', hotel: 'otel', ferry: 'feribot-bileti', car: 'arac-kiralama/sehir' });
      expect(TURNA_ORIGIN).toBe('https://www.turna.com');
    });

    it('A.8 isAllowedLandingUrl accepts exactly the undated landing pages', () => {
      expect(isAllowedLandingUrl('https://www.turna.com/ucak-bileti/istanbul-ankara')).toBeTruthy();
      expect(isAllowedLandingUrl('https://www.turna.com/otobus-bileti/istanbul-bursa')).toBeTruthy();
      expect(isAllowedLandingUrl('https://www.turna.com/otel/cesme')).toBeTruthy();
      expect(isAllowedLandingUrl('https://www.turna.com/feribot-bileti/pendik-yalova')).toBeTruthy();
      expect(isAllowedLandingUrl('https://www.turna.com/otel/a1-b2-c3')).toBeTruthy();
    });

    it('A.9 isAllowedLandingUrl rejects the private API proxy and the dated one-way search page', () => {
      expect(PRIVATE_API_URL).toContain('/proxy/v1/meta/');
      expect(isAllowedLandingUrl(PRIVATE_API_URL)).toBeFalsy();
      expect(DATED_SEARCH_URL).toContain(`/ucak-bileti/${DATED_SEARCH_SEGMENT}/istanbul-ankara/2026-08-28`);
      expect(isAllowedLandingUrl(DATED_SEARCH_URL)).toBeFalsy();
    });

    it('A.10 isAllowedLandingUrl rejects scheme, host, case, query and trailing-segment variations', () => {
      expect(isAllowedLandingUrl('http://www.turna.com/ucak-bileti/istanbul-ankara')).toBeFalsy();
      expect(isAllowedLandingUrl('https://turna.com/ucak-bileti/istanbul-ankara')).toBeFalsy();
      expect(isAllowedLandingUrl('https://www.turna.com/ucak-bileti/Istanbul-ankara')).toBeFalsy();
      expect(isAllowedLandingUrl('https://www.turna.com/ucak-bileti/istanbul-ankara/')).toBeFalsy();
      expect(isAllowedLandingUrl('https://www.turna.com/ucak-bileti/istanbul-ankara?x=1')).toBeFalsy();
      expect(isAllowedLandingUrl('https://www.turna.com/ucak-bileti/istanbul-ankara/2026-09-24')).toBeFalsy();
      expect(isAllowedLandingUrl('https://www.turna.com/ucak-bileti/')).toBeFalsy();
      expect(isAllowedLandingUrl('https://www.turna.com/arac-kiralama/istanbul')).toBeFalsy();
      expect(isAllowedLandingUrl('https://www.turna.com/ucak-bileti/istanbul--ankara')).toBeFalsy();
      expect(isAllowedLandingUrl('https://www.turna.com/ucak-bileti/-istanbul')).toBeFalsy();
      expect(isAllowedLandingUrl('')).toBeFalsy();
    });
  });
}

// ---------------------------------------------------------------------------
// B. Parser (port of turna/tests/test_parse.py, JSON-LD part)
// ---------------------------------------------------------------------------

function registerParseTests(): void {
  describe('Turna B: JSON-LD parser', () => {
    it('B.1 parseDurationMinutes understands every Turkish duration spelling', () => {
      expect(parseDurationMinutes('1s')).toBe(60);
      expect(parseDurationMinutes('2s 10d')).toBe(130);
      expect(parseDurationMinutes('1 sa 25 dk')).toBe(85);
      expect(parseDurationMinutes('45 dakika')).toBe(45);
      expect(parseDurationMinutes('1 saat 25 dakika')).toBe(85);
      expect(parseDurationMinutes('1 saat')).toBe(60);
      expect(parseDurationMinutes('')).toBeNull();
      expect(parseDurationMinutes('yok')).toBeNull();
      expect(parseDurationMinutes(null)).toBeNull();
      expect(parseDurationMinutes(undefined)).toBeNull();
    });

    it('B.2 formatDuration renders the nexora "N sa M dk" label with fallback', () => {
      expect(formatDuration(60)).toBe('1 sa');
      expect(formatDuration(130)).toBe('2 sa 10 dk');
      expect(formatDuration(45)).toBe('45 dk');
      expect(formatDuration(null)).toBe('');
      expect(formatDuration(null, '2s 10d')).toBe('2s 10d');
    });

    it('B.3 parsePrice accepts numbers and Turkish formatted strings, rejects non-positive values', () => {
      expect(parsePrice(1401.11)).toBe(1401.11);
      expect(parsePrice('500,00')).toBe(500);
      expect(parsePrice('1.401,11')).toBe(1401.11);
      expect(parsePrice('1.500')).toBe(1500);
      expect(parsePrice('1401.11')).toBe(1401.11);
      expect(parsePrice('₺ 2.811')).toBe(2811);
      expect(parsePrice(0)).toBeNull();
      expect(parsePrice(-5)).toBeNull();
      expect(parsePrice(Number.NaN)).toBeNull();
      expect(parsePrice('')).toBeNull();
      expect(parsePrice(null)).toBeNull();
      expect(parsePrice(undefined)).toBeNull();
      expect(parsePrice(true)).toBeNull();
    });

    it('B.4 parseTrDateTime normalises dd.mm.yyyy and ISO inputs to +03:00', () => {
      expect(parseTrDateTime('13.09.2026 11:29:00')).toBe('2026-09-13T11:29:00+03:00');
      expect(parseTrDateTime('13.09.2026 11:29')).toBe('2026-09-13T11:29:00+03:00');
      expect(parseTrDateTime('2026-09-24T09:50:00+03:00')).toBe('2026-09-24T09:50:00+03:00');
      expect(parseTrDateTime('2026-09-24T09:50')).toBe('2026-09-24T09:50:00+03:00');
      expect(parseTrDateTime('garbage')).toBeNull();
      expect(parseTrDateTime(null)).toBeNull();
      expect(parseTrDateTime('')).toBeNull();
    });

    it('B.5 stableId is deterministic, 12 hex characters and sensitive to every part', () => {
      expect(stableId('a', 1, null)).toBe(stableId('a', 1, null));
      expect(stableId('a', 1) === stableId('a', 2)).toBeFalsy();
      expect(stableId('x')).toHaveLength(12);
      expect(stableId('x')).toMatch(HEX12);
      expect(stableId('a', null)).toBe(stableId('a', undefined));
      expect(stableId('a', null)).toBe(stableId('a', ''));
    });

    it('B.6 stableId parity with the Python package: the first fixture flight is eee39b67f15c', () => {
      expect(stableId('flight', 'Pegasus', '2026-09-24T09:50:00+03:00', '2026-09-24T10:50:00+03:00', 1401.11)).toBe('eee39b67f15c');
      const flights = parseFlights(extractJsonLd(FLIGHT_PAGE));
      expect(flights[0].id).toBe('eee39b67f15c');
    });

    it('B.7 extractJsonLd returns the blocks in document order and extractTitle decodes the title', () => {
      const blocks = extractJsonLd(FLIGHT_PAGE);
      expect(blocks.map((b) => b['@type'])).toEqual(['ItemList', 'BreadcrumbList', 'FAQPage']);
      expect(extractTitle(FLIGHT_PAGE)).toBe(FLIGHT_PAGE_TITLE);
      expect(extractTitle(HOMEPAGE_PAGE)).toBe(HOMEPAGE_TITLE);
      expect(extractTitle('<html><head></head></html>')).toBeNull();
      expect(extractTitle('<title>Fiyat &amp; Sefer</title>')).toBe('Fiyat & Sefer');
    });

    it('B.8 extractJsonLd flattens @graph, tolerates malformed and empty blocks', () => {
      const html =
        '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"A"},{"@type":"B"}]}</script>' +
        "<script type='application/ld+json'>{broken json</script>" +
        '<script type="application/ld+json"></script>' +
        '<script type="application/ld+json">[{"@type":"C"}]</script>';
      const blocks = extractJsonLd(html);
      expect(blocks.filter((b) => typeof b['@type'] === 'string').map((b) => b['@type'])).toEqual(['A', 'B', 'C']);
      expect(blocks).toHaveLength(4);
      expect(extractJsonLd(HOMEPAGE_PAGE)).toHaveLength(0);
      expect(extractJsonLd('')).toHaveLength(0);
    });

    it('B.9 parseFlights collapses the duplicate, drops the unpriced item and sorts by price', () => {
      const flights = parseFlights(extractJsonLd(FLIGHT_PAGE));
      expect(flights).toHaveLength(3);
      expect(flights.map((f) => f.price)).toEqual([1401.11, 1950.5, 2808]);
      for (const f of flights) {
        expect(f.id).toMatch(HEX12);
        expect(f.kind).toBe('flight');
        expect(f.currency).toBe('TRY');
        expect(f.isDirect).toBeNull();
      }
      expect(new Set(flights.map((f) => f.id)).size).toBe(3);
    });

    it('B.10 parseFlights normalises the first fixture flight field by field', () => {
      const first = parseFlights(extractJsonLd(FLIGHT_PAGE))[0];
      expect(first.airline).toBe('Pegasus');
      expect(first.airlineCode).toBe('PC');
      expect(first.fromName).toBe('İstanbul (IST)');
      expect(first.fromCode).toBe('IST');
      expect(first.toName).toBe('Ankara (ANK)');
      expect(first.toCode).toBe('ANK');
      expect(first.departureAt).toBe('2026-09-24T09:50:00+03:00');
      expect(first.arrivalAt).toBe('2026-09-24T10:50:00+03:00');
      expect(first.date).toBe('2026-09-24');
      expect(first.durationMinutes).toBe(60);
      expect(first.durationLabel).toBe('1 sa');
    });

    it('B.11 parseFlights keeps the AJet leg (2 sa 10 dk) and the Turkish-formatted price string', () => {
      const flights = parseFlights(extractJsonLd(FLIGHT_PAGE));
      const ajet = flights[2];
      expect(ajet.airline).toBe('AJet');
      expect(ajet.airlineCode).toBe('VF');
      expect(ajet.durationMinutes).toBe(130);
      expect(ajet.durationLabel).toBe('2 sa 10 dk');
      expect(ajet.date).toBe('2026-09-25');
      const middle = flights[1];
      expect(middle.price).toBe(1950.5);
      expect(middle.durationMinutes).toBe(75);
      expect(middle.durationLabel).toBe('1 sa 15 dk');
      expect(middle.date).toBe('2026-09-26');
    });

    it('B.12 parseBuses normalises standalone BusTrip blocks (dd.mm.yyyy, "500,00", TL)', () => {
      const buses = parseBuses(extractJsonLd(BUS_PAGE));
      expect(buses.map((b) => b.company)).toEqual(['Elazığ Hazar Turizm', 'Kamil Koç']);
      const cheap = buses[0];
      expect(cheap.kind).toBe('bus');
      expect(cheap.price).toBe(500);
      expect(cheap.currency).toBe('TRY');
      expect(cheap.departureAt).toBe('2026-09-13T11:29:00+03:00');
      expect(cheap.arrivalAt).toBe('2026-09-13T18:29:00+03:00');
      expect(cheap.date).toBe('2026-09-13');
      expect(cheap.durationMinutes).toBe(420);
      expect(cheap.durationLabel).toBe('7 sa');
      expect(cheap.fromStop).toBe('İstanbul Avrupa');
      expect(cheap.fromCity).toBe('İstanbul');
      expect(cheap.toStop).toBe('Ankara (Aşti)');
      expect(cheap.toCity).toBe('Ankara');
      expect(cheap.companyUrl).toBe('https://www.turna.com/otobus-bileti/elazığ-hazar-turizm');
      expect(buses[1].price).toBe(1250);
      expect(buses[1].durationMinutes).toBe(375);
      expect(buses[1].durationLabel).toBe('6 sa 15 dk');
    });

    it('B.13 bus ids are stableId(bus, company, departureAt, fromStop, price), computed by the TS function', () => {
      const buses = parseBuses(extractJsonLd(BUS_PAGE));
      const expected = buses.map((b) => stableId('bus', b.company, b.departureAt, b.fromStop, b.price));
      expect(buses.map((b) => b.id)).toEqual(expected);
      for (const id of expected) expect(id).toMatch(HEX12);
      expect(expected[0] === expected[1]).toBeFalsy();
      // Re-parsing yields the same ids (determinism across runs of the same input).
      expect(parseBuses(extractJsonLd(BUS_PAGE)).map((b) => b.id)).toEqual(expected);
    });

    it('B.14 parseHotels reads ratings, review counts and tolerates a hotel without rating', () => {
      const hotels = parseHotels(extractJsonLd(HOTEL_PAGE));
      expect(hotels).toHaveLength(2);
      const akra = hotels[0];
      expect(akra.kind).toBe('hotel');
      expect(akra.name).toBe('Akra Antalya');
      expect(akra.url).toBe('https://www.turna.com/otel/akra-antalya');
      expect(akra.rating).toBe(9.4);
      expect(akra.ratingBest).toBe(10);
      expect(akra.reviewCount).toBe(1735);
      expect(akra.image).toBe('https://i.travelapi.com/x.jpg');
      expect(akra.country).toBe('Türkiye');
      expect(akra.locality.startsWith('Antalya Merkez')).toBeTruthy();
      expect(akra.id).toBe(stableId('hotel', akra.url));
      const bare = hotels[1];
      expect(bare.rating).toBeNull();
      expect(bare.reviewCount).toBeNull();
      expect(bare.ratingBest).toBe(10);
      expect(bare.image).toBeNull();
      expect(bare.country).toBeNull();
    });

    it('B.15 parseOffers dispatches by kind and ferry pages never yield offers', () => {
      expect(parseOffers('ferry', extractJsonLd(FERRY_PAGE))).toHaveLength(0);
      expect(parseOffers('ferry', extractJsonLd(FLIGHT_PAGE))).toHaveLength(0);
      expect(parseOffers('flight', extractJsonLd(FLIGHT_PAGE))).toHaveLength(3);
      expect(parseOffers('bus', extractJsonLd(BUS_PAGE))).toHaveLength(2);
      expect(parseOffers('hotel', extractJsonLd(HOTEL_PAGE))).toHaveLength(2);
      expect(parseOffers('flight', extractJsonLd(BUS_PAGE))).toHaveLength(0);
    });

    it('B.16 parseFacts distils the flight FAQ (count, carriers, weekday, frequency, hubs)', () => {
      const facts = parseFacts(extractJsonLd(FLIGHT_PAGE));
      expect(facts.carriersCount).toBe(3);
      expect(facts.popularCarriers).toEqual(['Pegasus', 'Ajet', 'Türk Hava Yolları']);
      expect(facts.cheapestWeekday).toBe('Cuma');
      expect(facts.tripsPerWeek).toBe(210);
      expect(facts.tripsPerDay).toBe(30);
      expect(facts.departureHubs).toEqual(['İstanbul Havalimanı', 'Sabiha Gökçen Havalimanı']);
      expect(facts.arrivalHubs).toEqual(['Esenboğa Havalimanı']);
      expect(facts.shortestDurationMinutes).toBeNull();
      expect(facts.shortestDurationLabel).toBeNull();
      expect(facts.faq).toHaveLength(4);
      expect(facts.faq[1].question).toBe('Haftanın en ucuz günü?');
    });

    it('B.17 parseFacts distils bus and ferry FAQs (50 firms, Perşembe, 1 sa 25 dk, İdo)', () => {
      const bus = parseFacts(extractJsonLd(BUS_PAGE));
      expect(bus.carriersCount).toBe(50);
      expect(bus.popularCarriers).toEqual(['Seç Turizm', 'Villa Seyahat', 'Lüks Mersin']);
      expect(bus.cheapestWeekday).toBe('Perşembe');
      expect(bus.tripsPerWeek).toBeNull();
      const ferry = parseFacts(extractJsonLd(FERRY_PAGE));
      expect(ferry.shortestDurationMinutes).toBe(85);
      expect(ferry.shortestDurationLabel).toBe('1 sa 25 dk');
      expect(ferry.carriersCount).toBe(1);
      expect(ferry.popularCarriers).toEqual(['İdo']);
      expect(ferry.faq).toHaveLength(2);
      const empty = parseFacts(extractJsonLd(HOMEPAGE_PAGE));
      expect(empty).toEqual(EMPTY_FACTS);
    });

    it('B.18 decodeEntities and stripTags clean FAQ prose', () => {
      expect(decodeEntities('&amp;&quot;&#39;&lt;&gt;&nbsp;&#199;&#x15f;')).toBe('&"\'<> Çş');
      expect(stripTags('<p>Merhaba   <b>dünya</b>!</p>')).toBe('Merhaba dünya !');
    });

    it('B.19 looksBlocked and hasStructuredData classify the fixture pages', () => {
      expect(looksBlocked(BLOCKED_PAGE)).toBeTruthy();
      expect(looksBlocked(BLOCKED_PAGE_LONG)).toBeTruthy();
      expect(looksBlocked(FLIGHT_PAGE)).toBeFalsy();
      expect(looksBlocked(HOMEPAGE_PAGE)).toBeFalsy();
      expect(hasStructuredData(FLIGHT_PAGE)).toBeTruthy();
      expect(hasStructuredData(FERRY_PAGE)).toBeTruthy();
      expect(hasStructuredData(HOMEPAGE_PAGE)).toBeFalsy();
      expect(HOMEPAGE_PAGE.length).toBeGreaterThan(6000);
    });
  });
}

// ---------------------------------------------------------------------------
// C. Analytics
// ---------------------------------------------------------------------------

function registerAnalyticsTests(): void {
  describe('Turna C: price analytics', () => {
    it('C.1 computeStats returns null for empty input and for unpriced kinds (hotels)', () => {
      expect(computeStats([])).toBeNull();
      expect(computeStats(parseHotels(extractJsonLd(HOTEL_PAGE)))).toBeNull();
    });

    it('C.2 computeStats over the three fixture flights (odd count median)', () => {
      const stats = computeStats(parseFlights(extractJsonLd(FLIGHT_PAGE)));
      if (!stats) throw new Error('stats expected');
      expect(stats.count).toBe(3);
      expect(stats.min).toBe(1401.11);
      expect(stats.max).toBe(2808);
      expect(stats.avg).toBe(2053.2);
      expect(stats.median).toBe(1950.5);
      expect(stats.byCompany).toEqual([
        { name: 'Pegasus', count: 2, minPrice: 1401.11, avgPrice: 1675.8 },
        { name: 'AJet', count: 1, minPrice: 2808, avgPrice: 2808 },
      ]);
      expect(stats.byDay).toEqual([
        { date: '2026-09-24', minPrice: 1401.11, count: 1 },
        { date: '2026-09-25', minPrice: 2808, count: 1 },
        { date: '2026-09-26', minPrice: 1950.5, count: 1 },
      ]);
    });

    it('C.3 computeStats over the two fixture buses (even count median, same day grouped)', () => {
      const stats = computeStats(parseBuses(extractJsonLd(BUS_PAGE)));
      if (!stats) throw new Error('stats expected');
      expect(stats.count).toBe(2);
      expect(stats.min).toBe(500);
      expect(stats.max).toBe(1250);
      expect(stats.avg).toBe(875);
      expect(stats.median).toBe(875);
      expect(stats.byDay).toEqual([{ date: '2026-09-13', minPrice: 500, count: 2 }]);
      expect(stats.byCompany.map((c) => c.name)).toEqual(['Elazığ Hazar Turizm', 'Kamil Koç']);
    });

    it('C.4 computeStats ignores hotels in mixed input and orders companies by count then min price', () => {
      const items: TurnaOffer[] = [
        ...parseFlights(extractJsonLd(FLIGHT_PAGE)),
        ...parseBuses(extractJsonLd(BUS_PAGE)),
        ...parseHotels(extractJsonLd(HOTEL_PAGE)),
      ];
      const stats = computeStats(items);
      if (!stats) throw new Error('stats expected');
      expect(stats.count).toBe(5);
      expect(stats.min).toBe(500);
      expect(stats.max).toBe(2808);
      expect(stats.avg).toBe(1581.92);
      expect(stats.median).toBe(1401.11);
      expect(stats.byCompany.map((c) => [c.name, c.count])).toEqual([
        ['Pegasus', 2],
        ['Elazığ Hazar Turizm', 1],
        ['Kamil Koç', 1],
        ['AJet', 1],
      ]);
      expect(stats.byDay.map((d) => d.date)).toEqual(['2026-09-13', '2026-09-24', '2026-09-25', '2026-09-26']);
    });

    it('C.5 computeStats rounds to two decimals and every byDay date is ISO', () => {
      const items: TurnaOffer[] = [
        { ...SAMPLE_FLIGHT_OFFERS[0], id: 'a', price: 100.333 },
        { ...SAMPLE_FLIGHT_OFFERS[0], id: 'b', price: 100.336 },
      ];
      const stats = computeStats(items);
      if (!stats) throw new Error('stats expected');
      expect(stats.min).toBe(100.33);
      expect(stats.max).toBe(100.34);
      expect(stats.avg).toBe(100.33);
      expect(stats.byCompany[0].avgPrice).toBe(100.33);
      for (const day of stats.byDay) expect(isIsoDate(day.date)).toBeTruthy();
    });
  });
}

// ---------------------------------------------------------------------------
// D. Fetch hardening (src/server/turna/fetch.ts + robots.ts), fully offline
// ---------------------------------------------------------------------------

function registerFetchTests(): void {
  describe('Turna D: fetch hardening', () => {
    it('D.1 a direct fetch is followed by a cache hit that keeps the original fetchedAt', async () => {
      const state = createRuntimeState();
      const h = harness(okPage);
      const first = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      h.advance(5_000);
      const second = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      expect(first.via).toBe('direct');
      expect(first.fetchedAt).toBe(new Date(CLOCK_START).toISOString());
      expect(second.via).toBe('cache');
      expect(second.fetchedAt).toBe(first.fetchedAt);
      expect(second.html).toBe(FLIGHT_PAGE);
      expect(h.fake.calls).toHaveLength(1);
      expect(h.sleeps).toHaveLength(0);
      expect(h.fake.calls[0].method).toBe('GET');
      expect(h.fake.calls[0].headers['user-agent']).toBe(BROWSER_HEADERS['user-agent']);
      expect(h.fake.calls[0].headers.cookie).toBeUndefined();
      expect(h.fake.calls[0].init?.redirect).toBe('manual');
      expect(h.fake.calls[0].init?.cache).toBeUndefined();
    });

    it('D.2 the positive cache expires after TURNA_CACHE_TTL_MS', async () => {
      const state = createRuntimeState();
      const h = harness(okPage);
      await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      h.advance(FETCH_DEFAULTS.cacheTtlMs - 1);
      expect((await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps })).via).toBe('cache');
      h.advance(2);
      const refetched = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      expect(refetched.via).toBe('direct');
      expect(refetched.fetchedAt).toBe(new Date(h.now()).toISOString());
      expect(h.fake.calls).toHaveLength(2);
    });

    it('D.3 refresh bypasses the cache once per minute and is otherwise throttled with a warning', async () => {
      const state = createRuntimeState();
      const h = harness(okPage);
      await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      h.advance(1_000);
      const refreshed = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps, refresh: true });
      expect(refreshed.via).toBe('direct');
      expect(h.fake.calls).toHaveLength(2);
      h.advance(1_000);
      const throttled = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps, refresh: true });
      expect(throttled.via).toBe('cache');
      expect(throttled.warnings).toContain(REFRESH_THROTTLED_WARNING);
      expect(throttled.fetchedAt).toBe(refreshed.fetchedAt);
      expect(h.fake.calls).toHaveLength(2);
      h.advance(FETCH_DEFAULTS.refreshMinMs);
      const again = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps, refresh: true });
      expect(again.via).toBe('direct');
      expect(again.warnings).toHaveLength(0);
      expect(h.fake.calls).toHaveLength(3);
    });

    it('D.4 HTTP 403 raises blocked with a 300 s cooldown and the upstream status', async () => {
      const state = createRuntimeState();
      const h = harness((call) => htmlResponse('denied', { status: 403, url: call.url }));
      const err = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(err.errorCode).toBe('blocked');
      expect(err.httpStatus).toBe(403);
      expect(err.retryAfterSeconds).toBe(FETCH_DEFAULTS.blockCooldownMs / 1000);
      expect(err.message).toContain('300 saniye sonra tekrar deneyin');
      expect(DASHES.test(err.message)).toBeFalsy();
      expect(h.fake.calls).toHaveLength(1);
      expect(state.blockedUntil.get('www.turna.com')).toBe(CLOCK_START + FETCH_DEFAULTS.blockCooldownMs);
    });

    it('D.5 during a block cooldown a stale cache entry is served with a warning and zero upstream calls', async () => {
      const state = createRuntimeState();
      const h = harness((call) => (call.index === 1 ? htmlResponse(FLIGHT_PAGE, { url: call.url }) : htmlResponse('denied', { status: 403, url: call.url })));
      const fresh = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      h.advance(FETCH_DEFAULTS.cacheTtlMs + 1);
      const blocked = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(blocked.errorCode).toBe('blocked');
      h.advance(10_000);
      const stale = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      expect(stale.via).toBe('cache');
      expect(stale.fetchedAt).toBe(fresh.fetchedAt);
      expect(stale.warnings).toContain(BLOCKED_STALE_WARNING);
      expect(h.fake.calls).toHaveLength(2);
    });

    it('D.6 an Akamai wall served with HTTP 200 blocks; the cooldown answers without any upstream call', async () => {
      const state = createRuntimeState();
      const h = harness((call) => htmlResponse(BLOCKED_PAGE_LONG, { url: call.url }));
      const first = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(first.errorCode).toBe('blocked');
      expect(first.httpStatus).toBe(200);
      h.advance(60_000);
      const second = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(second.errorCode).toBe('blocked');
      expect(second.retryAfterSeconds).toBe(240);
      expect(second.httpStatus).toBeUndefined();
      expect(h.fake.calls).toHaveLength(1);
      // The short 127-character shell is blocked as well (size heuristic).
      const shortState = createRuntimeState();
      const shortH = harness((call) => htmlResponse(BLOCKED_PAGE, { url: call.url }));
      expect((await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state: shortState, deps: shortH.deps }))).errorCode).toBe('blocked');
    });

    it('D.7 upstream 404 is route_not_found and negatively cached for 60 s', async () => {
      const state = createRuntimeState();
      const h = harness((call) => htmlResponse('nope', { status: 404, url: call.url }));
      const first = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(first.errorCode).toBe('route_not_found');
      expect(first.httpStatus).toBe(404);
      expect(first.message).toBe('Turna.com bu rota için sayfa yayımlamıyor (HTTP 404).');
      h.advance(30_000);
      const cached = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(cached.errorCode).toBe('route_not_found');
      expect(cached.httpStatus).toBe(404);
      expect(h.fake.calls).toHaveLength(1);
      h.advance(FETCH_DEFAULTS.negCacheTtlMs);
      await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(h.fake.calls).toHaveLength(2);
    });

    it('D.8 a 200 whose final URL left the target path (homepage redirect) is route_not_found', async () => {
      const state = createRuntimeState();
      const h = harness(() => htmlResponse(HOMEPAGE_PAGE, { url: 'https://www.turna.com/' }));
      const err = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(err.errorCode).toBe('route_not_found');
      expect(err.message).toContain('yönlendirdi');
      expect(state.negative.get(FLIGHT_TARGET.url)?.errorCode).toBe('route_not_found');
    });

    it('D.9 a 200 on the right path without JSON-LD is no_structured_data (negatively cached)', async () => {
      const state = createRuntimeState();
      const h = harness((call) => htmlResponse(HOMEPAGE_PAGE, { url: call.url }));
      const err = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(err.errorCode).toBe('no_structured_data');
      expect(err.httpStatus).toBe(200);
      expect(err.message).toBe('Turna sayfası yapısal veri (JSON-LD) içermiyor.');
      await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(h.fake.calls).toHaveLength(1);
    });

    it('D.10 HTTP 429 is retried once after an 800 ms backoff and the host gate wait is recorded', async () => {
      const state = createRuntimeState();
      const h = harness((call) => (call.index === 1 ? htmlResponse('slow down', { status: 429, url: call.url }) : htmlResponse(FLIGHT_PAGE, { url: call.url })));
      const pageResult = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      expect(pageResult.via).toBe('direct');
      expect(pageResult.warnings).toEqual(['direct: HTTP 429']);
      expect(h.fake.calls).toHaveLength(2);
      expect(h.sleeps).toEqual([BACKOFF_BASE_MS, FETCH_DEFAULTS.minIntervalMs]);
    });

    it('D.11 HTTP 5xx is transient too: 503 then 200 succeeds with the warning recorded', async () => {
      const state = createRuntimeState();
      const h = harness((call) => (call.index === 1 ? htmlResponse('down', { status: 503, url: call.url }) : htmlResponse(FLIGHT_PAGE, { url: call.url })));
      const pageResult = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      expect(pageResult.warnings).toEqual(['direct: HTTP 503']);
      expect(h.fake.calls).toHaveLength(2);
    });

    it('D.12 two timeouts give upstream_unavailable after exactly FETCH_ATTEMPTS attempts', async () => {
      const state = createRuntimeState();
      const h = harness(() => {
        throw timeoutError();
      });
      const err = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(err.errorCode).toBe('upstream_unavailable');
      expect(err.message).toBe(`Turna.com yanıt vermedi (${FETCH_ATTEMPTS} deneme): zaman aşımı (10 s)`);
      expect(err.warnings).toEqual(['direct: zaman aşımı (10 s)', 'direct: zaman aşımı (10 s)']);
      expect(err.httpStatus).toBeUndefined();
      expect(h.fake.calls).toHaveLength(FETCH_ATTEMPTS);
      expect(h.sleeps).toEqual([BACKOFF_BASE_MS, FETCH_DEFAULTS.minIntervalMs]);
    });

    it('D.13 a timeout while downloading the body is transient and retried', async () => {
      const state = createRuntimeState();
      const h = harness((call) => (call.index === 1 ? erroringBodyResponse(timeoutError(), call.url) : htmlResponse(FLIGHT_PAGE, { url: call.url })));
      const pageResult = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      expect(pageResult.via).toBe('direct');
      expect(h.fake.calls).toHaveLength(2);
      expect(pageResult.warnings.some((w) => w.startsWith('direct: zaman aşımı'))).toBeTruthy();
    });

    it('D.14 the 22 s total budget stops a second attempt', async () => {
      const state = createRuntimeState();
      const h = harness(() => {
        h.advance(TOTAL_BUDGET_MS + 1_000);
        throw timeoutError();
      });
      const err = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(err.errorCode).toBe('upstream_unavailable');
      expect(err.message).toContain('toplam süre bütçesi (22 s) aşıldı');
      expect(h.fake.calls).toHaveLength(1);
    });

    it('D.15 a network error (no response) is transient; a 3xx is never followed and is route_not_found', async () => {
      const state = createRuntimeState();
      const h = harness((call) => {
        if (call.index === 1) throw new TypeError('fetch failed');
        return htmlResponse(FLIGHT_PAGE, { url: call.url });
      });
      const pageResult = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      expect(pageResult.warnings).toEqual(['direct: fetch failed']);
      for (const status of [301, 302, 307, 308]) {
        const other = createRuntimeState();
        const h2 = harness((call) => htmlResponse('', { status, url: call.url, headers: { location: `https://www.turna.com/ucak-bileti/${DATED_SEARCH_SEGMENT}/istanbul-ankara/2026-08-28` } }));
        const err = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state: other, deps: h2.deps }));
        expect(err.errorCode).toBe('route_not_found');
        expect(err.httpStatus).toBe(status);
        expect(err.message).toContain('yönlendirdi');
        // Exactly one request, to the landing page only: the Location target is never fetched.
        expect(h2.fake.calls).toHaveLength(1);
        expect(h2.fake.calls[0].url).toBe(FLIGHT_TARGET.url);
        expect(h2.fake.calls[0].init?.redirect).toBe('manual');
        expect(other.negative.get(FLIGHT_TARGET.url)?.errorCode).toBe('route_not_found');
      }
      const odd = createRuntimeState();
      const h3 = harness((call) => htmlResponse('', { status: 204, url: call.url }));
      const err = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state: odd, deps: h3.deps }));
      expect(err.errorCode).toBe('upstream_unavailable');
      expect(err.httpStatus).toBe(204);
      expect(h3.fake.calls).toHaveLength(1);
    });

    it('D.16 a declared body over 6 MB is refused before download', async () => {
      const state = createRuntimeState();
      const h = harness((call) => htmlResponse(FLIGHT_PAGE, { url: call.url, headers: { 'content-length': String(7 * 1024 * 1024) } }));
      const err = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(err.errorCode).toBe('upstream_unavailable');
      expect(err.message).toBe('Turna yanıtı 6 MB sınırını aştı.');
      expect(h.fake.calls).toHaveLength(1);
    });

    it('D.17 the per-host gate spaces distinct URLs by TURNA_MIN_INTERVAL_MS', async () => {
      const state = createRuntimeState();
      const h = harness(okPage);
      const izmir = resolveTurnaTarget({ kind: 'flight', from: 'istanbul', to: 'izmir' });
      const antalya = resolveTurnaTarget({ kind: 'flight', from: 'istanbul', to: 'antalya' });
      await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      await fetchTurnaHtml(izmir, { state, deps: h.deps });
      await fetchTurnaHtml(antalya, { state, deps: h.deps });
      expect(h.sleeps).toEqual([FETCH_DEFAULTS.minIntervalMs, FETCH_DEFAULTS.minIntervalMs * 2]);
      expect(h.fake.calls).toHaveLength(3);
      const relaxed = createRuntimeState();
      const h2 = harness(okPage, { TURNA_MIN_INTERVAL_MS: '0' });
      await fetchTurnaHtml(FLIGHT_TARGET, { state: relaxed, deps: h2.deps });
      await fetchTurnaHtml(izmir, { state: relaxed, deps: h2.deps });
      expect(h2.sleeps).toHaveLength(0);
    });

    it('D.18 concurrent identical URLs share one upstream request (in-flight coalescing)', async () => {
      const state = createRuntimeState();
      const h = harness(okPage);
      const [a, b, c] = await Promise.all([
        fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }),
        fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }),
        fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }),
      ]);
      expect(h.fake.calls).toHaveLength(1);
      expect(a.html).toBe(b.html);
      expect(a.fetchedAt).toBe(b.fetchedAt);
      expect(c.fetchedAt).toBe(a.fetchedAt);
      expect(state.inflight.size).toBe(0);
    });

    it('D.19 more than MAX_HOST_QUEUE waiting requests fail fast with rate_limited (Retry-After 2)', async () => {
      const state = createRuntimeState();
      const h = harness(okPage);
      const cities = ['ankara', 'izmir', 'antalya', 'bursa', 'trabzon', 'adana', 'konya'];
      expect(cities).toHaveLength(MAX_HOST_QUEUE + 3);
      const results = await Promise.allSettled(
        cities.map((to) => fetchTurnaHtml(resolveTurnaTarget({ kind: 'flight', from: 'istanbul', to }), { state, deps: h.deps })),
      );
      const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      expect(rejected).toHaveLength(1);
      expect(results[results.length - 1].status).toBe('rejected');
      const err = rejected[0].reason as TurnaFetchError;
      expect(err instanceof TurnaFetchError).toBeTruthy();
      expect(err.errorCode).toBe('rate_limited');
      expect(err.retryAfterSeconds).toBe(RATE_LIMITED_RETRY_AFTER_S);
      expect(h.fake.calls).toHaveLength(cities.length - 1);
    });

    it('D.20 the per-minute rolling budget yields rate_limited with a Retry-After of at least 2 s', async () => {
      const state = createRuntimeState();
      const h = harness(okPage, { TURNA_MAX_FETCHES_PER_MIN: '2' });
      await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      await fetchTurnaHtml(resolveTurnaTarget({ kind: 'flight', from: 'istanbul', to: 'izmir' }), { state, deps: h.deps });
      const err = await rejectsWithFetchError(fetchTurnaHtml(resolveTurnaTarget({ kind: 'flight', from: 'istanbul', to: 'antalya' }), { state, deps: h.deps }));
      expect(err.errorCode).toBe('rate_limited');
      expect(err.retryAfterSeconds).toBeGreaterThanOrEqual(RATE_LIMITED_RETRY_AFTER_S);
      expect(err.message).toContain('Dakikalık Turna istek sınırına ulaşıldı');
      expect(h.fake.calls).toHaveLength(2);
      const budget = new RollingBudget();
      expect(budget.tryConsume(0, 2)).toBeTruthy();
      expect(budget.tryConsume(0, 2)).toBeTruthy();
      expect(budget.tryConsume(0, 2)).toBeFalsy();
      expect(budget.retryAfterSeconds(0)).toBe(60);
      expect(budget.retryAfterSeconds(59_500)).toBe(RATE_LIMITED_RETRY_AFTER_S);
      expect(budget.tryConsume(60_000, 2)).toBeTruthy();
      expect(budget.size).toBe(1);
    });

    it('D.21 the cache holds at most 64 entries and evicts the oldest', async () => {
      const state = createRuntimeState();
      const h = harness(okPage, { TURNA_MIN_INTERVAL_MS: '0', TURNA_MAX_FETCHES_PER_MIN: '1000' });
      const urls: string[] = [];
      for (let i = 0; i <= MAX_CACHE_ENTRIES; i += 1) {
        const url = `https://www.turna.com/ucak-bileti/a${i}-b${i}`;
        urls.push(url);
        await fetchTurnaHtml({ url }, { state, deps: h.deps });
        h.advance(10);
      }
      expect(state.cache.size).toBe(MAX_CACHE_ENTRIES);
      expect(state.cache.has(urls[0])).toBeFalsy();
      expect(state.cache.has(urls[1])).toBeTruthy();
      expect(state.cache.has(urls[MAX_CACHE_ENTRIES])).toBeTruthy();
      expect(h.sleeps).toHaveLength(0);
    });

    it('D.22 assertAllowedTurnaUrl refuses non-landing URLs before any network call', async () => {
      expect(() => assertAllowedTurnaUrl(PRIVATE_API_URL)).toThrow('İzin verilmeyen adres');
      expect(() => assertAllowedTurnaUrl(DATED_SEARCH_URL)).toThrow();
      assertAllowedTurnaUrl(FLIGHT_TARGET.url);
      const state = createRuntimeState();
      const h = harness(okPage);
      const err = await rejectsWithFetchError(fetchTurnaHtml({ url: DATED_SEARCH_URL }, { state, deps: h.deps }));
      expect(err.errorCode).toBe('invalid_query');
      expect(h.fake.calls).toHaveLength(0);
    });

    it('D.23 readFetchConfig applies TURNA_* overrides and falls back on malformed values', () => {
      expect(readFetchConfig({})).toEqual(FETCH_DEFAULTS);
      expect(readFetchConfig({ TURNA_RESPECT_ROBOTS: undefined, TURNA_CACHE_TTL_MS: '' })).toEqual(FETCH_DEFAULTS);
      const custom = readFetchConfig({
        TURNA_CACHE_TTL_MS: '1000',
        TURNA_MIN_INTERVAL_MS: '0',
        TURNA_BLOCK_COOLDOWN_MS: '5000',
        TURNA_REFRESH_MIN_MS: '10',
        TURNA_NEG_CACHE_TTL_MS: '20',
        TURNA_MAX_FETCHES_PER_MIN: '3',
        TURNA_RESPECT_ROBOTS: '0',
      });
      expect(custom).toEqual({ cacheTtlMs: 1000, minIntervalMs: 0, blockCooldownMs: 5000, refreshMinMs: 10, negCacheTtlMs: 20, maxFetchesPerMin: 3, respectRobots: false });
      expect(readFetchConfig({ TURNA_CACHE_TTL_MS: 'abc' }).cacheTtlMs).toBe(FETCH_DEFAULTS.cacheTtlMs);
      expect(readFetchConfig({ TURNA_CACHE_TTL_MS: '-1' }).cacheTtlMs).toBe(FETCH_DEFAULTS.cacheTtlMs);
      for (const off of ['0', 'false', 'off', 'no', 'FALSE']) expect(readFetchConfig({ TURNA_RESPECT_ROBOTS: off }).respectRobots).toBeFalsy();
      for (const on of ['1', 'true', 'yes']) expect(readFetchConfig({ TURNA_RESPECT_ROBOTS: on }).respectRobots).toBeTruthy();
      expect(FETCH_DEFAULTS.cacheTtlMs).toBe(600_000);
      expect(FETCH_DEFAULTS.minIntervalMs).toBe(1_200);
      expect(FETCH_DEFAULTS.blockCooldownMs).toBe(300_000);
      expect(FETCH_DEFAULTS.refreshMinMs).toBe(60_000);
      expect(FETCH_DEFAULTS.negCacheTtlMs).toBe(60_000);
      expect(FETCH_DEFAULTS.maxFetchesPerMin).toBe(20);
    });

    it('D.24 parseRobotsTxt keeps only the User-agent: * group; isPathAllowed uses longest match, Allow wins ties', () => {
      const rules = parseRobotsTxt(ROBOTS_ALLOW);
      expect(rules.rules).toHaveLength(3);
      expect(isPathAllowed(rules, '/ucak-bileti/istanbul-ankara')).toBeTruthy();
      expect(isPathAllowed(rules, '/otel/cesme')).toBeTruthy();
      expect(isPathAllowed(rules, '/api/proxy/v1/meta/x')).toBeFalsy();
      expect(isPathAllowed(rules, `/ucak-bileti/${DATED_SEARCH_SEGMENT}/istanbul-ankara/2026-08-28`)).toBeFalsy();
      expect(isPathAllowed(rules, '/private/x')).toBeTruthy();
      expect(isPathAllowed(parseRobotsTxt(ROBOTS_DENY_ALL), '/ucak-bileti/istanbul-ankara')).toBeFalsy();
      const ties = parseRobotsTxt('User-agent: *\nDisallow: /a\nAllow: /a\n');
      expect(isPathAllowed(ties, '/a/b')).toBeTruthy();
      const wildcard = parseRobotsTxt('User-agent: *\nDisallow: /*.json$\nDisallow: /x*y\n');
      expect(isPathAllowed(wildcard, '/data.json')).toBeFalsy();
      expect(isPathAllowed(wildcard, '/data.json?x')).toBeTruthy();
      expect(isPathAllowed(wildcard, '/x123y')).toBeFalsy();
      expect(isPathAllowed(parseRobotsTxt('User-agent: *\nDisallow:\n'), '/anything')).toBeTruthy();
      expect(isPathAllowed(parseRobotsTxt('# comment only\n'), '/anything')).toBeTruthy();
      const grouped = parseRobotsTxt('User-agent: Googlebot\nUser-agent: *\nDisallow: /shared\n\nUser-agent: Bingbot\nDisallow: /bing\n');
      expect(isPathAllowed(grouped, '/shared/x')).toBeFalsy();
      expect(isPathAllowed(grouped, '/bing/x')).toBeTruthy();
    });

    it('D.25 checkRobots caches robots.txt per host and evaluates path plus query', async () => {
      const robots = createRobotsState();
      const fake = fakeFetch((call) => htmlResponse(ROBOTS_ALLOW, { url: call.url }));
      let clock = CLOCK_START;
      const deps = { fetchImpl: fake.fetchImpl, now: () => clock, headers: BROWSER_HEADERS };
      expect((await checkRobots(FLIGHT_TARGET.url, robots, deps)).allowed).toBeTruthy();
      expect((await checkRobots(DATED_SEARCH_URL, robots, deps)).allowed).toBeFalsy();
      expect((await checkRobots(PRIVATE_API_URL, robots, deps)).allowed).toBeFalsy();
      expect(fake.calls).toHaveLength(1);
      expect(fake.calls[0].url).toBe('https://www.turna.com/robots.txt');
      expect(fake.calls[0].headers['user-agent']).toBe(BROWSER_HEADERS['user-agent']);
      clock += 24 * 60 * 60 * 1000 + 1;
      await checkRobots(FLIGHT_TARGET.url, robots, deps);
      expect(fake.calls).toHaveLength(2);
    });

    it('D.26 robots deny-all raises robots_disallowed with zero page fetches', async () => {
      const state = createRuntimeState();
      const h = harness((call) => (call.url.endsWith('/robots.txt') ? htmlResponse(ROBOTS_DENY_ALL, { url: call.url }) : htmlResponse(FLIGHT_PAGE, { url: call.url })), {
        TURNA_RESPECT_ROBOTS: '1',
      });
      const err = await rejectsWithFetchError(fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps }));
      expect(err.errorCode).toBe('robots_disallowed');
      expect(err.message).toContain(FLIGHT_TARGET.url);
      expect(h.fake.urls()).toEqual(['https://www.turna.com/robots.txt']);
      expect(h.fake.pageCalls()).toHaveLength(0);
    });

    it('D.27 robots allow lets the page through and robots.txt is fetched once per host', async () => {
      const state = createRuntimeState();
      const h = harness((call) => (call.url.endsWith('/robots.txt') ? htmlResponse(ROBOTS_ALLOW, { url: call.url }) : htmlResponse(FLIGHT_PAGE, { url: call.url })), {
        TURNA_RESPECT_ROBOTS: '1',
      });
      const first = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      expect(first.via).toBe('direct');
      expect(first.warnings).toHaveLength(0);
      await fetchTurnaHtml(resolveTurnaTarget({ kind: 'flight', from: 'istanbul', to: 'izmir' }), { state, deps: h.deps });
      expect(h.fake.urls().filter((u) => u.endsWith('/robots.txt'))).toHaveLength(1);
      expect(h.fake.pageCalls()).toHaveLength(2);
    });

    it('D.28 robots.txt failures fail open: HTTP 403 and network errors carry a warning only', async () => {
      const state = createRuntimeState();
      const h = harness((call) => (call.url.endsWith('/robots.txt') ? htmlResponse('denied', { status: 403, url: call.url }) : htmlResponse(FLIGHT_PAGE, { url: call.url })), {
        TURNA_RESPECT_ROBOTS: '1',
      });
      const pageResult = await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      expect(pageResult.via).toBe('direct');
      expect(pageResult.warnings).toHaveLength(1);
      expect(pageResult.warnings[0].startsWith(ROBOTS_FETCH_FAILED_WARNING)).toBeTruthy();
      expect(pageResult.warnings[0]).toContain('(HTTP 403)');
      const state2 = createRuntimeState();
      const h2 = harness((call) => {
        if (call.url.endsWith('/robots.txt')) throw new TypeError('getaddrinfo ENOTFOUND');
        return htmlResponse(FLIGHT_PAGE, { url: call.url });
      }, { TURNA_RESPECT_ROBOTS: '1' });
      const second = await fetchTurnaHtml(FLIGHT_TARGET, { state: state2, deps: h2.deps });
      expect(second.warnings[0]).toBe(`${ROBOTS_FETCH_FAILED_WARNING} (getaddrinfo ENOTFOUND)`);
    });

    it('D.29 TurnaFetchError exposes errorCode, httpStatus, retryAfterSeconds and warnings', () => {
      const bare = new TurnaFetchError('blocked', 'engel');
      expect(bare.name).toBe('TurnaFetchError');
      expect(bare.errorCode).toBe('blocked');
      expect(bare.httpStatus).toBeUndefined();
      expect(bare.retryAfterSeconds).toBeUndefined();
      expect(bare.warnings).toEqual([]);
      expect(bare instanceof Error).toBeTruthy();
      const full = new TurnaFetchError('rate_limited', 'çok', { httpStatus: 429, retryAfterSeconds: 2, warnings: ['a'] });
      expect(full.httpStatus).toBe(429);
      expect(full.retryAfterSeconds).toBe(2);
      expect(full.warnings).toEqual(['a']);
    });

    it('D.30 the host-gate wait counts against the total budget: a wait that crosses the deadline makes no upstream call', async () => {
      const state = createRuntimeState();
      const h = harness(okPage);
      // The first request sets the gate; the second must wait minIntervalMs, and this sleep jumps
      // the clock past the whole budget (a saturated queue on a slow instance).
      await fetchTurnaHtml(FLIGHT_TARGET, { state, deps: h.deps });
      const slow: FetchDeps = {
        ...h.deps,
        sleep: async (ms) => {
          h.sleeps.push(ms);
          h.advance(TOTAL_BUDGET_MS + 1_000);
        },
      };
      const izmir = resolveTurnaTarget({ kind: 'flight', from: 'istanbul', to: 'izmir' });
      const err = await rejectsWithFetchError(fetchTurnaHtml(izmir, { state, deps: slow }));
      expect(err.errorCode).toBe('upstream_unavailable');
      expect(err.message).toContain(`toplam süre bütçesi (${TOTAL_BUDGET_MS / 1000} s) aşıldı`);
      expect(h.fake.calls).toHaveLength(1);
      expect(h.sleeps).toEqual([FETCH_DEFAULTS.minIntervalMs]);
      // Attempt timeouts are bounded by what is left after the gate wait, never the full 10 s.
      const tight = createRuntimeState();
      const h2 = harness(okPage);
      await fetchTurnaHtml(FLIGHT_TARGET, { state: tight, deps: h2.deps });
      const lateGate: FetchDeps = {
        ...h2.deps,
        sleep: async () => {
          h2.advance(TOTAL_BUDGET_MS - 3_000);
        },
      };
      const antalya = resolveTurnaTarget({ kind: 'flight', from: 'istanbul', to: 'antalya' });
      const page = await fetchTurnaHtml(antalya, { state: tight, deps: lateGate });
      expect(page.via).toBe('direct');
      expect(h2.fake.calls).toHaveLength(2);
      const signal = h2.fake.calls[1].init?.signal;
      expect(signal instanceof AbortSignal).toBeTruthy();
    });
  });
}

// ---------------------------------------------------------------------------
// E. Pipeline and HTTP contract
// ---------------------------------------------------------------------------

class FakeIncoming extends EventEmitter {
  method: string;
  url: string;
  headers: Record<string, string>;
  query?: unknown;
  body?: unknown;
  readableEnded = false;

  constructor(init: { method: string; url: string; headers?: Record<string, string>; query?: unknown; body?: unknown }) {
    super();
    this.method = init.method;
    this.url = init.url;
    this.headers = init.headers ?? { host: 'localhost:5173' };
    this.query = init.query;
    this.body = init.body;
  }

  resume(): this {
    return this;
  }
}

interface FakeServerResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  ended: boolean;
  done: Promise<void>;
  setHeader(key: string, value: string): void;
  end(chunk?: string): void;
}

function fakeRes(): FakeServerResponse {
  let resolveDone: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });
  const res: FakeServerResponse = {
    statusCode: 200,
    headers: {},
    body: '',
    ended: false,
    done,
    setHeader(key, value) {
      res.headers[key] = value;
    },
    end(chunk) {
      res.body = chunk ?? '';
      res.ended = true;
      resolveDone();
    },
  };
  return res;
}

const asReq = (req: FakeIncoming): NodeTurnaRequest => req as unknown as NodeTurnaRequest;
const asRes = (res: FakeServerResponse): ServerResponse => res as unknown as ServerResponse;

function registerPipelineTests(): void {
  describe('Turna E: pipeline and HTTP contract', () => {
    it('E.1 toQuery requires kind, lower-cases it and rejects unknown kinds', () => {
      expect(throwsQueryError(() => toQuery({})).message).toContain("'kind' zorunludur");
      expect(throwsQueryError(() => toQuery({ kind: '' })).message).toContain("'kind' zorunludur");
      expect(throwsQueryError(() => toQuery({ kind: 'train' })).message).toContain('flight | bus | hotel | ferry');
      expect(toQuery({ kind: 'FLIGHT' }).kind).toBe('flight');
      expect(toQuery({ kind: ' bus ' }).kind).toBe('bus');
    });

    it('E.2 toQuery takes the first array value, trims, drops empty params and normalises refresh', () => {
      expect(toQuery({ kind: ['bus', 'flight'], from: [' İstanbul '], to: 'Ankara', refresh: '1' })).toEqual({ kind: 'bus', refresh: true, from: 'İstanbul', to: 'Ankara' });
      expect(toQuery({ kind: 'hotel', city: 'Çeşme', refresh: 'true' })).toEqual({ kind: 'hotel', refresh: true, city: 'Çeşme' });
      expect(toQuery({ kind: 'ferry', refresh: true })).toEqual({ kind: 'ferry', refresh: true });
      expect(toQuery({ kind: 'flight', from: '   ', city: '', refresh: 'yes' })).toEqual({ kind: 'flight', refresh: false });
      expect(toQuery({ kind: 'flight' }).refresh).toBe(false);
    });

    it('E.3 runTurnaQuery turns the flight fixture into a complete TurnaSuccess (status 200)', async () => {
      const store = spyStore();
      const out = await runTurnaQuery({ kind: 'flight', from: 'İstanbul', to: 'Ankara' }, { fetchPage: pageStub(FLIGHT_PAGE), store, now: () => new Date(CLOCK_START) });
      expect(out.status).toBe(200);
      expect(out.retryAfterSeconds).toBeUndefined();
      const body = expectSuccess(out.body);
      expect(body.kind).toBe('flight');
      expect(body.query).toEqual({ kind: 'flight', from: 'İstanbul', to: 'Ankara' });
      expect(body.routeKey).toBe('flight:istanbul-ankara');
      expect(body.sourceUrl).toBe(FLIGHT_TARGET.url);
      expect(body.pageTitle).toBe(FLIGHT_PAGE_TITLE);
      expect(body.fetchedVia).toBe('direct');
      expect(body.scrapedAt).toBe(FETCHED_AT_ISO);
      expect(typeof body.latencyMs).toBe('number');
      expect(body.items).toHaveLength(3);
      expect(body.items[0].id).toBe('eee39b67f15c');
      expect(body.stats?.min).toBe(1401.11);
      expect(body.facts.cheapestWeekday).toBe('Cuma');
      expect(body.history).toEqual([]);
      expect(body.delta).toBeNull();
      expect(body.warnings).toEqual([]);
      expect(Object.keys(body).sort()).toEqual(
        ['delta', 'facts', 'fetchedVia', 'history', 'items', 'kind', 'latencyMs', 'pageTitle', 'query', 'routeKey', 'scrapedAt', 'sourceUrl', 'stats', 'success', 'warnings'],
      );
      expect(store.records).toHaveLength(1);
      expect(store.records[0].routeKey).toBe('flight:istanbul-ankara');
      expect(store.records[0].items).toHaveLength(3);
      expect(store.historyCalls).toEqual(['flight:istanbul-ankara']);
      expect(store.deltaCalls).toEqual([['flight:istanbul-ankara', 'obs_1', 1401.11]]);
    });

    it('E.4 a cache hit reports fetchedVia cache, scrapedAt equal to the original fetch time and no new observation', async () => {
      const store = spyStore();
      const out = await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(FLIGHT_PAGE, 'cache', '2026-09-06T09:00:00.000Z'), store });
      const body = expectSuccess(out.body);
      expect(body.fetchedVia).toBe('cache');
      expect(body.scrapedAt).toBe('2026-09-06T09:00:00.000Z');
      expect(store.records).toHaveLength(0);
      expect(store.historyCalls).toHaveLength(1);
      expect(store.deltaCalls).toEqual([['flight:istanbul-ankara', null, 1401.11]]);
    });

    it('E.5 the ferry landing page is facts-only: items [] with stats null and no missing-offer warning', async () => {
      const out = await runTurnaQuery({ kind: 'ferry', from: 'yalova', to: 'yenikapi' }, { fetchPage: pageStub(FERRY_PAGE), store: new NoopHistoryStore() });
      const body = expectSuccess(out.body);
      expect(body.kind).toBe('ferry');
      expect(body.sourceUrl).toBe(FERRY_TARGET.url);
      expect(body.items).toEqual([]);
      expect(body.stats).toBeNull();
      expect(body.facts.shortestDurationLabel).toBe('1 sa 25 dk');
      expect(body.facts.popularCarriers).toEqual(['İdo']);
      expect(body.warnings).toEqual([]);
    });

    it('E.6 flight/bus pages without offers or without JSON-LD carry the spec warnings', async () => {
      const bus = expectSuccess((await runTurnaQuery({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(BUS_FACTS_ONLY_PAGE), store: new NoopHistoryStore() })).body);
      expect(bus.items).toHaveLength(0);
      expect(bus.warnings).toEqual([WARNING_NO_OFFERS]);
      expect(bus.facts.carriersCount).toBe(50);
      const bare = expectSuccess((await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(HOMEPAGE_PAGE), store: new NoopHistoryStore() })).body);
      expect(bare.warnings).toEqual([WARNING_NO_JSONLD, WARNING_NO_OFFERS]);
      expect(bare.pageTitle).toBe(HOMEPAGE_TITLE);
      const busOffers = expectSuccess((await runTurnaQuery({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(BUS_PAGE), store: new NoopHistoryStore() })).body);
      expect(busOffers.items.map((i) => i.id)).toEqual(parseBuses(extractJsonLd(BUS_PAGE)).map((b) => b.id));
      expect(busOffers.stats?.median).toBe(875);
    });

    it('E.7 the page fetch warnings are prepended to the response warnings', async () => {
      const fetchPage: PipelineDeps['fetchPage'] = async () => ({ html: FLIGHT_PAGE, via: 'cache', fetchedAt: FETCHED_AT_ISO, latencyMs: 1, warnings: [BLOCKED_STALE_WARNING] });
      const body = expectSuccess((await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchPage, store: new NoopHistoryStore() })).body);
      expect(body.warnings).toEqual([BLOCKED_STALE_WARNING]);
    });

    it('E.8 a throwing history store only adds warnings; the response stays 200', async () => {
      const throwing: TurnaHistoryStore = {
        async record() {
          throw new Error('db down');
        },
        async history() {
          throw new Error('db down');
        },
        async delta() {
          return null;
        },
      };
      const out = await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(FLIGHT_PAGE), store: throwing });
      expect(out.status).toBe(200);
      const body = expectSuccess(out.body);
      expect(body.warnings).toEqual(['Gözlem kaydedilemedi: db down', 'Geçmiş okunamadı: db down']);
      expect(body.items).toHaveLength(3);
    });

    it('E.9 a hanging history store is bounded by storeTimeoutMs', async () => {
      const hanging: TurnaHistoryStore = {
        record: () => new Promise(() => undefined),
        history: () => new Promise(() => undefined),
        delta: async () => null,
      };
      const out = await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(FLIGHT_PAGE), store: hanging, storeTimeoutMs: 5 });
      const body = expectSuccess(out.body);
      expect(body.warnings).toEqual(['Gözlem kaydedilemedi: Gözlem kaydı 5 ms içinde tamamlanmadı', 'Geçmiş okunamadı: Geçmiş sorgusu 5 ms içinde tamamlanmadı']);
    });

    it('E.10 an invalid query is 400 before any fetch; fetch errors map to the spec status table', async () => {
      let fetches = 0;
      const counting: PipelineDeps['fetchPage'] = async () => {
        fetches += 1;
        return { html: FLIGHT_PAGE, via: 'direct', fetchedAt: FETCHED_AT_ISO, latencyMs: 1, warnings: [] };
      };
      const same = await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'İstanbul' }, { fetchPage: counting, store: new NoopHistoryStore() });
      expect(same.status).toBe(400);
      expect(same.body.success).toBe(false);
      if (!same.body.success) {
        expect(same.body.errorCode).toBe('invalid_query');
        expect(same.body.error).toBe("'from' ve 'to' aynı olamaz.");
      }
      expect(fetches).toBe(0);

      const cases: Array<[TurnaFetchError, number, number | undefined]> = [
        [new TurnaFetchError('blocked', 'engel', { retryAfterSeconds: 120 }), 503, 120],
        [new TurnaFetchError('rate_limited', 'çok'), 429, RATE_LIMITED_RETRY_AFTER_S],
        [new TurnaFetchError('rate_limited', 'çok', { retryAfterSeconds: 7 }), 429, 7],
        [new TurnaFetchError('route_not_found', 'yok', { httpStatus: 404 }), 404, undefined],
        [new TurnaFetchError('no_structured_data', 'yok'), 502, undefined],
        [new TurnaFetchError('upstream_unavailable', 'yok'), 502, undefined],
        [new TurnaFetchError('robots_disallowed', 'yasak'), 403, undefined],
        [new TurnaFetchError('invalid_query', 'adres'), 400, undefined],
      ];
      for (const [error, status, retryAfter] of cases) {
        const out = await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchPage: failingPage(error), store: new NoopHistoryStore() });
        expect(out.status).toBe(status);
        expect(out.retryAfterSeconds).toBe(retryAfter);
        if (out.body.success) throw new Error('failure body expected');
        expect(out.body.errorCode).toBe(error.errorCode);
        expect(out.body.error).toBe(error.message);
      }
      const crash = await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchPage: failingPage(new Error('kaboom')), store: new NoopHistoryStore() });
      expect(crash.status).toBe(500);
      if (!crash.body.success) expect(crash.body.errorCode).toBe('internal_error');
    });

    it('E.11 STATUS_BY_ERROR_CODE matches spec section 2', () => {
      expect(STATUS_BY_ERROR_CODE.invalid_query).toBe(400);
      expect(STATUS_BY_ERROR_CODE.invalid_json).toBe(400);
      expect(STATUS_BY_ERROR_CODE.robots_disallowed).toBe(403);
      expect(STATUS_BY_ERROR_CODE.route_not_found).toBe(404);
      expect(STATUS_BY_ERROR_CODE.method_not_allowed).toBe(405);
      expect(STATUS_BY_ERROR_CODE.payload_too_large).toBe(413);
      expect(STATUS_BY_ERROR_CODE.rate_limited).toBe(429);
      expect(STATUS_BY_ERROR_CODE.internal_error).toBe(500);
      expect(STATUS_BY_ERROR_CODE.no_structured_data).toBe(502);
      expect(STATUS_BY_ERROR_CODE.upstream_unavailable).toBe(502);
      expect(STATUS_BY_ERROR_CODE.blocked).toBe(503);
    });

    it('E.12 GET without kind and identical from/to are 400 with no-store and JSON content type', async () => {
      const base = 'http://localhost:5173/api/turna';
      const missing = await handleTurnaHttp({ method: 'GET', url: new URL(`${base}?from=a&to=b`) });
      expect(missing.status).toBe(400);
      expect(missing.headers['Content-Type']).toBe(CONTENT_TYPE_JSON);
      expect(missing.headers['Cache-Control']).toBe(CACHE_CONTROL_NO_STORE);
      expect(JSON.parse(missing.body)).toEqual({ success: false, error: "'kind' zorunludur: flight | bus | hotel | ferry | car.", errorCode: 'invalid_query' });
      const same = await handleTurnaHttp({ method: 'GET', url: new URL(`${base}?kind=flight&from=istanbul&to=istanbul`) });
      expect(same.status).toBe(400);
      expect(JSON.parse(same.body).errorCode).toBe('invalid_query');
    });

    it('E.13 POST with invalid or non-object JSON is 400 invalid_json; PUT is 405 with Allow; OPTIONS is 204', async () => {
      const url = new URL('http://localhost:5173/api/turna');
      const bad = await handleTurnaHttp({ method: 'POST', url, body: '{bad' });
      expect(bad.status).toBe(400);
      expect(JSON.parse(bad.body)).toEqual({ success: false, error: 'Geçersiz JSON gövdesi.', errorCode: 'invalid_json' });
      const list = await handleTurnaHttp({ method: 'POST', url, body: '[1,2]' });
      expect(list.status).toBe(400);
      expect(JSON.parse(list.body).errorCode).toBe('invalid_json');
      const buffer = await handleTurnaHttp({ method: 'POST', url, body: Buffer.from('{"kind":"flight","from":"istanbul","to":"istanbul"}') });
      expect(buffer.status).toBe(400);
      expect(JSON.parse(buffer.body).errorCode).toBe('invalid_query');
      const put = await handleTurnaHttp({ method: 'PUT', url });
      expect(put.status).toBe(405);
      expect(put.headers.Allow).toBe(ALLOW_HEADER);
      expect(put.headers.Allow).toBe('GET, POST, OPTIONS');
      expect(JSON.parse(put.body).errorCode).toBe('method_not_allowed');
      const options = await handleTurnaHttp({ method: 'OPTIONS', url });
      expect(options.status).toBe(204);
      expect(options.body).toBe('');
      expect(options.headers.Allow).toBe(ALLOW_HEADER);
      const del = await handleTurnaHttp({ method: 'delete', url });
      expect(del.status).toBe(405);
    });

    it('E.14 a 200 without refresh carries the public Cache-Control and the X-Turna headers, no CORS header', async () => {
      const url = new URL('http://localhost:5173/api/turna?kind=flight&from=istanbul&to=ankara');
      const res = await handleTurnaHttp({ method: 'get', url }, { fetchPage: pageStub(FLIGHT_PAGE), store: new NoopHistoryStore() });
      expect(res.status).toBe(200);
      expect(res.headers['Content-Type']).toBe(CONTENT_TYPE_JSON);
      expect(res.headers['Cache-Control']).toBe(CACHE_CONTROL_PUBLIC);
      expect(res.headers['Cache-Control']).toBe('public, max-age=0, s-maxage=600, stale-while-revalidate=300');
      expect(res.headers['X-Turna-Fetched-Via']).toBe('direct');
      expect(res.headers['X-Turna-Scraped-At']).toBe(FETCHED_AT_ISO);
      expect(Object.keys(res.headers).some((k) => k.toLowerCase().startsWith('access-control'))).toBeFalsy();
      const body = JSON.parse(res.body) as { success: boolean; items: unknown[]; query: unknown };
      expect(body.success).toBe(true);
      expect(body.items).toHaveLength(3);
      expect(body.query).toEqual({ kind: 'flight', refresh: false, from: 'istanbul', to: 'ankara' });
    });

    it('E.15 the server envelope round-trips through the browser guard with zero drops', async () => {
      const url = new URL('http://localhost:5173/api/turna?kind=bus&from=istanbul&to=ankara');
      const res = await handleTurnaHttp({ method: 'GET', url }, { fetchPage: pageStub(BUS_PAGE, 'cache', '2026-09-06T09:00:00.000Z'), store: new NoopHistoryStore() });
      expect(res.headers['X-Turna-Fetched-Via']).toBe('cache');
      const parsed = parseTurnaResponse(JSON.parse(res.body));
      if (!parsed) throw new Error('guard rejected the server envelope');
      expect(parsed.dropped).toBe(0);
      const success = expectSuccess(parsed.response);
      expect(success.items).toHaveLength(2);
      expect(success.scrapedAt).toBe('2026-09-06T09:00:00.000Z');
      const ferry = await handleTurnaHttp({ method: 'GET', url: new URL('http://localhost:5173/api/turna?kind=ferry&from=yalova&to=yenikapi') }, { fetchPage: pageStub(FERRY_PAGE), store: new NoopHistoryStore() });
      const ferryParsed = parseTurnaResponse(JSON.parse(ferry.body));
      if (!ferryParsed) throw new Error('guard rejected the ferry envelope');
      expect(expectSuccess(ferryParsed.response).items).toHaveLength(0);
    });

    it('E.16 refresh=1 (GET) and refresh:true (POST object body) answer with private, no-store', async () => {
      const get = await handleTurnaHttp({ method: 'GET', url: new URL('http://localhost:5173/api/turna?kind=flight&from=istanbul&to=ankara&refresh=1') }, { fetchPage: pageStub(FLIGHT_PAGE), store: new NoopHistoryStore() });
      expect(get.status).toBe(200);
      expect(get.headers['Cache-Control']).toBe(CACHE_CONTROL_PRIVATE);
      expect(get.headers['Cache-Control']).toBe('private, no-store');
      let refreshSeen: boolean | undefined;
      const fetchPage: PipelineDeps['fetchPage'] = async (_target, opts) => {
        refreshSeen = opts.refresh;
        return { html: FLIGHT_PAGE, via: 'direct', fetchedAt: FETCHED_AT_ISO, latencyMs: 1, warnings: [] };
      };
      const post = await handleTurnaHttp({ method: 'POST', url: new URL('http://localhost:5173/api/turna'), body: { kind: 'flight', from: 'İstanbul', to: 'Ankara', refresh: true } }, { fetchPage, store: new NoopHistoryStore() });
      expect(post.status).toBe(200);
      expect(post.headers['Cache-Control']).toBe(CACHE_CONTROL_PRIVATE);
      expect(refreshSeen).toBe(true);
      const plain = await handleTurnaHttp({ method: 'POST', url: new URL('http://localhost:5173/api/turna'), body: '{"kind":"flight","from":"istanbul","to":"ankara"}' }, { fetchPage, store: new NoopHistoryStore() });
      expect(plain.headers['Cache-Control']).toBe(CACHE_CONTROL_PUBLIC);
      expect(refreshSeen).toBe(false);
    });

    it('E.17 blocked is 503 with Retry-After; rate_limited is 429 with Retry-After 2 (queue) or the budget wait, both no-store', async () => {
      const url = new URL('http://localhost:5173/api/turna?kind=flight&from=istanbul&to=ankara');
      const blocked = await handleTurnaHttp({ method: 'GET', url }, { fetchPage: failingPage(new TurnaFetchError('blocked', 'engel', { retryAfterSeconds: 120 })), store: new NoopHistoryStore() });
      expect(blocked.status).toBe(503);
      expect(blocked.headers['Retry-After']).toBe('120');
      expect(blocked.headers['Cache-Control']).toBe(CACHE_CONTROL_NO_STORE);
      expect(JSON.parse(blocked.body)).toEqual({ success: false, error: 'engel', errorCode: 'blocked' });
      const limited = await handleTurnaHttp({ method: 'GET', url }, { fetchPage: failingPage(new TurnaFetchError('rate_limited', 'çok')), store: new NoopHistoryStore() });
      expect(limited.status).toBe(429);
      expect(limited.headers['Retry-After']).toBe('2');
      // The per-minute budget reports the real wait (2..60 s) and the header carries it verbatim.
      const budgeted = await handleTurnaHttp({ method: 'GET', url }, { fetchPage: failingPage(new TurnaFetchError('rate_limited', 'bütçe', { retryAfterSeconds: 37 })), store: new NoopHistoryStore() });
      expect(budgeted.status).toBe(429);
      expect(budgeted.headers['Retry-After']).toBe('37');
      expect(budgeted.headers['Cache-Control']).toBe(CACHE_CONTROL_NO_STORE);
      const budget = new RollingBudget();
      budget.tryConsume(0, 1);
      expect(budget.retryAfterSeconds(0)).toBe(60);
      expect(budget.retryAfterSeconds(30_000)).toBe(30);
      expect(budget.retryAfterSeconds(59_000)).toBe(RATE_LIMITED_RETRY_AFTER_S);
      const notFound = await handleTurnaHttp({ method: 'GET', url }, { fetchPage: failingPage(new TurnaFetchError('route_not_found', 'yok', { httpStatus: 404 })), store: new NoopHistoryStore() });
      expect(notFound.status).toBe(404);
      expect(notFound.headers['Retry-After']).toBeUndefined();
      const robots = await handleTurnaHttp({ method: 'GET', url }, { fetchPage: failingPage(new TurnaFetchError('robots_disallowed', 'yasak')), store: new NoopHistoryStore() });
      expect(robots.status).toBe(403);
      const noLd = await handleTurnaHttp({ method: 'GET', url }, { fetchPage: failingPage(new TurnaFetchError('no_structured_data', 'yok')), store: new NoopHistoryStore() });
      expect(noLd.status).toBe(502);
    });

    it('E.18 serveTurnaNode merges a platform pre-parsed query and writes Content-Length', async () => {
      const req = new FakeIncoming({ method: 'GET', url: '/api/turna', query: { kind: 'flight', from: 'istanbul', to: 'ankara' } });
      const res = fakeRes();
      await serveTurnaNode(asReq(req), asRes(res), { fetchPage: pageStub(FLIGHT_PAGE), store: new NoopHistoryStore() });
      expect(res.statusCode).toBe(200);
      expect(res.headers['Content-Type']).toBe(CONTENT_TYPE_JSON);
      expect(res.headers['X-Turna-Fetched-Via']).toBe('direct');
      expect(res.headers['Content-Length']).toBe(String(Buffer.byteLength(res.body, 'utf8')));
      expect((JSON.parse(res.body) as { items: unknown[] }).items).toHaveLength(3);
      // Vercel pre-parses the body only when the request carried a Content-Type.
      const preParsed = new FakeIncoming({
        method: 'POST',
        url: '/api/turna',
        headers: { host: 'localhost:5173', 'content-type': 'application/json' },
        body: { kind: 'flight', from: 'istanbul', to: 'istanbul' },
      });
      const res2 = fakeRes();
      await serveTurnaNode(asReq(preParsed), asRes(res2));
      expect(res2.statusCode).toBe(400);
      expect(JSON.parse(res2.body).errorCode).toBe('invalid_query');
    });

    it('E.19 serveTurnaNode streams a raw POST body and rejects bodies over 16 KiB with 413', async () => {
      const req = new FakeIncoming({ method: 'POST', url: '/api/turna' });
      const res = fakeRes();
      const pending = serveTurnaNode(asReq(req), asRes(res));
      req.emit('data', Buffer.from('{"kind":"flig'));
      req.emit('data', Buffer.from('ht","from":"a","to":"b"}'));
      req.emit('end');
      await pending;
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).errorCode).toBe('invalid_query');
      const big = new FakeIncoming({ method: 'POST', url: '/api/turna' });
      const bigRes = fakeRes();
      const bigPending = serveTurnaNode(asReq(big), asRes(bigRes));
      big.emit('data', Buffer.alloc(MAX_BODY_BYTES + 1, 0x20));
      big.emit('end');
      await bigPending;
      expect(bigRes.statusCode).toBe(413);
      expect(JSON.parse(bigRes.body)).toEqual({ success: false, error: 'İstek gövdesi 16 KiB sınırını aşıyor.', errorCode: 'payload_too_large' });
      const broken = new FakeIncoming({ method: 'POST', url: '/api/turna' });
      const brokenRes = fakeRes();
      const brokenPending = serveTurnaNode(asReq(broken), asRes(brokenRes));
      broken.emit('data', '{nope');
      broken.emit('end');
      await brokenPending;
      expect(brokenRes.statusCode).toBe(400);
      expect(JSON.parse(brokenRes.body).errorCode).toBe('invalid_json');
    });

    it('E.20 the Vite middleware serves /turna and answers 404 JSON for every other /api path', async () => {
      expect(TURNA_API_MOUNT).toBe('/api');
      const plugin = turnaApiPlugin();
      expect(plugin.name).toBe('bileo-turna-api');
      const mounted: string[] = [];
      const fakeServer = { middlewares: { use: (route: string) => mounted.push(route) } };
      (plugin.configureServer as (s: unknown) => void)(fakeServer);
      (plugin.configurePreviewServer as (s: unknown) => void)(fakeServer);
      expect(mounted).toEqual(['/api', '/api']);
      const other = new FakeIncoming({ method: 'GET', url: '/legacy?from=a&to=b&type=ucak' });
      const otherRes = fakeRes();
      apiMiddleware(other as unknown as Parameters<typeof apiMiddleware>[0], asRes(otherRes));
      expect(otherRes.statusCode).toBe(404);
      expect(otherRes.headers['Cache-Control']).toBe(CACHE_CONTROL_NO_STORE);
      expect(JSON.parse(otherRes.body)).toEqual({ success: false, error: 'Bu API yolu yok.', errorCode: 'not_found' });
      const turna = new FakeIncoming({ method: 'GET', url: '/turna?from=a&to=b' });
      const turnaRes = fakeRes();
      apiMiddleware(turna as unknown as Parameters<typeof apiMiddleware>[0], asRes(turnaRes));
      await turnaRes.done;
      expect(turnaRes.statusCode).toBe(400);
      expect(JSON.parse(turnaRes.body).errorCode).toBe('invalid_query');
    });

    it('E.22 in-process metrics count every answered request and GET ?stats=1 returns them without touching Turna', async () => {
      const { TurnaMetrics, METRICS_RING_SIZE, turnaMetrics } = await import('../server/turna/metrics');
      const { STATS_QUERY_KEY } = await import('../server/turna/http');
      expect(STATS_QUERY_KEY).toBe('stats');
      expect(METRICS_RING_SIZE).toBe(200);
      expect(turnaMetrics instanceof TurnaMetrics).toBeTruthy();

      let tick = 0;
      const clock = () => new Date(CLOCK_START + tick++ * 1000);
      const m = new TurnaMetrics(clock, 3);
      expect(m.snapshot()).toEqual({
        success: true, kind: 'metrics', since: new Date(CLOCK_START).toISOString(), uptimeSeconds: 1, requests: 0, ok: 0, failed: 0, refreshRequests: 0,
        byStatus: {}, byErrorCode: {}, byKind: {}, fetchedVia: {}, cacheHitRate: null, latencyMs: { samples: 0, p50: null, p95: null, max: null }, lastError: null, bySource: {},
      });
      m.record({ kind: 'flight', status: 200, fetchedVia: 'direct', latencyMs: 900 });
      m.record({ kind: 'flight', status: 200, fetchedVia: 'cache', latencyMs: 12, refresh: false });
      m.record({ kind: 'bus', status: 503, errorCode: 'fetch_failed', latencyMs: 30000, refresh: true });
      m.record({ kind: null, status: 400, errorCode: 'invalid_query', latencyMs: 1.4 });
      const snap = m.snapshot();
      expect(snap.requests).toBe(4);
      expect(snap.ok).toBe(2);
      expect(snap.failed).toBe(2);
      expect(snap.refreshRequests).toBe(1);
      expect(snap.byStatus).toEqual({ '200': 2, '503': 1, '400': 1 });
      expect(snap.byErrorCode).toEqual({ fetch_failed: 1, invalid_query: 1 });
      expect(snap.byKind).toEqual({ flight: 2, bus: 1, unknown: 1 });
      expect(snap.fetchedVia).toEqual({ direct: 1, cache: 1 });
      expect(snap.cacheHitRate).toBe(0.5);
      // Ring of 3 keeps the newest latencies only: [12, 30000, 1] sorted -> p50 12, p95 30000.
      expect(snap.latencyMs).toEqual({ samples: 3, p50: 12, p95: 30000, max: 30000 });
      expect(snap.lastError?.status).toBe(400);
      expect(snap.lastError?.errorCode).toBe('invalid_query');
      expect(snap.lastError?.kind).toBe(null);
      m.reset();
      expect(m.snapshot().requests).toBe(0);
      expect(m.snapshot().latencyMs.samples).toBe(0);

      // Through the HTTP handler with an injected instance: one success, one 400, OPTIONS and the stats read itself uncounted.
      const metrics = new TurnaMetrics(clock);
      let fetches = 0;
      const stub = pageStub(FLIGHT_PAGE);
      const fetchPage: PipelineDeps['fetchPage'] = async (target, opts) => {
        fetches += 1;
        return stub(target, opts);
      };
      const deps = { fetchPage, store: new NoopHistoryStore(), metrics };
      expect((await handleTurnaHttp({ method: 'get', url: new URL('http://localhost/api/turna?kind=flight&from=istanbul&to=ankara') }, deps)).status).toBe(200);
      expect((await handleTurnaHttp({ method: 'get', url: new URL('http://localhost/api/turna?kind=car') }, deps)).status).toBe(400);
      expect((await handleTurnaHttp({ method: 'options', url: new URL('http://localhost/api/turna') }, deps)).status).toBe(204);
      const statsRes = await handleTurnaHttp({ method: 'get', url: new URL('http://localhost/api/turna?stats=1') }, deps);
      expect(statsRes.status).toBe(200);
      expect(statsRes.headers['Cache-Control']).toBe(CACHE_CONTROL_NO_STORE);
      const body = JSON.parse(statsRes.body) as ReturnType<TurnaMetrics['snapshot']>;
      expect(body.kind).toBe('metrics');
      expect(body.requests).toBe(2);
      expect(body.ok).toBe(1);
      expect(body.byStatus).toEqual({ '200': 1, '400': 1 });
      expect(body.byErrorCode).toEqual({ invalid_query: 1 });
      expect(body.byKind).toEqual({ flight: 1, car: 1 });
      expect(body.fetchedVia).toEqual({ direct: 1 });
      expect(body.latencyMs.samples).toBe(2);
      expect(fetches).toBe(1);
      // POST bodies count too, and refresh is tracked separately.
      const postRes = await handleTurnaHttp({ method: 'post', url: new URL('http://localhost/api/turna'), body: { kind: 'flight', from: 'istanbul', to: 'ankara', refresh: true } }, deps);
      expect(postRes.status).toBe(200);
      expect(metrics.snapshot().requests).toBe(3);
      expect(metrics.snapshot().refreshRequests).toBe(1);
      // The process-wide default is used when no instance is injected.
      const before = turnaMetrics.snapshot().requests;
      await handleTurnaHttp({ method: 'get', url: new URL('http://localhost/api/turna?kind=bus') }, { fetchPage, store: new NoopHistoryStore() });
      expect(turnaMetrics.snapshot().requests).toBe(before + 1);
    });

    it('E.21 serveTurnaNode matches Vercel: a throwing body getter is 400 invalid_json, the cap is enforced before the body, no Content-Type reads the stream', async () => {
      // Vercel installs req.body as a lazy getter that throws ApiError(400, 'Invalid JSON').
      const throwing = new FakeIncoming({ method: 'POST', url: '/api/turna', headers: { host: 'localhost:5173', 'content-type': 'application/json' } });
      Object.defineProperty(throwing, 'body', {
        get() {
          const err = new Error('Invalid JSON') as Error & { statusCode?: number };
          err.statusCode = 400;
          throw err;
        },
      });
      const throwingRes = fakeRes();
      await serveTurnaNode(asReq(throwing), asRes(throwingRes));
      expect(throwingRes.statusCode).toBe(400);
      expect(JSON.parse(throwingRes.body)).toEqual({ success: false, error: INVALID_JSON_MESSAGE, errorCode: 'invalid_json' });
      expect(throwingRes.headers['Cache-Control']).toBe(CACHE_CONTROL_NO_STORE);
      // Content-Length above the cap is refused before any body is read (the fake never emits data).
      const declared = new FakeIncoming({ method: 'POST', url: '/api/turna', headers: { host: 'localhost:5173', 'content-type': 'application/json', 'content-length': String(MAX_BODY_BYTES + 1) } });
      const declaredRes = fakeRes();
      await serveTurnaNode(asReq(declared), asRes(declaredRes));
      expect(declaredRes.statusCode).toBe(413);
      expect(JSON.parse(declaredRes.body).errorCode).toBe('payload_too_large');
      // A pre-parsed text body over the cap is refused too.
      const bigText = new FakeIncoming({ method: 'POST', url: '/api/turna', headers: { host: 'localhost:5173', 'content-type': 'text/plain' }, body: ' '.repeat(MAX_BODY_BYTES + 1) });
      const bigTextRes = fakeRes();
      await serveTurnaNode(asReq(bigText), asRes(bigTextRes));
      expect(bigTextRes.statusCode).toBe(413);
      // Without Content-Type Vercel exposes body '' and leaves the stream untouched: the stream is what counts.
      const untyped = new FakeIncoming({ method: 'POST', url: '/api/turna', body: '' });
      const untypedRes = fakeRes();
      const pending = serveTurnaNode(asReq(untyped), asRes(untypedRes));
      untyped.emit('data', Buffer.from('{"kind":"flight","from":"istanbul","to":"istanbul"}'));
      untyped.emit('end');
      await pending;
      expect(untypedRes.statusCode).toBe(400);
      expect(JSON.parse(untypedRes.body).errorCode).toBe('invalid_query');
      expect(JSON.parse(untypedRes.body).error).toContain('aynı');
    });
  });
}

// ---------------------------------------------------------------------------
// F. History store
// ---------------------------------------------------------------------------

interface QueryLog {
  text: string;
  values?: unknown[];
}

interface FakePool {
  pool: PgPoolLike;
  log: QueryLog[];
  released: () => number;
  connects: () => number;
}

function fakePool(opts: { previousRow?: Record<string, unknown> | null; historyRows?: Record<string, unknown>[]; failOn?: string } = {}): FakePool {
  const log: QueryLog[] = [];
  let released = 0;
  let connects = 0;
  const client = {
    async query(text: string, values?: unknown[]) {
      log.push({ text, values });
      if (opts.failOn && text.includes(opts.failOn)) throw new Error(`fake failure on ${opts.failOn}`);
      return { rows: [] };
    },
    release() {
      released += 1;
    },
  };
  const pool: PgPoolLike = {
    async query(text: string, values?: unknown[]) {
      log.push({ text, values });
      if (text === SELECT_PREVIOUS_SQL) return { rows: opts.previousRow ? [opts.previousRow] : [] };
      if (text === SELECT_HISTORY_SQL) return { rows: opts.historyRows ?? [] };
      return { rows: [] };
    },
    async connect() {
      connects += 1;
      return client;
    },
  };
  return { pool, log, released: () => released, connects: () => connects };
}

const OBSERVATION: ObservationInput = {
  routeKey: 'flight:istanbul-ankara',
  kind: 'flight',
  sourceUrl: FLIGHT_TARGET.url,
  fetchedVia: 'direct',
  latencyMs: 10,
  items: SAMPLE_FLIGHT_OFFERS,
  stats: computeStats(SAMPLE_FLIGHT_OFFERS),
  facts: EMPTY_FACTS,
};

function registerHistoryTests(): void {
  describe('Turna F: history store', () => {
    it('F.1 NoopHistoryStore records nothing, returns an empty history and a null delta', async () => {
      const store = new NoopHistoryStore(() => new Date(CLOCK_START));
      const rec = await store.record();
      expect(rec).toEqual({ id: 'noop', observedAt: new Date(CLOCK_START).toISOString() });
      expect(await store.history()).toEqual([]);
      expect(await store.delta()).toBeNull();
      const typed: TurnaHistoryStore = store;
      expect(await typed.history('flight:istanbul-ankara', 10)).toEqual([]);
      expect(await typed.delta('flight:istanbul-ankara', 'noop', 1401.11)).toBeNull();
    });

    it('F.2 Postgres history is opt-in: TURNA_HISTORY=pg plus DATABASE_URL or PGHOST', () => {
      expect(historyEnabled({})).toBeFalsy();
      expect(historyEnabled({ TURNA_HISTORY: 'off', DATABASE_URL: 'postgres://x' })).toBeFalsy();
      expect(historyEnabled({ TURNA_HISTORY: 'pg' })).toBeFalsy();
      expect(historyEnabled({ TURNA_HISTORY: 'pg', DATABASE_URL: 'postgres://x' })).toBeTruthy();
      expect(historyEnabled({ TURNA_HISTORY: 'pg', PGHOST: 'db.internal' })).toBeTruthy();
      expect(historyEnabled({ TURNA_HISTORY: 'pg', POSTGRES_HOST: 'ignored' })).toBeFalsy();
      expect(createHistoryStore({}) instanceof MemoryHistoryStore).toBeTruthy();
      expect(createHistoryStore({ TURNA_HISTORY: 'memory' }) instanceof MemoryHistoryStore).toBeTruthy();
      expect(createHistoryStore({ TURNA_HISTORY: 'off' }) instanceof NoopHistoryStore).toBeTruthy();
      expect(createHistoryStore({ TURNA_HISTORY: 'OFF', DATABASE_URL: 'postgres://x' }) instanceof NoopHistoryStore).toBeTruthy();
      expect(createHistoryStore({ TURNA_HISTORY: 'pg', PGHOST: 'db.internal' }) instanceof PgHistoryStore).toBeTruthy();
    });

    it('F.3 the DDL is idempotent and declares the composite offer key', () => {
      expect(TURNA_HISTORY_DDL).toContain('CREATE TABLE IF NOT EXISTS turna_observations');
      expect(TURNA_HISTORY_DDL).toContain('CREATE TABLE IF NOT EXISTS turna_offers');
      expect(TURNA_HISTORY_DDL).toContain('CREATE INDEX IF NOT EXISTS');
      expect(TURNA_HISTORY_DDL).toContain('PRIMARY KEY (observation_id, offer_id)');
      expect(TURNA_HISTORY_DDL).toContain('ON DELETE CASCADE');
      expect(INSERT_OFFER_SQL).toContain('ON CONFLICT (observation_id, offer_id) DO UPDATE');
      expect(INSERT_OBSERVATION_SQL).toContain('$12::jsonb');
      expect(INSERT_OFFER_SQL).toContain('$8::jsonb');
      expect(SELECT_PREVIOUS_SQL).toContain('($2::text IS NULL OR id <> $2::text)');
      expect(SELECT_PREVIOUS_SQL).toContain('min_price IS NOT NULL');
      expect(SELECT_HISTORY_SQL).toContain('ORDER BY observed_at DESC');
      expect(SELECT_HISTORY_SQL).toContain('LIMIT $2');
      for (const sql of [TURNA_HISTORY_DDL, INSERT_OBSERVATION_SQL, INSERT_OFFER_SQL, SELECT_HISTORY_SQL, SELECT_PREVIOUS_SQL]) {
        expect(sql).toNotContain("'");
      }
    });

    it('F.4 PgHistoryStore.record runs the DDL once, then BEGIN, observation, offers, COMMIT in one transaction', async () => {
      const fp = fakePool();
      const store = new PgHistoryStore(fp.pool, { now: () => new Date(CLOCK_START), newId: () => 'obs_test' });
      const rec = await store.record(OBSERVATION);
      expect(rec).toEqual({ id: 'obs_test', observedAt: new Date(CLOCK_START).toISOString() });
      const texts = fp.log.map((l) => l.text);
      expect(texts[0]).toBe(TURNA_HISTORY_DDL);
      expect(texts.slice(1)).toEqual(['BEGIN', INSERT_OBSERVATION_SQL, INSERT_OFFER_SQL, INSERT_OFFER_SQL, 'COMMIT']);
      expect(fp.connects()).toBe(1);
      expect(fp.released()).toBe(1);
      const observation = fp.log[2].values ?? [];
      expect(observation).toHaveLength(12);
      expect(observation.slice(0, 8)).toEqual(['obs_test', 'flight:istanbul-ankara', 'flight', FLIGHT_TARGET.url, new Date(CLOCK_START).toISOString(), 'direct', 10, 2]);
      // avg of 999 and 1401.11 is 1200.055; round2 lands on 1200.05 in IEEE-754 arithmetic.
      expect(OBSERVATION.stats?.avg).toBe(1200.05);
      expect(observation.slice(8, 11)).toEqual([999, 1200.05, 1401.11]);
      expect(JSON.parse(String(observation[11]))).toEqual(EMPTY_FACTS);
      const offer = fp.log[3].values ?? [];
      expect(offer.slice(0, 7)).toEqual(['obs_test', 'eee39b67f15c', 'flight:istanbul-ankara', 'flight', 'Pegasus', 1401.11, '2026-09-24T09:50:00+03:00']);
      expect(JSON.parse(String(offer[7]))).toEqual(SAMPLE_FLIGHT_OFFERS[0]);
      await store.record(OBSERVATION);
      expect(fp.log.filter((l) => l.text === TURNA_HISTORY_DDL)).toHaveLength(1);
    });

    it('F.5 PgHistoryStore.record rolls back and releases the client when an insert fails', async () => {
      const fp = fakePool({ failOn: 'INSERT INTO turna_offers' });
      const store = new PgHistoryStore(fp.pool, { newId: () => 'obs_fail' });
      let failed = false;
      try {
        await store.record(OBSERVATION);
      } catch (err) {
        failed = true;
        expect((err as Error).message).toContain('fake failure');
      }
      expect(failed).toBeTruthy();
      const texts = fp.log.map((l) => l.text);
      expect(texts).toContain('BEGIN');
      expect(texts).toContain('ROLLBACK');
      expect(texts).toNotContain('COMMIT');
      expect(fp.released()).toBe(1);
    });

    it('F.6 PgHistoryStore.history returns oldest to newest and coerces numeric strings', async () => {
      const fp = fakePool({
        historyRows: [
          { id: 'b', observed_at: new Date('2026-09-06T10:00:00Z'), min_price: '1401.11', avg_price: '1500.5', item_count: '3' },
          { id: 'a', observed_at: '2026-09-05T10:00:00.000Z', min_price: null, avg_price: null, item_count: 0 },
        ],
      });
      const store = new PgHistoryStore(fp.pool);
      const points = await store.history('flight:istanbul-ankara');
      expect(points).toEqual([
        { observedAt: '2026-09-05T10:00:00.000Z', minPrice: null, avgPrice: null, count: 0 },
        { observedAt: '2026-09-06T10:00:00.000Z', minPrice: 1401.11, avgPrice: 1500.5, count: 3 },
      ]);
      const select = fp.log.find((l) => l.text === SELECT_HISTORY_SQL);
      expect(select?.values).toEqual(['flight:istanbul-ankara', 60]);
      await store.history('flight:istanbul-ankara', 5);
      expect(fp.log[fp.log.length - 1].values).toEqual(['flight:istanbul-ankara', 5]);
    });

    it('F.7 PgHistoryStore.delta excludes the current observation and computes change and percentage', async () => {
      const fp = fakePool({ previousRow: { id: 'obs_prev', observed_at: new Date('2026-09-05T10:00:00Z'), min_price: '1500.00', avg_price: '1600', item_count: 3 } });
      const store = new PgHistoryStore(fp.pool);
      const delta = await store.delta('flight:istanbul-ankara', 'obs_test', 1401.11);
      expect(delta).toEqual({ previousObservedAt: '2026-09-05T10:00:00.000Z', previousMin: 1500, currentMin: 1401.11, change: -98.89, changePct: -6.59 });
      const call = fp.log.find((l) => l.text === SELECT_PREVIOUS_SQL);
      expect(call?.values).toEqual(['flight:istanbul-ankara', 'obs_test']);
      const noCurrent = await store.delta('flight:istanbul-ankara', null, 1600);
      expect(noCurrent?.change).toBe(100);
      expect(noCurrent?.changePct).toBe(6.67);
      expect(fp.log[fp.log.length - 1].values).toEqual(['flight:istanbul-ankara', null]);
    });

    it('F.8 PgHistoryStore.delta is null without a current price or without an earlier observation', async () => {
      const fp = fakePool({ previousRow: null });
      const store = new PgHistoryStore(fp.pool);
      const before = fp.log.length;
      expect(await store.delta('flight:istanbul-ankara', 'obs_test', null)).toBeNull();
      expect(fp.log.length).toBe(before);
      expect(await store.delta('flight:istanbul-ankara', 'obs_test', 1000)).toBeNull();
      expect(fp.log.some((l) => l.text === SELECT_PREVIOUS_SQL)).toBeTruthy();
    });

    it('F.9 the pipeline records only direct fetches and hands the new observation id to delta', async () => {
      const fp = fakePool({ previousRow: { id: 'obs_prev', observed_at: new Date('2026-09-05T10:00:00Z'), min_price: '1500.00', avg_price: '1600', item_count: 3 } });
      const store = new PgHistoryStore(fp.pool, { now: () => new Date(CLOCK_START), newId: () => 'obs_live' });
      const out = await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(FLIGHT_PAGE), store });
      const body = expectSuccess(out.body);
      expect(body.delta?.previousMin).toBe(1500);
      expect(body.delta?.currentMin).toBe(1401.11);
      expect(body.warnings).toEqual([]);
      const previous = fp.log.find((l) => l.text === SELECT_PREVIOUS_SQL);
      expect(previous?.values).toEqual(['flight:istanbul-ankara', 'obs_live']);
      expect(fp.log.filter((l) => l.text === INSERT_OFFER_SQL)).toHaveLength(3);
    });

    it('F.10 MemoryHistoryStore keeps bounded real observations per route and computes the same delta as Postgres', async () => {
      let tick = 0;
      const clock = () => new Date(CLOCK_START + tick++ * 60_000);
      const stats = (min: number): PriceStats => ({ count: 1, min, max: min, avg: min, median: min, byCompany: [], byDay: [] });
      const obs = (min: number | null): ObservationInput => ({ ...OBSERVATION, routeKey: 'flight:istanbul-ankara', stats: min === null ? null : stats(min) });
      const store = new MemoryHistoryStore(clock);
      const r1 = await store.record(obs(1500));
      await store.record(obs(null));
      const r3 = await store.record(obs(1401.11));
      expect(r1.id === r3.id).toBeFalsy();

      // The current observation is skipped, so is the priceless one in between.
      const delta = await store.delta('flight:istanbul-ankara', r3.id, 1401.11);
      expect(delta).toEqual({ previousObservedAt: r1.observedAt, previousMin: 1500, currentMin: 1401.11, change: -98.89, changePct: -6.59 });
      // Without a current id (cache hit) the newest priced observation is the baseline.
      expect((await store.delta('flight:istanbul-ankara', null, 1600))?.previousMin).toBe(1401.11);
      expect(await store.delta('flight:istanbul-ankara', r3.id, null)).toBe(null);
      expect(await store.delta('bus:istanbul-ankara', null, 500)).toBe(null);

      const history = await store.history('flight:istanbul-ankara');
      expect(history.map((h) => h.minPrice)).toEqual([1500, null, 1401.11]);
      expect(history[0].observedAt).toBe(r1.observedAt);
      expect(history[2].observedAt).toBe(r3.observedAt);
      expect((await store.history('flight:istanbul-ankara', 2)).map((h) => h.minPrice)).toEqual([null, 1401.11]);
      expect(await store.history('car:istanbul')).toEqual([]);

      // The per-route cap drops the oldest points; the default cap is 60.
      const small = new MemoryHistoryStore(clock, 3);
      for (const min of [1, 2, 3, 4, 5]) await small.record(obs(min));
      expect((await small.history('flight:istanbul-ankara')).map((h) => h.minPrice)).toEqual([3, 4, 5]);
      expect(MEMORY_HISTORY_LIMIT).toBe(60);

      // Through the pipeline: the second direct fetch of the same route gets a delta and two history points.
      const live = new MemoryHistoryStore(clock);
      const first = expectSuccess((await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(FLIGHT_PAGE), store: live })).body);
      expect(first.delta).toBe(null);
      expect(first.history).toHaveLength(1);
      const second = expectSuccess((await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(FLIGHT_PAGE), store: live })).body);
      expect(second.delta).toEqual({ previousObservedAt: first.history[0].observedAt, previousMin: 1401.11, currentMin: 1401.11, change: 0, changePct: 0 });
      expect(second.history).toHaveLength(2);
      expect(second.warnings).toEqual([]);
    });
  });
}

// ---------------------------------------------------------------------------
// G. Guard, adapter, format helpers and browser client
// ---------------------------------------------------------------------------

const ROUTE_CTX = { fromCity: 'İstanbul', toCity: 'Ankara' };

function registerGuardAdapterTests(): void {
  describe('Turna G: guard, adapter, format and client', () => {
    it('G.1 isoClockHHMM reads the +03:00 text so the process timezone cannot shift 09:50/10:50', () => {
      const previousTz = process.env.TZ;
      try {
        for (const tz of ['America/Los_Angeles', 'Pacific/Auckland', 'UTC', 'Europe/Istanbul']) {
          process.env.TZ = tz;
          expect(isoClockHHMM('2026-09-24T09:50:00+03:00')).toBe('09:50');
          expect(isoClockHHMM('2026-09-24T10:50:00+03:00')).toBe('10:50');
          expect(isoClockHHMM('2026-09-25T00:15:00+03:00')).toBe('00:15');
          expect(formatTrDate('2026-09-24')).toBe('24 Eylül Perşembe');
          const { routes } = toRouteItems(successEnvelope(), ROUTE_CTX);
          expect(routes[0].departureTime).toBe('09:50');
          expect(routes[0].arrivalTime).toBe('10:50');
          expect(routes[0].date).toBe('24 Eylül Perşembe');
        }
      } finally {
        if (previousTz === undefined) delete process.env.TZ;
        else process.env.TZ = previousTz;
      }
      expect(isoClockHHMM('2026-09-24')).toBe('');
      expect(isoClockHHMM('')).toBe('');
    });

    it('G.2 bileoDuration and parseBileoDurationMinutes keep the legacy Hs MMdk format round-trippable', () => {
      expect(bileoDuration(60)).toBe('1s 00dk');
      expect(bileoDuration(130)).toBe('2s 10dk');
      expect(bileoDuration(420)).toBe('7s 00dk');
      expect(bileoDuration(375)).toBe('6s 15dk');
      expect(bileoDuration(0)).toBe('0s 00dk');
      expect(bileoDuration(59.6)).toBe('1s 00dk');
      expect(bileoDuration(-5)).toBe('0s 00dk');
      expect(parseBileoDurationMinutes('5s 30dk')).toBe(330);
      expect(parseBileoDurationMinutes('2s')).toBe(120);
      expect(parseBileoDurationMinutes('45dk')).toBe(45);
      expect(parseBileoDurationMinutes('1 saat 25 dakika')).toBe(85);
      expect(parseBileoDurationMinutes('7s 00dk')).toBe(420);
      expect(parseBileoDurationMinutes('')).toBeNull();
      expect(parseBileoDurationMinutes('yok')).toBeNull();
      for (const minutes of [60, 130, 375, 420, 5]) expect(parseBileoDurationMinutes(bileoDuration(minutes))).toBe(minutes);
      for (const route of POPULAR_ROUTES) expect(parseBileoDurationMinutes(route.duration)).toBeGreaterThan(0);
    });

    it('G.3 formatTrDate, formatDayChip and formatTrClock', () => {
      expect(formatTrDate('2026-09-24')).toBe('24 Eylül Perşembe');
      expect(formatTrDate('2026-09-13')).toBe('13 Eylül Pazar');
      expect(formatTrDate('2026-01-01')).toBe('1 Ocak Perşembe');
      expect(formatTrDate('24 Mayıs Cuma')).toBe('24 Mayıs Cuma');
      expect(formatTrDate('2026-02-31')).toBe('2026-02-31');
      expect(formatTrDate('')).toBe('');
      expect(formatDayChip('2026-09-24')).toEqual({ weekday: 'Per', day: '24', month: 'Eyl' });
      expect(formatDayChip('2026-09-13')).toEqual({ weekday: 'Paz', day: '13', month: 'Eyl' });
      expect(formatDayChip('2026-12-07')).toEqual({ weekday: 'Pzt', day: '7', month: 'Ara' });
      expect(formatDayChip('nope')).toEqual({ weekday: '', day: 'nope', month: '' });
      expect(formatTrClock(FETCHED_AT_ISO)).toMatch(/^\d{2}:\d{2}$/);
      expect(formatTrClock(FETCHED_AT_ISO)).toBe(new Date(FETCHED_AT_ISO).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
      expect(formatTrClock('garbage')).toBe('');
      expect(isIsoDate('2026-09-24')).toBeTruthy();
      expect(isIsoDate('24.09.2026')).toBeFalsy();
    });

    it('G.4 priceTL and stripParenCode', () => {
      expect(priceTL(1250)).toBe('1.250 TL');
      expect(priceTL(1250.5, 2)).toBe('1.250,50 TL');
      expect(priceTL(1401.11, 2)).toBe('1.401,11 TL');
      expect(priceTL(999)).toBe('999 TL');
      expect(stripParenCode('İstanbul (IST)')).toBe('İstanbul');
      expect(stripParenCode('Ankara (Aşti)')).toBe('Ankara');
      expect(stripParenCode('İstanbul Havalimanı (İGA)')).toBe('İstanbul Havalimanı');
      expect(stripParenCode('İzmir')).toBe('İzmir');
      expect(stripParenCode('')).toBe('');
    });

    it('G.5 parseTurnaResponse accepts a complete envelope and returns it unchanged with zero drops', () => {
      const parsed = parseTurnaResponse(asWireJson(successEnvelope({ stats: computeStats(SAMPLE_FLIGHT_OFFERS) })));
      if (!parsed) throw new Error('valid envelope rejected');
      expect(parsed.dropped).toBe(0);
      const success = expectSuccess(parsed.response);
      expect(success.items).toHaveLength(2);
      expect(success.stats?.min).toBe(999);
      expect(success.pageTitle).toBe(FLIGHT_PAGE_TITLE);
      const nullTitle = parseTurnaResponse(asWireJson(successEnvelope({ pageTitle: null })));
      expect(nullTitle?.response.success).toBe(true);
      const hotels = parseTurnaResponse(asWireJson(successEnvelope({ kind: 'hotel', items: parseHotels(extractJsonLd(HOTEL_PAGE)) })));
      expect(hotels?.dropped).toBe(0);
      for (const via of ['crw-stealth', 'crw-js', 'direct', 'cache'] as const) {
        expect(parseTurnaResponse(asWireJson(successEnvelope({ fetchedVia: via })))).toBeDefined();
      }
    });

    it('G.6 parseTurnaResponse drops a string-price item, counts it and recomputes the stats', () => {
      const wire = asWireJson(successEnvelope({ stats: { count: 3, min: 500, max: 1401.11, avg: 900, median: 999, byCompany: [], byDay: [] } })) as Record<string, unknown>;
      (wire.items as unknown[]).push(STRING_PRICE_OFFER);
      const parsed = parseTurnaResponse(wire);
      if (!parsed) throw new Error('envelope rejected');
      expect(parsed.dropped).toBe(1);
      const success = expectSuccess(parsed.response);
      expect(success.items.map((i) => i.id)).toEqual(['eee39b67f15c', 'abcdefabcdef']);
      expect(success.stats).toEqual(computeStats(SAMPLE_FLIGHT_OFFERS));
      expect(success.stats?.min).toBe(999);
      expect(success.stats?.max).toBe(1401.11);
    });

    it('G.7 validateTurnaOffer never patches: wrong currency, non-ISO date or string price are rejected', () => {
      const flight = SAMPLE_FLIGHT_OFFERS[0];
      expect(validateTurnaOffer(flight)).toBe(flight);
      expect(validateTurnaOffer(SAMPLE_BUS_OFFERS[1])).toBe(SAMPLE_BUS_OFFERS[1]);
      expect(validateTurnaOffer(STRING_PRICE_OFFER)).toBeNull();
      expect(validateTurnaOffer({ ...flight, currency: 'USD' })).toBeNull();
      expect(validateTurnaOffer({ ...flight, date: '24.09.2026' })).toBeNull();
      expect(validateTurnaOffer({ ...flight, departureAt: '13.09.2026 11:29' })).toBeNull();
      expect(validateTurnaOffer({ ...flight, price: 0 })).toBeNull();
      expect(validateTurnaOffer({ ...flight, id: '' })).toBeNull();
      expect(validateTurnaOffer({ ...flight, isDirect: 'no' })).toBeNull();
      expect(validateTurnaOffer({ ...flight, airlineCode: undefined })).toBeNull();
      expect(validateTurnaOffer({ ...SAMPLE_BUS_OFFERS[0], companyUrl: 5 })).toBeNull();
      expect(validateTurnaOffer(null)).toBeNull();
      expect(validateTurnaOffer('flight')).toBeNull();
      expect(validateTurnaOffer([])).toBeNull();
      expect(validateTurnaOffer({ kind: 'car' })).toBeNull();
    });

    it('G.8 parseTurnaResponse rejects malformed envelopes and accepts failure envelopes', () => {
      expect(parseTurnaResponse('x')).toBeNull();
      expect(parseTurnaResponse(null)).toBeNull();
      expect(parseTurnaResponse([])).toBeNull();
      expect(parseTurnaResponse({})).toBeNull();
      expect(parseTurnaResponse({ success: 'true' })).toBeNull();
      const base = asWireJson(successEnvelope()) as Record<string, unknown>;
      expect(parseTurnaResponse({ ...base, fetchedVia: 'nope' })).toBeNull();
      expect(parseTurnaResponse({ ...base, items: 'none' })).toBeNull();
      expect(parseTurnaResponse({ ...base, kind: 'train' })).toBeNull();
      expect(parseTurnaResponse({ ...base, query: { kind: 'train' } })).toBeNull();
      expect(parseTurnaResponse({ ...base, warnings: ['a', 1] })).toBeNull();
      expect(parseTurnaResponse({ ...base, latencyMs: '12' })).toBeNull();
      expect(parseTurnaResponse({ ...base, history: [{ observedAt: 'x', minPrice: 1, avgPrice: 1 }] })).toBeNull();
      expect(parseTurnaResponse({ ...base, delta: { previousObservedAt: 'x', previousMin: '1', currentMin: 1, change: 0, changePct: 0 } })).toBeNull();
      expect(parseTurnaResponse({ ...base, stats: { ...(computeStats(SAMPLE_FLIGHT_OFFERS) as object), byDay: [{ date: '24/09/2026', minPrice: 1, count: 1 }] } })).toBeNull();
      const { faq: _omitted, ...factsWithoutFaq } = EMPTY_FACTS;
      expect(parseTurnaResponse({ ...base, facts: factsWithoutFaq })).toBeNull();
      expect(parseTurnaResponse({ ...base, facts: { ...EMPTY_FACTS, faq: [{ question: 'q' }] } })).toBeNull();
      const { pageTitle: _title, ...withoutTitle } = base;
      expect(parseTurnaResponse(withoutTitle)).toBeNull();
      const failure = parseTurnaResponse({ success: false, error: 'engel', errorCode: 'blocked' });
      expect(failure?.dropped).toBe(0);
      expect(failure?.response).toEqual({ success: false, error: 'engel', errorCode: 'blocked' });
      expect(parseTurnaResponse({ success: false, error: 'engel' })).toBeNull();
    });

    it('G.9 transportTypeToKind and kindToTransportType map bileo modes to Turna kinds', () => {
      expect(transportTypeToKind('otobus')).toBe('bus');
      expect(transportTypeToKind('ucak')).toBe('flight');
      expect(transportTypeToKind('feribot')).toBe('ferry');
      expect(transportTypeToKind('tren')).toBeNull();
      expect(kindToTransportType('bus')).toBe('otobus');
      expect(kindToTransportType('flight')).toBe('ucak');
      expect(kindToTransportType('ferry')).toBe('feribot');
      expect(kindToTransportType('hotel')).toBeNull();
    });

    it('G.10 airportNameByCode resolves IATA codes from the province dataset (first match wins)', () => {
      expect(airportNameByCode('IST')).toBe('İstanbul Havalimanı (İGA)');
      expect(airportNameByCode('ist')).toBe('İstanbul Havalimanı (İGA)');
      expect(airportNameByCode(' SAW ')).toBe('Sabiha Gökçen Havalimanı');
      expect(airportNameByCode('ESB')).toBe('Ankara Esenboğa Havalimanı');
      expect(typeof airportNameByCode('COV')).toBe('string');
      expect(airportNameByCode('ANK')).toBeUndefined();
      expect(airportNameByCode('ZZZ')).toBeUndefined();
      expect(airportNameByCode(null)).toBeUndefined();
      expect(airportNameByCode(undefined)).toBeUndefined();
      expect(airportNameByCode('')).toBeUndefined();
      // Turna publishes city codes: a code owned by a multi-airport province is ambiguous.
      expect(isUnambiguousAirportCode('IST')).toBeFalsy();
      expect(isUnambiguousAirportCode('SAW')).toBeFalsy();
      expect(isUnambiguousAirportCode('ESB')).toBeTruthy();
      expect(isUnambiguousAirportCode('ADB')).toBeTruthy();
      expect(isUnambiguousAirportCode('ANK')).toBeFalsy();
      expect(isUnambiguousAirportCode(null)).toBeFalsy();
      expect(airportTerminalLabel('İstanbul (IST)', 'IST')).toBe('İstanbul (IST)');
      expect(airportTerminalLabel('İzmir (IZM)', 'IZM')).toBe('İzmir (IZM)');
      expect(airportTerminalLabel('Ankara (ESB)', 'ESB')).toBe('Ankara Esenboğa Havalimanı (ESB)');
      expect(airportTerminalLabel('', 'IST')).toBe('IST');
      expect(airportTerminalLabel('', null)).toBe('');
    });

    it('G.11 toRouteItems maps flights: ids, clocks, duration, Turkish date, terminals, layout', () => {
      const { routes, dropped } = toRouteItems(successEnvelope(), ROUTE_CTX);
      expect(dropped).toBe(0);
      expect(routes).toHaveLength(2);
      const [pegasus, ajet] = routes;
      expect(pegasus.id).toBe('turna-flight-eee39b67f15c');
      expect(pegasus.from).toBe('İstanbul');
      expect(pegasus.fromTerminal).toBe('İstanbul (IST)');
      expect(pegasus.to).toBe('Ankara');
      expect(pegasus.toTerminal).toBe('Ankara (ANK)');
      expect(pegasus.departureTime).toBe('09:50');
      expect(pegasus.arrivalTime).toBe('10:50');
      expect(pegasus.duration).toBe('1s 00dk');
      expect(pegasus.durationMinutes).toBe(60);
      expect(pegasus.date).toBe('24 Eylül Perşembe');
      expect(pegasus.price).toBe(1401.11);
      expect(pegasus.company).toBe('Pegasus');
      expect(pegasus.transportType).toBe('ucak');
      expect(pegasus.seatLayoutType).toBe('plane_3_3');
      expect(ajet.id).toBe('turna-flight-abcdefabcdef');
      expect(ajet.fromTerminal).toBe('İstanbul (SAW)');
      expect(ajet.departureTime).toBe('00:15');
      expect(ajet.arrivalTime).toBe('02:25');
      expect(ajet.duration).toBe('2s 10dk');
      expect(ajet.date).toBe('25 Eylül Cuma');
      expect(ajet.price).toBe(999);
    });

    it('G.12 every field Turna does not publish stays undefined on adapted rows', () => {
      const { routes } = toRouteItems(successEnvelope(), ROUTE_CTX);
      for (const route of routes) {
        expect(route.vehicleType).toBeUndefined();
        expect(route.availableSeats).toBeUndefined();
        expect(route.rating).toBeUndefined();
        expect(route.reviewCount).toBeUndefined();
        expect(route.features).toBeUndefined();
        expect(route.originalPrice).toBeUndefined();
        expect(route.badge).toBeUndefined();
        expect(route.gateOrPlatform).toBeUndefined();
        expect(route.reviews).toBeUndefined();
        expect(route.companyLogo).toBeUndefined();
        expect(route.aircraftModel).toBeUndefined();
        expect(route.serviceClass).toBeUndefined();
        expect('vehicleType' in route).toBeFalsy();
        expect('rating' in route).toBeFalsy();
        expect('availableSeats' in route).toBeFalsy();
        expect('features' in route).toBeFalsy();
      }
    });

    it('G.13 provenance carries the source facts of the flight offer and nothing more', () => {
      const envelope = successEnvelope();
      const { routes } = toRouteItems(envelope, ROUTE_CTX);
      const prov = routes[0].provenance;
      if (!prov) throw new Error('provenance expected');
      expect(prov).toEqual({
        source: 'turna',
        kind: 'flight',
        offerId: 'eee39b67f15c',
        routeKey: 'flight:istanbul-ankara',
        sourceUrl: 'https://www.turna.com/ucak-bileti/istanbul-ankara',
        scrapedAt: '2026-09-06T09:00:00.000Z',
        fetchedVia: 'direct',
        dateIso: '2026-09-24',
        departureAt: '2026-09-24T09:50:00+03:00',
        arrivalAt: '2026-09-24T10:50:00+03:00',
        durationMinutes: 60,
        isDirect: null,
        currency: 'TRY',
        sampling: 'cheapest-upcoming',
        airlineCode: 'PC',
        logoUrl: 'https://cdn.turna.com/Images/Flight/Airlines/PC.png',
      });
      expect('companyUrl' in prov).toBeFalsy();
      expect('companySlug' in prov).toBeFalsy();
      expect(toRouteItems(successEnvelope({ fetchedVia: 'cache' }), ROUTE_CTX).routes[0].provenance?.fetchedVia).toBe('cache');
      expect(toRouteItems(successEnvelope({ fetchedVia: 'crw-stealth' }), ROUTE_CTX).routes[0].provenance?.fetchedVia).toBe('direct');
    });

    it('G.14 toRouteItems maps buses from the parsed fixture: İstanbul Avrupa, 7s 00dk, 6s 15dk, bus_2_1', async () => {
      const body = expectSuccess((await runTurnaQuery({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(BUS_PAGE, 'cache', '2026-09-06T09:00:00.000Z'), store: new NoopHistoryStore() })).body);
      const { routes, dropped } = toRouteItems(body, ROUTE_CTX);
      expect(dropped).toBe(0);
      expect(routes).toHaveLength(2);
      const [hazar, kamil] = routes;
      expect(hazar.id).toBe(`turna-bus-${body.items[0].id}`);
      expect(hazar.id).toMatch(/^turna-bus-[0-9a-f]{12}$/);
      expect(hazar.from).toBe('İstanbul');
      expect(hazar.fromTerminal).toBe('İstanbul Avrupa');
      expect(hazar.to).toBe('Ankara');
      expect(hazar.toTerminal).toBe('Ankara (Aşti)');
      expect(hazar.departureTime).toBe('11:29');
      expect(hazar.arrivalTime).toBe('18:29');
      expect(hazar.duration).toBe('7s 00dk');
      expect(hazar.durationMinutes).toBe(420);
      expect(hazar.date).toBe('13 Eylül Pazar');
      expect(hazar.price).toBe(500);
      expect(hazar.company).toBe('Elazığ Hazar Turizm');
      expect(hazar.transportType).toBe('otobus');
      expect(hazar.seatLayoutType).toBe('bus_2_1');
      expect(kamil.duration).toBe('6s 15dk');
      expect(kamil.departureTime).toBe('23:30');
      expect(kamil.arrivalTime).toBe('05:45');
      expect(kamil.price).toBe(1250);
      const prov = hazar.provenance;
      if (!prov) throw new Error('provenance expected');
      expect(prov.kind).toBe('bus');
      expect(prov.fetchedVia).toBe('cache');
      expect(prov.scrapedAt).toBe('2026-09-06T09:00:00.000Z');
      expect(prov.routeKey).toBe('bus:istanbul-ankara');
      expect(prov.sourceUrl).toBe(BUS_TARGET.url);
      expect(prov.isDirect).toBeNull();
      expect(prov.durationMinutes).toBe(420);
      expect(prov.companyUrl).toBe('https://www.turna.com/otobus-bileti/elazığ-hazar-turizm');
      expect('airlineCode' in prov).toBeFalsy();
      expect(hazar.vehicleType).toBeUndefined();
      expect(hazar.availableSeats).toBeUndefined();
    });

    it('G.15 toRouteItems drops unusable offers, ignores hotels and falls back to the search context', () => {
      const hotel = parseHotels(extractJsonLd(HOTEL_PAGE))[0];
      const broken: FlightOffer[] = [
        { ...SAMPLE_FLIGHT_OFFERS[0], id: 'zero', price: 0 },
        { ...SAMPLE_FLIGHT_OFFERS[0], id: 'tr-date', departureAt: '13.09.2026 11:29' },
        { ...SAMPLE_FLIGHT_OFFERS[0], id: 'short-date', date: '2026-9-13' },
      ];
      const envelope = successEnvelope({ items: [...SAMPLE_FLIGHT_OFFERS, hotel, ...broken] });
      const { routes, dropped } = toRouteItems(envelope, ROUTE_CTX);
      expect(routes).toHaveLength(2);
      expect(dropped).toBe(3);
      const anonymous: FlightOffer = { ...SAMPLE_FLIGHT_OFFERS[0], fromName: '', fromCode: null, toName: '', toCode: 'ESB', durationMinutes: null, durationLabel: '1 saat' };
      const [row] = toRouteItems(successEnvelope({ items: [anonymous] }), { fromCity: 'Kadıköy', toCity: 'Başkent' }).routes;
      expect(row.from).toBe('Kadıköy');
      expect(row.fromTerminal).toBe('');
      expect(row.to).toBe('Başkent');
      expect(row.toTerminal).toBe('Ankara Esenboğa Havalimanı (ESB)');
      expect(row.duration).toBe('1 saat');
      expect(row.durationMinutes).toBeUndefined();
      expect(row.provenance?.durationMinutes).toBeNull();
    });

    it('G.16 buildTurnaUrl canonicalises slugs in a fixed order; refresh appends refresh=1', () => {
      expect(TURNA_API_PATH).toBe('/api/turna');
      expect(buildTurnaUrl({ kind: 'bus', from: 'İstanbul', to: 'Ankara' })).toBe('/api/turna?kind=bus&from=istanbul&to=ankara');
      expect(buildTurnaUrl({ kind: 'bus', from: 'İstanbul', to: 'Ankara' }, true)).toBe('/api/turna?kind=bus&from=istanbul&to=ankara&refresh=1');
      expect(buildTurnaUrl({ kind: 'flight', from: ' ISTANBUL ', to: 'ankara' })).toBe(buildTurnaUrl({ kind: 'flight', from: 'istanbul', to: 'Ankara' }));
      expect(buildTurnaUrl({ kind: 'hotel', city: 'Çeşme' })).toBe('/api/turna?kind=hotel&city=cesme');
      expect(buildTurnaUrl({ kind: 'ferry', from: 'Yalova', to: 'Yenikapı' })).toBe('/api/turna?kind=ferry&from=yalova&to=yenikapi');
      expect(canonicalTurnaQuery({ kind: 'flight', from: 'İstanbul ', to: 'ANKARA', refresh: true })).toEqual({ kind: 'flight', from: 'istanbul', to: 'ankara' });
      expect(canonicalTurnaQuery({ kind: 'hotel', to: 'Bodrum' })).toEqual({ kind: 'hotel', city: 'bodrum' });
    });

    it('G.17 parseRetryAfter handles delta-seconds, HTTP dates and garbage', () => {
      const now = () => new Date('2026-09-06T10:00:00.000Z');
      expect(parseRetryAfter('120')).toBe(120);
      expect(parseRetryAfter(' 7 ')).toBe(7);
      expect(parseRetryAfter('Sun, 06 Sep 2026 10:01:30 GMT', now)).toBe(90);
      expect(parseRetryAfter('Sun, 06 Sep 2026 09:00:00 GMT', now)).toBe(0);
      expect(parseRetryAfter('soon')).toBeUndefined();
      expect(parseRetryAfter('')).toBeUndefined();
      expect(parseRetryAfter(null)).toBeUndefined();
      expect(parseRetryAfter(undefined)).toBeUndefined();
    });

    it('G.18 fetchTurna requests the canonical URL and maps a 200 with items to ok', async () => {
      const fake = fakeFetch(() => jsonResponse(successEnvelope({ stats: computeStats(SAMPLE_FLIGHT_OFFERS) })));
      const state = await fetchTurna({ kind: 'flight', from: 'İstanbul', to: 'Ankara' }, { fetchImpl: fake.fetchImpl, now: () => new Date(CLOCK_START) });
      const ok = expectLive(state, 'ok');
      expect(fake.calls).toHaveLength(1);
      expect(fake.calls[0].url).toBe('/api/turna?kind=flight&from=istanbul&to=ankara');
      expect(fake.calls[0].method).toBe('GET');
      expect(fake.calls[0].headers.accept).toBe('application/json');
      expect(fake.calls[0].init?.credentials).toBe('same-origin');
      expect(fake.calls[0].init?.signal instanceof AbortSignal).toBeTruthy();
      expect(ok.query).toEqual({ kind: 'flight', from: 'istanbul', to: 'ankara' });
      expect(ok.routes).toHaveLength(2);
      expect(ok.droppedItems).toBe(0);
      expect(ok.receivedAt).toBe(new Date(CLOCK_START).toISOString());
      expect(ok.result.stats?.min).toBe(999);
      expect(ok.routes[0].from).toBe('İstanbul');
      const refreshed = fakeFetch(() => jsonResponse(successEnvelope()));
      await fetchTurna({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { fetchImpl: refreshed.fetchImpl, refresh: true });
      expect(refreshed.calls[0].url).toBe('/api/turna?kind=bus&from=istanbul&to=ankara&refresh=1');
    });

    it('G.19 fetchTurna counts guard drops in droppedItems and uses display names only as fallbacks', async () => {
      const wire = asWireJson(successEnvelope()) as Record<string, unknown>;
      (wire.items as unknown[]).push(STRING_PRICE_OFFER);
      const fake = fakeFetch(() => jsonResponse(wire));
      const ok = expectLive(await fetchTurna({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchImpl: fake.fetchImpl }), 'ok');
      expect(ok.droppedItems).toBe(1);
      expect(ok.routes).toHaveLength(2);
      const anonymous: FlightOffer = { ...SAMPLE_FLIGHT_OFFERS[0], fromName: '', fromCode: null, toName: '', toCode: null };
      const fallback = fakeFetch(() => jsonResponse(successEnvelope({ items: [anonymous] })));
      const fromPlaces = expectLive(await fetchTurna({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchImpl: fallback.fetchImpl }), 'ok');
      expect(fromPlaces.routes[0].from).toBe('İstanbul');
      expect(fromPlaces.routes[0].to).toBe('Ankara');
      const explicit = fakeFetch(() => jsonResponse(successEnvelope({ items: [anonymous] })));
      const fromOpts = expectLive(await fetchTurna({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchImpl: explicit.fetchImpl, fromCity: 'Kadıköy', toCity: 'Çankaya' }), 'ok');
      expect(fromOpts.routes[0].from).toBe('Kadıköy');
      expect(fromOpts.routes[0].to).toBe('Çankaya');
    });

    it('G.20 fetchTurna maps zero items to facts-only and failures to error with status, code and Retry-After', async () => {
      const ferry = fakeFetch(() => jsonResponse(successEnvelope({ kind: 'ferry', items: [], routeKey: 'ferry:yalova-yenikapi', sourceUrl: FERRY_TARGET.url })));
      const factsOnly = expectLive(await fetchTurna({ kind: 'ferry', from: 'Yalova', to: 'Yenikapı' }, { fetchImpl: ferry.fetchImpl }), 'facts-only');
      expect(factsOnly.result.kind).toBe('ferry');
      expect(factsOnly.query).toEqual({ kind: 'ferry', from: 'yalova', to: 'yenikapi' });
      const blocked = fakeFetch(() => jsonResponse({ success: false, error: 'Turna erişimi engelli', errorCode: 'blocked' }, { status: 503, headers: { 'Retry-After': '120' } }));
      const err = expectLive(await fetchTurna({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchImpl: blocked.fetchImpl }), 'error');
      expect(err.httpStatus).toBe(503);
      expect(err.errorCode).toBe('blocked');
      expect(err.message).toBe('Turna erişimi engelli');
      expect(err.retryAfterSeconds).toBe(120);
      expect(err.query).toEqual({ kind: 'flight', from: 'istanbul', to: 'ankara' });
      const notFound = fakeFetch(() => jsonResponse({ success: false, error: 'yok', errorCode: 'route_not_found' }, { status: 404 }));
      const nf = expectLive(await fetchTurna({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchImpl: notFound.fetchImpl }), 'error');
      expect(nf.errorCode).toBe('route_not_found');
      expect(nf.retryAfterSeconds).toBeUndefined();
    });

    it('G.21 fetchTurna reports invalid_response, http_5xx, network and aborted honestly', async () => {
      const garbage = fakeFetch(() => jsonResponse({ hello: 'world' }));
      const invalid = expectLive(await fetchTurna({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchImpl: garbage.fetchImpl }), 'error');
      expect(invalid.errorCode).toBe('invalid_response');
      expect(invalid.httpStatus).toBe(200);
      const html = fakeFetch(() => htmlResponse('<html>Bad Gateway</html>', { status: 502 }));
      const badGateway = expectLive(await fetchTurna({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchImpl: html.fetchImpl }), 'error');
      expect(badGateway.errorCode).toBe('http_502');
      expect(badGateway.message).toBe('Sunucu yanıtı okunamadı.');
      const offline = fakeFetch(() => {
        throw new TypeError('Failed to fetch');
      });
      const network = expectLive(await fetchTurna({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchImpl: offline.fetchImpl }), 'error');
      expect(network.errorCode).toBe('network');
      expect(network.httpStatus).toBeNull();
      const controller = new AbortController();
      controller.abort();
      const aborting = fakeFetch((call) => {
        if (call.init?.signal?.aborted) throw new DOMException('aborted', 'AbortError');
        return jsonResponse(successEnvelope());
      });
      const aborted = expectLive(await fetchTurna({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchImpl: aborting.fetchImpl, signal: controller.signal }), 'error');
      expect(aborted.errorCode).toBe('aborted');
      expect(aborted.message).toBe('Arama iptal edildi.');
    });

    it('G.22 city-level codes from the live pages (IST -> ANK, IST -> IZM) never resolve to a specific İstanbul airport', () => {
      // Shapes copied from real /api/turna responses: Turna publishes city codes, not IATA airport codes.
      const izmir: FlightOffer = {
        ...SAMPLE_FLIGHT_OFFERS[0],
        id: 'abcdef012345',
        airline: 'AJet',
        airlineCode: 'VF',
        fromName: 'İstanbul (IST)',
        fromCode: 'IST',
        toName: 'İzmir (IZM)',
        toCode: 'IZM',
      };
      const { routes, dropped } = toRouteItems(successEnvelope({ items: [SAMPLE_FLIGHT_OFFERS[0], izmir] }), ROUTE_CTX);
      expect(dropped).toBe(0);
      expect(routes).toHaveLength(2);
      for (const route of routes) {
        expect(route.fromTerminal).toBe('İstanbul (IST)');
        expect(route.fromTerminal).toNotContain('İGA');
        expect(route.fromTerminal).toNotContain('Havalimanı');
        expect(route.from).toBe('İstanbul');
      }
      expect(routes[0].toTerminal).toBe('Ankara (ANK)');
      expect(routes[1].toTerminal).toBe('İzmir (IZM)');
      expect(routes[1].to).toBe('İzmir');
    });
  });
}

// ---------------------------------------------------------------------------
// H. Local places autocomplete
// ---------------------------------------------------------------------------

interface FakeStorage {
  map: Map<string, string>;
  localStorage: Storage;
}

function fakeStorage(): FakeStorage {
  const map = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (index: number) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
  return { map, localStorage };
}

/** Install a window.localStorage stand-in for the duration of fn (the runner is sequential). */
function withFakeWindow<T>(fn: (storage: FakeStorage) => T): T {
  const g = globalThis as { window?: unknown };
  const had = 'window' in g;
  const previous = g.window;
  const storage = fakeStorage();
  g.window = { localStorage: storage.localStorage };
  try {
    return fn(storage);
  } finally {
    if (had) g.window = previous;
    else delete g.window;
  }
}

function recent(transportType: RecentSearch['transportType'], fromSlug: string, toSlug: string, at: string): RecentSearch {
  return { transportType, fromCity: fromSlug, toCity: toSlug, fromSlug, toSlug, at };
}

function registerPlacesTests(): void {
  describe('Turna H: local places autocomplete', () => {
    it('H.1 "ist" in ucak mode ranks İstanbul first with its IST and SAW airports', () => {
      const [first] = searchPlaces('ist', 'ucak');
      expect(first.cityName).toBe('İstanbul');
      expect(first.slug).toBe('istanbul');
      expect(first.matchedOn).toBe('city');
      expect(first.plate).toBe(34);
      expect(first.airports.map((a) => a.code)).toEqual(['IST', 'SAW']);
      expect(first.modes).toContain('ucak');
      expect(first.modes).toContain('otobus');
      expect(first.terminals.length).toBeGreaterThan(0);
    });

    it('H.2 ıst, IST and İst are equivalent to ist (Turkish-aware normalisation)', () => {
      const expected = searchPlaces('ist', 'ucak').map((s) => s.slug);
      expect(searchPlaces('ıst', 'ucak').map((s) => s.slug)).toEqual(expected);
      expect(searchPlaces('IST', 'ucak').map((s) => s.slug)).toEqual(expected);
      expect(searchPlaces('İst', 'ucak').map((s) => s.slug)).toEqual(expected);
      expect(searchPlaces('İSTANBUL', 'otobus')[0].slug).toBe('istanbul');
      expect(searchPlaces('çeş', 'otobus')[0].slug).toBe('cesme');
    });

    it('H.3 IATA codes, airport names and terminals are secondary match keys', () => {
      const adb = searchPlaces('adb', 'ucak');
      expect(adb[0].cityName).toBe('İzmir');
      expect(adb[0].matchedOn).toBe('code');
      const saw = searchPlaces('saw', 'ucak');
      expect(saw[0].cityName).toBe('İstanbul');
      expect(saw[0].matchedOn).toBe('code');
      const esenler = searchPlaces('esenler', 'otobus');
      expect(esenler[0].cityName).toBe('İstanbul');
      expect(esenler[0].matchedOn).toBe('terminal');
      expect(esenler[0].terminals.some((t) => t.includes('Esenler'))).toBeTruthy();
      const gokcen = searchPlaces('gokcen', 'ucak');
      expect(gokcen[0].cityName).toBe('İstanbul');
      expect(gokcen[0].matchedOn).toBe('airport');
    });

    it('H.4 the Feribot tab only ever suggests the preset-verified FERRY_STOPS', () => {
      expect(FERRY_STOPS.map((s) => s.slug)).toEqual(['yalova', 'yenikapi', 'pendik']);
      const y = searchPlaces('y', 'feribot');
      expect(y.map((s) => s.slug)).toEqual(['yenikapi', 'yalova']);
      for (const s of y) {
        expect(s.matchedOn).toBe('stop');
        expect(s.modes).toContain('feribot');
      }
      expect(searchPlaces('pen', 'feribot').map((s) => s.slug)).toEqual(['pendik']);
      expect(searchPlaces('ist', 'feribot')).toEqual([]);
      expect(searchPlaces('ankara', 'feribot')).toEqual([]);
      for (const term of ['a', 'e', 'i', 'y', 'p', 'yal', 'yeni', 'pendik']) {
        for (const s of searchPlaces(term, 'feribot')) expect(FERRY_STOPS.some((f) => f.slug === s.slug)).toBeTruthy();
      }
    });

    it('H.5 tren yields nothing; empty terms and zero limits yield nothing; limit is honoured', () => {
      expect(searchPlaces('ist', 'tren')).toEqual([]);
      expect(searchPlaces('', 'ucak')).toEqual([]);
      expect(searchPlaces('   ', 'otobus')).toEqual([]);
      expect(searchPlaces('a', 'otobus', 0)).toEqual([]);
      expect(searchPlaces('a', 'otobus', 3)).toHaveLength(3);
      expect(searchPlaces('a', 'otobus').length).toBeLessThanOrEqual(8);
      expect(popularCities('tren')).toEqual([]);
    });

    it('H.6 every suggestion slug equals slugifyTr(cityName), so URL and label can never disagree', () => {
      const letters = 'abcdefghijklmnoprstuvyz'.split('');
      let seen = 0;
      for (const term of letters) {
        for (const mode of ['otobus', 'ucak', 'feribot'] as const) {
          for (const s of searchPlaces(term, mode, 81)) {
            seen += 1;
            expect(s.slug).toBe(slugifyTr(s.cityName));
            expect(s.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
            expect(isAllowedLandingUrl(`https://www.turna.com/otobus-bileti/${s.slug}-x`)).toBeTruthy();
          }
        }
      }
      expect(seen).toBeGreaterThan(81);
    });

    it('H.7 findPlaceBySlug normalises its input and knows the ferry stops and districts', () => {
      const urfa = findPlaceBySlug('sanliurfa');
      expect(urfa?.cityName).toBe('Şanlıurfa');
      expect(urfa?.plate).toBe(63);
      expect(urfa?.airports.map((a) => a.code)).toEqual(['GNY']);
      expect(findPlaceBySlug('İstanbul')?.slug).toBe('istanbul');
      expect(findPlaceBySlug('yalova')?.modes).toEqual(['otobus', 'feribot']);
      expect(findPlaceBySlug('yenikapi')?.modes).toEqual(['feribot']);
      expect(findPlaceBySlug('pendik')?.modes).toEqual(['feribot']);
      expect(findPlaceBySlug('nope')).toBeUndefined();
      expect(findPlaceBySlug('')).toBeUndefined();
    });

    it('H.8 EXTRA_DISTRICTS Bodrum and Çeşme are rows with their province plate and region', () => {
      expect(EXTRA_DISTRICTS.map((d) => [d.slug, d.province])).toEqual([
        ['bodrum', 'Muğla'],
        ['cesme', 'İzmir'],
      ]);
      const bodrum = searchPlaces('bod', 'ucak')[0];
      expect(bodrum.slug).toBe('bodrum');
      expect(bodrum.modes).toEqual(['otobus', 'ucak']);
      expect(bodrum.airports.map((a) => a.code)).toEqual(['BJV']);
      expect(bodrum.plate).toBe(48);
      expect(bodrum.region).toBe('Ege');
      const cesme = searchPlaces('ces', 'otobus')[0];
      expect(cesme.slug).toBe('cesme');
      expect(cesme.terminals).toEqual(['Çeşme Otogarı']);
      expect(cesme.plate).toBe(35);
      expect(searchPlaces('ces', 'ucak').map((s) => s.slug)).toNotContain('cesme');
    });

    it('H.9 popularCities ranks provinces by intercity-route frequency; feribot follows preset order', () => {
      const bus = popularCities('otobus');
      expect(bus).toHaveLength(8);
      expect(bus[0].cityName).toBe('İstanbul');
      expect(bus.slice(0, 3).map((c) => c.cityName)).toEqual(['İstanbul', 'Ankara', 'İzmir']);
      for (const c of bus) expect(c.modes).toContain('otobus');
      const air = popularCities('ucak');
      for (const c of air) expect(c.airports.length).toBeGreaterThan(0);
      expect(popularCities('feribot').map((c) => c.cityName)).toEqual(['Yalova', 'Yenikapı', 'Pendik']);
      expect(popularCities('otobus', 3)).toHaveLength(3);
      expect(popularCities('otobus', 0)).toEqual([]);
      expect(new Set(bus.map((c) => c.slug)).size).toBe(8);
    });

    it('H.10 recent searches are SSR-safe: no window means an empty list and silent writes', () => {
      expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
      expect(readRecentSearches()).toEqual([]);
      writeRecentSearch(recent('ucak', 'istanbul', 'ankara', FETCHED_AT_ISO));
      clearRecentSearches();
      expect(readRecentSearches()).toEqual([]);
      expect(RECENT_SEARCHES_KEY).toBe('bileo_recent_searches');
      expect(RECENT_SEARCHES_MAX).toBe(5);
    });

    it('H.11 recent searches persist newest first, dedupe by mode plus slugs and keep at most five', () => {
      withFakeWindow((storage) => {
        writeRecentSearch(recent('ucak', 'istanbul', 'ankara', '2026-09-06T10:00:00.000Z'));
        writeRecentSearch(recent('otobus', 'istanbul', 'ankara', '2026-09-06T10:01:00.000Z'));
        writeRecentSearch(recent('ucak', 'istanbul', 'izmir', '2026-09-06T10:02:00.000Z'));
        expect(readRecentSearches().map((r) => `${r.transportType}:${r.toSlug}`)).toEqual(['ucak:izmir', 'otobus:ankara', 'ucak:ankara']);
        writeRecentSearch(recent('ucak', 'istanbul', 'ankara', '2026-09-06T10:03:00.000Z'));
        const deduped = readRecentSearches();
        expect(deduped).toHaveLength(3);
        expect(deduped[0].at).toBe('2026-09-06T10:03:00.000Z');
        writeRecentSearch(recent('ucak', 'istanbul', 'antalya', '2026-09-06T10:04:00.000Z'));
        writeRecentSearch(recent('ucak', 'istanbul', 'trabzon', '2026-09-06T10:05:00.000Z'));
        writeRecentSearch(recent('ucak', 'ankara', 'izmir', '2026-09-06T10:06:00.000Z'));
        const capped = readRecentSearches();
        expect(capped).toHaveLength(RECENT_SEARCHES_MAX);
        expect(capped[0].fromSlug).toBe('ankara');
        expect(capped.some((r) => r.toSlug === 'ankara' && r.transportType === 'otobus')).toBeFalsy();
        expect(JSON.parse(storage.map.get(RECENT_SEARCHES_KEY) ?? '[]')).toHaveLength(5);
        clearRecentSearches();
        expect(readRecentSearches()).toEqual([]);
        expect(storage.map.has(RECENT_SEARCHES_KEY)).toBeFalsy();
      });
    });

    it('H.12 corrupt or foreign localStorage content is ignored, never thrown', () => {
      withFakeWindow((storage) => {
        storage.map.set(RECENT_SEARCHES_KEY, '{not json');
        expect(readRecentSearches()).toEqual([]);
        storage.map.set(RECENT_SEARCHES_KEY, JSON.stringify([{ transportType: 'ucak' }, 5, null, recent('otobus', 'bursa', 'istanbul', 'x'), { ...recent('tren', 'a', 'b', 'x') }, { ...recent('ucak', 'c', 'd', 'x'), transportType: 'car' }]));
        const kept = readRecentSearches();
        expect(kept.map((r) => r.fromSlug)).toEqual(['bursa', 'a']);
        writeRecentSearch(recent('ucak', 'istanbul', 'ankara', 'y'));
        expect(readRecentSearches()).toHaveLength(3);
      });
    });
  });
}

// ---------------------------------------------------------------------------
// I. Static guards over the integrated tree
// ---------------------------------------------------------------------------

/** Literals the spec forbids anywhere under api/, src/ and vite.config.ts (assembled so this file stays clean). */
const FORBIDDEN_LITERALS: string[] = [
  ['turna.com', 'api'].join('/'),
  ['tek', 'yon'].join('-'),
  ['scrapeTurna', 'Direct'].join(''),
  ['live', 'scrape'].join('-'),
  ['/api/', 'autocomplete'].join(''),
];

const NODE_BUILTINS = new Set(['fs', 'path', 'crypto', 'http', 'https', 'url', 'os', 'child_process', 'stream', 'zlib', 'net', 'tls', 'events', 'buffer', 'util']);

const NEW_SOURCE_DIRS = ['src/lib/turna', 'src/components/results', 'src/server/turna', 'src/lib/sources', 'src/server/sources'];
const NEW_SOURCE_FILES = ['src/tests/turna_scraper.test.ts', 'src/tests/fixtures/turna_fixtures.ts', 'api/turna.ts', 'api/search.ts', 'scripts/turna_smoke.ts', 'src/tests/sources.test.ts', 'src/tests/fixtures/sources_fixtures.ts'];

function registerStaticGuardTests(): void {
  describe('Turna I: static guards', () => {
    it('I.1 browser-facing code imports neither node: modules nor src/server/turna', () => {
      const roots = [rel('src/lib'), rel('src/components'), rel('src/data')];
      const files = [...roots.flatMap((dir) => walkFiles(dir, isCodeFile)), rel('src/App.tsx'), rel('src/main.tsx')];
      expect(files.length).toBeGreaterThan(20);
      const violations: string[] = [];
      for (const file of files) {
        for (const spec of importSpecifiers(readText(file))) {
          if (spec.startsWith('node:') || spec.includes('server/turna')) violations.push(`${path.relative(ROOT, file)} -> ${spec}`);
        }
      }
      expect(violations).toEqual([]);
    });

    it('I.2 src/lib/turna is pure browser code: no bare Node builtins, no components, no server imports', () => {
      const files = walkFiles(rel('src/lib/turna'), isCodeFile);
      expect(files.map((f) => path.basename(f)).sort()).toEqual(['adapter.ts', 'alerts.ts', 'analytics.ts', 'client.ts', 'format.ts', 'guard.ts', 'places.ts', 'types.ts', 'urls.ts']);
      const violations: string[] = [];
      for (const file of files) {
        for (const spec of importSpecifiers(readText(file))) {
          if (NODE_BUILTINS.has(spec) || spec.startsWith('node:') || spec.includes('/server/') || spec.includes('/components/')) {
            violations.push(`${path.basename(file)} -> ${spec}`);
          }
        }
      }
      expect(violations).toEqual([]);
      expect(readText(rel('src/server/turna/parse.ts'))).toContain("from 'node:crypto'");
      expect(readText(rel('src/server/turna/parse.ts'))).toContain('SERVER ONLY');
    });

    it('I.3 no file under src/components or src/data mentions lucide-react', () => {
      const hits: string[] = [];
      for (const dir of [rel('src/components'), rel('src/data')]) {
        for (const file of walkFiles(dir)) {
          for (const line of linesContaining(readText(file), 'lucide-react')) hits.push(`${path.relative(ROOT, file)}:${line}`);
        }
      }
      expect(hits).toEqual([]);
    });

    it('I.4 api/, src/ and vite.config.ts contain none of the retired scraper or private-API literals', () => {
      const files = [...walkFiles(rel('api')), ...walkFiles(rel('src')), rel('vite.config.ts')];
      expect(files.length).toBeGreaterThan(50);
      const hits: string[] = [];
      for (const file of files) {
        const text = readText(file);
        for (const literal of FORBIDDEN_LITERALS) {
          for (const line of linesContaining(text, literal)) hits.push(`${path.relative(ROOT, file)}:${line} (${literal})`);
        }
      }
      expect(hits).toEqual([]);
    });

    it('I.5 new source files contain no em or en dash', () => {
      const files = [...NEW_SOURCE_DIRS.flatMap((dir) => walkFiles(rel(dir), isCodeFile)), ...NEW_SOURCE_FILES.map((f) => rel(f)).filter((f) => fs.existsSync(f))];
      expect(files.length).toBeGreaterThan(18);
      const hits: string[] = [];
      for (const file of files) {
        for (const line of linesContaining(readText(file), DASHES)) hits.push(`${path.relative(ROOT, file)}:${line}`);
      }
      expect(hits).toEqual([]);
    });

    it('I.6 TicketExperienceScreen no longer fabricates reviews or scores', () => {
      const text = readText(rel('src/components/TicketExperienceScreen.tsx'));
      for (const forbidden of ['DEFAULT_REVIEWS', '|| 4.8', '|| 1420', 'Pamukkale Müşteri Deneyimi']) expect(text).toNotContain(forbidden);
      expect(text).toContain('Puan verisi yok');
      expect(text).toContain('Önizleme kodu');
      expect(text).toContain('Kaynak sayfa');
    });

    it('I.7 SearchResults and the results components follow the design rules of the spec', () => {
      const searchResults = readText(rel('src/components/SearchResults.tsx'));
      expect(searchResults).toNotContain('id="search-results-section"');
      expect(searchResults).toNotContain('animate-ping');
      expect(searchResults).toNotContain('senkronize edildi');
      expect(searchResults).toContain('aria-live="polite"');
      const resultsDir = rel('src/components/results');
      const files = walkFiles(resultsDir, isCodeFile).map((f) => path.basename(f)).sort();
      expect(files).toEqual([
        'BrandLogo.tsx',
        'CarResults.tsx',
        'DayStrip.tsx',
        'FerryFactsPanel.tsx',
        'HotelResults.tsx',
        'OtherSourcesPanel.tsx',
        'PriceDeltaLine.tsx',
        'PriceHistoryStrip.tsx',
        'PriceStatsRow.tsx',
        'ProvenanceStrip.tsx',
        'ResultsSkeleton.tsx',
        'RouteFactsLine.tsx',
        'SearchStateNotice.tsx',
        'SourceBadge.tsx',
      ]);
      for (const file of walkFiles(resultsDir, isCodeFile)) {
        const text = readText(file);
        expect(text).toNotContain('animate-ping');
        expect(text).toNotContain('lucide-react');
        for (const noop of ['animate-fadeIn', 'shadow-2xs', 'shadow-xs', 'backdrop-blur-xs', 'no-scrollbar']) expect(text).toNotContain(noop);
      }
      expect(readText(path.join(resultsDir, 'ProvenanceStrip.tsx'))).toContain(
        'Bu liste Turna.com rota sayfasındaki yaklaşan tarihlerin en ucuz seferleridir; belirli bir güne ait tam sefer listesi değildir.',
      );
      expect(readText(rel('src/components/icons/BileoIcons.tsx'))).toContain('BileoExternalLink');
    });

    it('I.8 HeroSection uses the local autocomplete and dropped the fabricated defaults', () => {
      const hero = readText(rel('src/components/HeroSection.tsx'));
      for (const forbidden of ['Turna veritabanından aranıyor', 'POPULAR_CHIPS', 'isLoadingSuggestions', 'countryName', '#0a1172', '#070b4f', '28 Ağu']) {
        expect(hero).toNotContain(forbidden);
      }
      expect(hero).toContain('searchPlaces');
      expect(hero).toContain('role="combobox"');
      // Exactly one page-level heading exists on the main screen and it lives in the Hero (screen-reader only).
      expect(hero).toContain('<h1 className="sr-only">');
      expect(hero.split('<h1').length - 1).toBe(1);
      expect(readText(rel('src/components/Header.tsx'))).toNotContain('<h1');
      expect(readText(rel('src/components/SearchResults.tsx'))).toNotContain('<h1');
      expect(hero).toContain('role="listbox"');
      expect(hero).toContain('aria-autocomplete="list"');
      expect(hero).toContain('<form');
      expect(hero).toContain('BileoSwapHorizontal');
      expect(hero).toContain('Yaklaşan tarihler');
    });

    it('I.9 App drives search through fetchTurna with visibility-based revalidation and a single purchase callback', () => {
      const app = readText(rel('src/App.tsx'));
      expect(app).toContain('fetchTurna(');
      expect(app).toContain("from './lib/turna/client'");
      expect(app).toContain('visibilitychange');
      expect(app).toNotContain('setInterval(');
      expect(app).toNotContain('fetchLiveTurnaTickets');
      expect(app).toNotContain('24 Mayıs Cuma');
      expect(app).toContain('onBookingCompleted={handleTicketPurchased}');
      expect(app).toNotContain('onPaymentSuccess=');
      expect(app).toContain("from './lib/turna/places'");
      expect(app).toContain('writeRecentSearch(');
    });

    it('I.10 build and deploy configuration matches spec section 1', () => {
      const tsconfig = JSON.parse(readText(rel('tsconfig.json'))) as { include: string[]; exclude?: string[] };
      expect(tsconfig.include).toEqual(['src', 'api', 'vite.config.ts']);
      const pkg = JSON.parse(readText(rel('package.json'))) as { engines?: Record<string, string>; scripts: Record<string, string> };
      expect(pkg.engines?.node).toBe('22.x');
      expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
      expect(pkg.scripts['smoke:turna']).toBe('tsx scripts/turna_smoke.ts');
      expect(pkg.scripts.test).toBe('tsx src/tests/test_runner.ts');
      const vercel = JSON.parse(readText(rel('vercel.json'))) as { functions?: Record<string, { maxDuration?: number }>; rewrites: Array<{ source: string }> };
      expect(vercel.functions?.['api/turna.ts']?.maxDuration).toBe(30);
      expect(vercel.functions?.['api/search.ts']?.maxDuration).toBe(30);
      expect(readText(rel('api/search.ts'))).toContain("from '../src/server/sources/http'");
      expect(vercel.rewrites.map((r) => r.source)).toEqual(['/api/(.*)', '/(.*)']);
      const env = readText(rel('.env.example'));
      for (const key of ['TURNA_CACHE_TTL_MS=600000', 'TURNA_MIN_INTERVAL_MS=1200', 'TURNA_BLOCK_COOLDOWN_MS=300000', 'TURNA_REFRESH_MIN_MS=60000', 'TURNA_NEG_CACHE_TTL_MS=60000', 'TURNA_MAX_FETCHES_PER_MIN=20', 'TURNA_RESPECT_ROBOTS=1', 'TURNA_HISTORY=memory']) {
        expect(env).toContain(key);
      }
      const apiEntry = readText(rel('api/turna.ts'));
      expect(apiEntry).toContain("from '../src/server/turna/http'");
      expect(apiEntry).toContain('serveTurnaNode(req, res)');
      expect(apiEntry).toContain('maxDuration: 30');
      const viteConfig = readText(rel('vite.config.ts'));
      expect(viteConfig).toContain('turnaApiPlugin');
      expect(viteConfig).toContain('./src/server/turna/vitePlugin');
    });

    it('I.11 the retired scraper, scratch files and static route dump are gone', () => {
      const gone = [
        'api/utils/scraper.ts',
        ['api/live', 'scrape.ts'].join('-'),
        'api/autocomplete.ts',
        'scratch.ts',
        'scratch_fetch.ts',
        'scratch_fetch2.ts',
        'turna_test.html',
        'turna_test2.html',
        'turna_sanliurfa.html',
        'tools/turna_live_api.py',
        'src/data/turnaScrapedRoutes.json',
      ];
      const stillPresent = gone.filter((f) => fs.existsSync(rel(f)));
      expect(stillPresent).toEqual([]);
      expect(fs.existsSync(rel('api/turna.ts'))).toBeTruthy();
      expect(fs.existsSync(rel('src/components/HeroSection.tsx'))).toBeTruthy();
    });

    it('I.12 turnaScrapedRoutes.ts survives as an empty, BOM-free export that mockData still spreads', () => {
      const text = readText(rel('src/data/turnaScrapedRoutes.ts'));
      expect(text.charCodeAt(0) === 0xfeff).toBeFalsy();
      expect(text).toContain('export const TURNA_SCRAPED_ROUTES: RouteItem[] = []');
      expect(TURNA_SCRAPED_ROUTES).toEqual([]);
      const mock = readText(rel('src/data/mockData.ts'));
      expect(mock).toContain("from './turnaScrapedRoutes'");
      expect(mock).toContain('...TURNA_SCRAPED_ROUTES');
    });

    it('I.13 mock rows keep exactly 10 POPULAR_ROUTES with HH:MM clocks and Hs MMdk durations', () => {
      expect(POPULAR_ROUTES).toHaveLength(10);
      for (const route of POPULAR_ROUTES) {
        expect(route.departureTime).toMatch(/^\d{2}:\d{2}$/);
        expect(route.arrivalTime).toMatch(/^\d{2}:\d{2}$/);
        expect(route.duration).toMatch(/^\d+s \d{2}dk$/);
        expect(route.provenance).toBeUndefined();
        expect(formatTrDate(route.date)).toBe(route.date);
      }
    });

    it('I.14 this suite and its fixtures keep the repo-wide literal gate clean by construction', () => {
      const self = readText(rel('src/tests/turna_scraper.test.ts')) + readText(rel('src/tests/fixtures/turna_fixtures.ts'));
      for (const literal of FORBIDDEN_LITERALS) expect(self).toNotContain(literal);
      expect(PRIVATE_API_URL).toContain(FORBIDDEN_LITERALS[0]);
      expect(DATED_SEARCH_URL).toContain(FORBIDDEN_LITERALS[1]);
    });
  });
}

// ---------------------------------------------------------------------------
// J. SearchResults SSR (renderToStaticMarkup in Node)
// ---------------------------------------------------------------------------

type SearchResultsModule = typeof import('../components/SearchResults');
let searchResultsModule: SearchResultsModule | null = null;

async function loadSearchResults(): Promise<SearchResultsModule> {
  if (!searchResultsModule) searchResultsModule = await import('../components/SearchResults');
  return searchResultsModule;
}

const noop = (): void => undefined;

const BASE_SEARCH_STATE: SearchFilterState = {
  transportType: 'ucak',
  fromCity: 'İstanbul',
  toCity: 'Ankara',
  departureDate: '',
  passengerCount: 1,
  maxPrice: 5000,
  selectedCompanies: [],
  departureTimeRange: 'all',
  onlyDirect: false,
  seatTypePreference: 'all',
  sortBy: 'cheapest',
};

const PROVENANCE_DISCLOSURE = 'Bu liste Turna.com rota sayfasındaki yaklaşan tarihlerin en ucuz seferleridir; belirli bir güne ait tam sefer listesi değildir.';

async function renderResults(live: LiveSearchState | undefined, extra: Partial<SearchResultsProps> = {}): Promise<string> {
  const mod = await loadSearchResults();
  const props: SearchResultsProps = {
    routes: live?.status === 'ok' ? live.routes : [],
    searchState: BASE_SEARCH_STATE,
    live,
    onRefresh: noop,
    onUpdateSearchState: noop,
    onSelectRoute: noop,
    onOpenPriceAlert: noop,
    ...extra,
  };
  // React.lazy renders its fallback on the first server pass; once the chunk promise settles the
  // second pass contains the real panel, exactly like a browser that has the chunk cached.
  let html = renderToStaticMarkup(React.createElement(mod.SearchResults, props));
  if (html.includes('data-lazy-fallback=')) {
    await mod.preloadCityResults();
    await new Promise((resolve) => setTimeout(resolve, 0));
    html = renderToStaticMarkup(React.createElement(mod.SearchResults, props));
  }
  return html;
}

const count = (html: string, needle: string): number => html.split(needle).length - 1;
const semanticDots = (html: string): number => (html.match(/rounded-full[^"]*bg-(emerald|amber)-500/g) ?? []).length;

/** React DOM's text and attribute escaping, so copy with apostrophes or ampersands can be matched in SSR output. */
const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[ch] ?? ch);

/** The one `<article>` whose aria-label starts with `labelPrefix` (React-escaped); throws when there is none. */
function cardFor(html: string, labelPrefix: string): string {
  const marker = `<article aria-label="${escapeHtml(labelPrefix)}`;
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`No <article> with an aria-label starting "${labelPrefix}"`);
  const end = html.indexOf('</article>', start);
  return html.slice(start, end === -1 ? undefined : end);
}

/** The polygon BileoStar draws; one per rendered star icon. */
const STAR_POLYGON = 'points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"';

/** City-kind copy owned by SearchResults (pinned verbatim; the route disclosure must not leak into these screens). */
const CITY_DISCLOSURE_HOTEL = 'Bu liste Turna.com şehir sayfasında listelenen otellerdir; fiyatlar tarih seçimine bağlı olduğu için burada gösterilmez.';
const CITY_DISCLOSURE_CAR = 'Bu liste Turna.com şehir sayfasında yayımlanan araçların günlük fiyatlarıdır; tarih ve teslim noktasına göre değişebilir.';
const CITY_EMPTY_TITLE = 'Turna bu şehir için liste yayımlamamış.';
/** HotelResults' stand-in for a price (pinned verbatim: the hotel screen must never show a number as a price). */
const HOTEL_PRICE_NOTE_COPY = 'Fiyat tarih seçimine bağlıdır; Turna sayfasında görüntülenir.';

/** An `ok` live state for a hotel or car body: routes are always empty, the offers live in result.items. */
function cityOkState(result: TurnaSuccess): Extract<LiveSearchState, { status: 'ok' }> {
  return { status: 'ok', query: result.query, result, routes: [], droppedItems: 0, receivedAt: result.scrapedAt };
}

async function liveOkState(): Promise<Extract<LiveSearchState, { status: 'ok' }>> {
  const scrapedAt = new Date().toISOString();
  const out = await runTurnaQuery({ kind: 'flight', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(FLIGHT_PAGE, 'direct', scrapedAt), store: new NoopHistoryStore() });
  const result = expectSuccess(out.body);
  result.warnings.push(ROBOTS_FETCH_FAILED_WARNING);
  const { routes, dropped } = toRouteItems(result, ROUTE_CTX);
  return { status: 'ok', query: { kind: 'flight', from: 'istanbul', to: 'ankara' }, result, routes, droppedItems: dropped + 1, receivedAt: scrapedAt };
}

function registerSsrTests(): void {
  describe('Turna J: SearchResults SSR', () => {
    it('J.1 idle renders the sign-in notice inside a polite live region', async () => {
      const html = await renderResults({ status: 'idle' });
      expect(html).toContain('Aramayı başlatmak için giriş yapın.');
      expect(html).toContain('aria-live="polite"');
      expect(semanticDots(html)).toBe(0);
      expect(html).toNotContain('animate-ping');
    });

    it('J.2 loading renders the skeleton, aria-busy and no semantic dot', async () => {
      const html = await renderResults({ status: 'loading', query: { kind: 'flight', from: 'istanbul', to: 'ankara' }, startedAt: Date.now() });
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain('animate-pulse');
      expect(semanticDots(html)).toBe(0);
      expect(html).toNotContain('Kaynak sayfa');
    });

    it('J.3 ok renders provenance, disclosure, stats, day strip, facts and per-card dates from the fixture', async () => {
      const live = await liveOkState();
      const html = await renderResults(live);
      expect(html).toContain('Turna.com');
      expect(html).toContain('Kaynak sayfa');
      expect(html).toContain('Canlı alındı');
      expect(html).toContain(PROVENANCE_DISCLOSURE);
      expect(html).toContain('href="https://www.turna.com/ucak-bileti/istanbul-ankara"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('Notlar (2)');
      expect(html).toContain('En düşük');
      expect(html).toContain('Ortanca');
      expect(html).toContain('En yüksek');
      expect(html).toContain('1.401,11 TL');
      expect(html).toContain('role="radiogroup"');
      expect(count(html, 'role="radio"')).toBe((live.result.stats?.byDay.length ?? 0) + 1);
      expect(html).toContain('En ucuz gün');
      expect(html).toContain('Turna rota bilgisi');
      expect(html).toContain('24 Eylül Perşembe');
      expect(html).toContain('25 Eylül Cuma');
      expect(html).toContain('26 Eylül Cumartesi');
      expect(html).toContain('09:50');
      expect(count(html, '>İncele<')).toBe(3);
      expect(html).toContain('aria-live="polite"');
      expect(semanticDots(html)).toBe(1);
    });

    it('J.4 ok never shows fabricated affordances for Turna rows', async () => {
      const html = await renderResults(await liveOkState());
      expect(html).toNotContain('Direkt Sefer');
      expect(html).toNotContain('En Yüksek Puanlı');
      expect(html).toNotContain('Sadece 2+1');
      expect(html).toNotContain('animate-ping');
      expect(html).toNotContain('senkronize');
      expect(html).toNotContain('220V');
      expect(html).toNotContain('Yoğun Talep');
      expect(html).toNotContain('En Uygun');
      expect(html).toNotContain('saniye önce');
      expect(html).toNotContain('search-results-section');
      expect(DASHES.test(html)).toBeFalsy();
    });

    it('J.5 a cached result shows Önbellekten and the amber dot', async () => {
      const live = await liveOkState();
      live.result.fetchedVia = 'cache';
      live.result.scrapedAt = '2026-09-06T08:15:00.000Z';
      const html = await renderResults(live);
      expect(html).toContain('Önbellekten');
      expect(html).toNotContain('Canlı alındı');
      expect(semanticDots(html)).toBe(1);
      expect(html).toContain('bg-amber-500');
      expect(html).toNotContain('bg-emerald-500');
    });

    it('J.6 facts-only ferry renders the FerryFactsPanel with native details and the source link', async () => {
      const out = await runTurnaQuery({ kind: 'ferry', from: 'yalova', to: 'yenikapi' }, { fetchPage: pageStub(FERRY_PAGE, 'cache', '2026-09-06T08:15:00.000Z'), store: new NoopHistoryStore() });
      const result = expectSuccess(out.body);
      const html = await renderResults(
        { status: 'facts-only', query: { kind: 'ferry', from: 'yalova', to: 'yenikapi' }, result, receivedAt: new Date().toISOString() },
        { searchState: { ...BASE_SEARCH_STATE, transportType: 'feribot', fromCity: 'Yalova', toCity: 'Yenikapı' } },
      );
      expect(html).toContain('Turna feribot sayfası bilet listesi yayımlamaz');
      expect(html).toContain('<details');
      expect(html).toContain('Kaç saat?');
      expect(html).toContain('1 sa 25 dk');
      expect(html).toContain('Kaynak sayfa');
      expect(html).toContain('href="https://www.turna.com/feribot-bileti/yalova-yenikapi"');
      expect(html).toContain('Önbellekten');
      expect(html).toNotContain('role="radiogroup"');
      expect(DASHES.test(html)).toBeFalsy();
    });

    it('J.7 facts-only bus renders the no-offers notice with facts and a retry action', async () => {
      const out = await runTurnaQuery({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { fetchPage: pageStub(BUS_FACTS_ONLY_PAGE), store: new NoopHistoryStore() });
      const result = expectSuccess(out.body);
      const html = await renderResults(
        { status: 'facts-only', query: { kind: 'bus', from: 'istanbul', to: 'ankara' }, result, receivedAt: new Date().toISOString() },
        { searchState: { ...BASE_SEARCH_STATE, transportType: 'otobus' } },
      );
      expect(html).toContain('Turna bu rota için yapısal teklif yayımlamamış');
      expect(html).toContain('Tekrar dene');
      expect(html).toContain('Turna rota bilgisi');
      expect(html).toContain('Kaynak sayfa');
    });

    it('J.8 unsupported renders the train sentence verbatim', async () => {
      const html = await renderResults(
        { status: 'unsupported', transportType: 'tren', reason: 'Turna.com tren bileti sunmuyor; bu sekmede canlı veri yok.' },
        { searchState: { ...BASE_SEARCH_STATE, transportType: 'tren' } },
      );
      expect(html).toContain('Turna.com tren bileti sunmuyor; bu sekmede canlı veri yok.');
      expect(html).toNotContain('Tekrar dene');
    });

    it('J.9 error states are keyed by errorCode and offer Tekrar dene', async () => {
      const query = { kind: 'flight' as const, from: 'istanbul', to: 'ankara' };
      const blocked = await renderResults({ status: 'error', query, httpStatus: 503, errorCode: 'blocked', message: 'engel', retryAfterSeconds: 120 });
      expect(blocked).toContain('Turna.com erişimi şu an engelli. 120 sn sonra tekrar deneyin.');
      expect(blocked).toContain('Hata kodu: blocked, HTTP 503');
      expect(blocked).toContain('Tekrar dene');
      const notFound = await renderResults({ status: 'error', query, httpStatus: 404, errorCode: 'route_not_found', message: 'yok' });
      expect(notFound).toContain('sayfa yayımlamıyor');
      expect(notFound).toContain('Tekrar dene');
      const network = await renderResults({ status: 'error', query: null, httpStatus: null, errorCode: 'network', message: 'Sunucuya ulaşılamadı; bağlantınızı kontrol edin.' });
      expect(network).toContain('Bağlantı kurulamadı');
      expect(network).toContain('Tekrar dene');
      for (const html of [blocked, notFound, network]) {
        expect(semanticDots(html)).toBe(0);
        expect(DASHES.test(html)).toBeFalsy();
      }
    });

    it('J.10 the legacy path (no live prop) still renders mock rows with guarded optional fields', async () => {
      const legacy: RouteItem[] = [
        {
          id: 'b-101', from: 'İstanbul', fromTerminal: 'Esenler Otogarı', to: 'Ankara', toTerminal: 'AŞTİ', departureTime: '10:30', arrivalTime: '16:00',
          duration: '5s 30dk', date: '24 Mayıs Cumartesi', price: 650, company: 'Kamil Koç', transportType: 'otobus', vehicleType: '2+1 Rahat Hat',
          availableSeats: 3, rating: 4.8, reviewCount: 3420, features: ['Wi-Fi', '220V Priz', 'İkram'],
        },
        {
          id: 'b-102', from: 'İstanbul', fromTerminal: 'Esenler Otogarı', to: 'Ankara', toTerminal: 'AŞTİ', departureTime: '23:30', arrivalTime: '05:00',
          duration: '10s 05dk', date: '24 Mayıs Cumartesi', price: 500, company: 'Metro Turizm', transportType: 'otobus', availableSeats: 0,
        },
      ];
      const html = await renderResults(undefined, { routes: legacy, searchState: { ...BASE_SEARCH_STATE, transportType: 'otobus' } });
      expect(html).toContain('Son 3 koltuk');
      expect(html).toContain('Boş koltuk yok');
      expect(html).toNotContain('Son 0');
      expect(html).toContain('Sadece 2+1');
      expect(html).toContain('24 Mayıs Cumartesi');
      expect(html).toNotContain('Kaynak sayfa');
      const empty = await renderResults(undefined, { routes: [] });
      expect(empty).toContain('listelenecek sefer bulunamadı');
      const loading = await renderResults(undefined, { routes: [], isLiveScraping: true });
      expect(loading).toContain('animate-pulse');
      expect(loading).toContain('aria-busy="true"');
    });

    it('J.11 hotel ok renders the city heading and otel counter, stars only when stated, ratings only when present, never a price', async () => {
      const hotels = parseHotels(extractJsonLd(HOTEL_PAGE_RSC_HTML), HOTEL_PAGE_RSC_HTML);
      // A hotel the page lists without any score, star class or photo, whose link is not a turna.com page.
      const bare: HotelOffer = {
        kind: 'hotel',
        id: 'bare00000001',
        name: 'Sessiz Pansiyon',
        url: 'https://example.org/sessiz-pansiyon',
        slug: null,
        image: null,
        images: [],
        locality: '',
        district: null,
        city: null,
        region: null,
        country: null,
        rating: null,
        ratingBest: 10,
        ratingText: null,
        reviewCount: null,
        stars: null,
        amenities: [],
        tags: [],
        breakfast: null,
        turnaId: null,
      };
      const result = hotelEnvelope([...hotels, bare]);
      const html = await renderResults(cityOkState(result), { searchState: { ...BASE_SEARCH_STATE, searchKind: 'otel', fromCity: 'Antalya', toCity: '' } });

      // Heading, eyebrow, counter and the hotel disclosure instead of the route one.
      expect(html).toContain('Antalya otelleri');
      expect(html).toContain('(5)</span>');
      expect(html).toContain('>Antalya</span>');
      expect(html).toContain('· </span>Otel</span>');
      expect(html).toContain('<span>5 otel</span>');
      expect(html).toContain('5 otel; 2 tanesinde yıldız bilgisi; puan verisi 4 otelde');
      expect(html).toContain(CITY_DISCLOSURE_HOTEL);
      expect(html).toNotContain(PROVENANCE_DISCLOSURE);
      expect(html).toContain('Kaynak sayfa');
      expect(html).toContain(`href="${result.sourceUrl}"`);
      expect(semanticDots(html)).toBe(1);

      // Every card carries the price sentence and the Turna link; nothing anywhere looks like a price.
      expect(count(html, escapeHtml(HOTEL_PRICE_NOTE_COPY))).toBe(5);
      expect(count(html, escapeHtml("Turna'da gör"))).toBe(5);
      expect(count(html, '<img')).toBe(4);
      for (const forbidden of [' TL', '₺', 'Puan verisi yok', 'En Yüksek Puanlı', 'hiçbiri doğrulanamadı', '0 tarih', 'teklif', 'role="radiogroup"', 'Bilet Fiyatı', 'Fiyat Alarmı', 'Direkt Sefer', 'Sadece 2+1', 'animate-ping']) {
        expect(html).toNotContain(forbidden);
      }
      expect(DASHES.test(html)).toBeFalsy();

      // Sort and facet controls only offer what the data has.
      expect(html).toContain('>Puan</option>');
      expect(html).toContain('>Yorum sayısı</option>');
      expect(html).toContain('>Yıldız</option>');
      expect(html).toContain('>Ad A-Z</option>');
      expect(html).toContain('Yıldız:');
      expect(html).toContain('>5 yıldız<span');
      expect(html).toContain('>Belirtilmemiş<span');
      expect(html).toContain('Bölge:');
      expect(html).toContain('>Muratpaşa<span');
      expect(html).toContain('>Aksu<span');
      expect(html).toContain('Etiket:');
      expect(html).toContain('>5 Yıldızlı Otel<span');

      // Akra: five stars, 9,4/10 Harika, 1.735 yorum, district + city, amenities, tags, its own turna.com link and photo.
      const akra = cardFor(html, 'Akra Antalya');
      expect(count(akra, STAR_POLYGON)).toBe(5);
      expect(akra).toContain('aria-label="5 yıldız"');
      expect(akra).toContain('9,4');
      expect(akra).toContain('/10');
      expect(akra).toContain('Harika');
      expect(akra).toContain('1.735 yorum');
      expect(akra).toContain('Muratpaşa, Antalya');
      for (const amenity of ['>Otopark<', '>Engelli Dostu<', '>Açık Havuz<', '>5 Yıldızlı Otel<', '>İş Oteli<']) expect(akra).toContain(amenity);
      expect(akra).toContain('aria-label="Olanaklar"');
      expect(akra).toContain('aria-label="Etiketler"');
      expect(akra).toContain('href="https://www.turna.com/otel/akra-antalya"');
      expect(akra).toContain('src="https://i.travelapi.com/lodging/5956_z.jpg"');
      expect(akra).toContain('alt="Akra Antalya"');
      expect(akra).toContain('loading="lazy"');
      expect(akra).toMatch(/referrerpolicy="no-referrer"/i);
      expect(akra).toNotContain('Kahvaltı');

      // Swandor: starRating 0 on the page -> no star icon at all; breakfast printed verbatim.
      const swandor = cardFor(html, 'Swandor Hotels & Resort Topkapi Palace');
      expect(count(swandor, STAR_POLYGON)).toBe(0);
      expect(swandor).toNotContain('yıldız"');
      expect(swandor).toContain('8,9');
      expect(swandor).toContain('Çok İyi');
      expect(swandor).toContain('2.280 yorum');
      expect(swandor).toContain('Aksu, Antalya');
      expect(swandor).toContain('Kahvaltı dahil [açık büfe]');

      // Rixos (JSON-LD only): no stars, locality fallback, no amenity or tag lists.
      const rixos = cardFor(html, 'Rixos Downtown Antalya');
      expect(count(rixos, STAR_POLYGON)).toBe(0);
      expect(rixos).toContain('8,8');
      expect(rixos).toContain('1.020 yorum');
      expect(rixos).toContain('Antalya Merkez, Muratpaşa, Antalya');
      expect(rixos).toNotContain('aria-label="Olanaklar"');
      expect(rixos).toNotContain('aria-label="Etiketler"');

      // The bare hotel: no score block, no stars, initial-letter placeholder, link falls back to the city page.
      const quiet = cardFor(html, 'Sessiz Pansiyon');
      expect(count(quiet, STAR_POLYGON)).toBe(0);
      expect(quiet).toNotContain('yorum');
      expect(quiet).toNotContain('/10');
      expect(quiet).toNotContain('<img');
      expect(quiet).toContain('>S</span>');
      expect(quiet).toNotContain('example.org');
      expect(quiet).toContain(`href="${result.sourceUrl}"`);
    });

    it('J.12 car ok renders the city heading and araç counter, daily-price KPI row, company distribution, chips, logos and Turna links', async () => {
      const cars = parseCars(CAR_PAGE_HTML);
      const result = carEnvelope(cars);
      const html = await renderResults(cityOkState(result), { searchState: { ...BASE_SEARCH_STATE, searchKind: 'arac', fromCity: 'İstanbul', toCity: '' } });

      expect(html).toContain('İstanbul araç kiralama');
      expect(html).toContain('(4)</span>');
      expect(html).toContain('>İstanbul</span>');
      expect(html).toContain('· </span>Araç</span>');
      expect(html).toContain('<span>4 araç</span>');
      expect(html).toContain(CITY_DISCLOSURE_CAR);
      expect(html).toNotContain(PROVENANCE_DISCLOSURE);
      expect(semanticDots(html)).toBe(1);

      // KPI row over dailyPrice with the /gün unit and its own accessible name.
      expect(html).toContain('aria-label="Günlük fiyat özeti"');
      expect(html).toNotContain('aria-label="Fiyat özeti"');
      expect(html).toContain('1.250 TL/gün');
      expect(html).toContain('1.669 TL/gün');
      expect(html).toContain('2.500 TL/gün');
      expect(count(html, 'TL/gün')).toBe(3);
      expect(html).toContain('4 firma: Avis 1, Circular 1, Garenta 1, Veyonda Car 1');

      // One card per car, cheapest first, each with the source note, the unit and the Turna link to the city page.
      expect(count(html, 'Turna landing fiyatı')).toBe(4);
      expect(count(html, escapeHtml("Turna'da kirala"))).toBe(4);
      expect(count(html, `href="${result.sourceUrl}"`)).toBe(5);
      expect(count(html, '>/gün</span>')).toBe(4);
      const order = ['Fiat Egea,', 'Renault Clio,', 'Toyota Corolla,', 'Nissan Qashqai,'].map((label) => html.indexOf(`<article aria-label="${label}`));
      expect(order.every((i) => i > -1)).toBeTruthy();
      expect([...order].sort((a, b) => a - b)).toEqual(order);

      const clio = cardFor(html, 'Renault Clio, Circular, 1.437,99 TL günlük');
      for (const chip of ['>Ekonomi<', '>Benzin<', '>Manuel<', '>500 km/gün<']) expect(clio).toContain(chip);
      expect(clio).toContain('aria-label="Araç özellikleri"');
      expect(clio).toContain('1.437,99 TL');
      expect(clio).toContain(`src="${CAR_LOGO_BASE}/circular.png"`);
      expect(clio).toContain('alt="Circular"');
      expect(clio).toMatch(/referrerpolicy="no-referrer"/i);
      expect(clio).toContain('src="https://res.cloudinary.com/otorento/image/upload/Renault_Clio.png"');
      expect(clio).toContain('alt="Renault Clio"');
      expect(count(clio, '<img')).toBe(2);

      // Qashqai: MileageLimit 0 -> the "not stated" sentence; no vehicle image -> the line-art placeholder, logo still an <img>.
      const qashqai = cardFor(html, 'Nissan Qashqai, Veyonda Car, 2.500,00 TL günlük');
      for (const chip of ['>Premium<', '>Dizel<', '>Otomatik<', '>Km limiti belirtilmemiş<']) expect(qashqai).toContain(chip);
      expect(qashqai).toContain('viewBox="0 0 64 32"');
      expect(count(qashqai, '<img')).toBe(1);
      expect(qashqai).toContain('alt="Veyonda Car"');
      expect(qashqai).toNotContain('km/gün');

      const egea = cardFor(html, 'Fiat Egea, Garenta, 1.250,00 TL günlük');
      expect(egea).toContain('>Diğer<');
      expect(egea).toContain('>300 km/gün<');
      const corolla = cardFor(html, 'Toyota Corolla, Avis, 1.900,01 TL günlük');
      for (const chip of ['>Standart<', '>Hibrit<', '>Otomatik<', '>Km limiti belirtilmemiş<']) expect(corolla).toContain(chip);

      // Facets for every dimension with two or more values; sort options; nothing from the route screen.
      for (const facet of ['Sınıf:', 'Vites:', 'Yakıt:', 'Firma:']) expect(html).toContain(facet);
      expect(html).toContain('>Fiyat artan</option>');
      expect(html).toContain('>Fiyat azalan</option>');
      expect(html).toContain('>Sınıf</option>');
      for (const forbidden of ['0 tarih', 'teklif', 'role="radiogroup"', 'Bilet Fiyatı', 'Fiyat Alarmı', 'Direkt Sefer', 'En Yüksek Puanlı', 'Puan verisi yok', '₺']) {
        expect(html).toNotContain(forbidden);
      }
      expect(DASHES.test(html)).toBeFalsy();
    });

    it('J.13 a hotel or car page without a list is facts-only: quiet notice, source link, no dot; an ok body with zero items keeps the strip', async () => {
      const cases: Array<{ result: TurnaSuccess; searchKind: SearchKind; city: string; message: string; eyebrow: string; heading: string }> = [
        { result: hotelEnvelope([]), searchKind: 'otel', city: 'Antalya', message: 'otel listesi içermiyor', eyebrow: '· </span>Otel</span>', heading: 'Antalya otelleri' },
        { result: carEnvelope([]), searchKind: 'arac', city: 'İstanbul', message: 'araç listesi içermiyor', eyebrow: '· </span>Araç</span>', heading: 'İstanbul araç kiralama' },
      ];
      for (const { result, searchKind, city, message, eyebrow, heading } of cases) {
        const html = await renderResults(
          { status: 'facts-only', query: result.query, result, receivedAt: result.scrapedAt },
          { searchState: { ...BASE_SEARCH_STATE, searchKind, fromCity: city, toCity: '' } },
        );
        expect(html).toContain(CITY_EMPTY_TITLE);
        expect(html).toContain(message);
        expect(html).toContain(`>${city}</span>`);
        expect(html).toContain(eyebrow);
        expect(html).toContain(`href="${result.sourceUrl}"`);
        expect(html).toContain('Kaynak sayfa');
        expect(html).toContain('Tekrar dene');
        expect(semanticDots(html)).toBe(0);
        for (const forbidden of [heading, '0 tarih', 'teklif', 'role="radiogroup"', 'Turna rota bilgisi', 'feribot sayfası', 'yapısal teklif']) expect(html).toNotContain(forbidden);
        expect(DASHES.test(html)).toBeFalsy();
      }
      // `ok` with an empty hotel list (every item rejected client-side): strip with a zero counter, then the same quiet notice.
      const zero = await renderResults(cityOkState(hotelEnvelope([])), { searchState: { ...BASE_SEARCH_STATE, searchKind: 'otel', fromCity: 'Antalya', toCity: '' } });
      expect(zero).toContain('<span>0 otel</span>');
      expect(zero).toContain('Antalya otelleri');
      expect(zero).toContain('(0)</span>');
      expect(zero).toContain(CITY_EMPTY_TITLE);
      expect(zero).toContain(CITY_DISCLOSURE_HOTEL);
      expect(semanticDots(zero)).toBe(1);
      expect(zero).toNotContain('hiçbiri doğrulanamadı');
      expect(zero).toNotContain(escapeHtml("Turna'da gör"));
      expect(zero).toNotContain('0 tarih');
    });

    it('J.14 route cards resolve the brand in order: bileo SVG mark, Turna CDN <img> with no-referrer, text logo', async () => {
      const base = SAMPLE_FLIGHT_OFFERS[1];
      const freebird: FlightOffer = { ...base, id: 'aaaaaaaaaaa1', airline: 'Freebird Airlines', airlineCode: 'FH', logoUrl: `${TURNA_CDN}/Images/Flight/Airlines/FH.png` };
      const tailwind: FlightOffer = { ...base, id: 'aaaaaaaaaaa2', airline: 'Tailwind Airlines', airlineCode: null, logoUrl: null };
      // A Phase 1 body: the offer has no logoUrl key at all, so the provenance has none either.
      const { logoUrl: _omitted, ...sagaPhase1 } = { ...base, id: 'aaaaaaaaaaa3', airline: 'Saga Airlines', airlineCode: 'SGX' };
      const result = successEnvelope({ items: [SAMPLE_FLIGHT_OFFERS[0], freebird, tailwind, sagaPhase1 as FlightOffer] });
      const { routes, dropped } = toRouteItems(result, ROUTE_CTX);
      expect(routes).toHaveLength(4);
      expect(dropped).toBe(0);
      expect(routes[1].provenance?.logoUrl).toBe(`${TURNA_CDN}/Images/Flight/Airlines/FH.png`);
      expect(routes[2].provenance?.logoUrl).toBeNull();
      expect('logoUrl' in (routes[3].provenance ?? {})).toBeFalsy();
      const html = await renderResults({ status: 'ok', query: result.query, result, routes, droppedItems: 0, receivedAt: result.scrapedAt });

      // 1. Pegasus is in bileo's SVG brand set: vector mark, no remote image.
      const pegasus = cardFor(html, 'Pegasus,');
      expect(pegasus).toContain('>PEGASUS<');
      expect(pegasus).toContain('title="Pegasus"');
      expect(pegasus).toNotContain('<img');

      // 2. Unknown airline with a Turna CDN logo: lazy <img> with the exact URL and no referrer.
      const fb = cardFor(html, 'Freebird Airlines,');
      expect(fb).toContain(`<img src="${TURNA_CDN}/Images/Flight/Airlines/FH.png"`);
      expect(fb).toContain('alt="Freebird Airlines"');
      expect(fb).toContain('loading="lazy"');
      expect(fb).toMatch(/referrerpolicy="no-referrer"/i);
      expect(fb).toContain('title="Freebird Airlines"');
      expect(fb).toNotContain('>PEGASUS<');

      // 3. Unknown airline without a logo (null from Turna, or a Phase 1 body without the key): text logo, no <img>.
      for (const [prefix, name] of [['Tailwind Airlines,', 'Tailwind Airlines'], ['Saga Airlines,', 'Saga Airlines']] as const) {
        const card = cardFor(html, prefix);
        expect(card).toNotContain('<img');
        expect(card).toContain(`>${name}</span>`);
        expect(card).toContain(`title="${name}"`);
      }
      expect(count(html, '<img')).toBe(1);
      expect(count(html, '>İncele<')).toBe(4);
      expect(semanticDots(html)).toBe(1);
      expect(DASHES.test(html)).toBeFalsy();
    });

    it('J.15 ProvenanceStrip: countLabel replaces the counter; without it dayCount 0 prints only the offer count, never "0 tarih"', async () => {
      const { ProvenanceStrip, freshnessTone, FRESH_WINDOW_MS } = await import('../components/results/ProvenanceStrip');
      const result = hotelEnvelope([]);
      const nowMs = Date.parse(result.scrapedAt);
      const render = (props: Partial<ProvenanceStripProps>): string =>
        renderToStaticMarkup(React.createElement(ProvenanceStrip, { result, offerCount: 0, dayCount: 0, nowMs, ...props }));

      const labelled = render({ offerCount: 50, dayCount: 0, countLabel: '50 otel' });
      expect(labelled).toContain('<span>50 otel</span>');
      expect(labelled).toNotContain('teklif');
      expect(labelled).toNotContain('0 tarih');
      expect(labelled).toContain(PROVENANCE_DISCLOSURE);
      expect(labelled).toContain('Canlı alındı');
      expect(labelled).toContain('bg-emerald-500');
      expect(semanticDots(labelled)).toBe(1);

      const bare = render({ offerCount: 4, dayCount: 0 });
      expect(bare).toContain('<span>4 teklif</span>');
      expect(bare).toNotContain('0 tarih');
      expect(bare).toNotContain('4 teklif,');

      const dated = render({ offerCount: 12, dayCount: 3 });
      expect(dated).toContain('<span>12 teklif, 3 tarih</span>');

      // countLabel wins even when dayCount is set; showDisclosure=false drops the route sentence.
      const labelledDated = render({ offerCount: 12, dayCount: 3, countLabel: '12 araç', showDisclosure: false });
      expect(labelledDated).toContain('<span>12 araç</span>');
      expect(labelledDated).toNotContain('tarih');
      expect(labelledDated).toNotContain(PROVENANCE_DISCLOSURE);

      // Freshness: cache or older than the window -> amber and Önbellekten / stale text.
      const cached = renderToStaticMarkup(
        React.createElement(ProvenanceStrip, { result: { ...result, fetchedVia: 'cache' }, offerCount: 1, dayCount: 0, countLabel: '1 otel', nowMs }),
      );
      expect(cached).toContain('Önbellekten');
      expect(cached).toContain('bg-amber-500');
      expect(cached).toNotContain('bg-emerald-500');
      expect(FRESH_WINDOW_MS).toBe(600000);
      expect(freshnessTone(result, nowMs)).toBe('live');
      expect(freshnessTone(result, nowMs + FRESH_WINDOW_MS - 1)).toBe('live');
      expect(freshnessTone(result, nowMs + FRESH_WINDOW_MS)).toBe('stale');
      expect(freshnessTone({ ...result, fetchedVia: 'cache' }, nowMs)).toBe('stale');
      expect(freshnessTone({ ...result, scrapedAt: 'not a date' }, nowMs)).toBe('stale');
    });

    it('J.16 PriceDeltaLine states the change against the previous real observation and stays absent without a delta', async () => {
      const { PriceDeltaLine, priceDeltaSentence } = await import('../components/results/PriceDeltaLine');
      const down = { previousObservedAt: '2026-09-06T20:00:00.000Z', previousMin: 1500, currentMin: 1401.11, change: -98.89, changePct: -6.59 };
      const downText = priceDeltaSentence(down);
      expect(downText).toMatch(/^\d{2}:\d{2} taramasına göre en düşük fiyat %6,6 düştü: 1\.500 TL yerine 1\.401 TL\.$/);
      expect(priceDeltaSentence({ ...down, previousMin: 1300, change: 101.11, changePct: 7.78 })).toContain('%7,8 yükseldi: 1.300 TL yerine 1.401 TL.');
      expect(priceDeltaSentence({ ...down, previousMin: 1401.11, change: 0, changePct: 0 })).toContain('en düşük fiyat değişmedi (1.401 TL).');
      expect(priceDeltaSentence({ ...down, previousMin: 900, currentMin: 778.34, change: -121.66, changePct: -13.52 }, '/gün')).toContain('900 TL/gün yerine 778 TL/gün.');
      expect(priceDeltaSentence({ ...down, previousObservedAt: 'not-a-date' })).toMatch(/^Önceki taramaya göre/);
      expect(DASHES.test(downText)).toBeFalsy();

      const el = renderToStaticMarkup(React.createElement(PriceDeltaLine, { delta: down, unitSuffix: '' }));
      expect(el).toContain('data-price-delta="down"');
      expect(el).toContain('düştü');

      const live = await liveOkState();
      const plain = await renderResults(live);
      expect(plain).toNotContain('data-price-delta');
      expect(plain).toNotContain('taramasına göre');
      const withDelta = { ...live, result: { ...live.result, delta: down } };
      const html = await renderResults(withDelta);
      expect(html).toContain('data-price-delta="down"');
      expect(html).toContain('1.500 TL yerine 1.401 TL.');
      expect(semanticDots(html)).toBe(1);
    });

    it('J.17 PriceHistoryStrip lists the newest priced observations only when at least two exist', async () => {
      const { PriceHistoryStrip, historyStripPoints, HISTORY_STRIP_LABEL, HISTORY_STRIP_MAX } = await import('../components/results/PriceHistoryStrip');
      const at = (minute: number, day = 6): string => new Date(Date.UTC(2026, 8, day, 10, minute, 0)).toISOString();
      const point = (minute: number, minPrice: number | null, day = 6) => ({ observedAt: at(minute, day), minPrice, avgPrice: minPrice, count: minPrice === null ? 0 : 3 });

      // Fewer than two priced points is not a history; priceless and undated points never count.
      expect(historyStripPoints([])).toEqual([]);
      expect(historyStripPoints([point(0, 1500)])).toEqual([]);
      expect(historyStripPoints([point(0, 1500), point(5, null)])).toEqual([]);
      expect(historyStripPoints([point(0, 1500), { observedAt: 'not a date', minPrice: 1400, avgPrice: 1400, count: 1 }])).toEqual([]);

      // Oldest first, capped at the newest HISTORY_STRIP_MAX priced points, clock-only labels within one day.
      const seven = [0, 5, 10, 15, 20, 25, 30].map((m, i) => point(m, 1500 - i * 10));
      const pts = historyStripPoints(seven);
      expect(HISTORY_STRIP_MAX).toBe(5);
      expect(pts).toHaveLength(5);
      expect(pts.map((x) => x.minPrice)).toEqual([1480, 1470, 1460, 1450, 1440]);
      for (const x of pts) expect(x.label).toMatch(/^\d{2}:\d{2}$/);
      expect(historyStripPoints(seven, 2).map((x) => x.minPrice)).toEqual([1450, 1440]);
      expect(historyStripPoints(seven, 1)).toHaveLength(2);

      // Spanning two calendar days prefixes the day so equal clocks stay distinguishable.
      const twoDays = historyStripPoints([point(0, 1500, 5), point(0, 1400, 6)]);
      expect(twoDays).toHaveLength(2);
      for (const x of twoDays) expect(x.label).toMatch(/^\d{2}\.\d{2} \d{2}:\d{2}$/);
      expect(twoDays[0].label === twoDays[1].label).toBeFalsy();

      // Direct SSR: numbers only, newest emphasised, optional unit suffix, nothing at all below two points.
      const strip = renderToStaticMarkup(React.createElement(PriceHistoryStrip, { history: seven, unitSuffix: '/gün' }));
      expect(strip).toContain('data-price-history="5"');
      expect(strip).toContain(HISTORY_STRIP_LABEL);
      expect(strip).toContain('1.440 TL/gün');
      expect(strip).toContain('1.480 TL/gün');
      expect(strip).toNotContain('1.500 TL');
      expect((strip.match(/<time /g) ?? []).length).toBe(5);
      expect(semanticDots(strip)).toBe(0);
      expect(renderToStaticMarkup(React.createElement(PriceHistoryStrip, { history: [point(0, 1500)] }))).toBe('');
      expect(DASHES.test(strip)).toBeFalsy();

      // Through SearchResults for a route and for cars; absent when the server sent a single observation.
      const live = await liveOkState();
      expect(await renderResults(live)).toNotContain('data-price-history');
      const routeHtml = await renderResults({ ...live, result: { ...live.result, history: [point(0, 1500), point(5, 1401.11)] } });
      expect(routeHtml).toContain('data-price-history="2"');
      expect(routeHtml).toContain('1.401 TL</span>');
      expect(semanticDots(routeHtml)).toBe(1);
      const carHtml = await renderResults(cityOkState({ ...carEnvelope(SAMPLE_CAR_OFFERS), history: [point(0, 1300), point(5, 1250)] }));
      expect(carHtml).toContain('data-price-history="2"');
      expect(carHtml).toContain('1.250 TL/gün');
      expect(semanticDots(carHtml)).toBe(1);
    });
  });
}

// ---------------------------------------------------------------------------
// K. Phase 2: hotel and car (RSC payload, city kinds, logos)
// ---------------------------------------------------------------------------

const CAR_TARGET = resolveTurnaTarget({ kind: 'car', city: 'istanbul' });
const HOTEL_TARGET = resolveTurnaTarget({ kind: 'hotel', city: 'antalya' });
const CAR_LOGO_BASE = 'https://res.cloudinary.com/turna/image/upload/q_auto,f_auto/Images/Car/CarCompanies';

function carEnvelope(cars: TurnaOffer[]): TurnaSuccess {
  return successEnvelope({
    kind: 'car',
    items: cars,
    routeKey: 'car:istanbul',
    sourceUrl: CAR_TARGET.url,
    query: { kind: 'car', city: 'istanbul' },
    stats: computeStats(cars),
    pageTitle: CAR_PAGE_TITLE,
  });
}

function hotelEnvelope(hotels: TurnaOffer[]): TurnaSuccess {
  return successEnvelope({
    kind: 'hotel',
    items: hotels,
    routeKey: 'hotel:antalya',
    sourceUrl: HOTEL_TARGET.url,
    query: { kind: 'hotel', city: 'antalya' },
    pageTitle: HOTEL_PAGE_RSC_TITLE,
  });
}

function asHotel(offer: TurnaOffer): HotelOffer {
  if (offer.kind !== 'hotel') throw new Error(`hotel offer expected, got ${offer.kind}`);
  return offer;
}

function asCar(offer: TurnaOffer): CarOffer {
  if (offer.kind !== 'car') throw new Error(`car offer expected, got ${offer.kind}`);
  return offer;
}

function registerPhase2Tests(): void {
  describe('Turna K: hotel and car (Phase 2)', () => {
    it('K.1 extractRscText concatenates the push chunks and extractRscArray prefers a populated array over an empty one', () => {
      expect(count(CAR_PAGE_HTML, 'self.__next_f.push([1,')).toBe(2);
      expect(CAR_PAGE_HTML).toContain('self.__next_f.push([0])');
      const text = extractRscText(CAR_PAGE_HTML);
      expect(text.startsWith('b:C\n')).toBeTruthy();
      expect(text).toContain('"filters":{"cars":[]}');
      const cars = extractRscArray(text, 'cars');
      expect(cars).toHaveLength(CAR_RSC_ITEMS.length);
      expect(cars).toEqual(CAR_RSC_ITEMS);
      expect(extractRscArray(text, 'initialHotels')).toBeNull();
      expect(extractRscArray('', 'cars')).toBeNull();
      expect(extractRscArray('"cars":[]', 'cars')).toEqual([]);
      expect(extractRscArray('"cars":[1,2', 'cars')).toBeNull();
      expect(extractRscArray('"cars":[1,2]', 'cars')).toEqual([1, 2]);
      const hotels = extractRscArray(extractRscText(HOTEL_PAGE_RSC_HTML), 'initialHotels');
      expect(hotels).toEqual(HOTEL_RSC_ITEMS);
      expect(extractRscText(FLIGHT_PAGE)).toBe('');
      expect(extractRscText(HOMEPAGE_PAGE)).toBe('');
      // A chunk with a broken escape is skipped; the others still decode.
      const broken = '<script>self.__next_f.push([1,"a\\qb"])</script><script>self.__next_f.push([1,"\\"x\\":[1]"])</script>';
      expect(extractRscText(broken)).toBe('"x":[1]');
      expect(extractRscArray(extractRscText(broken), 'x')).toEqual([1]);
    });

    it('K.2 parseCars normalises the RSC cars: enums, km limit, images, company logo, daily price; duplicate and unpriced rows dropped', () => {
      const cars = parseCars(CAR_PAGE_HTML);
      expect(cars).toHaveLength(4);
      expect(cars.map((c) => c.dailyPrice)).toEqual([1250, 1437.99, 1900.01, 2500]);
      expect(cars.map((c) => `${c.brand} ${c.model}`)).toEqual(['Fiat Egea', 'Renault Clio', 'Toyota Corolla', 'Nissan Qashqai']);
      const [egea, clio, corolla, qashqai] = cars;
      expect(egea.vehicleClass).toBe('other');
      expect(egea.vehicleClassRaw).toBe('VehicleClassMiniElite');
      expect(egea.transmission).toBe('manual');
      expect(egea.fuelType).toBe('gasoline');
      expect(egea.mileageLimitKm).toBe(300);
      expect(egea.company).toBe('Garenta');
      expect(egea.companySlug).toBe('garenta');
      expect(egea.imageUrl).toBe('https://res.cloudinary.com/otorento/image/upload/Fiat_Egea.png');
      expect(clio.vehicleClass).toBe('economy');
      expect(clio.vehicleClassRaw).toBe('VehicleClassEconomy');
      expect(clio.fuelType).toBe('gasoline');
      expect(clio.fuelTypeRaw).toBe('FuelTypeGasoline');
      expect(clio.transmission).toBe('manual');
      expect(clio.mileageLimitKm).toBe(500);
      expect(clio.imageUrl).toBe('https://res.cloudinary.com/otorento/image/upload/Renault_Clio.png');
      expect(clio.company).toBe('Circular');
      expect(clio.companySlug).toBe('circular');
      expect(clio.companyLogoUrl).toBe(`${CAR_LOGO_BASE}/circular.png`);
      expect(corolla.vehicleClass).toBe('standard');
      expect(corolla.fuelType).toBe('hybrid');
      expect(corolla.fuelTypeRaw).toBe('FuelTypeHybrid');
      expect(corolla.transmission).toBe('auto');
      expect(corolla.mileageLimitKm).toBeNull();
      expect(qashqai.vehicleClass).toBe('premium');
      expect(qashqai.vehicleClassRaw).toBe('VehicleClassPremium');
      expect(qashqai.fuelType).toBe('diesel');
      expect(qashqai.transmission).toBe('auto');
      expect(qashqai.mileageLimitKm).toBeNull();
      expect(qashqai.imageUrl).toBeNull();
      expect(qashqai.company).toBe('Veyonda Car');
      expect(qashqai.companySlug).toBe('veyonda-car');
      expect(qashqai.companyLogoUrl).toBe(`${CAR_LOGO_BASE}/veyonda-car.png`);
      for (const c of cars) {
        expect(c.kind).toBe('car');
        expect(c.currency).toBe('TRY');
        expect(c.id).toMatch(HEX12);
        expect(c.id).toBe(stableId('car', c.company, c.brand, c.model, c.vehicleClassRaw, c.dailyPrice));
        expect(c.dailyPrice).toBeGreaterThan(0);
        expect(validateTurnaOffer(c)).toBe(c);
      }
      expect(new Set(cars.map((c) => c.id)).size).toBe(4);
      expect(parseOffers('car', extractJsonLd(CAR_PAGE_HTML), CAR_PAGE_HTML)).toHaveLength(4);
      // Re-parsing yields identical ids (determinism).
      expect(parseCars(CAR_PAGE_HTML).map((c) => c.id)).toEqual(cars.map((c) => c.id));
    });

    it('K.3 parseHotels merges the RSC initialHotels with the JSON-LD list by slug: 3 + 2 with one overlap yield 4 rich rows', () => {
      const hotels = parseHotels(extractJsonLd(HOTEL_PAGE_RSC_HTML), HOTEL_PAGE_RSC_HTML);
      expect(hotels).toHaveLength(4);
      expect(hotels.map((h) => h.slug)).toEqual(['akra-antalya', 'titanic-deluxe-lara', 'swandor-topkapi-palace', 'rixos-downtown-antalya']);
      expect(new Set(hotels.map((h) => h.slug)).size).toBe(4);
      expect(new Set(hotels.map((h) => h.id)).size).toBe(4);
      const [akra, titanic, swandor, rixos] = hotels;
      // The overlapping slug keeps the RSC row (richer); the JSON-LD copy is discarded.
      expect(akra.name).toBe('Akra Antalya');
      expect(akra.stars).toBe(5);
      expect(akra.rating).toBe(9.4);
      expect(akra.ratingBest).toBe(10);
      expect(akra.ratingText).toBe('Harika');
      expect(akra.reviewCount).toBe(1735);
      expect(akra.url).toBe('https://www.turna.com/otel/akra-antalya');
      expect(akra.id).toBe(stableId('hotel', akra.url));
      expect(akra.image).toBe('https://i.travelapi.com/lodging/5956_z.jpg');
      expect(akra.images).toEqual(['https://i.travelapi.com/lodging/5956_b.jpg', 'https://cdn.turna.com/hotel/static/5956/akra-antalya_a.webp']);
      expect(akra.locality).toBe('Antalya Merkez, Muratpaşa, Antalya');
      expect(akra.district).toBe('Muratpaşa');
      expect(akra.city).toBe('Antalya');
      expect(akra.region).toBe('Akdeniz Bölgesi');
      expect(akra.country).toBe('Türkiye');
      expect(akra.amenities).toEqual(['Otopark', 'Engelli Dostu', 'Açık Havuz']);
      expect(akra.tags).toEqual(['5 Yıldızlı Otel', 'İş Oteli']);
      expect(akra.breakfast).toBeNull();
      expect(akra.turnaId).toBe(5956);
      expect(titanic.stars).toBe(5);
      expect(titanic.rating).toBe(9.2);
      expect(titanic.reviewCount).toBe(3120);
      expect(titanic.district).toBe('Aksu');
      // starRating 0 means "not stated": stars is null, never 0; the "]" inside breakfast did not end the array.
      expect(swandor.stars).toBeNull();
      expect(swandor.rating).toBe(8.9);
      expect(swandor.ratingText).toBe('Çok İyi');
      expect(swandor.reviewCount).toBe(2280);
      expect(swandor.breakfast).toBe('Kahvaltı dahil [açık büfe]');
      expect(swandor.turnaId).toBe(3071);
      // JSON-LD-only row: Phase 1 fields set, Phase 2 fields in the absence encoding.
      expect(rixos.name).toBe('Rixos Downtown Antalya');
      expect(rixos.rating).toBe(8.8);
      expect(rixos.reviewCount).toBe(1020);
      expect(rixos.image).toBe('https://i.travelapi.com/x.jpg');
      expect(rixos.images).toEqual(['https://i.travelapi.com/x.jpg']);
      expect(rixos.locality).toBe('Antalya Merkez, Muratpaşa, Antalya');
      expect(rixos.stars).toBeNull();
      expect(rixos.ratingText).toBeNull();
      expect(rixos.district).toBeNull();
      expect(rixos.city).toBeNull();
      expect(rixos.region).toBeNull();
      expect(rixos.amenities).toEqual([]);
      expect(rixos.tags).toEqual([]);
      expect(rixos.breakfast).toBeNull();
      expect(rixos.turnaId).toBeNull();
      for (const h of hotels) {
        expect(h.kind).toBe('hotel');
        expect(h.id).toMatch(HEX12);
        expect(validateTurnaOffer(h)).toEqual(h);
      }
      expect(computeStats(hotels)).toBeNull();
    });

    it('K.4 without an RSC payload parseHotels falls back to JSON-LD only with Phase 2 fields null or []; parseOffers threads the html', () => {
      const blocks = extractJsonLd(HOTEL_PAGE);
      const withHtml = parseHotels(blocks, HOTEL_PAGE);
      expect(withHtml).toHaveLength(2);
      expect(withHtml).toEqual(parseHotels(blocks));
      const akra = withHtml[0];
      expect(akra.slug).toBe('akra-antalya');
      expect(akra.images).toEqual(['https://i.travelapi.com/x.jpg']);
      expect(akra.stars).toBeNull();
      expect(akra.ratingText).toBeNull();
      expect(akra.district).toBeNull();
      expect(akra.city).toBeNull();
      expect(akra.region).toBeNull();
      expect(akra.amenities).toEqual([]);
      expect(akra.tags).toEqual([]);
      expect(akra.breakfast).toBeNull();
      expect(akra.turnaId).toBeNull();
      const bare = withHtml[1];
      expect(bare.slug).toBe('no-rating');
      expect(bare.images).toEqual([]);
      expect(bare.stars).toBeNull();
      // parseOffers threads the html: with it the RSC rows are merged in, without it only the JSON-LD rows remain.
      const rscBlocks = extractJsonLd(HOTEL_PAGE_RSC_HTML);
      expect(parseOffers('hotel', rscBlocks, HOTEL_PAGE_RSC_HTML)).toHaveLength(4);
      expect(parseOffers('hotel', rscBlocks)).toHaveLength(2);
      expect(parseOffers('hotel', rscBlocks).map((h) => asHotel(h).slug)).toEqual(['akra-antalya', 'rixos-downtown-antalya']);
      expect(parseOffers('car', extractJsonLd(FLIGHT_PAGE), FLIGHT_PAGE)).toHaveLength(0);
      expect(parseOffers('ferry', extractJsonLd(CAR_PAGE_HTML), CAR_PAGE_HTML)).toHaveLength(0);
      expect(parseOffers('flight', extractJsonLd(CAR_PAGE_HTML), CAR_PAGE_HTML)).toHaveLength(0);
    });

    it('K.5 a page without a cars array yields zero car offers and the pipeline answers 200 with the no-offers warning', async () => {
      expect(parseCars('')).toEqual([]);
      expect(parseCars(FLIGHT_PAGE)).toEqual([]);
      expect(parseCars(HOTEL_PAGE_RSC_HTML)).toEqual([]);
      expect(parseCars(page([], { extra: rscScripts('cars', []) }))).toEqual([]);
      const out = await runTurnaQuery({ kind: 'car', city: 'istanbul' }, { fetchPage: pageStub(HOTEL_PAGE_RSC_HTML), store: new NoopHistoryStore() });
      expect(out.status).toBe(200);
      const body = expectSuccess(out.body);
      expect(body.kind).toBe('car');
      expect(body.routeKey).toBe('car:istanbul');
      expect(body.items).toEqual([]);
      expect(body.stats).toBeNull();
      expect(body.warnings).toEqual([WARNING_NO_OFFERS]);
      // Rows without a usable price, without brand and model, or in a foreign currency are skipped, never patched.
      const unusable = page([], {
        extra: rscScripts('cars', [
          { ...CAR_RSC_ITEMS[1], DailyPrice: 'yok' },
          { ...CAR_RSC_ITEMS[1], DailyPrice: -5 },
          { ...CAR_RSC_ITEMS[1], Brand: '', Model: '' },
          { ...CAR_RSC_ITEMS[1], CurrencyCode: 'EUR' },
        ]),
      });
      expect(parseCars(unusable)).toEqual([]);
      // A Turkish price string and the TL currency code are accepted like the JSON-LD offers.
      const stringPrice = page([], { extra: rscScripts('cars', [{ ...CAR_RSC_ITEMS[1], DailyPrice: '1.437,99', CurrencyCode: 'TL' }]) });
      expect(parseCars(stringPrice).map((c) => c.dailyPrice)).toEqual([1437.99]);
    });

    it('K.6 parseFlights and parseBuses derive the CDN logo URLs and the bus company slugs from the fixture pages', () => {
      const flights = parseFlights(extractJsonLd(FLIGHT_PAGE));
      expect(flights.map((f) => f.logoUrl)).toEqual([
        `${TURNA_CDN}/Images/Flight/Airlines/PC.png`,
        `${TURNA_CDN}/Images/Flight/Airlines/PC.png`,
        `${TURNA_CDN}/Images/Flight/Airlines/VF.png`,
      ]);
      for (const f of flights) expect(f.logoUrl).toBe(airlineLogoUrl(f.airlineCode));
      const buses = parseBuses(extractJsonLd(BUS_PAGE));
      expect(buses.map((b) => b.companySlug)).toEqual(['elazig-hazar-turizm', 'kamil-koc']);
      expect(buses.map((b) => b.logoUrl)).toEqual([
        `${TURNA_CDN}/Images/Bus/BusCompanies/elazig-hazar-turizm.png`,
        `${TURNA_CDN}/Images/Bus/BusCompanies/kamil-koc.png`,
      ]);
      expect(buses[0].companyUrl).toBe('https://www.turna.com/otobus-bileti/elazığ-hazar-turizm');
      for (const b of buses) expect(b.logoUrl).toBe(busCompanyLogoUrl(b.company));
      // A flight without an IATA code has no derivable logo: null, not a guessed URL.
      const noCode = parseFlights(
        extractJsonLd(page([{ '@type': 'ItemList', itemListElement: [{ '@type': 'ListItem', item: flight('2026-09-24T09:50:00+03:00', '2026-09-24T10:50:00+03:00', 100, '1s', 'Bilinmeyen', '') }] }])),
      );
      expect(noCode).toHaveLength(1);
      expect(noCode[0].airlineCode).toBeNull();
      expect(noCode[0].logoUrl).toBeNull();
      // Both fixture pages round-trip through the pipeline and the guard with the new fields intact.
      const parsed = parseTurnaResponse(asWireJson(successEnvelope({ kind: 'bus', items: buses })));
      expect(parsed?.dropped).toBe(0);
      expect(expectSuccess(parsed?.response as TurnaSuccess).items.map((i) => (i as BusOffer).companySlug)).toEqual(['elazig-hazar-turizm', 'kamil-koc']);
    });

    it('K.7 KIND_PATH.car, CITY_KINDS and resolveTurnaTarget address car rental by city exactly like hotels', () => {
      expect(KIND_PATH.car).toBe('arac-kiralama/sehir');
      expect(TURNA_KINDS).toEqual(['flight', 'bus', 'hotel', 'ferry', 'car']);
      expect([...CITY_KINDS].sort()).toEqual(['car', 'hotel']);
      expect(isCityKind('car')).toBeTruthy();
      expect(isCityKind('hotel')).toBeTruthy();
      for (const kind of ['flight', 'bus', 'ferry'] as const) expect(isCityKind(kind)).toBeFalsy();
      expect(KIND_LIST_LABEL).toBe('flight | bus | hotel | ferry | car');
      expect(CAR_TARGET.kind).toBe('car');
      expect(CAR_TARGET.url).toBe('https://www.turna.com/arac-kiralama/sehir/istanbul');
      expect(CAR_TARGET.routeKey).toBe('car:istanbul');
      expect(CAR_TARGET.label).toBe('istanbul');
      expect(CAR_TARGET.slugs).toEqual({ city: 'istanbul' });
      expect(resolveTurnaTarget({ kind: 'car', city: 'İstanbul' }).url).toBe(CAR_TARGET.url);
      expect(resolveTurnaTarget({ kind: 'car', to: 'Ankara' }).routeKey).toBe('car:ankara');
      expect(resolveTurnaTarget({ kind: 'car', from: 'İzmir' }).url).toBe('https://www.turna.com/arac-kiralama/sehir/izmir');
      expect(resolveTurnaTarget({ kind: 'car', city: 'Los Angeles' }).url).toBe('https://www.turna.com/arac-kiralama/sehir/los-angeles');
      const missing = throwsQueryError(() => resolveTurnaTarget({ kind: 'car' }));
      expect(missing.errorCode).toBe('invalid_query');
      expect(missing.message).toContain("'city'");
      expect(throwsQueryError(() => resolveTurnaTarget({ kind: 'car', city: 'a' })).message).toContain("'city'");
      expect(throwsQueryError(() => resolveTurnaTarget({ kind: 'car', city: '   ' })).message).toContain("'city'");
      expect(throwsQueryError(() => resolveTurnaTarget({ kind: 'train' as unknown as 'car', city: 'istanbul' })).message).toContain(KIND_LIST_LABEL);
      const carPresets = TURNA_PRESETS.filter((p) => p.kind === 'car');
      expect(carPresets.map((p) => p.city)).toEqual(['istanbul', 'ankara', 'izmir', 'antalya']);
      for (const preset of carPresets) {
        expect(findCarCity(preset.city ?? '')).toBeDefined();
        expect(resolveTurnaTarget(preset).routeKey).toBe(`car:${preset.city}`);
      }
    });

    it('K.8 isAllowedLandingUrl accepts /arac-kiralama/sehir/{slug} only; the logo builders fold names to the CDN paths', () => {
      expect(isAllowedLandingUrl(CAR_TARGET.url)).toBeTruthy();
      expect(isAllowedLandingUrl('https://www.turna.com/arac-kiralama/sehir/los-angeles')).toBeTruthy();
      expect(isAllowedLandingUrl('https://www.turna.com/arac-kiralama/istanbul')).toBeFalsy();
      expect(isAllowedLandingUrl('https://www.turna.com/arac-kiralama/sehir')).toBeFalsy();
      expect(isAllowedLandingUrl('https://www.turna.com/arac-kiralama/sehir/')).toBeFalsy();
      expect(isAllowedLandingUrl('https://www.turna.com/arac-kiralama/sehir/Istanbul')).toBeFalsy();
      expect(isAllowedLandingUrl(`${CAR_TARGET.url}/`)).toBeFalsy();
      expect(isAllowedLandingUrl(`${CAR_TARGET.url}?pickup=2026-09-24`)).toBeFalsy();
      expect(isAllowedLandingUrl(`${CAR_TARGET.url}/${DATED_SEARCH_SEGMENT}/2026-09-24`)).toBeFalsy();
      expect(isAllowedLandingUrl(`${TURNA_ORIGIN}/${['api', 'proxy', 'v1', 'car', 'search'].join('/')}`)).toBeFalsy();
      expect(isAllowedLandingUrl(PRIVATE_API_URL)).toBeFalsy();
      expect(isAllowedLandingUrl(`http://www.turna.com/${KIND_PATH.car}/istanbul`)).toBeFalsy();
      expect(TURNA_CDN).toBe('https://cdn.turna.com');
      expect(airlineLogoUrl('PC')).toBe('https://cdn.turna.com/Images/Flight/Airlines/PC.png');
      expect(airlineLogoUrl(' tk ')).toBe('https://cdn.turna.com/Images/Flight/Airlines/TK.png');
      expect(airlineLogoUrl('vf')).toBe(`${TURNA_CDN}/Images/Flight/Airlines/VF.png`);
      expect(airlineLogoUrl('')).toBeNull();
      expect(airlineLogoUrl(null)).toBeNull();
      expect(airlineLogoUrl(undefined)).toBeNull();
      expect(airlineLogoUrl('A')).toBeNull();
      expect(airlineLogoUrl('ABCD')).toBeNull();
      expect(airlineLogoUrl('P C')).toBeNull();
      expect(busCompanyLogoUrl('Niğde İnan Turizm')).toBe('https://cdn.turna.com/Images/Bus/BusCompanies/nigde-inan-turizm.png');
      expect(busCompanyLogoUrl('Kamil Koç')).toBe(`${TURNA_CDN}/Images/Bus/BusCompanies/kamil-koc.png`);
      expect(busCompanyLogoUrl('Adıyaman Anka Turizm')).toBe(`${TURNA_CDN}/Images/Bus/BusCompanies/adiyaman-anka-turizm.png`);
      expect(busCompanyLogoUrl('   ')).toBeNull();
      expect(busCompanyLogoUrl(null)).toBeNull();
      expect(busCompanyLogoUrl(undefined)).toBeNull();
      // The CDN paths are static assets, not landing pages: the server allowlist never lets them through.
      expect(isAllowedLandingUrl(airlineLogoUrl('PC') ?? '')).toBeFalsy();
      expect(isAllowedLandingUrl(busCompanyLogoUrl('Kamil Koç') ?? '')).toBeFalsy();
    });

    it('K.9 GET kind=car&city=istanbul turns the car fixture into a 200 TurnaSuccess with routeKey car:istanbul and daily-price stats', async () => {
      const store = spyStore();
      const res = await handleTurnaHttp(
        { method: 'GET', url: new URL('http://localhost:5173/api/turna?kind=car&city=İstanbul') },
        { fetchPage: pageStub(CAR_PAGE_HTML), store, now: () => new Date(CLOCK_START) },
      );
      expect(res.status).toBe(200);
      expect(res.headers['Content-Type']).toBe(CONTENT_TYPE_JSON);
      expect(res.headers['Cache-Control']).toBe(CACHE_CONTROL_PUBLIC);
      expect(res.headers['X-Turna-Fetched-Via']).toBe('direct');
      expect(res.headers['X-Turna-Scraped-At']).toBe(FETCHED_AT_ISO);
      const parsed = parseTurnaResponse(JSON.parse(res.body));
      if (!parsed) throw new Error('guard rejected the car envelope');
      expect(parsed.dropped).toBe(0);
      const body = expectSuccess(parsed.response);
      expect(body.kind).toBe('car');
      expect(body.query).toEqual({ kind: 'car', refresh: false, city: 'İstanbul' });
      expect(body.routeKey).toBe('car:istanbul');
      expect(body.sourceUrl).toBe(CAR_TARGET.url);
      expect(body.pageTitle).toBe(CAR_PAGE_TITLE);
      expect(body.scrapedAt).toBe(FETCHED_AT_ISO);
      expect(body.items).toHaveLength(4);
      expect(body.items.every((i) => i.kind === 'car')).toBeTruthy();
      expect(body.items.map((i) => asCar(i).dailyPrice)).toEqual([1250, 1437.99, 1900.01, 2500]);
      expect(body.stats).toEqual({
        count: 4,
        min: 1250,
        max: 2500,
        avg: 1772,
        median: 1669,
        byCompany: [
          { name: 'Garenta', count: 1, minPrice: 1250, avgPrice: 1250 },
          { name: 'Circular', count: 1, minPrice: 1437.99, avgPrice: 1437.99 },
          { name: 'Avis', count: 1, minPrice: 1900.01, avgPrice: 1900.01 },
          { name: 'Veyonda Car', count: 1, minPrice: 2500, avgPrice: 2500 },
        ],
        byDay: [],
      });
      expect(body.stats).toEqual(computeStats(parseCars(CAR_PAGE_HTML)));
      expect(body.warnings).toEqual([]);
      expect(body.facts.faq).toEqual([{ question: 'Yaş sınırı?', answer: 'Araç kiralamak için en az 21 yaşında olmalısınız.' }]);
      expect(body.facts.carriersCount).toBeNull();
      expect(store.records).toHaveLength(1);
      expect(store.records[0].kind).toBe('car');
      expect(store.records[0].routeKey).toBe('car:istanbul');
      expect(store.records[0].items).toHaveLength(4);
      expect(store.records[0].stats?.min).toBe(1250);
      expect(store.historyCalls).toEqual(['car:istanbul']);
      expect(store.deltaCalls).toEqual([['car:istanbul', 'obs_1', 1250]]);
      // `to` and `from` fall back to the city for car queries, as for hotels.
      const viaTo = expectSuccess((await runTurnaQuery({ kind: 'car', to: 'Ankara' }, { fetchPage: pageStub(CAR_PAGE_HTML, 'cache'), store: new NoopHistoryStore() })).body);
      expect(viaTo.routeKey).toBe('car:ankara');
      expect(viaTo.sourceUrl).toBe('https://www.turna.com/arac-kiralama/sehir/ankara');
      expect(viaTo.fetchedVia).toBe('cache');
    });

    it('K.10 GET kind=hotel&city=antalya merges JSON-LD and RSC hotels: 4 items, stats null, no warning, the guard keeps the rich fields', async () => {
      const store = spyStore();
      const res = await handleTurnaHttp(
        { method: 'GET', url: new URL('http://localhost:5173/api/turna?kind=hotel&city=antalya') },
        { fetchPage: pageStub(HOTEL_PAGE_RSC_HTML), store },
      );
      expect(res.status).toBe(200);
      expect(res.headers['Cache-Control']).toBe(CACHE_CONTROL_PUBLIC);
      const parsed = parseTurnaResponse(JSON.parse(res.body));
      if (!parsed) throw new Error('guard rejected the hotel envelope');
      expect(parsed.dropped).toBe(0);
      const body = expectSuccess(parsed.response);
      expect(body.kind).toBe('hotel');
      expect(body.routeKey).toBe('hotel:antalya');
      expect(body.sourceUrl).toBe(HOTEL_TARGET.url);
      expect(body.sourceUrl).toBe('https://www.turna.com/otel/antalya');
      expect(body.pageTitle).toBe(HOTEL_PAGE_RSC_TITLE);
      expect(body.items).toHaveLength(4);
      expect(body.stats).toBeNull();
      expect(body.warnings).toEqual([]);
      expect(body.items.map((i) => asHotel(i).slug)).toEqual(['akra-antalya', 'titanic-deluxe-lara', 'swandor-topkapi-palace', 'rixos-downtown-antalya']);
      expect(body.items.map((i) => asHotel(i).stars)).toEqual([5, 5, null, null]);
      const akra = asHotel(body.items[0]);
      expect(akra.ratingText).toBe('Harika');
      expect(akra.district).toBe('Muratpaşa');
      expect(akra.amenities).toEqual(['Otopark', 'Engelli Dostu', 'Açık Havuz']);
      expect(akra.tags).toEqual(['5 Yıldızlı Otel', 'İş Oteli']);
      expect(akra.images).toHaveLength(2);
      expect(akra.turnaId).toBe(5956);
      expect(store.records).toHaveLength(1);
      expect(store.records[0].stats).toBeNull();
      expect(store.deltaCalls).toEqual([['hotel:antalya', 'obs_1', null]]);
      // A Phase 1 shaped page (JSON-LD only) still answers with its two hotels and no warning.
      const legacy = expectSuccess((await runTurnaQuery({ kind: 'hotel', city: 'antalya' }, { fetchPage: pageStub(HOTEL_PAGE), store: new NoopHistoryStore() })).body);
      expect(legacy.items).toHaveLength(2);
      expect(legacy.stats).toBeNull();
      expect(legacy.warnings).toEqual([]);
      expect(asHotel(legacy.items[0]).stars).toBeNull();
      expect(asHotel(legacy.items[0]).amenities).toEqual([]);
    });

    it('K.11 kind=car without a city is 400 invalid_query before any fetch; toQuery normalises the car kind and city', async () => {
      let fetches = 0;
      const counting: PipelineDeps['fetchPage'] = async () => {
        fetches += 1;
        return { html: CAR_PAGE_HTML, via: 'direct', fetchedAt: FETCHED_AT_ISO, latencyMs: 1, warnings: [] };
      };
      const deps = { fetchPage: counting, store: new NoopHistoryStore() };
      const missing = await handleTurnaHttp({ method: 'GET', url: new URL('http://localhost:5173/api/turna?kind=car') }, deps);
      expect(missing.status).toBe(400);
      expect(missing.headers['Content-Type']).toBe(CONTENT_TYPE_JSON);
      expect(missing.headers['Cache-Control']).toBe(CACHE_CONTROL_NO_STORE);
      const body = JSON.parse(missing.body) as { success: boolean; error: string; errorCode: string };
      expect(body.success).toBe(false);
      expect(body.errorCode).toBe('invalid_query');
      expect(body.error).toContain("'city'");
      const short = await handleTurnaHttp({ method: 'GET', url: new URL('http://localhost:5173/api/turna?kind=car&city=a') }, deps);
      expect(short.status).toBe(400);
      expect(JSON.parse(short.body).errorCode).toBe('invalid_query');
      const post = await handleTurnaHttp({ method: 'POST', url: new URL('http://localhost:5173/api/turna'), body: { kind: 'car' } }, deps);
      expect(post.status).toBe(400);
      expect(JSON.parse(post.body).errorCode).toBe('invalid_query');
      const hotelMissing = await handleTurnaHttp({ method: 'GET', url: new URL('http://localhost:5173/api/turna?kind=hotel') }, deps);
      expect(hotelMissing.status).toBe(400);
      expect(fetches).toBe(0);
      expect(toQuery({ kind: 'CAR', city: ' İstanbul ' })).toEqual({ kind: 'car', refresh: false, city: 'İstanbul' });
      expect(toQuery({ kind: ['car'], city: ['ankara', 'izmir'], refresh: '1' })).toEqual({ kind: 'car', refresh: true, city: 'ankara' });
      expect(toQuery({ kind: 'car', city: '' })).toEqual({ kind: 'car', refresh: false });
      expect(throwsQueryError(() => toQuery({ kind: 'train' })).message).toBe("'kind' flight | bus | hotel | ferry | car olmalı (alınan: train).");
      expect(throwsQueryError(() => toQuery({})).message).toBe(`'kind' zorunludur: ${KIND_LIST_LABEL}.`);
      // Bodrum has no car landing page on turna.com: the URL is well-formed, so the answer comes from upstream
      // (404 route_not_found), never from the allowlist.
      const bodrum = await runTurnaQuery(
        { kind: 'car', city: 'bodrum' },
        { fetchPage: failingPage(new TurnaFetchError('route_not_found', 'yok', { httpStatus: 404 })), store: new NoopHistoryStore() },
      );
      expect(bodrum.status).toBe(404);
      if (bodrum.body.success) throw new Error('failure body expected');
      expect(bodrum.body.errorCode).toBe('route_not_found');
    });

    it('K.12 the guard validates cars field by field: dailyPrice must be a finite positive number and every enum must be known', () => {
      const [clio, qashqai] = SAMPLE_CAR_OFFERS;
      expect(validateTurnaOffer(clio)).toBe(clio);
      expect(validateTurnaOffer(qashqai)).toBe(qashqai);
      expect(validateTurnaOffer(asWireJson(clio))).toEqual(clio);
      for (const price of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, '1437.99', null, undefined]) {
        expect(validateTurnaOffer({ ...clio, dailyPrice: price })).toBeNull();
      }
      expect(validateTurnaOffer({ ...clio, transmission: 'cvt' })).toBeNull();
      expect(validateTurnaOffer({ ...clio, transmission: 'Manuel' })).toBeNull();
      expect(validateTurnaOffer({ ...clio, transmission: 'TransmissionAuto' })).toBeNull();
      expect(validateTurnaOffer({ ...clio, vehicleClass: 'suv' })).toBeNull();
      expect(validateTurnaOffer({ ...clio, vehicleClass: 'VehicleClassEconomy' })).toBeNull();
      expect(validateTurnaOffer({ ...clio, fuelType: 'petrol' })).toBeNull();
      expect(validateTurnaOffer({ ...clio, currency: 'EUR' })).toBeNull();
      expect(validateTurnaOffer({ ...clio, currency: 'TL' })).toBeNull();
      expect(validateTurnaOffer({ ...clio, id: '' })).toBeNull();
      expect(validateTurnaOffer({ ...clio, brand: 7 })).toBeNull();
      expect(validateTurnaOffer({ ...clio, model: null })).toBeNull();
      expect(validateTurnaOffer({ ...clio, mileageLimitKm: '500' })).toBeNull();
      expect(validateTurnaOffer({ ...clio, imageUrl: undefined })).toBeNull();
      expect(validateTurnaOffer({ ...clio, companyLogoUrl: undefined })).toBeNull();
      expect(validateTurnaOffer({ ...clio, companySlug: 5 })).toBeNull();
      expect(validateTurnaOffer({ ...clio, vehicleClassRaw: null })).toBeNull();
      const { mileageLimitKm: _km, ...withoutKm } = clio;
      expect(validateTurnaOffer(withoutKm)).toBeNull();
      for (const vehicleClass of ['economy', 'standard', 'fullsize', 'premium', 'luxury', 'other']) {
        expect(validateTurnaOffer({ ...clio, vehicleClass }) !== null).toBeTruthy();
      }
      for (const fuelType of ['gasoline', 'diesel', 'hybrid', 'electric', 'lpg', 'other']) {
        expect(validateTurnaOffer({ ...clio, fuelType }) !== null).toBeTruthy();
      }
      for (const transmission of ['auto', 'manual', 'other']) {
        expect(validateTurnaOffer({ ...clio, transmission }) !== null).toBeTruthy();
      }
      // Envelope level: a bad car is dropped, counted, and the stats are recomputed from the survivors.
      const wire = asWireJson(successEnvelope({ kind: 'car', items: SAMPLE_CAR_OFFERS, stats: { count: 3, min: 1, max: 9999, avg: 5, median: 5, byCompany: [], byDay: [] } })) as Record<string, unknown>;
      const clean = parseTurnaResponse(wire);
      if (!clean) throw new Error('car envelope rejected');
      expect(clean.dropped).toBe(0);
      expect(expectSuccess(clean.response).stats?.min).toBe(1);
      (wire.items as unknown[]).push({ ...clio, id: 'badbadbadbad', dailyPrice: 0 });
      const dirty = parseTurnaResponse(wire);
      if (!dirty) throw new Error('car envelope rejected');
      expect(dirty.dropped).toBe(1);
      const success = expectSuccess(dirty.response);
      expect(success.items).toHaveLength(2);
      expect(success.stats).toEqual(computeStats(SAMPLE_CAR_OFFERS));
      expect(success.stats?.min).toBe(1437.99);
      expect(success.stats?.byDay).toEqual([]);
    });

    it('K.13 the guard accepts a Phase 1 hotel body and encodes the absent Phase 2 fields as null or [], never inventing values', () => {
      const hotel = validateTurnaOffer(PHASE1_HOTEL_WIRE);
      if (!hotel || hotel.kind !== 'hotel') throw new Error('Phase 1 hotel rejected');
      expect(hotel).toEqual({
        kind: 'hotel',
        source: 'turna',
        id: 'abc123abc123',
        name: 'Akra Antalya',
        url: 'https://www.turna.com/otel/akra-antalya',
        slug: null,
        image: 'https://i.travelapi.com/x.jpg',
        images: ['https://i.travelapi.com/x.jpg'],
        locality: 'Antalya Merkez, Muratpaşa, Antalya',
        district: null,
        city: null,
        region: null,
        country: 'Türkiye',
        rating: 9.4,
        ratingBest: 10,
        ratingText: null,
        reviewCount: 1735,
        stars: null,
        amenities: [],
        tags: [],
        breakfast: null,
        turnaId: null,
      });
      expect(Object.keys(hotel)).toHaveLength(22);
      const noImage = validateTurnaOffer({ ...PHASE1_HOTEL_WIRE, image: null });
      expect(noImage && noImage.kind === 'hotel' ? noImage.images : 'x').toEqual([]);
      // Rich rows round-trip unchanged through the wire and the guard.
      const rich = parseHotels(extractJsonLd(HOTEL_PAGE_RSC_HTML), HOTEL_PAGE_RSC_HTML);
      for (const h of rich) expect(validateTurnaOffer(asWireJson(h))).toEqual(h);
      const envelope = parseTurnaResponse(asWireJson(hotelEnvelope(rich)));
      expect(envelope?.dropped).toBe(0);
      // Present-but-wrong Phase 2 fields are rejected, not coerced.
      expect(validateTurnaOffer({ ...PHASE1_HOTEL_WIRE, stars: '5' })).toBeNull();
      expect(validateTurnaOffer({ ...PHASE1_HOTEL_WIRE, amenities: 'Otopark' })).toBeNull();
      expect(validateTurnaOffer({ ...PHASE1_HOTEL_WIRE, tags: [1] })).toBeNull();
      expect(validateTurnaOffer({ ...PHASE1_HOTEL_WIRE, images: [null] })).toBeNull();
      expect(validateTurnaOffer({ ...PHASE1_HOTEL_WIRE, turnaId: '5956' })).toBeNull();
      expect(validateTurnaOffer({ ...PHASE1_HOTEL_WIRE, district: 3 })).toBeNull();
      expect(validateTurnaOffer({ ...PHASE1_HOTEL_WIRE, slug: 7 })).toBeNull();
      // Phase 1 core fields stay mandatory.
      const { rating: _r, ...noRating } = PHASE1_HOTEL_WIRE;
      expect(validateTurnaOffer(noRating)).toBeNull();
      const { locality: _l, ...noLocality } = PHASE1_HOTEL_WIRE;
      expect(validateTurnaOffer(noLocality)).toBeNull();
      const { image: _i, ...noImageKey } = PHASE1_HOTEL_WIRE;
      expect(validateTurnaOffer(noImageKey)).toBeNull();
      expect(validateTurnaOffer({ ...PHASE1_HOTEL_WIRE, ratingBest: null })).toBeNull();
      expect(validateTurnaOffer({ ...PHASE1_HOTEL_WIRE, reviewCount: '1735' })).toBeNull();
      // Flights and buses tolerate an ABSENT logoUrl/companySlug (Phase 1 body) but not a wrong type.
      const { logoUrl: _lu, ...flightP1 } = SAMPLE_FLIGHT_OFFERS[0];
      expect(validateTurnaOffer(flightP1)).toBe(flightP1);
      expect(validateTurnaOffer({ ...SAMPLE_FLIGHT_OFFERS[0], logoUrl: 5 })).toBeNull();
      expect(validateTurnaOffer({ ...SAMPLE_FLIGHT_OFFERS[0], logoUrl: null }) !== null).toBeTruthy();
      const { logoUrl: _bl, companySlug: _cs, ...busP1 } = SAMPLE_BUS_OFFERS[0];
      expect(validateTurnaOffer(busP1)).toBe(busP1);
      expect(validateTurnaOffer({ ...SAMPLE_BUS_OFFERS[0], companySlug: 1 })).toBeNull();
      expect(validateTurnaOffer({ ...SAMPLE_BUS_OFFERS[0], logoUrl: {} })).toBeNull();
    });

    it('K.14 SEARCH_KINDS and the SearchKind <-> TurnaKind maps cover the Otel and Araç tabs; tren stays null', () => {
      expect(SEARCH_KINDS).toEqual(['otobus', 'ucak', 'tren', 'feribot', 'otel', 'arac']);
      for (const k of SEARCH_KINDS) expect(isSearchKind(k)).toBeTruthy();
      for (const bad of ['car', 'hotel', 'flight', '', 5, null, undefined, {}]) expect(isSearchKind(bad)).toBeFalsy();
      const table: Array<[SearchKind, TurnaKind | null]> = [
        ['otobus', 'bus'],
        ['ucak', 'flight'],
        ['tren', null],
        ['feribot', 'ferry'],
        ['otel', 'hotel'],
        ['arac', 'car'],
      ];
      for (const [searchKind, turnaKind] of table) expect(searchKindToTurnaKind(searchKind)).toBe(turnaKind);
      for (const kind of TURNA_KINDS) expect(searchKindToTurnaKind(turnaKindToSearchKind(kind))).toBe(kind);
      expect(turnaKindToSearchKind('car')).toBe('arac');
      expect(turnaKindToSearchKind('hotel')).toBe('otel');
      expect(turnaKindToSearchKind('bus')).toBe('otobus');
      expect(turnaKindToSearchKind('flight')).toBe('ucak');
      expect(turnaKindToSearchKind('ferry')).toBe('feribot');
      expect(TURNA_KINDS.map(turnaKindLabelTr)).toEqual(['Uçak', 'Otobüs', 'Otel', 'Feribot', 'Araç']);
      expect(kindToTransportType('car')).toBeNull();
      expect(kindToTransportType('hotel')).toBeNull();
      expect(transportTypeToKind('tren')).toBeNull();
      // The transport subset agrees with the older maps.
      for (const t of ['otobus', 'ucak', 'tren', 'feribot'] as const) expect(searchKindToTurnaKind(t)).toBe(transportTypeToKind(t));
    });

    it('K.15 toRouteItems leaves hotel and car offers out as nonRouteItems (never dropped); provenance carries logoUrl/companySlug only when the offer does', () => {
      const cars = parseCars(CAR_PAGE_HTML);
      const adapted = toRouteItems(carEnvelope(cars), { fromCity: 'İstanbul', toCity: '' });
      expect(adapted.routes).toEqual([]);
      expect(adapted.dropped).toBe(0);
      expect(adapted.nonRouteItems).toBe(cars.length);
      expect(adapted.nonRouteItems).toBe(4);
      const hotels = parseHotels(extractJsonLd(HOTEL_PAGE_RSC_HTML), HOTEL_PAGE_RSC_HTML);
      expect(toRouteItems(hotelEnvelope(hotels), ROUTE_CTX)).toEqual({ routes: [], dropped: 0, nonRouteItems: 4 });
      const mixed = toRouteItems(successEnvelope({ items: [...SAMPLE_FLIGHT_OFFERS, cars[0], hotels[0], { ...SAMPLE_FLIGHT_OFFERS[0], id: 'zero', price: 0 }] }), ROUTE_CTX);
      expect(mixed.routes).toHaveLength(2);
      expect(mixed.dropped).toBe(1);
      expect(mixed.nonRouteItems).toBe(2);
      expect(toRouteItems(successEnvelope({ items: [] }), ROUTE_CTX)).toEqual({ routes: [], dropped: 0, nonRouteItems: 0 });
      // Phase 2 flight: logoUrl copied. Phase 1 flight (no key): omitted, not null.
      const [withLogo] = toRouteItems(successEnvelope(), ROUTE_CTX).routes;
      expect(withLogo.provenance?.logoUrl).toBe('https://cdn.turna.com/Images/Flight/Airlines/PC.png');
      const { logoUrl: _lu, ...phase1Flight } = SAMPLE_FLIGHT_OFFERS[0];
      const [legacy] = toRouteItems(successEnvelope({ items: [phase1Flight as FlightOffer] }), ROUTE_CTX).routes;
      if (!legacy.provenance) throw new Error('provenance expected');
      expect('logoUrl' in legacy.provenance).toBeFalsy();
      expect(legacy.provenance.airlineCode).toBe('PC');
      // A flight whose source has no IATA code keeps the key with null (the absence is Turna's, not ours).
      const [nullLogo] = toRouteItems(successEnvelope({ items: [{ ...SAMPLE_FLIGHT_OFFERS[0], airlineCode: null, logoUrl: null }] }), ROUTE_CTX).routes;
      if (!nullLogo.provenance) throw new Error('provenance expected');
      expect('logoUrl' in nullLogo.provenance).toBeTruthy();
      expect(nullLogo.provenance.logoUrl).toBeNull();
      // Bus: companySlug and logoUrl copied when present, omitted for a Phase 1 body.
      const [hazar] = toRouteItems(successEnvelope({ kind: 'bus', items: SAMPLE_BUS_OFFERS, routeKey: 'bus:istanbul-ankara', sourceUrl: BUS_TARGET.url }), ROUTE_CTX).routes;
      if (!hazar.provenance) throw new Error('provenance expected');
      expect(hazar.provenance.kind).toBe('bus');
      expect(hazar.provenance.companySlug).toBe('elazig-hazar-turizm');
      expect(hazar.provenance.logoUrl).toBe('https://cdn.turna.com/Images/Bus/BusCompanies/elazig-hazar-turizm.png');
      expect(hazar.provenance.companyUrl).toBe(SAMPLE_BUS_OFFERS[0].companyUrl);
      const { logoUrl: _bl, companySlug: _cs, ...phase1Bus } = SAMPLE_BUS_OFFERS[0];
      const [legacyBus] = toRouteItems(successEnvelope({ kind: 'bus', items: [phase1Bus as BusOffer] }), ROUTE_CTX).routes;
      if (!legacyBus.provenance) throw new Error('provenance expected');
      expect('logoUrl' in legacyBus.provenance).toBeFalsy();
      expect('companySlug' in legacyBus.provenance).toBeFalsy();
      expect(legacyBus.provenance.companyUrl).toBe(SAMPLE_BUS_OFFERS[0].companyUrl);
      // Route rows never carry a companyLogo of their own: the UI derives it from provenance.
      expect(withLogo.companyLogo).toBeUndefined();
      expect(hazar.companyLogo).toBeUndefined();
      expect('companyLogo' in hazar).toBeFalsy();
    });

    it('K.16 the client builds kind=car&city= URLs and maps a car payload with items to ok with empty routes', async () => {
      expect(buildTurnaUrl({ kind: 'car', city: 'İstanbul' })).toBe('/api/turna?kind=car&city=istanbul');
      expect(buildTurnaUrl({ kind: 'car', to: 'Ankara' }, true)).toBe('/api/turna?kind=car&city=ankara&refresh=1');
      expect(buildTurnaUrl({ kind: 'car', from: 'Los Angeles' })).toBe('/api/turna?kind=car&city=los-angeles');
      expect(canonicalTurnaQuery({ kind: 'car', from: 'İzmir', refresh: true })).toEqual({ kind: 'car', city: 'izmir' });
      expect(canonicalTurnaQuery({ kind: 'car', city: ' ANTALYA ', from: 'x', to: 'y' })).toEqual({ kind: 'car', city: 'antalya' });
      const base = asWireJson(successEnvelope()) as Record<string, unknown>;
      expect(parseTurnaResponse({ ...base, kind: 'car' }) !== null).toBeTruthy();
      expect(parseTurnaResponse({ ...base, query: { kind: 'car', city: 'istanbul' } }) !== null).toBeTruthy();
      expect(parseTurnaResponse({ ...base, query: { kind: 'car', city: 5 } })).toBeNull();
      const cars = parseCars(CAR_PAGE_HTML);
      const envelope = carEnvelope(cars);
      const fake = fakeFetch(() => jsonResponse(envelope));
      const ok = expectLive(await fetchTurna({ kind: 'car', city: 'İstanbul' }, { fetchImpl: fake.fetchImpl, now: () => new Date(CLOCK_START) }), 'ok');
      expect(fake.calls).toHaveLength(1);
      expect(fake.calls[0].url).toBe('/api/turna?kind=car&city=istanbul');
      expect(fake.calls[0].method).toBe('GET');
      expect(ok.query).toEqual({ kind: 'car', city: 'istanbul' });
      expect(ok.routes).toEqual([]);
      expect(ok.droppedItems).toBe(0);
      expect(ok.result.kind).toBe('car');
      expect(ok.result.routeKey).toBe('car:istanbul');
      expect(ok.result.items).toHaveLength(4);
      expect(ok.result.items.length).toBe(cars.length);
      expect(ok.result.stats?.min).toBe(1250);
      expect(ok.result.stats?.median).toBe(1669);
      expect(ok.result.stats?.byDay).toEqual([]);
      expect(ok.receivedAt).toBe(new Date(CLOCK_START).toISOString());
      const first = asCar(ok.result.items[0]);
      expect(first.brand).toBe('Fiat');
      expect(first.dailyPrice).toBe(1250);
      expect(first.transmission).toBe('manual');
      // Guard drops are counted for cars too, and the stats are recomputed from the survivors.
      const wire = asWireJson(envelope) as Record<string, unknown>;
      (wire.items as unknown[]).push({ ...cars[0], id: 'badbadbadbad', dailyPrice: 0 });
      const dirty = expectLive(await fetchTurna({ kind: 'car', city: 'istanbul' }, { fetchImpl: fakeFetch(() => jsonResponse(wire)).fetchImpl }), 'ok');
      expect(dirty.droppedItems).toBe(1);
      expect(dirty.result.items).toHaveLength(4);
      expect(dirty.result.stats).toEqual(computeStats(cars));
    });

    it('K.17 a hotel payload with items is ok (routes [], stats null); an empty car or hotel payload is facts-only; errors keep their codes', async () => {
      const hotels = parseHotels(extractJsonLd(HOTEL_PAGE_RSC_HTML), HOTEL_PAGE_RSC_HTML);
      const fake = fakeFetch(() => jsonResponse(hotelEnvelope(hotels)));
      const ok = expectLive(await fetchTurna({ kind: 'hotel', city: 'Antalya' }, { fetchImpl: fake.fetchImpl }), 'ok');
      expect(fake.calls[0].url).toBe('/api/turna?kind=hotel&city=antalya');
      expect(ok.query).toEqual({ kind: 'hotel', city: 'antalya' });
      expect(ok.routes).toEqual([]);
      expect(ok.droppedItems).toBe(0);
      expect(ok.result.items).toHaveLength(4);
      expect(ok.result.stats).toBeNull();
      expect(ok.result.items.map((i) => asHotel(i).stars)).toEqual([5, 5, null, null]);
      const akra = asHotel(ok.result.items[0]);
      expect(akra.amenities).toHaveLength(3);
      expect(akra.images).toHaveLength(2);
      expect(akra.ratingText).toBe('Harika');
      const emptyCar = fakeFetch(() =>
        jsonResponse(
          successEnvelope({
            kind: 'car',
            items: [],
            routeKey: 'car:bodrum',
            sourceUrl: 'https://www.turna.com/arac-kiralama/sehir/bodrum',
            query: { kind: 'car', city: 'bodrum' },
            warnings: [WARNING_NO_OFFERS],
          }),
        ),
      );
      const factsOnly = expectLive(await fetchTurna({ kind: 'car', city: 'bodrum' }, { fetchImpl: emptyCar.fetchImpl }), 'facts-only');
      expect(factsOnly.result.kind).toBe('car');
      expect(factsOnly.query).toEqual({ kind: 'car', city: 'bodrum' });
      expect(factsOnly.result.warnings).toEqual([WARNING_NO_OFFERS]);
      const emptyHotel = fakeFetch(() => jsonResponse(hotelEnvelope([])));
      expect((await fetchTurna({ kind: 'hotel', city: 'antalya' }, { fetchImpl: emptyHotel.fetchImpl })).status).toBe('facts-only');
      const notFound = fakeFetch(() => jsonResponse({ success: false, error: 'Turna.com bu şehir için sayfa yayımlamıyor (HTTP 404).', errorCode: 'route_not_found' }, { status: 404 }));
      const err = expectLive(await fetchTurna({ kind: 'car', city: 'bodrum' }, { fetchImpl: notFound.fetchImpl }), 'error');
      expect(err.errorCode).toBe('route_not_found');
      expect(err.httpStatus).toBe(404);
      expect(err.query).toEqual({ kind: 'car', city: 'bodrum' });
      const invalid = fakeFetch(() => jsonResponse({ success: false, error: "'city' geçersiz veya boş (örn. istanbul, izmir, cesme).", errorCode: 'invalid_query' }, { status: 400 }));
      const bad = expectLive(await fetchTurna({ kind: 'car', city: '' }, { fetchImpl: invalid.fetchImpl }), 'error');
      expect(bad.errorCode).toBe('invalid_query');
      expect(bad.httpStatus).toBe(400);
      expect(invalid.calls[0].url).toBe('/api/turna?kind=car&city=');
    });

    it('K.18 searchPlacesForKind: arac searches only CAR_CITIES, otel searches provinces plus districts, transport kinds equal searchPlaces', () => {
      const arac = searchPlacesForKind('ist', 'arac');
      expect(arac[0].slug).toBe('istanbul');
      expect(arac[0].cityName).toBe('İstanbul');
      expect(arac[0].matchedOn).toBe('city');
      expect(arac[0].plate).toBe(34);
      for (const s of arac) expect(findCarCity(s.slug)).toBeDefined();
      expect(searchPlacesForKind('İST', 'arac')[0].slug).toBe('istanbul');
      expect(searchPlacesForKind('ıst', 'arac')[0].slug).toBe('istanbul');
      // Bodrum and Çeşme have no car landing page: the Araç tab can never build their URL.
      expect(searchPlacesForKind('bod', 'arac')).toEqual([]);
      expect(searchPlacesForKind('çeş', 'arac')).toEqual([]);
      const lefkosa = searchPlacesForKind('lef', 'arac');
      expect(lefkosa.map((s) => s.slug)).toEqual(['lefkosa']);
      expect(lefkosa[0].cityName).toBe('Lefkoşa');
      expect(lefkosa[0].region).toBe('Yurt dışı');
      expect(lefkosa[0].plate).toBe(0);
      expect(lefkosa[0].modes).toEqual([]);
      expect(lefkosa[0].airports).toEqual([]);
      expect(lefkosa[0].matchedOn).toBe('city');
      expect(searchPlacesForKind('los', 'arac').map((s) => s.cityName)).toEqual(['Los Angeles']);
      for (const s of searchPlacesForKind('a', 'arac', 200)) {
        expect(s.matchedOn).toBe('city');
        expect(s.slug).toBe(slugifyTr(s.cityName));
        expect(findCarCity(s.slug)?.slug).toBe(s.slug);
      }
      const otel = searchPlacesForKind('ist', 'otel');
      expect(otel.map((s) => s.slug)).toEqual(['istanbul']);
      expect(otel[0].matchedOn).toBe('city');
      expect(searchPlacesForKind('bod', 'otel').map((s) => s.slug)).toEqual(['bodrum']);
      expect(searchPlacesForKind('çeş', 'otel').map((s) => s.slug)).toEqual(['cesme']);
      expect(searchPlacesForKind('an', 'otel').map((s) => s.slug)).toEqual(['ankara', 'antalya']);
      expect(searchPlacesForKind('lef', 'otel')).toEqual([]);
      for (const mode of ['otobus', 'ucak', 'feribot'] as const) {
        expect(searchPlacesForKind('ist', mode)).toEqual(searchPlaces('ist', mode));
        expect(searchPlacesForKind('y', mode)).toEqual(searchPlaces('y', mode));
        expect(searchPlacesForKind('esenler', mode)).toEqual(searchPlaces('esenler', mode));
      }
      expect(searchPlacesForKind('ist', 'tren')).toEqual([]);
      expect(searchPlacesForKind('', 'arac')).toEqual([]);
      expect(searchPlacesForKind('   ', 'otel')).toEqual([]);
      expect(searchPlacesForKind('a', 'arac', 0)).toEqual([]);
      expect(searchPlacesForKind('a', 'arac', 2)).toHaveLength(2);
      expect(searchPlacesForKind('a', 'otel').length).toBeLessThanOrEqual(8);
      for (const s of searchPlacesForKind('a', 'otel', 100)) expect(s.slug).toBe(slugifyTr(s.cityName));
    });

    it('K.19 popularCities for the single-city tabs: arac follows CAR_CITIES order, otel ranks provinces by connectivity then the districts', () => {
      const arac = popularCities('arac');
      expect(arac).toHaveLength(8);
      expect(arac[0].cityName).toBe('İstanbul');
      expect(arac.map((c) => c.cityName)).toEqual(['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Adana', 'Bursa', 'Muğla', 'Trabzon']);
      expect(arac.map((c) => c.slug)).toEqual(CAR_CITIES.slice(0, 8).map((c) => c.slug));
      for (const c of arac) {
        expect(c.matchedOn).toBe('city');
        expect(c.plate).toBeGreaterThan(0);
        expect(c.slug).toBe(slugifyTr(c.cityName));
      }
      expect(popularCities('arac', 3).map((c) => c.slug)).toEqual(['istanbul', 'ankara', 'izmir']);
      expect(popularCities('arac', 0)).toEqual([]);
      expect(popularCities('arac', 200)).toHaveLength(CAR_CITIES.length);
      expect(popularCities('arac', 200).map((c) => c.slug)).toEqual(CAR_CITIES.map((c) => c.slug));
      const otel = popularCities('otel');
      expect(otel).toHaveLength(8);
      expect(otel[0].cityName).toBe('İstanbul');
      expect(otel.slice(0, 3).map((c) => c.cityName)).toEqual(['İstanbul', 'Ankara', 'İzmir']);
      expect(new Set(otel.map((c) => c.slug)).size).toBe(8);
      const allHotelCities = popularCities('otel', 200);
      expect(allHotelCities).toHaveLength(83);
      expect(allHotelCities.map((c) => c.slug).slice(-2)).toEqual(['bodrum', 'cesme']);
      expect(new Set(allHotelCities.map((c) => c.slug)).size).toBe(83);
      expect(popularCities('otobus')).toEqual(popularCities('otobus', 8));
      expect(popularCities('feribot').map((c) => c.slug)).toEqual(['yalova', 'yenikapi', 'pendik']);
      expect(popularCities('tren')).toEqual([]);
    });

    it('K.20 CAR_CITIES: 111 unique ascii slugs, 70 provinces then 41 cities abroad, slug === slugifyTr(cityName), every one an allowed landing URL', () => {
      expect(CAR_CITIES).toHaveLength(111);
      expect(new Set(CAR_CITIES.map((c) => c.slug)).size).toBe(111);
      const provinces = CAR_CITIES.slice(0, 70);
      const abroad = CAR_CITIES.slice(70);
      expect(abroad).toHaveLength(41);
      for (const c of provinces) {
        expect(c.abroad).toBeFalsy();
        expect(typeof c.province).toBe('string');
        expect(findPlaceBySlug(c.slug)?.cityName).toBe(c.cityName);
        expect(findPlaceBySlug(c.slug)?.plate).toBeGreaterThan(0);
      }
      for (const c of abroad) {
        expect(c.abroad).toBeTruthy();
        expect(c.province).toBeUndefined();
        expect(findPlaceBySlug(c.slug)).toBeUndefined();
      }
      for (const c of CAR_CITIES) {
        expect(c.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(c.slug).toBe(slugifyTr(c.cityName));
        const target = resolveTurnaTarget({ kind: 'car', city: c.slug });
        expect(target.url).toBe(`https://www.turna.com/arac-kiralama/sehir/${c.slug}`);
        expect(isAllowedLandingUrl(target.url)).toBeTruthy();
        expect(DASHES.test(c.cityName)).toBeFalsy();
      }
      expect(CAR_CITIES.slice(0, 8).map((c) => c.slug)).toEqual(['istanbul', 'ankara', 'izmir', 'antalya', 'adana', 'bursa', 'mugla', 'trabzon']);
      expect(CAR_CITIES.map((c) => c.slug)).toNotContain('bodrum');
      expect(CAR_CITIES.map((c) => c.slug)).toNotContain('cesme');
      expect(findCarCity('istanbul')).toEqual({ cityName: 'İstanbul', slug: 'istanbul', abroad: false, province: 'İstanbul' });
      expect(findCarCity('İstanbul')?.slug).toBe('istanbul');
      expect(findCarCity(' Muğla ')?.province).toBe('Muğla');
      expect(findCarCity('lefkosa')).toEqual({ cityName: 'Lefkoşa', slug: 'lefkosa', abroad: true });
      expect(findCarCity('baku')?.cityName).toBe('Bakü');
      expect(findCarCity('los-angeles')?.cityName).toBe('Los Angeles');
      expect(findCarCity('grad-beograd')?.cityName).toBe('Grad Beograd');
      expect(findCarCity('bodrum')).toBeUndefined();
      expect(findCarCity('')).toBeUndefined();
      expect(findCarCity('nope')).toBeUndefined();
    });

    it('K.21 a car observation round-trips through the history store: price = dailyPrice, depart_at null; hotels have no price', async () => {
      const cars = parseCars(CAR_PAGE_HTML);
      const fp = fakePool();
      const store = new PgHistoryStore(fp.pool, { now: () => new Date(CLOCK_START), newId: () => 'obs_car' });
      const rec = await store.record({ routeKey: 'car:istanbul', kind: 'car', sourceUrl: CAR_TARGET.url, fetchedVia: 'direct', latencyMs: 7, items: cars, stats: computeStats(cars), facts: EMPTY_FACTS });
      expect(rec).toEqual({ id: 'obs_car', observedAt: new Date(CLOCK_START).toISOString() });
      const texts = fp.log.map((l) => l.text);
      expect(texts[0]).toBe(TURNA_HISTORY_DDL);
      expect(texts.slice(1)).toEqual(['BEGIN', INSERT_OBSERVATION_SQL, INSERT_OFFER_SQL, INSERT_OFFER_SQL, INSERT_OFFER_SQL, INSERT_OFFER_SQL, 'COMMIT']);
      const observation = fp.log[2].values ?? [];
      expect(observation.slice(0, 8)).toEqual(['obs_car', 'car:istanbul', 'car', CAR_TARGET.url, new Date(CLOCK_START).toISOString(), 'direct', 7, 4]);
      expect(observation.slice(8, 11)).toEqual([1250, 1772, 2500]);
      const offer = fp.log[3].values ?? [];
      expect(offer.slice(0, 7)).toEqual(['obs_car', cars[0].id, 'car:istanbul', 'car', 'Garenta', 1250, null]);
      expect(JSON.parse(String(offer[7]))).toEqual(cars[0]);
      expect(fp.released()).toBe(1);
      // Hotels: no price, no departure; the company column carries the hotel name.
      const hotels = parseHotels(extractJsonLd(HOTEL_PAGE_RSC_HTML), HOTEL_PAGE_RSC_HTML);
      const hp = fakePool();
      const hotelStore = new PgHistoryStore(hp.pool, { newId: () => 'obs_hotel' });
      await hotelStore.record({ routeKey: 'hotel:antalya', kind: 'hotel', sourceUrl: HOTEL_TARGET.url, fetchedVia: 'direct', latencyMs: 3, items: hotels, stats: null, facts: EMPTY_FACTS });
      const hotelObservation = hp.log[2].values ?? [];
      expect(hotelObservation.slice(7, 11)).toEqual([4, null, null, null]);
      const hotelOffer = hp.log[3].values ?? [];
      expect(hotelOffer.slice(2, 7)).toEqual(['hotel:antalya', 'hotel', 'Akra Antalya', null, null]);
      expect(JSON.parse(String(hotelOffer[7])).stars).toBe(5);
      // Through the pipeline: the car observation feeds delta with the daily minimum.
      const pp = fakePool({ previousRow: { id: 'obs_prev', observed_at: new Date('2026-09-05T10:00:00Z'), min_price: '1300.00', avg_price: '1800', item_count: 5 } });
      const pipelineStore = new PgHistoryStore(pp.pool, { now: () => new Date(CLOCK_START), newId: () => 'obs_live' });
      const body = expectSuccess((await runTurnaQuery({ kind: 'car', city: 'istanbul' }, { fetchPage: pageStub(CAR_PAGE_HTML), store: pipelineStore })).body);
      expect(body.delta).toEqual({ previousObservedAt: '2026-09-05T10:00:00.000Z', previousMin: 1300, currentMin: 1250, change: -50, changePct: -3.85 });
      expect(body.warnings).toEqual([]);
      expect(pp.log.find((l) => l.text === SELECT_PREVIOUS_SQL)?.values).toEqual(['car:istanbul', 'obs_live']);
      expect(pp.log.filter((l) => l.text === INSERT_OFFER_SQL)).toHaveLength(4);
      // The Noop store accepts car observations too and the hotel pipeline never asks for a delta with a price.
      const noop = new NoopHistoryStore(() => new Date(CLOCK_START));
      expect((await noop.record()).id).toBe('noop');
      const spy = spyStore();
      await runTurnaQuery({ kind: 'hotel', city: 'antalya' }, { fetchPage: pageStub(HOTEL_PAGE_RSC_HTML), store: spy });
      expect(spy.deltaCalls).toEqual([['hotel:antalya', 'obs_1', null]]);
    });

    it('K.22 the Phase 2 fixture pages behave like real landing pages in the fetch layer: JSON-LD present, not blocked, cached once', async () => {
      for (const html of [CAR_PAGE_HTML, HOTEL_PAGE_RSC_HTML]) {
        expect(looksBlocked(html)).toBeFalsy();
        expect(hasStructuredData(html)).toBeTruthy();
        expect(html.length).toBeGreaterThan(6000);
        expect(DASHES.test(html)).toBeFalsy();
      }
      expect(extractTitle(CAR_PAGE_HTML)).toBe(CAR_PAGE_TITLE);
      expect(extractTitle(HOTEL_PAGE_RSC_HTML)).toBe(HOTEL_PAGE_RSC_TITLE);
      expect(extractJsonLd(CAR_PAGE_HTML).map((b) => b['@type'])).toEqual(['BreadcrumbList', 'AutoRental', 'FAQPage']);
      expect(extractJsonLd(HOTEL_PAGE_RSC_HTML).map((b) => b['@type'])).toEqual(['ItemList', 'BreadcrumbList']);
      // A car page carries no JSON-LD offers at all: without the RSC payload there is nothing to parse.
      expect(parseOffers('car', extractJsonLd(CAR_PAGE_HTML))).toEqual([]);
      expect(parseFacts(extractJsonLd(CAR_PAGE_HTML)).faq).toEqual([{ question: 'Yaş sınırı?', answer: 'Araç kiralamak için en az 21 yaşında olmalısınız.' }]);
      expect(isPathAllowed(parseRobotsTxt(ROBOTS_ALLOW), '/arac-kiralama/sehir/istanbul')).toBeTruthy();
      expect(isPathAllowed(parseRobotsTxt(ROBOTS_ALLOW), '/otel/antalya')).toBeTruthy();
      // Fetch layer end to end with the car page: the allowlisted car URL is fetched once and then cached.
      const state = createRuntimeState();
      const h = harness((call) => htmlResponse(call.url.includes('/otel/') ? HOTEL_PAGE_RSC_HTML : CAR_PAGE_HTML, { url: call.url }));
      const first = await fetchTurnaHtml(CAR_TARGET, { state, deps: h.deps });
      expect(first.via).toBe('direct');
      expect(first.html).toBe(CAR_PAGE_HTML);
      expect(h.fake.calls[0].url).toBe(CAR_TARGET.url);
      expect((await fetchTurnaHtml(CAR_TARGET, { state, deps: h.deps })).via).toBe('cache');
      expect(h.fake.calls).toHaveLength(1);
      const hotelPage = await fetchTurnaHtml(HOTEL_TARGET, { state, deps: h.deps });
      expect(hotelPage.html).toBe(HOTEL_PAGE_RSC_HTML);
      expect(h.fake.calls).toHaveLength(2);
      // The whole chain: fetch layer -> pipeline -> HTTP -> guard, for both city kinds.
      const carOut = await runTurnaQuery({ kind: 'car', city: 'istanbul' }, { fetchPage: (target, opts) => fetchTurnaHtml(target, { ...opts, state, deps: h.deps }), store: new NoopHistoryStore() });
      expect(expectSuccess(carOut.body).items).toHaveLength(4);
      expect(expectSuccess(carOut.body).fetchedVia).toBe('cache');
      expect(h.fake.calls).toHaveLength(2);
    });
  });
}

// ---------------------------------------------------------------------------
// L. Phase 2 UI static guards and the pure helpers of the city result screens
// ---------------------------------------------------------------------------

function registerPhase2UiGuardTests(): void {
  describe('Turna L: Phase 2 UI static guards', () => {
    it('L.1 HeroSection: six tabs in SEARCH_KINDS order and no Puan, single-city copy, kind-aware autocomplete, no lucide, no dashes', () => {
      const hero = readText(rel('src/components/HeroSection.tsx'));
      const tabsBlock = hero.match(/const HERO_TABS[^=]*=\s*\[([\s\S]*?)\];/)?.[1] ?? '';
      expect(tabsBlock.length).toBeGreaterThan(0);
      expect(Array.from(tabsBlock.matchAll(/label:\s*'([^']+)'/g), (m) => m[1])).toEqual(['Otobüs', 'Uçak', 'Tren', 'Feribot', 'Otel', 'Araç']);
      expect(Array.from(tabsBlock.matchAll(/kind:\s*'([^']+)'/g), (m) => m[1])).toEqual([...SEARCH_KINDS]);
      expect(tabsBlock).toNotContain('Puan');
      expect(hero).toNotContain("'Puan'");
      for (const copy of [
        'Otel Ara',
        'Araç Ara',
        'Şehir veya bölge yazın',
        'Teslim alma şehri yazın',
        'Tarih ve fiyat seçimi Turna sayfasında yapılır.',
        'Günlük fiyatlar Turna landing sayfasından alınır; müsaitlik tarih seçimine bağlıdır.',
        'Turna sayfasında seçilir',
        'Şehir adını yazın (en az 2 harf).',
        'Bu şehir için Turna araç kiralama sayfası yok; listeden bir şehir seçin.',
        'Yalnızca Turna.com araç kiralama sayfası bulunan şehirler listelenir.',
      ]) {
        expect(hero).toContain(copy);
      }
      for (const ident of ['searchPlacesForKind', 'popularCities', 'findCarCity', "from '../lib/turna/places'", 'role="combobox"']) expect(hero).toContain(ident);
      expect(hero).toNotContain('lucide-react');
      expect(linesContaining(hero, DASHES)).toEqual([]);
    });

    it('L.2 App: SearchKind to TurnaKind mapping, kind-aware toasts and no fabricated city fallback around the price alert', () => {
      const app = readText(rel('src/App.tsx'));
      for (const needle of [
        'searchKindToTurnaKind',
        'isCityKind',
        "from './lib/turna/adapter'",
        'otel listelendi',
        'araç listelendi',
        'En düşük günlük fiyat',
        'Otel fiyatları tarih seçimine bağlıdır; Turna sayfasında görüntülenir.',
        'Bu şehir için Turna sayfası liste yayımlamamış; kaynak bağlantısı gösteriliyor.',
        'searchKind: activeKind',
      ]) {
        expect(app).toContain(needle);
      }
      expect(app).toNotContain("|| 'Ankara'");
      const alertStart = app.indexOf('<PriceAlertModal');
      expect(alertStart).toBeGreaterThan(-1);
      const alertBlock = app.slice(alertStart, app.indexOf('/>', alertStart));
      expect(alertBlock).toContain('fromCity={searchState.fromCity}');
      expect(alertBlock).toContain('toCity={searchState.toCity}');
      expect(alertBlock).toNotContain("|| '");
      // Search data never falls back to a made-up city. The weather widget's `initialCity` default is the one
      // remaining literal (a widget default, not Turna data); anything else is a regression.
      const lines = app.split(/\r?\n/);
      const cityFallbacks = linesContaining(app, "|| 'İstanbul'").filter((n) => !lines[n - 1].includes('initialCity='));
      expect(cityFallbacks).toEqual([]);
      expect(linesContaining(app, DASHES)).toEqual([]);
    });

    it('L.3 getNormalizedBrandName matches the short aliases (thy, klm, ba, vib, ido) as whole words only', async () => {
      const { getNormalizedBrandName, AVIATION_BRANDS, BUS_BRANDS, RAIL_FERRY_BRANDS, FOOTER_DISTINCT_BRANDS } = await import('../components/PartnerLogosRibbon');
      const cases: Array<[string, string]> = [
        ['Seyidoğlu Turizm', 'Seyidoğlu Turizm'],
        ['İDO', 'İDO'],
        ['ido', 'İDO'],
        ['İDO Deniz Otobüsleri', 'İDO'],
        ['Kathy Tours', 'Kathy Tours'],
        ['Vibe Tur', 'Vibe Tur'],
        ['Vib Turizm', 'Sakarya VİB'],
        ['BA', 'British Airways'],
        ['ba cityflyer', 'British Airways'],
        ['Global Bakü Tur', 'Global Bakü Tur'],
        ['Başkentray', 'Başkentray'],
        ['THY', 'Türk Hava Yolları'],
        ['Turkish Airlines', 'Türk Hava Yolları'],
        ['KLM Royal Dutch Airlines', 'KLM'],
        ['Metro Turizm', 'Metro Turizm'],
        ['Pegasus Airlines', 'Pegasus'],
        ['Freebird Airlines', 'Freebird Airlines'],
        ['Elazığ Hazar Turizm', 'Elazığ Hazar Turizm'],
        ['', ''],
      ];
      for (const [input, expected] of cases) expect(getNormalizedBrandName(input)).toBe(expected);
      // Every canonical brand is a fixed point: BrandLogo's "bileo has an SVG" predicate depends on it.
      const brands = [...AVIATION_BRANDS, ...BUS_BRANDS, ...RAIL_FERRY_BRANDS, ...FOOTER_DISTINCT_BRANDS];
      expect(brands.length).toBeGreaterThan(40);
      for (const brand of brands) expect(getNormalizedBrandName(brand)).toBe(brand);
      const ribbon = readText(rel('src/components/PartnerLogosRibbon.tsx'));
      expect(ribbon).toContain("hasToken(n, 'ba')");
      for (const substringRule of ["includes('ba')", "includes('thy')", "includes('klm')", "includes('vib')", "includes('ido')"]) expect(ribbon).toNotContain(substringRule);
    });

    it('L.4 BrandLogo predicates: hasBrandMark follows the SVG brand set, isRenderableLogoUrl accepts absolute https URLs only', async () => {
      const { hasBrandMark, isRenderableLogoUrl } = await import('../components/results/BrandLogo');
      const { AVIATION_BRANDS, BUS_BRANDS, RAIL_FERRY_BRANDS, FOOTER_DISTINCT_BRANDS } = await import('../components/PartnerLogosRibbon');
      for (const brand of [...AVIATION_BRANDS, ...BUS_BRANDS, ...RAIL_FERRY_BRANDS, ...FOOTER_DISTINCT_BRANDS]) expect(hasBrandMark(brand)).toBeTruthy();
      for (const alias of ['Pegasus', 'Turkish Airlines', 'THY', 'Kamil Koç', 'İDO', 'ido', 'BA', 'BUDO Express', '  Pegasus  ']) expect(hasBrandMark(alias)).toBeTruthy();
      for (const unknown of ['Freebird Airlines', 'Elazığ Hazar Turizm', 'Seyidoğlu Turizm', 'Circular', 'Veyonda Car', 'Garenta', 'Avis', 'Kathy Tours', '', '   ']) {
        expect(hasBrandMark(unknown)).toBeFalsy();
      }
      for (const url of [`${TURNA_CDN}/Images/Flight/Airlines/PC.png`, `${TURNA_CDN}/Images/Bus/BusCompanies/kamil-koc.png`, `${CAR_LOGO_BASE}/circular.png`, 'HTTPS://cdn.turna.com/x.png']) {
        expect(isRenderableLogoUrl(url)).toBeTruthy();
      }
      for (const bad of ['http://cdn.turna.com/x.png', '//cdn.turna.com/x.png', 'cdn.turna.com/x.png', 'data:image/png;base64,AAAA', 'javascript:alert(1)', 'https://x.com/a b.png', 'https://x.com/"onerror=x', "https://x.com/'.png", 'https://x.com/<svg>', 'https://', '', null, undefined]) {
        expect(isRenderableLogoUrl(bad)).toBeFalsy();
      }
    });

    it('L.5 HotelResults helpers: tr-TR rating and review formatting, location line, summary line, frequency facets, link fallback', async () => {
      const m = await import('../components/results/HotelResults');
      expect(m.HOTEL_PRICE_NOTE).toBe(HOTEL_PRICE_NOTE_COPY);
      expect(m.HOTEL_LINK_LABEL).toBe("Turna'da gör");
      expect(m.HOTEL_EMPTY_FILTER_COPY).toBe('Filtrelere uyan otel yok.');
      expect(m.formatHotelRating(9.4)).toBe('9,4');
      expect(m.formatHotelRating(10)).toBe('10');
      expect(m.formatHotelRating(8.9)).toBe('8,9');
      expect(m.formatReviewCount(1735)).toBe('1.735 yorum');
      expect(m.formatReviewCount(0)).toBe('0 yorum');
      const hotels = parseHotels(extractJsonLd(HOTEL_PAGE_RSC_HTML), HOTEL_PAGE_RSC_HTML);
      const [akra, , swandor, rixos] = hotels;
      expect(m.hotelLocationLine(akra)).toBe('Muratpaşa, Antalya');
      expect(m.hotelLocationLine(swandor)).toBe('Aksu, Antalya');
      expect(m.hotelLocationLine(rixos)).toBe('Antalya Merkez, Muratpaşa, Antalya');
      expect(m.hotelLocationLine({ ...rixos, locality: '   ' })).toBeNull();
      expect(m.hotelLocationLine({ ...akra, district: 'Antalya' })).toBe('Antalya');
      expect(m.hotelLocationLine({ ...akra, district: null })).toBe('Antalya');
      expect(m.hotelSummaryLine(hotels)).toBe('4 otel; 2 tanesinde yıldız bilgisi; puan verisi 4 otelde');
      expect(m.hotelSummaryLine([])).toBe('0 otel');
      expect(m.hotelSummaryLine([{ ...rixos, rating: null }])).toBe('1 otel');
      expect(m.hotelSummaryLine([{ ...rixos, rating: null, stars: 0 }])).toBe('1 otel');
      expect(m.topByFrequency(['Spa', 'Denize Sıfır', 'Spa', ' ', 'Aile', 'Denize Sıfır '], 2)).toEqual([
        { value: 'Denize Sıfır', count: 2 },
        { value: 'Spa', count: 2 },
      ]);
      expect(m.topByFrequency([], 3)).toEqual([]);
      expect(m.topByFrequency(['b', 'a'], 0)).toEqual([]);
      const result = hotelEnvelope(hotels);
      expect(m.hotelLinkHref(akra, result)).toBe('https://www.turna.com/otel/akra-antalya');
      expect(m.hotelLinkHref({ ...akra, url: 'https://evil.example/otel/akra-antalya' }, result)).toBe(result.sourceUrl);
      expect(m.hotelLinkHref({ ...akra, url: 'http://www.turna.com/otel/akra-antalya' }, result)).toBe(result.sourceUrl);
      expect(m.hotelLinkHref({ ...akra, url: '' }, result)).toBe(result.sourceUrl);
    });

    it('L.6 CarResults helpers: enum labels, a mileage label that never invents a limit, company distribution line', async () => {
      const m = await import('../components/results/CarResults');
      expect(m.CAR_LINK_LABEL).toBe("Turna'da kirala");
      expect(m.CAR_MILEAGE_UNKNOWN).toBe('Km limiti belirtilmemiş');
      expect(m.CAR_EMPTY_FILTER_COPY).toBe('Filtrelere uyan araç yok.');
      expect(m.CAR_CLASS_LABEL).toEqual({ economy: 'Ekonomi', standard: 'Standart', fullsize: 'Geniş', premium: 'Premium', luxury: 'Lüks', other: 'Diğer' });
      expect(m.CAR_FUEL_LABEL).toEqual({ gasoline: 'Benzin', diesel: 'Dizel', hybrid: 'Hibrit', electric: 'Elektrik', lpg: 'LPG', other: 'Diğer' });
      expect(m.CAR_TRANSMISSION_LABEL).toEqual({ auto: 'Otomatik', manual: 'Manuel', other: 'Belirtilmemiş' });
      expect(m.mileageLabel(500)).toBe('500 km/gün');
      expect(m.mileageLabel(1500)).toBe('1.500 km/gün');
      for (const km of [null, 0, -1, Number.NaN, Number.POSITIVE_INFINITY]) expect(m.mileageLabel(km)).toBe('Km limiti belirtilmemiş');
      const cars = parseCars(CAR_PAGE_HTML);
      expect(m.companyDistribution(cars)).toEqual([
        { name: 'Avis', count: 1 },
        { name: 'Circular', count: 1 },
        { name: 'Garenta', count: 1 },
        { name: 'Veyonda Car', count: 1 },
      ]);
      expect(m.companyDistributionLine(cars)).toBe('4 firma: Avis 1, Circular 1, Garenta 1, Veyonda Car 1');
      expect(m.companyDistributionLine(cars, 2)).toBe('4 firma: Avis 1, Circular 1, +2');
      expect(m.companyDistributionLine([])).toBe('');
      expect(m.companyDistribution([...SAMPLE_CAR_OFFERS, SAMPLE_CAR_OFFERS[0]])).toEqual([
        { name: 'Circular', count: 2 },
        { name: 'Veyonda Car', count: 1 },
      ]);
      expect(m.companyDistribution([{ ...SAMPLE_CAR_OFFERS[0], company: '   ' }])).toEqual([]);
      expect(m.companyDistributionLine([{ ...SAMPLE_CAR_OFFERS[0], company: ' Circular ' }, SAMPLE_CAR_OFFERS[0]])).toBe('1 firma: Circular 2');
    });

    it('L.7 SearchResults city helpers: cityDisplayName prefers the curated dataset, then the page title, then the slug', async () => {
      const { cityDisplayName, cityHeading } = await loadSearchResults();
      expect(cityDisplayName('antalya', null)).toBe('Antalya');
      expect(cityDisplayName('istanbul', 'Antalya Otelleri | Turna')).toBe('İstanbul');
      expect(cityDisplayName('lefkosa', null)).toBe('Lefkoşa');
      expect(cityDisplayName('ankara', CAR_PAGE_TITLE)).toBe('Ankara');
      expect(cityDisplayName('nowhere', 'Nowhere Otelleri | Turna')).toBe('Nowhere');
      expect(cityDisplayName('nowhere', 'Nowhere Araç Kiralama - Rent a Car | Turna')).toBe('Nowhere');
      expect(cityDisplayName(null, HOTEL_PAGE_RSC_TITLE)).toBe('Antalya');
      expect(cityDisplayName('nowhere', null)).toBe('Nowhere');
      expect(cityDisplayName('nowhere', '')).toBe('Nowhere');
      expect(cityDisplayName(null, `${'x'.repeat(41)} | Turna`)).toBe('Şehir');
      expect(cityDisplayName(null, null)).toBe('Şehir');
      expect(cityHeading('hotel', 'Antalya')).toBe('Antalya otelleri');
      expect(cityHeading('car', 'İstanbul')).toBe('İstanbul araç kiralama');
    });

    it('L.8 results components: hotels never format a price, cars show only dailyPrice, every remote logo has an onError fallback', () => {
      const hotel = readText(rel('src/components/results/HotelResults.tsx'));
      for (const forbidden of ['priceTL', '₺', ' TL', 'availableSeats', 'lucide-react']) expect(hotel).toNotContain(forbidden);
      expect(hotel).toContain('referrerPolicy="no-referrer"');
      expect(hotel).toContain('loading="lazy"');
      expect(hotel).toContain('onError');
      const car = readText(rel('src/components/results/CarResults.tsx'));
      expect(car).toContain('priceTL(car.dailyPrice');
      expect(car).toContain('unitSuffix={CAR_PRICE_UNIT}');
      expect(car).toContain('ariaLabel="Günlük fiyat özeti"');
      expect(car).toContain('<BrandLogo name={car.company} logoUrl={car.companyLogoUrl}');
      for (const forbidden of ['availableSeats', 'rating', 'lucide-react']) expect(car).toNotContain(forbidden);
      const brand = readText(rel('src/components/results/BrandLogo.tsx'));
      for (const needle of ['getNormalizedBrandName', 'onError', 'referrerPolicy="no-referrer"', 'loading="lazy"', 'useState']) expect(brand).toContain(needle);
      expect(brand).toNotContain('window.');
      expect(brand).toNotContain('document.');
      const searchResults = readText(rel('src/components/SearchResults.tsx'));
      for (const needle of ["import('./results/HotelResults')", "import('./results/CarResults')", 'export function preloadCityResults', "from './results/BrandLogo'", 'countLabel=', 'showDisclosure={false}', CITY_EMPTY_TITLE, CITY_DISCLOSURE_HOTEL, CITY_DISCLOSURE_CAR, 'export function cityDisplayName', 'export function cityHeading']) {
        expect(searchResults).toContain(needle);
      }
      expect(searchResults).toNotContain("from './CompanyLogo'");
      expect(searchResults).toNotContain('route.companyLogo}');
    });

    it('L.9 local price alerts: browser-only storage, one per route, triggered once per observation, no e-mail promise', async () => {
      const alerts = await import('../lib/turna/alerts');
      const mem = new Map<string, string>();
      const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
      const at = () => new Date(CLOCK_START);
      expect(alerts.readPriceAlerts(store)).toEqual([]);
      expect(alerts.readPriceAlerts(null)).toEqual([]);

      const saved = alerts.savePriceAlert({ routeKey: 'flight:istanbul-ankara', label: 'İstanbul - Ankara', targetPrice: 1350.4, baselinePrice: 1401.11 }, store, at);
      expect(saved).toHaveLength(1);
      expect(saved[0].targetPrice).toBe(1350);
      expect(saved[0].createdAt).toBe(new Date(CLOCK_START).toISOString());
      expect(JSON.parse(mem.get(alerts.PRICE_ALERTS_KEY) ?? '[]')).toHaveLength(1);
      // Saving the same route again replaces the target instead of stacking alerts.
      expect(alerts.savePriceAlert({ routeKey: 'flight:istanbul-ankara', label: 'İstanbul - Ankara', targetPrice: 1300, baselinePrice: 1401.11 }, store, at).map((a) => a.targetPrice)).toEqual([1300]);
      alerts.savePriceAlert({ routeKey: 'car:istanbul', label: 'İstanbul (Araç)', targetPrice: 700, baselinePrice: 778.34 }, store, at);
      expect(alerts.findPriceAlert('car:istanbul', store)?.targetPrice).toBe(700);
      expect(alerts.findPriceAlert(null, store)).toBe(undefined);
      // Invalid input is refused, corrupt storage reads as empty.
      expect(alerts.savePriceAlert({ routeKey: '', label: 'x', targetPrice: 10, baselinePrice: 10 }, store, at)).toHaveLength(2);
      expect(alerts.savePriceAlert({ routeKey: 'bus:a-b', label: 'x', targetPrice: Number.NaN, baselinePrice: 10 }, store, at)).toHaveLength(2);
      mem.set('corrupt', '{'); expect(alerts.readPriceAlerts({ ...store, getItem: () => '{' })).toEqual([]);

      // Above the target: nothing. At or below: reported once per scrapedAt, then silent for the same observation.
      const result = (min: number | null, scrapedAt: string) => ({ routeKey: 'flight:istanbul-ankara', scrapedAt, stats: min === null ? null : { count: 1, min, max: min, avg: min, median: min, byCompany: [], byDay: [] } });
      expect(alerts.checkPriceAlerts(result(1401.11, '2026-09-06T10:00:00.000Z'), store)).toEqual([]);
      const hits = alerts.checkPriceAlerts(result(1299.5, '2026-09-06T10:05:00.000Z'), store);
      expect(hits.map((h) => [h.routeKey, h.targetPrice, h.lastNotifiedScrapedAt])).toEqual([['flight:istanbul-ankara', 1300, '2026-09-06T10:05:00.000Z']]);
      expect(alerts.checkPriceAlerts(result(1299.5, '2026-09-06T10:05:00.000Z'), store)).toEqual([]);
      expect(alerts.checkPriceAlerts(result(1300, '2026-09-06T10:10:00.000Z'), store)).toHaveLength(1);
      expect(alerts.checkPriceAlerts(result(null, '2026-09-06T10:15:00.000Z'), store)).toEqual([]);
      expect(alerts.checkPriceAlerts({ routeKey: 'hotel:antalya', scrapedAt: 'x', stats: null }, store)).toEqual([]);
      expect(alerts.removePriceAlert('flight:istanbul-ankara', store).map((a) => a.routeKey)).toEqual(['car:istanbul']);

      // The modal makes no delivery promise it cannot keep and binds the alert to the live route key.
      const modal = readText(rel('src/components/PriceAlertModal.tsx'));
      for (const gone of ['type="email"', 'e-postanıza', 'adresine bildirim', 'BileoMail', 'animate-fadeIn', 'backdrop-blur-xs']) expect(modal).toNotContain(gone);
      for (const needle of ['PRICE_ALERT_DISCLOSURE', 'E-posta veya SMS gönderilmez', 'savePriceAlert', 'removePriceAlert', 'findPriceAlert', 'routeKey', 'aria-modal="true"', 'Alarmı kaldır']) expect(modal).toContain(needle);
      expect(linesContaining(modal, DASHES)).toEqual([]);
      const app = readText(rel('src/App.tsx'));
      expect(app).toContain('checkPriceAlerts(next.result)');
      expect(app).toContain("routeKey={live.status === 'ok' ? live.result.routeKey : null}");
      const { PRICE_ALERT_DISCLOSURE, priceAlertLabel } = await import('../components/PriceAlertModal');
      expect(PRICE_ALERT_DISCLOSURE).toContain('yalnızca bu tarayıcıda');
      expect(priceAlertLabel('İstanbul', 'Ankara')).toBe('İstanbul - Ankara');
      expect(priceAlertLabel('İstanbul', '')).toBe('İstanbul');
    });

    it('L.10 useDialogFocus wraps Tab inside the dialog, closes on Escape and the price alert modal uses it', async () => {
      const { wrapFocusIndex, FOCUSABLE_SELECTOR } = await import('../lib/useDialogFocus');
      expect(FOCUSABLE_SELECTOR).toContain('button');
      expect(FOCUSABLE_SELECTOR).toContain('[tabindex]:not([tabindex="-1"])');
      // Forward: only the last element (or focus outside the list) wraps to the first.
      expect(wrapFocusIndex(3, 0, false)).toBe(null);
      expect(wrapFocusIndex(3, 1, false)).toBe(null);
      expect(wrapFocusIndex(3, 2, false)).toBe(0);
      expect(wrapFocusIndex(3, -1, false)).toBe(0);
      // Backward: only the first element (or focus outside) wraps to the last.
      expect(wrapFocusIndex(3, 0, true)).toBe(2);
      expect(wrapFocusIndex(3, -1, true)).toBe(2);
      expect(wrapFocusIndex(3, 2, true)).toBe(null);
      expect(wrapFocusIndex(0, -1, false)).toBe(null);
      expect(wrapFocusIndex(0, -1, true)).toBe(null);
      const hook = readText(rel('src/lib/useDialogFocus.ts'));
      for (const needle of ["event.key === 'Escape'", "event.key !== 'Tab'", 'opener.focus()', 'onCloseRef.current()']) expect(hook).toContain(needle);
      const modal = readText(rel('src/components/PriceAlertModal.tsx'));
      expect(modal).toContain("from '../lib/useDialogFocus'");
      expect(modal).toContain('ref={dialogRef} tabIndex={-1}');
      expect(modal).toContain('role="dialog"');
      // The same hook guards the sign-in and PNR dialogs, which are the other two modals reachable from the Hero.
      for (const file of ['src/components/AuthModal.tsx', 'src/components/PnrQueryModal.tsx']) {
        const src = readText(rel(file));
        expect(src).toContain("from '../lib/useDialogFocus'");
        expect(src).toContain('ref={dialogRef} tabIndex={-1}');
        expect(src).toContain('role="dialog"');
        expect(src).toContain('aria-modal="true"');
      }
    });

    it('L.11 the muted text token meets WCAG AA (4.5:1) on every cream surface it is used on', () => {
      const config = readText(rel('tailwind.config.js'));
      const hex = (name: string): string => {
        const m = config.match(new RegExp(name + ":[ ]*'(#[0-9A-Fa-f]{6})'"));
        expect(m).toBeTruthy();
        return (m as RegExpMatchArray)[1];
      };
      const luminance = (h: string): number => {
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (a: string, b: string): number => {
        const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
      };
      const muted = hex('muted');
      const surfaces = ['#FFFFFF', hex('100'), hex('200'), hex('300'), hex('soft'), '#FAF7F2'];
      for (const bg of surfaces) expect(ratio(muted, bg) >= 4.5).toBeTruthy();
      expect(ratio(hex('DEFAULT'), hex('200')) >= 7).toBeTruthy();
      expect(ratio('#FFFFFF', hex('700')) >= 4.5).toBeTruthy();
      // The lighter token fails AA on cream, so it must not carry small text; arrows only.
      const light = walkFiles(rel('src/components'), isCodeFile).flatMap((f) => linesContaining(readText(f), 'text-charcoal-light').map((n) => `${path.basename(f)}:${n}`));
      expect(light.length <= 2).toBeTruthy();
      // The retired muted hex must not survive anywhere in app code (built by concatenation so this file passes too).
      const retiredMuted = '#7872' + '6D';
      for (const f of walkFiles(rel('src'), isCodeFile)) expect(readText(f)).toNotContain(retiredMuted);
    });

    it('L.12 full-screen views move focus to their heading on entry and hand it back on exit', () => {
      const hook = readText(rel('src/lib/useScreenEntry.ts'));
      for (const needle of ['window.scrollTo({ top: 0, left: 0 })', 'target.focus({ preventScroll: true })', 'opener.focus()', 'no focus trap and no Escape binding']) {
        expect(hook).toContain(needle);
      }
      for (const file of ['src/components/TicketExperienceScreen.tsx', 'src/components/SeatSelectionModal.tsx', 'src/components/CheckoutModal.tsx']) {
        const src = readText(rel(file));
        expect(src).toContain("from '../lib/useScreenEntry'");
        expect(src).toContain('const entryRef = useScreenEntry<HTMLHeadingElement>();');
        expect(linesContaining(src, 'ref={entryRef} tabIndex={-1}')).toHaveLength(1);
      }
    });

    it('L.13 seats are real buttons with a visible focus ring, aria-pressed and a state-carrying accessible name', async () => {
      const src = readText(rel('src/components/common/RealisticSeat.tsx'));
      expect(src).toContain('aria-pressed={isSelected}');
      expect(src).toContain('aria-label={accessibleName}');
      expect(src).toContain('focus-visible:ring-2');
      expect(src).toNotContain('focus:outline-none');
      const { RealisticSeat } = await import('../components/common/RealisticSeat');
      const base = { id: 's12', number: 12, row: 3, col: 1, status: 'available' as const, tier: 'standard' as const, price: 500 };
      const render = (props: Record<string, unknown>): string =>
        renderToStaticMarkup(React.createElement(RealisticSeat, { seat: base, isSelected: false, isMale: false, isFemale: false, isBooked: false, onClick: noop, ...props } as never));
      const free = render({});
      expect(free).toContain('<button type="button"');
      expect(free).toContain('aria-pressed="false"');
      expect(free).toContain('aria-label="Koltuk 12, boş"');
      expect(free).toNotContain('disabled=""');
      expect(render({ isSelected: true, selectedGender: 'female' })).toContain('aria-label="Koltuk 12, seçili, bayan"');
      expect(render({ isSelected: true })).toContain('aria-pressed="true"');
      const taken = render({ isMale: true });
      expect(taken).toContain('aria-label="Koltuk 12, dolu, bay"');
      expect(taken).toContain('disabled=""');
      expect(render({ isBooked: true })).toContain('aria-label="Koltuk 12, dolu"');
      expect(render({ isSingleVIP: true })).toContain('aria-label="Koltuk 12, tekli VIP, boş"');
      expect(DASHES.test(free)).toBeFalsy();
    });

    it('L.14 the weather widget declares itself a static sample instead of posing as a live forecast', async () => {
      const src = readText(rel('src/components/DestinationWeatherModal.tsx'));
      expect(src).toContain('export const WEATHER_SAMPLE_DISCLOSURE');
      expect(src).toContain('Varış Noktası Hava Durumu (örnek)');
      expect(src).toContain('data-weather-disclosure');
      expect(src).toContain('https://www.mgm.gov.tr/');
      for (const claim of ['Canlı hava', 'canlı tahmin', 'güncel tahmin', 'Anlık']) expect(src).toNotContain(claim);
      expect(readText(rel('src/components/Footer.tsx'))).toContain('Hava Durumu (örnek)');
      const { WEATHER_SAMPLE_DISCLOSURE, DestinationWeatherModal } = await import('../components/DestinationWeatherModal');
      expect(WEATHER_SAMPLE_DISCLOSURE).toContain('temsili bir örnektir');
      expect(WEATHER_SAMPLE_DISCLOSURE).toContain('canlı bir hava durumu kaynağından gelmez');
      const html = renderToStaticMarkup(React.createElement(DestinationWeatherModal, { isOpen: true, onClose: noop, initialCity: 'Ankara' }));
      expect(html).toContain('data-weather-disclosure');
      expect(html).toContain('role="note"');
      expect(html).toContain('(örnek)');
      expect(html).toContain('href="https://www.mgm.gov.tr/"');
      expect(DASHES.test(html)).toBeFalsy();
    });

    it('L.15 the five "live" radar and tracker guides are labelled as samples and drop their live-feed claims', async () => {
      const { SampleDataNotice, SAMPLE_DATA_NOTICE } = await import('../components/common/SampleDataNotice');
      expect(SAMPLE_DATA_NOTICE).toContain('temsili örneklerdir');
      const strip = renderToStaticMarkup(React.createElement(SampleDataNotice, null));
      expect(strip).toContain('role="note"');
      expect(strip).toContain('data-sample-data-notice');
      expect(strip).toContain(SAMPLE_DATA_NOTICE);
      expect(semanticDots(strip)).toBe(0);
      const files = ['LiveJourneyTrackerModal', 'HighwayPassesLiveRadarModal', 'LiveRoadWeatherRadarModal', 'LiveOccupancyRadarModal', 'LiveFlightRadarModal'];
      for (const name of files) {
        const src = readText(rel(`src/components/${name}.tsx`));
        expect(src).toContain("from './common/SampleDataNotice'");
        expect(linesContaining(src, '<SampleDataNotice />')).toHaveLength(1);
        expect(src).toMatch(/<h3[^>]*>[^<]*\(örnek\)<\/h3>/);
        for (const claim of ['Canlı Sinyal', 'ADS-B Canlı', 'anlık çekilir', 'Gerçek Zamanlı Koltuk', 'CANLI (', 'telemetrisi entegredir', 'anlık hız', 'Anlık Hız', 'anlık bildirim']) expect(src).toNotContain(claim);
      }
      const footer = readText(rel('src/components/Footer.tsx'));
      for (const label of ['Araç Takibi (örnek)', 'Yol & Radar (örnek)', 'Uçuş Radarı (örnek)', 'Doluluk Radarı (örnek)', 'Geçit & Tünel Radarı (örnek)']) expect(footer).toContain(label);
      expect(footer).toNotContain('<span>Canlı Araç Takibi</span>');
    });

    it('L.16 six more guide modals with hand-written fares, clocks and frequencies carry the sample notice and drop official or real-time claims', () => {
      const files = ['TaxiEstimatorModal', 'SmartTransferPlannerModal', 'RouteStopsModal', 'InteractiveRouteNetworkModal', 'MultiModalComparisonModal', 'LuggageStorageModal'];
      for (const name of files) {
        const src = readText(rel(`src/components/${name}.tsx`));
        expect(src).toContain("from './common/SampleDataNotice'");
        expect(linesContaining(src, '<SampleDataNotice />')).toHaveLength(1);
        expect(src).toMatch(/<h3[^>]*>[^<]*\(örnek\)<\/h3>/);
        // The notice sits directly under the header block, before any table or number.
        expect(src.indexOf('<SampleDataNotice />') > src.indexOf('</h3>')).toBeTruthy();
        expect(src.indexOf('<SampleDataNotice />') < src.indexOf('overflow-y-auto space-y')).toBeTruthy();
        for (const claim of ['gerçek zamanlı optimize', 'Resmi tarife,', 'anlık çekilir', 'Canlı Sinyal']) expect(src).toNotContain(claim);
      }
      const footer2 = readText(rel('src/components/Footer.tsx'));
      for (const label of ['Taksi Tarifesi (örnek)', 'Emanet Dolapları (örnek)', 'Güzergah & Duraklar (örnek)', 'Mod Karşılaştırma (örnek)', 'Rota Ağı Haritası (örnek)', 'Akıllı Aktarma (örnek)']) expect(footer2).toContain(label);
      // The five radar guides from L.15 keep their single notice; nothing was duplicated.
      for (const name of ['LiveFlightRadarModal', 'LiveOccupancyRadarModal']) expect(linesContaining(readText(rel(`src/components/${name}.tsx`)), '<SampleDataNotice />')).toHaveLength(1);
    });

    it('L.17 third batch of fare, timetable and toll guides carries the sample notice and stops citing official current tariffs', () => {
      const files = ['FareMatrixModal', 'AirportMetroTransitModal', 'AirportExpressBusGuideModal', 'ShuttleTimetableModal', 'HighwayTollModal', 'CityTransitCardsModal'];
      for (const name of files) {
        const src = readText(rel(`src/components/${name}.tsx`));
        expect(src).toContain("from './common/SampleDataNotice'");
        expect(linesContaining(src, '<SampleDataNotice />')).toHaveLength(1);
        expect(src).toMatch(/<h3[^>]*>[^<]*\(örnek\)<\/h3>/);
        expect(src.indexOf('<SampleDataNotice />') > src.indexOf('</h3>')).toBeTruthy();
        expect(src.indexOf('<SampleDataNotice />') < src.indexOf('overflow-y-auto space-y')).toBeTruthy();
        for (const claim of ['resmi güncel tarife', 'Resmi Tarife &', 'güncel tarifeler</p>', 'baz alınmıştır']) expect(src).toNotContain(claim);
      }
      const footer3 = readText(rel('src/components/Footer.tsx'));
      for (const label of ['Servis Saatleri (örnek)', 'Otoyol & Köprü Geçişleri (örnek)', 'Havalimanı Metrosu (örnek)', 'Havalimanı Servisleri (örnek)']) expect(footer3).toContain(label);
      expect(readText(rel('src/components/WhyBileoSection.tsx'))).toContain('Süre Tablosu (örnek)');
      // Inventory so far: 5 (L.15) + 6 (L.16) + 6 (L.17) guide modals carry exactly one notice each.
      const all = ['LiveJourneyTrackerModal', 'HighwayPassesLiveRadarModal', 'LiveRoadWeatherRadarModal', 'LiveOccupancyRadarModal', 'LiveFlightRadarModal', 'TaxiEstimatorModal', 'SmartTransferPlannerModal', 'RouteStopsModal', 'InteractiveRouteNetworkModal', 'MultiModalComparisonModal', 'LuggageStorageModal', ...files];
      expect(all).toHaveLength(17);
      for (const name of all) expect(linesContaining(readText(rel(`src/components/${name}.tsx`)), '<SampleDataNotice />')).toHaveLength(1);
    });

    it('L.18 fourth batch (car rental, parcel, budget, travel guides, insurance) carries the sample notice; parcel lookup invents no shipment', () => {
      const files = ['CarRentalTransitGuideModal', 'ExpressParcelTransitModal', 'SmartTravelBudgetCalculatorModal', 'TravelGuidesModal', 'TravelInsuranceModal'];
      for (const name of files) {
        const src = readText(rel(`src/components/${name}.tsx`));
        expect(src).toContain("from './common/SampleDataNotice'");
        expect(linesContaining(src, '<SampleDataNotice />')).toHaveLength(1);
        expect(src).toMatch(/<h3[^>]*>[^<]*\(örnek\)<\/h3>/);
        expect(src.indexOf('<SampleDataNotice />') > src.indexOf('</h3>')).toBeTruthy();
        expect(src.indexOf('<SampleDataNotice />') < src.indexOf('overflow-y-auto space-y')).toBeTruthy();
      }
      const parcel = readText(rel('src/components/ExpressParcelTransitModal.tsx'));
      for (const claim of ['Canlı Kargo Takibi', 'canlı konumu', 'aktif sevkiyatta', 'Generate dynamic tracking', 'const simulated']) expect(parcel).toNotContain(claim);
      expect(parcel).toContain('Kargo Takibi (örnek)');
      expect(parcel).toContain("onShowToast('Kayıt Bulunamadı'");
      expect(parcel).toContain('setActiveParcel(null)');
      expect(readText(rel('src/components/TravelInsuranceModal.tsx'))).toContain('gerçek bir sigorta ürünü satılmaz');
      const footer4 = readText(rel('src/components/Footer.tsx'));
      for (const label of ['Seyahat Sigortası (örnek)', 'Tatil & Gezi Rehberi (örnek)', 'Hızlı Kargo (örnek)', 'Araç Kiralama (örnek)', 'Seyahat Bütçe Planlayıcı (örnek)']) expect(footer4).toContain(label);
      // Inventory: 17 (L.15-L.17) + 5 = 22 guide modals, one notice each; booking flows (Checkout, SeatSelection, TicketReschedule) are not guides and carry none.
      const labelled = fs.readdirSync(rel('src/components')).filter((f) => f.endsWith('Modal.tsx') && readText(rel(`src/components/${f}`)).includes("from './common/SampleDataNotice'"));
      expect(labelled).toHaveLength(22);
      for (const name of ['CheckoutModal', 'SeatSelectionModal', 'TicketRescheduleModal']) expect(readText(rel(`src/components/${name}.tsx`))).toNotContain('SampleDataNotice');
    });

    it('L.19 README documents every npm script, both HTTP endpoints and every TURNA_* variable of .env.example', () => {
      const readme = readText(rel('README.md'));
      const pkg = JSON.parse(readText(rel('package.json'))) as { scripts: Record<string, string> };
      for (const script of Object.keys(pkg.scripts)) expect(readme).toContain(`npm run ${script}`.replace('npm run test', 'npm test'));
      for (const endpoint of ['/api/turna', '/api/search', '?stats=1', 'sources=', 'refresh=1']) expect(readme).toContain(endpoint);
      // Response contract words the README must keep in step with src/server/turna/http.ts and src/lib/turna/types.ts.
      for (const word of ['X-Turna-Fetched-Via', 'X-Turna-Scraped-At', 'Retry-After', '`history`', '`delta`', '`stats`', '`facts`', 's-maxage=600', 's-maxage=300', 'private, no-store']) expect(readme).toContain(word);
      const vercel = JSON.parse(readText(rel('vercel.json'))) as { functions: Record<string, { maxDuration: number }> };
      for (const fn of ['api/turna.ts', 'api/search.ts']) expect(vercel.functions[fn].maxDuration).toBe(30);
      for (const word of ['## Dağıtım', 'maxDuration', 'immutable', 'stale-while-revalidate']) expect(readme).toContain(word);
      const turnaHttp = readText(rel('src/server/turna/http.ts'));
      for (const header of ['X-Turna-Fetched-Via', 'X-Turna-Scraped-At', 'Retry-After']) expect(turnaHttp).toContain(`'${header}'`);
      expect(turnaHttp).toContain("'public, max-age=0, s-maxage=600, stale-while-revalidate=300'");
      expect(readText(rel('src/server/sources/http.ts'))).toContain("'public, max-age=0, s-maxage=300, stale-while-revalidate=300'");
      const envKeys = readText(rel('.env.example')).split(/\r?\n/).map((l) => /^(TURNA_[A-Z_]+)=/.exec(l)?.[1]).filter((k): k is string => Boolean(k));
      expect(envKeys.length >= 8).toBeTruthy();
      for (const key of envKeys) expect(readme).toContain(`\`${key}\``);
      for (const doc of ['KAYNAK_GENISLETME_PLANI.md', 'TURNA_INTEGRATION.md', 'GELISTIRME_PLANI.md', '.env.example']) expect(readme).toContain(doc);
      // Honesty rules are stated, and the README carries no dash characters other than the hyphen.
      for (const rule of ['Koltuk doluluğu', 'tarihsiz landing', 'robots.txt', 'SampleDataNotice', 'lucide-react']) expect(readme).toContain(rule);
      expect(/[\u2013\u2014]/.test(readme)).toBeFalsy();
    });

    it('L.20 every new-tab link under src/components is safe and announces the new tab to screen readers', () => {
      const walk = (dir: string): string[] =>
        fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : e.name.endsWith('.tsx') ? [`${dir}/${e.name}`] : []));
      const files = walk(rel('src/components'));
      expect(files.length >= 60).toBeTruthy();
      let total = 0;
      let results = 0;
      for (const file of files) {
        const src = readText(file);
        const newTab = (src.match(/target="_blank"/g) ?? []).length;
        total += newTab;
        if (file.includes('/results/')) results += newTab;
        expect((src.match(/rel="noopener noreferrer"/g) ?? []).length).toBe(newTab);
        expect((src.match(/\(yeni sekmede açılır\)/g) ?? []).length).toBe(newTab);
      }
      // results: OtherSourcesPanel (2), SourceBadge (1), HotelResults (2), CarResults (1), FerryFactsPanel (1), ProvenanceStrip (1);
      // elsewhere: SearchResults (1), TicketExperienceScreen (1), DestinationWeatherModal (1).
      expect(results).toBe(8);
      expect(total).toBe(11);
    });
  });
}

// ---------------------------------------------------------------------------
// Entry point registered by src/tests/test_runner.ts
// ---------------------------------------------------------------------------

export function runTurnaScraperTests(): void {
  registerUrlTests();
  registerParseTests();
  registerAnalyticsTests();
  registerFetchTests();
  registerPipelineTests();
  registerHistoryTests();
  registerGuardAdapterTests();
  registerPlacesTests();
  registerStaticGuardTests();
  registerSsrTests();
  registerPhase2Tests();
  registerPhase2UiGuardTests();
}
