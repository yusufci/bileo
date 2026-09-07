/**
 * SERVER ONLY. Source adapters for the non-Turna landing pages plus the shared, hardened fetch path.
 * Each adapter knows which kinds it serves, how to turn a query into a landing URL and route key, which
 * URLs it may fetch, and how to parse the page. Fetching reuses `fetchTurnaHtml` (cache, robots.txt,
 * per-host gate, rolling budget, block cooldown, negative cache) with the adapter's allowlist guard.
 */
import type { SourceId, SourceKind, SourceOffer, SourceQuery } from '../../lib/sources/types';
import { allowedUrlGuard } from '../../lib/sources/urls';
import { slugifyTr } from '../../lib/turna/urls';
import { fetchTurnaHtml } from '../turna/fetch';
import type { FetchTurnaHtmlOptions, FetchedPage } from '../turna/fetch';
import { busLandingUrl, flightLandingUrl, hotelLandingUrl, parseBusTrips, parseFlights, parseHotels } from './obilet';
import { otelzHotelLandingUrl, parseOtelzHotels } from './otelz';
import { enuygunBusLandingUrl, enuygunFlightLandingUrl, enuygunHotelLandingUrl, parseEnuygunBusTrips, parseEnuygunFlights, parseEnuygunHotels } from './enuygun';
import { flixbusRouteLandingUrl, parseFlixbusRouteFacts } from './flixbus';

export type { SourceKind, SourceOffer, SourceQuery } from '../../lib/sources/types';

export interface SourceTarget {
  source: SourceId;
  kind: SourceKind;
  url: string;
  /** e.g. `obilet:bus:istanbul-ankara`, `obilet:hotel:antalya` */
  routeKey: string;
}

export interface SourceAdapter {
  id: SourceId;
  kinds: readonly SourceKind[];
  /** Landing URL and route key for a query, or null when the adapter does not serve it or the query is incomplete. */
  resolve(query: SourceQuery): SourceTarget | null;
  isAllowedUrl(url: string): boolean;
  parse(kind: SourceKind, html: string, sourceUrl: string): SourceOffer[];
}

const MIN_SLUG = 2;

function slug(value: string | undefined): string | null {
  if (!value) return null;
  const s = slugifyTr(value);
  return s.length >= MIN_SLUG ? s : null;
}

function routePair(query: SourceQuery): { from: string; to: string } | null {
  const from = slug(query.from);
  const to = slug(query.to);
  if (!from || !to || from === to) return null;
  return { from, to };
}

function citySlug(query: SourceQuery): string | null {
  return slug(query.city ?? query.to ?? query.from);
}

export const obiletAdapter: SourceAdapter = {
  id: 'obilet',
  kinds: ['bus', 'flight', 'hotel'],
  resolve(query) {
    if (query.kind === 'hotel') {
      const city = citySlug(query);
      return city ? { source: 'obilet', kind: 'hotel', url: hotelLandingUrl('obilet', city), routeKey: `obilet:hotel:${city}` } : null;
    }
    const pair = routePair(query);
    if (!pair) return null;
    const url = query.kind === 'bus' ? busLandingUrl('obilet', pair.from, pair.to) : flightLandingUrl('obilet', pair.from, pair.to);
    return { source: 'obilet', kind: query.kind, url, routeKey: `obilet:${query.kind}:${pair.from}-${pair.to}` };
  },
  isAllowedUrl: allowedUrlGuard('obilet'),
  parse(kind, html, sourceUrl) {
    if (kind === 'bus') return parseBusTrips(html, 'obilet', sourceUrl);
    if (kind === 'flight') return parseFlights(html, 'obilet', sourceUrl);
    return parseHotels(html, 'obilet', sourceUrl);
  },
};

/** Same platform as obilet (identical microdata); bus only. */
export const biletallAdapter: SourceAdapter = {
  id: 'biletall',
  kinds: ['bus'],
  resolve(query) {
    if (query.kind !== 'bus') return null;
    const pair = routePair(query);
    return pair ? { source: 'biletall', kind: 'bus', url: busLandingUrl('biletall', pair.from, pair.to), routeKey: `biletall:bus:${pair.from}-${pair.to}` } : null;
  },
  isAllowedUrl: allowedUrlGuard('biletall'),
  parse(kind, html, sourceUrl) {
    return kind === 'bus' ? parseBusTrips(html, 'biletall', sourceUrl) : [];
  },
};

/** otelz.com city pages: hotels only, no prices published, ratings from JSON-LD, coordinates from the Next.js payload. */
export const otelzAdapter: SourceAdapter = {
  id: 'otelz',
  kinds: ['hotel'],
  resolve(query) {
    if (query.kind !== 'hotel') return null;
    const city = citySlug(query);
    return city ? { source: 'otelz', kind: 'hotel', url: otelzHotelLandingUrl(city), routeKey: `otelz:hotel:${city}` } : null;
  },
  isAllowedUrl: allowedUrlGuard('otelz'),
  parse(kind, html, sourceUrl) {
    return kind === 'hotel' ? parseOtelzHotels(html, sourceUrl) : [];
  },
};

/** enuygun.com bus, flight and hotel landing pages: JSON-LD with calendar dates and coded cities/regions; slow host (see HOST_TIMEOUTS). */
export const enuygunAdapter: SourceAdapter = {
  id: 'enuygun',
  kinds: ['bus', 'flight', 'hotel'],
  resolve(query) {
    if (query.kind === 'hotel') {
      // Hotels need enuygun's region id; cities outside the table are refused rather than guessed.
      const city = citySlug(query);
      const url = city ? enuygunHotelLandingUrl(city) : null;
      return url && city ? { source: 'enuygun', kind: 'hotel', url, routeKey: `enuygun:hotel:${city}` } : null;
    }
    const pair = routePair(query);
    if (!pair) return null;
    if (query.kind === 'bus') return { source: 'enuygun', kind: 'bus', url: enuygunBusLandingUrl(pair.from, pair.to), routeKey: `enuygun:bus:${pair.from}-${pair.to}` };
    // Flights need enuygun's city code; cities outside the table are refused rather than guessed.
    const url = enuygunFlightLandingUrl(pair.from, pair.to);
    return url ? { source: 'enuygun', kind: 'flight', url, routeKey: `enuygun:flight:${pair.from}-${pair.to}` } : null;
  },
  isAllowedUrl: allowedUrlGuard('enuygun'),
  parse(kind, html, sourceUrl) {
    if (kind === 'bus') return parseEnuygunBusTrips(html, sourceUrl);
    if (kind === 'flight') return parseEnuygunFlights(html, sourceUrl);
    if (kind === 'hotel') return parseEnuygunHotels(html, sourceUrl);
    return [];
  },
};

/**
 * flixbus.com.tr route pages publish no timetable, only route facts (starting price, typical duration, first and last
 * planned departure, stops). Served under bus queries as a single `SourceRouteFacts` item; slow host (see HOST_TIMEOUTS).
 */
export const flixbusAdapter: SourceAdapter = {
  id: 'flixbus',
  kinds: ['bus'],
  resolve(query) {
    if (query.kind !== 'bus') return null;
    const pair = routePair(query);
    return pair ? { source: 'flixbus', kind: 'bus', url: flixbusRouteLandingUrl(pair.from, pair.to), routeKey: `flixbus:bus:${pair.from}-${pair.to}` } : null;
  },
  isAllowedUrl: allowedUrlGuard('flixbus'),
  parse(kind, html, sourceUrl) {
    if (kind !== 'bus') return [];
    const facts = parseFlixbusRouteFacts(html, sourceUrl);
    return facts ? [facts] : [];
  },
};

export const SOURCE_ADAPTERS: ReadonlyArray<SourceAdapter> = [obiletAdapter, biletallAdapter, otelzAdapter, enuygunAdapter, flixbusAdapter];

export function getSourceAdapter(id: SourceId): SourceAdapter | null {
  return SOURCE_ADAPTERS.find((a) => a.id === id) ?? null;
}

/** Adapters that serve `kind`, in registry order. */
export function adaptersForKind(kind: SourceKind): SourceAdapter[] {
  return SOURCE_ADAPTERS.filter((a) => a.kinds.includes(kind));
}

/**
 * Fetch a resolved landing page through the shared hardened layer. The adapter's allowlist replaces the
 * Turna allowlist; robots.txt, cache, host gate, budget and block cooldown apply unchanged (they are host based).
 */
export function fetchSourcePage(target: SourceTarget, opts: Omit<FetchTurnaHtmlOptions, 'allow'> = {}): Promise<FetchedPage> {
  const adapter = getSourceAdapter(target.source);
  if (!adapter) return Promise.reject(new Error(`Bilinmeyen kaynak: ${target.source}`));
  return fetchTurnaHtml({ url: target.url }, { ...opts, allow: adapter.isAllowedUrl });
}
