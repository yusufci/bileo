/**
 * Multi-source contract (Phase A of KAYNAK_GENISLETME_PLANI.md). Turna keeps its own contract in
 * `src/lib/turna/types.ts`; the types here describe offers coming from the other landing-page sources
 * (obilet, biletall, otelz, enuygun, flixbus). Browser-safe: no Node imports.
 */

export type SourceId = 'turna' | 'obilet' | 'biletall' | 'otelz' | 'enuygun' | 'flixbus';

export const SOURCE_IDS: readonly SourceId[] = ['turna', 'obilet', 'biletall', 'otelz', 'enuygun', 'flixbus'];

/** Turkish display names used in badges and provenance copy. */
export const SOURCE_LABELS: Record<SourceId, string> = {
  turna: 'Turna.com',
  obilet: 'obilet.com',
  biletall: 'biletall.com',
  otelz: 'otelz.com',
  enuygun: 'enuygun.com',
  flixbus: 'flixbus.com.tr',
};

export const SOURCE_ORIGINS: Record<SourceId, string> = {
  turna: 'https://www.turna.com',
  obilet: 'https://www.obilet.com',
  biletall: 'https://www.biletall.com',
  otelz: 'https://www.otelz.com',
  enuygun: 'https://www.enuygun.com',
  flixbus: 'https://www.flixbus.com.tr',
};

export function isSourceId(value: unknown): value is SourceId {
  return typeof value === 'string' && (SOURCE_IDS as readonly string[]).includes(value);
}

/**
 * A bus departure as published on an obilet / biletall route landing page. These pages list the
 * cheapest upcoming departures with clock times only, so there is no calendar date and no ISO
 * timestamp; `date` is therefore always null and the UI must not invent one.
 */
export interface SourceBusTrip {
  source: SourceId;
  kind: 'bus';
  /** 12-hex stable id (source, company, departure time, price). */
  id: string;
  company: string;
  companyLogoUrl: string | null;
  fromCity: string;
  fromStop: string | null;
  toCity: string;
  toStop: string | null;
  /** HH:MM as printed on the page. */
  departureTime: string;
  arrivalTime: string;
  /** Derived from the two clocks; crosses midnight when arrival < departure. Null when a clock is malformed. */
  durationMinutes: number | null;
  price: number;
  currency: 'TRY';
  /** "2+1" or "2+2" seat layout as printed; null when the page does not state it. This is layout, not availability. */
  seatLayout: string | null;
  /** YYYY-MM-DD when the page publishes a calendar date for the departure (enuygun does); null for clock-only pages (obilet, biletall). */
  date: string | null;
  /** The landing page the trip was read from (for attribution links). */
  sourceUrl: string;
}

/**
 * A flight as published on an obilet route landing page: the cheapest upcoming fares with clock times
 * only (no calendar date, so `date` is null). Airports carry IATA codes; the airline carries its code.
 */
export interface SourceFlight {
  source: SourceId;
  kind: 'flight';
  id: string;
  airline: string;
  airlineCode: string | null;
  fromCode: string | null;
  fromName: string;
  toCode: string | null;
  toName: string;
  /** HH:MM as printed. */
  departureTime: string;
  arrivalTime: string;
  /** From the page's duration label ("1sa 0dk") when present, else the clock difference; null when neither parses. */
  durationMinutes: number | null;
  price: number;
  currency: 'TRY';
  /** YYYY-MM-DD when the page publishes the departure date (enuygun); null for clock-only pages (obilet). */
  date: string | null;
  sourceUrl: string;
}

/**
 * A hotel as listed on an obilet city landing page (`/otel/{city}-otelleri`). The page publishes
 * identity, star class, guest rating and amenities but no price (prices depend on dates), so there is
 * no price field at all here.
 */
export interface SourceHotel {
  source: SourceId;
  kind: 'hotel';
  id: string;
  name: string;
  url: string;
  image: string | null;
  /** Official star class 1..7; null when the page states 0 or nothing. */
  stars: number | null;
  /** Guest score on a 0..ratingBest scale; null when the page has no aggregate rating. */
  rating: number | null;
  ratingBest: number;
  reviewCount: number | null;
  /** addressLocality, e.g. "Antalya". */
  city: string | null;
  /** streetAddress as printed, e.g. "Kundu, Antalya". */
  street: string | null;
  latitude: number | null;
  longitude: number | null;
  /** First 300 characters of the page description, or null. */
  description: string | null;
  /** amenityFeature names whose value is true, in page order. */
  amenities: string[];
  sourceUrl: string;
}

/**
 * Route-level facts from a page that publishes no timetable (flixbus.com.tr route pages): the lowest price of an
 * aggregate offer, the typical duration, the first and last planned departure clocks and the stops at both ends.
 * `hasTimetable` is always false so the UI never presents these facts as departures.
 */
export interface SourceRouteFacts {
  source: SourceId;
  kind: 'route';
  id: string;
  fromCity: string;
  toCity: string;
  /** AggregateOffer.lowPrice in TRY ("fiyatlar ... TL'den başlar"); null when absent or not TRY. */
  lowPrice: number | null;
  currency: 'TRY';
  offerCount: number | null;
  /** Typical duration stated in the FAQ ("yaklaşık 6 saat 45 dakika"); null when not stated. */
  durationMinutes: number | null;
  distanceKm: number | null;
  /** First and last planned departure clocks stated in the FAQ; null when not stated. */
  firstDeparture: string | null;
  lastDeparture: string | null;
  departureStops: string[];
  arrivalStops: string[];
  operatorName: string | null;
  operatorLogoUrl: string | null;
  /** Always false: no departures are published, so nothing here is a timetable. */
  hasTimetable: false;
  sourceUrl: string;
}

export type SourceKind = 'bus' | 'flight' | 'hotel';

export interface SourceQuery {
  kind: SourceKind;
  from?: string;
  to?: string;
  city?: string;
}

export type SourceOffer = SourceBusTrip | SourceFlight | SourceHotel | SourceRouteFacts;

/** One source answered: its parsed items plus attribution. `items` may be empty (then a warning says so). */
export interface SourceSuccess {
  success: true;
  source: SourceId;
  kind: SourceKind;
  /** e.g. `obilet:bus:istanbul-ankara` */
  routeKey: string;
  sourceUrl: string;
  fetchedVia: 'direct' | 'cache';
  /** ISO timestamp of the upstream fetch (preserved on cache hits). */
  scrapedAt: string;
  latencyMs: number;
  items: SourceOffer[];
  /** Lowest price among priced items; null for hotels (no prices) or empty lists. */
  minPrice: number | null;
  warnings: string[];
}

/** One source failed, with its own error code (blocked, robots_disallowed, route_not_found, ...). */
export interface SourceFailure {
  success: false;
  source: SourceId;
  errorCode: string;
  error: string;
  retryAfterSeconds?: number;
}

export type SourceResult = SourceSuccess | SourceFailure;

/** Answer of `GET /api/search`: every requested source reports separately; nothing is merged without attribution. */
export interface SearchEnvelope {
  success: true;
  kind: SourceKind;
  query: { from?: string; to?: string; city?: string };
  requested: SourceId[];
  results: SourceResult[];
  /** Per successful source: its minPrice (null when the source publishes no prices). */
  cheapestBySource: Record<string, number | null>;
  generatedAt: string;
}
