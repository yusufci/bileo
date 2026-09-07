/**
 * SERVER ONLY. enuygun.com bus, flight and hotel landing pages (trailing slash). Bus route pages publish
 * their upcoming departures as JSON-LD `BusTrip` objects with full ISO date-times, stop names, the operator
 * and a TRY price, plus a `Product` block naming the route. Only the page HTML is read here; the fetch layer
 * (host timeouts, robots.txt, allowlist) lives in registry.ts / fetch.ts.
 */
import type { SourceBusTrip, SourceFlight, SourceHotel } from '../../lib/sources/types';
import { SOURCE_ORIGINS } from '../../lib/sources/types';
import { slugifyTr } from '../../lib/turna/urls';
import { decodeEntities, stableId } from '../turna/parse';
import { clockDiffMinutes, parseTrPrice } from './microdata';
import { jsonLdObjects } from './obilet';

export const ENUYGUN_BUS_PATH = 'otobus-bileti';
export const ENUYGUN_FLIGHT_PATH = 'ucak-bileti';
export const ENUYGUN_HOTEL_PATH = 'otel/bolge';

/** `https://www.enuygun.com/otobus-bileti/istanbul-ankara/` (the trailing slash is part of the canonical URL). */
export function enuygunBusLandingUrl(from: string, to: string): string {
  return `${SOURCE_ORIGINS.enuygun}/${ENUYGUN_BUS_PATH}/${slugifyTr(from)}-${slugifyTr(to)}/`;
}

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? decodeEntities(value).trim() : null;
}

const ISO_LOCAL = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

/** "2026-09-08T11:29:00" -> { date: '2026-09-08', clock: '11:29' }; null for anything else. */
export function splitIsoLocal(value: string | null): { date: string; clock: string } | null {
  if (!value) return null;
  const m = ISO_LOCAL.exec(value.trim());
  return m ? { date: m[1], clock: m[2] } : null;
}

/** Minutes between two ISO local timestamps (may span days); falls back to the clocks; null when unparseable. */
export function isoDiffMinutes(departure: string | null, arrival: string | null): number | null {
  const a = splitIsoLocal(departure);
  const b = splitIsoLocal(arrival);
  if (!a || !b) return null;
  const da = Date.parse(`${a.date}T${a.clock}:00Z`);
  const db = Date.parse(`${b.date}T${b.clock}:00Z`);
  if (Number.isNaN(da) || Number.isNaN(db)) return clockDiffMinutes(a.clock, b.clock);
  const diff = Math.round((db - da) / 60_000);
  return diff >= 0 ? diff : clockDiffMinutes(a.clock, b.clock);
}

/** City names from the `Product.name` ("İstanbul - Ankara Otobüs Bileti"), else from the URL slug. */
export function routeCities(html: string, sourceUrl: string): { fromCity: string; toCity: string } {
  for (const product of jsonLdObjects(html, 'Product')) {
    const name = str(product.name);
    const m = name ? /^(.+?)\s+-\s+(.+?)\s+Otobüs Bileti$/i.exec(name) : null;
    if (m) return { fromCity: m[1].trim(), toCity: m[2].trim() };
  }
  const slug = /\/otobus-bileti\/([a-z0-9-]+)\/?$/i.exec(sourceUrl)?.[1] ?? '';
  const parts = slug.split('-');
  if (parts.length >= 2) {
    const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
    return { fromCity: cap(parts[0]), toCity: cap(parts.slice(1).join('-')) };
  }
  return { fromCity: '', toCity: '' };
}

/** All `BusTrip` objects of an enuygun route page; items without operator, ISO clocks or a positive TRY price are skipped. */
export function parseEnuygunBusTrips(html: string, sourceUrl: string): SourceBusTrip[] {
  const { fromCity, toCity } = routeCities(html, sourceUrl);
  const trips: SourceBusTrip[] = [];
  for (const t of jsonLdObjects(html, 'BusTrip')) {
    const provider = isObject(t.provider) ? t.provider : {};
    const company = str(provider.name);
    const dep = splitIsoLocal(str(t.departureTime));
    const arr = splitIsoLocal(str(t.arrivalTime));
    const offers = isObject(t.offers) ? t.offers : Array.isArray(t.offers) ? t.offers.find(isObject) : undefined;
    const priceRaw = offers ? offers.price : undefined;
    const price = typeof priceRaw === 'number' ? (Number.isFinite(priceRaw) && priceRaw > 0 ? Math.round(priceRaw * 100) / 100 : null) : parseTrPrice(str(priceRaw));
    const currency = offers ? str(offers.priceCurrency) : null;
    if (!company || !dep || !arr || price === null) continue;
    if (currency && currency.toUpperCase() !== 'TRY' && currency.toUpperCase() !== 'TL') continue;
    const fromStop = isObject(t.departureBusStop) ? str(t.departureBusStop.name) : null;
    const toStop = isObject(t.arrivalBusStop) ? str(t.arrivalBusStop.name) : null;
    trips.push({
      source: 'enuygun',
      kind: 'bus',
      id: stableId('enuygun', 'bus', company, fromCity, toCity, dep.date, dep.clock, price),
      company,
      companyLogoUrl: null,
      fromCity,
      fromStop,
      toCity,
      toStop,
      departureTime: dep.clock,
      arrivalTime: arr.clock,
      durationMinutes: isoDiffMinutes(str(t.departureTime), str(t.arrivalTime)),
      price,
      currency: 'TRY',
      seatLayout: null,
      date: dep.date,
      sourceUrl,
    });
  }
  return trips;
}

/**
 * enuygun's own city codes, read from the route links on its homepage (2026-09-07). Only these cities can be
 * queried; anything else is refused instead of guessed, because a wrong code answers a different city.
 */
export const ENUYGUN_FLIGHT_CITY_CODES: Readonly<Record<string, string>> = {
  istanbul: 'ista',
  ankara: 'anka',
  izmir: 'izma',
  antalya: 'ayta',
  adana: 'adaa',
  diyarbakir: 'diya',
  gaziantep: 'gzta',
  hatay: 'htya',
  trabzon: 'tzxa',
  kayseri: 'asra',
  malatya: 'mlxa',
  sivas: 'vasa',
  van: 'vana',
};

/** `https://www.enuygun.com/ucak-bileti/istanbul-ankara-ista-anka/`; null when either city has no known code. */
export function enuygunFlightLandingUrl(from: string, to: string): string | null {
  const a = slugifyTr(from);
  const b = slugifyTr(to);
  const codeA = ENUYGUN_FLIGHT_CITY_CODES[a];
  const codeB = ENUYGUN_FLIGHT_CITY_CODES[b];
  if (!codeA || !codeB || a === b) return null;
  return `${SOURCE_ORIGINS.enuygun}/${ENUYGUN_FLIGHT_PATH}/${a}-${b}-${codeA}-${codeB}/`;
}

/** ISO 8601 duration ("PT1H", "PT1H30M", "PT45M") -> minutes; null for anything else or zero. */
export function parseIsoDuration(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(value.trim());
  if (!m) return null;
  const total = Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) + Math.round(Number(m[4] ?? 0) / 60);
  return total > 0 ? total : null;
}

function addMinutesToClock(clock: string, minutes: number): string {
  const [h, mm] = clock.split(':').map(Number);
  const total = (h * 60 + mm + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * All `Flight` objects of an enuygun flight route page. The page publishes the departure (ISO, +03:00) and the
 * duration; the arrival clock is departure plus duration when the page does not print one. Items without an
 * airline, departure, airports or a positive TRY price are skipped.
 */
export function parseEnuygunFlights(html: string, sourceUrl: string): SourceFlight[] {
  const flights: SourceFlight[] = [];
  for (const f of jsonLdObjects(html, 'Flight')) {
    const provider = isObject(f.provider) ? f.provider : {};
    const dep = isObject(f.departureAirport) ? f.departureAirport : {};
    const arr = isObject(f.arrivalAirport) ? f.arrivalAirport : {};
    const offers = Array.isArray(f.offers) ? f.offers.find(isObject) : isObject(f.offers) ? f.offers : undefined;
    const priceRaw = offers ? offers.price : undefined;
    const price = typeof priceRaw === 'number' ? (Number.isFinite(priceRaw) && priceRaw > 0 ? Math.round(priceRaw * 100) / 100 : null) : parseTrPrice(str(priceRaw));
    const currency = offers ? str(offers.priceCurrency) : null;
    const airline = str(provider.name);
    const departure = splitIsoLocal(str(f.departureTime));
    const fromName = str(dep.name);
    const toName = str(arr.name);
    if (!airline || !departure || !fromName || !toName || price === null) continue;
    if (currency && currency.toUpperCase() !== 'TRY' && currency.toUpperCase() !== 'TL') continue;
    const duration = parseIsoDuration(str(f.estimatedFlightDuration));
    const printedArrival = splitIsoLocal(str(f.arrivalTime));
    const arrivalClock = printedArrival?.clock ?? (duration !== null ? addMinutesToClock(departure.clock, duration) : null);
    if (!arrivalClock) continue;
    const airlineCode = str(provider.iataCode);
    const fromCode = str(dep.iataCode);
    const toCode = str(arr.iataCode);
    flights.push({
      source: 'enuygun',
      kind: 'flight',
      id: stableId('enuygun', 'flight', airline, fromCode ?? fromName, toCode ?? toName, departure.date, departure.clock, price),
      airline,
      airlineCode: airlineCode ? airlineCode.toUpperCase() : null,
      fromCode: fromCode ? fromCode.toUpperCase() : null,
      fromName,
      toCode: toCode ? toCode.toUpperCase() : null,
      toName,
      departureTime: departure.clock,
      arrivalTime: arrivalClock,
      durationMinutes: duration ?? (printedArrival ? isoDiffMinutes(str(f.departureTime), str(f.arrivalTime)) : null),
      price,
      currency: 'TRY',
      date: departure.date,
      sourceUrl,
    });
  }
  return flights;
}

/**
 * enuygun's own hotel region ids, read from its hotel landing links (2026-09-07). The id is part of the URL
 * (`/otel/bolge/antalya-481/`), so only these regions can be queried; other cities are refused, not guessed.
 */
export const ENUYGUN_HOTEL_REGION_IDS: Readonly<Record<string, string>> = {
  antalya: '481',
  istanbul: '1639',
  izmir: '1665',
  ankara: '386',
  bodrum: '745',
  alanya: '4671',
  cesme: '4275',
  kusadasi: '4227',
  marmaris: '4302',
  ayvalik: '4498',
  didim: '6069857',
  eskisehir: '7119',
  fethiye: '6341134',
  kapadokya: '6054888',
  kibris: '45',
  londra: '2114',
  'mersin-province': '553248635458625001',
  paris: '2734',
  roma: '3023',
  sapanca: '6049293',
};

/** Query slugs whose enuygun region slug differs; only certain equivalents, no guesses. */
const ENUYGUN_HOTEL_REGION_ALIASES: Readonly<Record<string, string>> = { mersin: 'mersin-province' };

/** `https://www.enuygun.com/otel/bolge/antalya-481/`; null when the city is not in the region table. */
export function enuygunHotelLandingUrl(city: string): string | null {
  const slug = slugifyTr(city);
  const regionSlug = ENUYGUN_HOTEL_REGION_ALIASES[slug] ?? slug;
  const id = ENUYGUN_HOTEL_REGION_IDS[regionSlug];
  return id ? `${SOURCE_ORIGINS.enuygun}/${ENUYGUN_HOTEL_PATH}/${regionSlug}-${id}/` : null;
}

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  ccedil: 'ç',
  Ccedil: 'Ç',
  ouml: 'ö',
  Ouml: 'Ö',
  uuml: 'ü',
  Uuml: 'Ü',
  scedil: 'ş',
  Scedil: 'Ş',
  inodot: 'ı',
  Idot: 'İ',
  gbreve: 'ğ',
  Gbreve: 'Ğ',
  acirc: 'â',
  Acirc: 'Â',
  icirc: 'î',
  Icirc: 'Î',
  ucirc: 'û',
  Ucirc: 'Û',
};

/** enuygun descriptions carry HTML named entities for Turkish letters (`i&ccedil;in`); known names are decoded, unknown ones stay as printed. */
export function decodeTrEntities(text: string): string {
  return decodeEntities(text).replace(/&([A-Za-z]+);/g, (whole, name: string) => NAMED_ENTITIES[name] ?? whole);
}

function num(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.trim().replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * All `Hotel` objects of an enuygun region page (a JSON-LD `ItemList` of 20). The page publishes name, detail URL,
 * image, district (`addressLocality`), city (`addressRegion`), a 0..10 guest score with its review count and a
 * description. It publishes neither a star class nor a price, so `stars` stays null and no price is invented.
 * Only items linking to enuygun's own detail pages are attributed to enuygun.
 */
export function parseEnuygunHotels(html: string, sourceUrl: string): SourceHotel[] {
  const hotels: SourceHotel[] = [];
  const seen = new Set<string>();
  for (const h of jsonLdObjects(html, 'Hotel')) {
    const name = str(h.name);
    const url = str(h.url);
    if (!name || !url || !url.startsWith(`${SOURCE_ORIGINS.enuygun}/`) || seen.has(url)) continue;
    seen.add(url);
    const address = isObject(h.address) ? h.address : {};
    const district = str(address.addressLocality);
    const region = str(address.addressRegion);
    const agg = isObject(h.aggregateRating) ? h.aggregateRating : {};
    const rating = num(agg.ratingValue);
    const best = num(agg.bestRating);
    const reviews = num(agg.reviewCount);
    const description = typeof h.description === 'string' ? decodeTrEntities(h.description).replace(/\s+/g, ' ').trim() : '';
    const image = str(h.image) ?? (Array.isArray(h.image) ? str(h.image[0]) : null);
    hotels.push({
      source: 'enuygun',
      kind: 'hotel',
      id: stableId('enuygun', 'hotel', url),
      name,
      url,
      image: image && /^https?:\/\//.test(image) ? image : null,
      stars: null,
      rating: rating !== null && rating > 0 ? Math.round(rating * 10) / 10 : null,
      ratingBest: best !== null && best > 0 ? best : 10,
      reviewCount: reviews !== null && reviews >= 0 ? Math.round(reviews) : null,
      city: region ?? district,
      street: district && region && district !== region ? `${district}, ${region}` : district,
      latitude: null,
      longitude: null,
      description: description ? description.slice(0, 300) : null,
      amenities: [],
      sourceUrl,
    });
  }
  return hotels;
}
