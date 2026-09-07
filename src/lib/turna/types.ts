/**
 * Shared contract between the `/api/turna` handler and the browser (client, guard, adapter, UI).
 * Verbatim copy of nexora-panel/lib/turna/types.ts, which mirrors the Python package
 * `turna/models.py` field-for-field (camelCase here). Browser-safe: no Node imports.
 */

export type TurnaKind = 'flight' | 'bus' | 'hotel' | 'ferry' | 'car';

export const TURNA_KINDS: readonly TurnaKind[] = ['flight', 'bus', 'hotel', 'ferry', 'car'];

export interface TurnaQuery {
  kind: TurnaKind;
  /** Origin city slug or name (flight/bus/ferry). */
  from?: string;
  /** Destination city slug or name (flight/bus/ferry). */
  to?: string;
  /** City slug or name (hotel/car). */
  city?: string;
  /** Skip the short-lived HTML cache and hit turna.com again. */
  refresh?: boolean;
}

export interface FlightOffer {
  kind: 'flight';
  /** Publisher of this offer. Turna landing pages always report 'turna'; other sites use their own types in src/lib/sources. */
  source: 'turna';
  id: string;
  airline: string;
  airlineCode: string | null;
  /** https://cdn.turna.com/Images/Flight/Airlines/{IATA}.png (derived; null without an IATA code). */
  logoUrl: string | null;
  fromName: string;
  fromCode: string | null;
  toName: string;
  toCode: string | null;
  /** ISO-8601 with offset, e.g. 2026-09-24T09:50:00+03:00 */
  departureAt: string;
  arrivalAt: string;
  /** YYYY-MM-DD (local departure date) */
  date: string;
  durationMinutes: number | null;
  durationLabel: string;
  price: number;
  currency: 'TRY';
  /** null = the source does not say (turna landing pages list cheapest fares without stop info) */
  isDirect: boolean | null;
}

export interface BusOffer {
  kind: 'bus';
  /** Publisher of this offer. Turna landing pages always report 'turna'; other sites use their own types in src/lib/sources. */
  source: 'turna';
  id: string;
  company: string;
  companyUrl: string | null;
  /** ASCII slug of the company (last segment of companyUrl, Turkish-folded), e.g. `adiyaman-anka-turizm`. */
  companySlug: string | null;
  /** https://cdn.turna.com/Images/Bus/BusCompanies/{slug}.png (derived; the CDN may answer 403/404 for some firms). */
  logoUrl: string | null;
  fromStop: string;
  fromCity: string;
  toStop: string;
  toCity: string;
  departureAt: string;
  arrivalAt: string;
  date: string;
  durationMinutes: number | null;
  durationLabel: string;
  price: number;
  currency: 'TRY';
}

export interface HotelOffer {
  kind: 'hotel';
  /** Publisher of this offer. Turna landing pages always report 'turna'; other sites use their own types in src/lib/sources. */
  source: 'turna';
  id: string;
  name: string;
  url: string;
  /** turna.com hotel slug (`/otel/{slug}`). */
  slug: string | null;
  image: string | null;
  images: string[];
  /** Free-text location as printed on the page, e.g. "Antalya Merkez, Muratpaşa, Antalya". */
  locality: string;
  district: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  /** Guest score on a 0..ratingBest scale. */
  rating: number | null;
  ratingBest: number;
  /** e.g. "Harika", "Çok İyi" */
  ratingText: string | null;
  reviewCount: number | null;
  /** Official star class; null when the page says 0 / does not state it. */
  stars: number | null;
  amenities: string[];
  tags: string[];
  breakfast: string | null;
  /** turna.com internal hotel id. */
  turnaId: number | null;
}

export type CarVehicleClass = 'economy' | 'standard' | 'fullsize' | 'premium' | 'luxury' | 'other';
export type CarFuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'lpg' | 'other';
export type CarTransmission = 'auto' | 'manual' | 'other';

export interface CarOffer {
  kind: 'car';
  /** Publisher of this offer. Turna landing pages always report 'turna'; other sites use their own types in src/lib/sources. */
  source: 'turna';
  id: string;
  brand: string;
  model: string;
  vehicleClass: CarVehicleClass;
  /** Source enum, e.g. "VehicleClassEconomy", "VehicleClassLuxuryElite". */
  vehicleClassRaw: string;
  fuelType: CarFuelType;
  /** Source enum, e.g. "FuelTypeGasoline". */
  fuelTypeRaw: string;
  transmission: CarTransmission;
  /** Daily km allowance; null when the page says 0 / unlimited / not stated. */
  mileageLimitKm: number | null;
  imageUrl: string | null;
  company: string;
  companySlug: string | null;
  companyLogoUrl: string | null;
  dailyPrice: number;
  currency: 'TRY';
}

export type TurnaOffer = FlightOffer | BusOffer | HotelOffer | CarOffer;

/** Market facts distilled from the page's FAQ block (numbers parsed from Turkish prose). */
export interface RouteFacts {
  carriersCount: number | null;
  popularCarriers: string[];
  cheapestWeekday: string | null;
  tripsPerWeek: number | null;
  tripsPerDay: number | null;
  departureHubs: string[];
  arrivalHubs: string[];
  shortestDurationMinutes: number | null;
  shortestDurationLabel: string | null;
  faq: Array<{ question: string; answer: string }>;
}

export interface CompanyStat {
  name: string;
  count: number;
  minPrice: number;
  avgPrice: number;
}

export interface DayStat {
  /** YYYY-MM-DD */
  date: string;
  minPrice: number;
  count: number;
}

export interface PriceStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  byCompany: CompanyStat[];
  /** Empty for kinds without a travel date (car rentals). */
  byDay: DayStat[];
}

export interface HistoryPoint {
  /** ISO timestamp of the observation */
  observedAt: string;
  minPrice: number | null;
  avgPrice: number | null;
  count: number;
}

export interface PriceDelta {
  previousObservedAt: string;
  previousMin: number;
  currentMin: number;
  change: number;
  changePct: number;
}

export type FetchedVia = 'crw-stealth' | 'crw-js' | 'direct' | 'cache';

export interface TurnaSuccess {
  success: true;
  kind: TurnaKind;
  query: TurnaQuery;
  /** Stable key such as `flight:istanbul-ankara`, `hotel:antalya` or `car:istanbul`; used for history. */
  routeKey: string;
  sourceUrl: string;
  pageTitle: string | null;
  fetchedVia: FetchedVia;
  latencyMs: number;
  scrapedAt: string;
  items: TurnaOffer[];
  facts: RouteFacts;
  /** Null for kinds without prices (hotel, ferry); present for flight, bus and car (daily price). */
  stats: PriceStats | null;
  /** Oldest to newest, capped at 60 observations. */
  history: HistoryPoint[];
  delta: PriceDelta | null;
  warnings: string[];
}

export interface TurnaFailure {
  success: false;
  error: string;
  errorCode: string;
}

export type TurnaResponse = TurnaSuccess | TurnaFailure;

export interface TurnaPreset {
  label: string;
  kind: TurnaKind;
  from?: string;
  to?: string;
  city?: string;
}

/** Popular routes shown as one-click presets in the UI. Slugs match turna.com URL segments. */
export const TURNA_PRESETS: TurnaPreset[] = [
  { label: 'İstanbul → Ankara', kind: 'flight', from: 'istanbul', to: 'ankara' },
  { label: 'İstanbul → İzmir', kind: 'flight', from: 'istanbul', to: 'izmir' },
  { label: 'İstanbul → Antalya', kind: 'flight', from: 'istanbul', to: 'antalya' },
  { label: 'İstanbul → Bodrum', kind: 'flight', from: 'istanbul', to: 'bodrum' },
  { label: 'İstanbul → Trabzon', kind: 'flight', from: 'istanbul', to: 'trabzon' },
  { label: 'Ankara → İzmir', kind: 'flight', from: 'ankara', to: 'izmir' },
  { label: 'İstanbul → Ankara', kind: 'bus', from: 'istanbul', to: 'ankara' },
  { label: 'İstanbul → İzmir', kind: 'bus', from: 'istanbul', to: 'izmir' },
  { label: 'İstanbul → Bursa', kind: 'bus', from: 'istanbul', to: 'bursa' },
  { label: 'Ankara → İzmir', kind: 'bus', from: 'ankara', to: 'izmir' },
  { label: 'Antalya', kind: 'hotel', city: 'antalya' },
  { label: 'Bodrum', kind: 'hotel', city: 'bodrum' },
  { label: 'İstanbul', kind: 'hotel', city: 'istanbul' },
  { label: 'Çeşme', kind: 'hotel', city: 'cesme' },
  { label: 'Yalova → Yenikapı', kind: 'ferry', from: 'yalova', to: 'yenikapi' },
  { label: 'Pendik → Yalova', kind: 'ferry', from: 'pendik', to: 'yalova' },
  { label: 'İstanbul', kind: 'car', city: 'istanbul' },
  { label: 'Ankara', kind: 'car', city: 'ankara' },
  { label: 'İzmir', kind: 'car', city: 'izmir' },
  { label: 'Antalya', kind: 'car', city: 'antalya' },
];
