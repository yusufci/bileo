/**
 * TurnaOffer -> RouteItem adapter plus the SearchKind <-> TurnaKind maps. Pure and browser-safe.
 *
 * Rule: nothing Turna does not publish is invented. vehicleType, availableSeats, rating,
 * reviewCount, features, originalPrice, badge and gateOrPlatform stay undefined; the UI renders
 * their absence. The only enrichment is a deterministic airport-name lookup in the curated
 * TURKEY_81_PROVINCES dataset, and it is applied only when the code is unambiguous: Turna's
 * landing pages publish CITY-level codes ("İstanbul (IST)", "Ankara (ANK)", "İzmir (IZM)"), so a
 * code that belongs to a province with more than one airport (IST/SAW for İstanbul) is never
 * resolved to a specific airport. Such legs keep Turna's own text.
 *
 * Hotel and car offers are not routes: `toRouteItems` leaves them out (counted in `nonRouteItems`,
 * never in `dropped`) and their result screens read `result.items` directly, narrowing on `kind`.
 */
import type { RouteItem, RouteProvenance, SearchKind, TransportType } from '../../types';
import type { BusOffer, FlightOffer, TurnaKind, TurnaSuccess } from './types';
import { TURKEY_81_PROVINCES } from '../../data/turkeyProvinces';
import { ISO_DATE_RE, ISO_DATETIME_RE, bileoDuration, formatTrDate, isoClockHHMM, stripParenCode } from './format';

const KIND_BY_TRANSPORT: Record<TransportType, TurnaKind | null> = {
  otobus: 'bus',
  ucak: 'flight',
  feribot: 'ferry',
  tren: null,
};

const TRANSPORT_BY_KIND: Record<TurnaKind, TransportType | null> = {
  bus: 'otobus',
  flight: 'ucak',
  ferry: 'feribot',
  hotel: null,
  car: null,
};

/** Every search tab the UI can be in: the four transport modes plus Otel and Araç. */
export const SEARCH_KINDS: readonly SearchKind[] = ['otobus', 'ucak', 'tren', 'feribot', 'otel', 'arac'];

const TURNA_KIND_BY_SEARCH_KIND: Record<SearchKind, TurnaKind | null> = {
  otobus: 'bus',
  ucak: 'flight',
  feribot: 'ferry',
  tren: null,
  otel: 'hotel',
  arac: 'car',
};

const SEARCH_KIND_BY_TURNA_KIND: Record<TurnaKind, SearchKind> = {
  bus: 'otobus',
  flight: 'ucak',
  ferry: 'feribot',
  hotel: 'otel',
  car: 'arac',
};

const KIND_LABEL_TR: Record<TurnaKind, string> = {
  flight: 'Uçak',
  bus: 'Otobüs',
  ferry: 'Feribot',
  hotel: 'Otel',
  car: 'Araç',
};

/** otobus -> bus, ucak -> flight, feribot -> ferry, tren -> null (Turna has no train product). */
export function transportTypeToKind(transportType: TransportType): TurnaKind | null {
  return KIND_BY_TRANSPORT[transportType] ?? null;
}

/** Inverse of transportTypeToKind; hotel and car -> null (not transport modes). */
export function kindToTransportType(kind: TurnaKind): TransportType | null {
  return TRANSPORT_BY_KIND[kind] ?? null;
}

export function isSearchKind(value: unknown): value is SearchKind {
  return typeof value === 'string' && (SEARCH_KINDS as readonly string[]).includes(value);
}

/** otobus -> bus, ucak -> flight, feribot -> ferry, tren -> null, otel -> hotel, arac -> car. */
export function searchKindToTurnaKind(kind: SearchKind): TurnaKind | null {
  return TURNA_KIND_BY_SEARCH_KIND[kind] ?? null;
}

/** bus -> otobus, flight -> ucak, ferry -> feribot, hotel -> otel, car -> arac. */
export function turnaKindToSearchKind(kind: TurnaKind): SearchKind {
  return SEARCH_KIND_BY_TURNA_KIND[kind];
}

/** Turkish label of a Turna kind: Uçak, Otobüs, Feribot, Otel, Araç. */
export function turnaKindLabelTr(kind: TurnaKind): string {
  return KIND_LABEL_TR[kind];
}

export interface RouteContext {
  /** Display names typed or selected by the user; used only when Turna's own text is empty. */
  fromCity: string;
  toCity: string;
}

interface AirportEntry {
  name: string;
  /** Number of airports listed for the province that owns this code. */
  provinceAirportCount: number;
}

let airportIndex: Map<string, AirportEntry> | null = null;

/** IATA code -> airport entry from the dataset. First match wins for duplicated codes (COV/OGU/RZV). */
function getAirportIndex(): Map<string, AirportEntry> {
  if (airportIndex) return airportIndex;
  const index = new Map<string, AirportEntry>();
  for (const province of TURKEY_81_PROVINCES) {
    const airports = province.airports ?? [];
    for (const airport of airports) {
      const code = airport.code.trim().toUpperCase();
      if (code && !index.has(code)) index.set(code, { name: airport.name, provinceAirportCount: airports.length });
    }
  }
  airportIndex = index;
  return index;
}

export function airportNameByCode(code: string | null | undefined): string | undefined {
  if (!code) return undefined;
  return getAirportIndex().get(code.trim().toUpperCase())?.name;
}

/**
 * True when a code can only mean one airport: it is in the dataset AND its province lists a
 * single airport. Turna uses city codes (IST covers both İstanbul airports), so multi-airport
 * provinces are never resolved; ESB (Ankara) or ADB (İzmir) are safe because there is nothing
 * else the code could denote.
 */
export function isUnambiguousAirportCode(code: string | null | undefined): boolean {
  if (!code) return false;
  const entry = getAirportIndex().get(code.trim().toUpperCase());
  return entry !== undefined && entry.provinceAirportCount === 1;
}

/**
 * Terminal label for a flight leg: the dataset airport name only when the code is unambiguous
 * (the code is appended unless the dataset name already carries a parenthesis), otherwise
 * Turna's own text such as "İstanbul (IST)", and the bare code as a last resort.
 */
export function airportTerminalLabel(turnaName: string, code: string | null): string {
  const known = airportNameByCode(code);
  if (known && code && isUnambiguousAirportCode(code)) {
    return known.includes('(') ? known : `${known} (${code.trim().toUpperCase()})`;
  }
  const text = turnaName.trim();
  if (text) return text;
  return code ? code.trim().toUpperCase() : '';
}

function isUsableOffer(offer: FlightOffer | BusOffer): boolean {
  return (
    typeof offer.price === 'number' &&
    Number.isFinite(offer.price) &&
    offer.price > 0 &&
    typeof offer.departureAt === 'string' &&
    ISO_DATETIME_RE.test(offer.departureAt) &&
    typeof offer.date === 'string' &&
    ISO_DATE_RE.test(offer.date)
  );
}

function provenanceFor(result: TurnaSuccess, offer: FlightOffer | BusOffer): RouteProvenance {
  const provenance: RouteProvenance = {
    source: 'turna',
    kind: offer.kind,
    offerId: offer.id,
    routeKey: result.routeKey,
    sourceUrl: result.sourceUrl,
    scrapedAt: result.scrapedAt,
    fetchedVia: result.fetchedVia === 'cache' ? 'cache' : 'direct',
    dateIso: offer.date,
    departureAt: offer.departureAt,
    arrivalAt: offer.arrivalAt,
    durationMinutes: offer.durationMinutes,
    isDirect: offer.kind === 'flight' ? offer.isDirect : null,
    currency: 'TRY',
    sampling: 'cheapest-upcoming',
  };
  if (offer.kind === 'flight') provenance.airlineCode = offer.airlineCode;
  if (offer.kind === 'bus') provenance.companyUrl = offer.companyUrl;
  // Phase 2 fields, copied only when the offer carries them (a Phase 1 edge-cached body has neither):
  // the derived CDN logo may 403/404 for some firms, so the UI keeps an onError text fallback.
  if ('logoUrl' in offer) provenance.logoUrl = offer.logoUrl;
  if (offer.kind === 'bus' && 'companySlug' in offer) provenance.companySlug = offer.companySlug;
  return provenance;
}

function durationLabel(offer: FlightOffer | BusOffer): string {
  return offer.durationMinutes != null ? bileoDuration(offer.durationMinutes) : offer.durationLabel || '';
}

export function flightToRouteItem(offer: FlightOffer, result: TurnaSuccess, ctx: RouteContext): RouteItem {
  const item: RouteItem = {
    id: `turna-flight-${offer.id}`,
    from: stripParenCode(offer.fromName) || ctx.fromCity,
    fromTerminal: airportTerminalLabel(offer.fromName, offer.fromCode),
    to: stripParenCode(offer.toName) || ctx.toCity,
    toTerminal: airportTerminalLabel(offer.toName, offer.toCode),
    departureTime: isoClockHHMM(offer.departureAt),
    arrivalTime: isoClockHHMM(offer.arrivalAt),
    duration: durationLabel(offer),
    date: formatTrDate(offer.date),
    price: offer.price,
    company: offer.airline,
    transportType: 'ucak',
    seatLayoutType: 'plane_3_3',
    provenance: provenanceFor(result, offer),
  };
  if (offer.durationMinutes != null) item.durationMinutes = offer.durationMinutes;
  return item;
}

export function busToRouteItem(offer: BusOffer, result: TurnaSuccess, ctx: RouteContext): RouteItem {
  const item: RouteItem = {
    id: `turna-bus-${offer.id}`,
    from: offer.fromCity || ctx.fromCity,
    fromTerminal: offer.fromStop,
    to: offer.toCity || ctx.toCity,
    toTerminal: offer.toStop,
    departureTime: isoClockHHMM(offer.departureAt),
    arrivalTime: isoClockHHMM(offer.arrivalAt),
    duration: durationLabel(offer),
    date: formatTrDate(offer.date),
    price: offer.price,
    company: offer.company,
    transportType: 'otobus',
    seatLayoutType: 'bus_2_1',
    provenance: provenanceFor(result, offer),
  };
  if (offer.durationMinutes != null) item.durationMinutes = offer.durationMinutes;
  return item;
}

export interface RouteAdaptation {
  routes: RouteItem[];
  /** Flight/bus offers that failed the structural checks (never patched). */
  dropped: number;
  /** Valid hotel/car offers, which are not routes; their own result screens read `result.items`. */
  nonRouteItems: number;
}

/**
 * Adapt every priced flight/bus offer of a TurnaSuccess into RouteItem rows.
 * Hotel and car offers are not routes: they are skipped and counted in `nonRouteItems`, never in
 * `dropped`. Offers failing the structural checks are dropped and counted, never patched.
 */
export function toRouteItems(result: TurnaSuccess, ctx: RouteContext): RouteAdaptation {
  const routes: RouteItem[] = [];
  let dropped = 0;
  let nonRouteItems = 0;
  for (const offer of result.items) {
    if (offer.kind === 'flight') {
      if (!isUsableOffer(offer)) {
        dropped += 1;
        continue;
      }
      routes.push(flightToRouteItem(offer, result, ctx));
    } else if (offer.kind === 'bus') {
      if (!isUsableOffer(offer)) {
        dropped += 1;
        continue;
      }
      routes.push(busToRouteItem(offer, result, ctx));
    } else {
      nonRouteItems += 1;
    }
  }
  return { routes, dropped, nonRouteItems };
}
