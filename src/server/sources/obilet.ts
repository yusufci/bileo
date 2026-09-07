/**
 * SERVER ONLY. obilet.com bus route landing pages (`/otobus-bileti/{from}-{to}`) publish their
 * cheapest upcoming departures as schema.org microdata (`BusTrip` items with provider, stops,
 * `AggregateOffer.lowPrice`, clocks). biletall.com serves the same markup, so the parser takes the
 * source id as a parameter. Only the page HTML is read here; fetching and robots live in Phase A4.
 */
import type { SourceBusTrip, SourceFlight, SourceHotel, SourceId } from '../../lib/sources/types';
import { SOURCE_ORIGINS } from '../../lib/sources/types';
import { slugifyTr } from '../../lib/turna/urls';
import { decodeEntities, extractJsonLd, stableId } from '../turna/parse';
import { attrValue, clockDiffMinutes, extractItemscopes, itemprop, nestedScope, parseTrPrice } from './microdata';

export const OBILET_BUS_PATH = 'otobus-bileti';
export const OBILET_FLIGHT_PATH = 'ucak-bileti';
export const OBILET_HOTEL_PATH = 'otel';

/** `https://www.obilet.com/otobus-bileti/istanbul-ankara` (or the biletall twin). */
export function busLandingUrl(source: 'obilet' | 'biletall', from: string, to: string): string {
  return `${SOURCE_ORIGINS[source]}/${OBILET_BUS_PATH}/${slugifyTr(from)}-${slugifyTr(to)}`;
}

/** Text right before a `<br />` inside the stop cell, e.g. "İstanbul Avrupa"; null when absent. */
function cityBeforeStop(block: string, stopProp: 'departureBusStop' | 'arrivalBusStop'): string | null {
  const idx = block.search(new RegExp(`itemprop="${stopProp}"`, 'i'));
  if (idx === -1) return null;
  const before = block.slice(0, idx);
  const cell = before.lastIndexOf('<div>');
  const fragment = before.slice(cell === -1 ? 0 : cell);
  const m = /<div>\s*([^<]+?)\s*<br\s*\/?>/i.exec(fragment);
  return m ? decodeEntities(m[1]).trim() || null : null;
}

/** "2+1" / "2+2" printed next to the seat icon; null when the page does not state a layout. */
function seatLayout(block: string): string | null {
  const m = /class="seat"[\s\S]{0,200}?<\/svg>\s*([0-9]\s*(?:&#x2B;|&#43;|\+)\s*[0-9])/i.exec(block);
  return m ? decodeEntities(m[1]).replace(/\s+/g, '') : null;
}

/** All BusTrip items of the page, in page order; malformed items (no company, clock or price) are skipped. */
export function parseBusTrips(html: string, source: 'obilet' | 'biletall', sourceUrl: string): SourceBusTrip[] {
  const trips: SourceBusTrip[] = [];
  for (const block of extractItemscopes(html, 'BusTrip')) {
    const provider = nestedScope(block, 'provider');
    const company = provider ? itemprop(provider, 'name') : null;
    const departureTime = itemprop(block, 'departureTime');
    const arrivalTime = itemprop(block, 'arrivalTime');
    const offers = nestedScope(block, 'offers');
    const priceRaw = offers ? attrValue(offers, 'data-price') ?? itemprop(offers, 'lowPrice') : null;
    const price = parseTrPrice(priceRaw);
    if (!company || !departureTime || !arrivalTime || price === null) continue;
    const fromStopScope = nestedScope(block, 'departureBusStop');
    const toStopScope = nestedScope(block, 'arrivalBusStop');
    const fromCity = attrValue(block, 'data-origin-name') ?? cityBeforeStop(block, 'departureBusStop') ?? '';
    const toCity = attrValue(block, 'data-destination-name') ?? cityBeforeStop(block, 'arrivalBusStop') ?? '';
    const logo = provider ? attrValue(provider, 'data-src') ?? attrValue(provider, 'src') : null;
    trips.push({
      source,
      kind: 'bus',
      id: stableId(source, 'bus', company, fromCity, toCity, departureTime, price),
      company,
      companyLogoUrl: logo && /^https?:\/\//i.test(logo) ? logo : null,
      fromCity,
      fromStop: fromStopScope ? itemprop(fromStopScope, 'name') : null,
      toCity,
      toStop: toStopScope ? itemprop(toStopScope, 'name') : null,
      departureTime: departureTime.trim(),
      arrivalTime: arrivalTime.trim(),
      durationMinutes: clockDiffMinutes(departureTime, arrivalTime),
      price,
      currency: 'TRY',
      seatLayout: seatLayout(block),
      date: null,
      sourceUrl,
    });
  }
  return trips;
}

/** The "560 TL'den Başlayan" figure in the page title; null when the title carries no price. */
export function titleMinPrice(html: string): number | null {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!title) return null;
  const m = /(\d[\d.]*)\s*TL/i.exec(decodeEntities(title[1]));
  return m ? parseTrPrice(m[1]) : null;
}

export type SourceIdWithBusLanding = Extract<SourceId, 'obilet' | 'biletall'>;

/** `https://www.obilet.com/ucak-bileti/istanbul-ankara`. */
export function flightLandingUrl(source: 'obilet', from: string, to: string): string {
  return `${SOURCE_ORIGINS[source]}/${OBILET_FLIGHT_PATH}/${slugifyTr(from)}-${slugifyTr(to)}`;
}

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? decodeEntities(value).trim() : null;
}

/** Every object with the given `@type` anywhere inside the page's JSON-LD blocks (arrays and nesting included). */
export function jsonLdObjects(html: string, type: string): JsonObject[] {
  const out: JsonObject[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!isObject(node)) return;
    if (node['@type'] === type) out.push(node);
    for (const value of Object.values(node)) walk(value);
  };
  walk(extractJsonLd(html));
  return out;
}

/** "1sa 0dk" / "2sa 15dk" / "55dk" -> minutes; null when the label has no hour or minute part. */
export function parseTrDuration(label: string | null | undefined): number | null {
  if (!label) return null;
  const hours = /(\d+)\s*sa/i.exec(label);
  const minutes = /(\d+)\s*dk/i.exec(label);
  if (!hours && !minutes) return null;
  const total = (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  return total > 0 ? total : null;
}

/** All `Flight` objects of an obilet flight landing page; items without airline, clocks or a positive price are skipped. */
export function parseFlights(html: string, source: 'obilet', sourceUrl: string): SourceFlight[] {
  const flights: SourceFlight[] = [];
  for (const f of jsonLdObjects(html, 'Flight')) {
    const provider = isObject(f.provider) ? f.provider : {};
    const dep = isObject(f.departureAirport) ? f.departureAirport : {};
    const arr = isObject(f.arrivalAirport) ? f.arrivalAirport : {};
    const offers = Array.isArray(f.offers) ? f.offers : isObject(f.offers) ? [f.offers] : [];
    const firstOffer = offers.find(isObject);
    const price = parseTrPrice(str(firstOffer?.price));
    const airline = str(provider.name);
    const departureTime = str(f.departureTime);
    const arrivalTime = str(f.arrivalTime);
    const fromName = str(dep.name);
    const toName = str(arr.name);
    if (!airline || !departureTime || !arrivalTime || !fromName || !toName || price === null) continue;
    const currency = str(firstOffer?.priceCurrency);
    if (currency && currency.toUpperCase() !== 'TRY' && currency.toUpperCase() !== 'TL') continue;
    const airlineCode = str(provider.iataCode);
    const fromCode = str(dep.iataCode);
    const toCode = str(arr.iataCode);
    flights.push({
      source,
      kind: 'flight',
      id: stableId(source, 'flight', airline, fromCode ?? fromName, toCode ?? toName, departureTime, arrivalTime, price),
      airline,
      airlineCode: airlineCode ? airlineCode.toUpperCase() : null,
      fromCode: fromCode ? fromCode.toUpperCase() : null,
      fromName,
      toCode: toCode ? toCode.toUpperCase() : null,
      toName,
      departureTime,
      arrivalTime,
      durationMinutes: parseTrDuration(str(f.estimatedFlightDuration)) ?? clockDiffMinutes(departureTime, arrivalTime),
      price,
      currency: 'TRY',
      date: null,
      sourceUrl,
    });
  }
  return flights;
}

/** `TravelAction.result.lowPrice` ("1.470,00 TL") of the page, or null when absent. */
export function aggregateLowPrice(html: string): number | null {
  for (const action of jsonLdObjects(html, 'TravelAction')) {
    const result = isObject(action.result) ? action.result : null;
    const low = result ? parseTrPrice(str(result.lowPrice)) : null;
    if (low !== null) return low;
  }
  for (const offer of jsonLdObjects(html, 'AggregateOffer')) {
    const low = parseTrPrice(str(offer.lowPrice));
    if (low !== null) return low;
  }
  return null;
}

/** `https://www.obilet.com/otel/antalya-otelleri`. */
export function hotelLandingUrl(source: 'obilet', city: string): string {
  return `${SOURCE_ORIGINS[source]}/${OBILET_HOTEL_PATH}/${slugifyTr(city)}-otelleri`;
}

function num(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** All `Hotel` objects of an obilet city landing page; items without a name or an absolute URL are skipped. No price exists. */
export function parseHotels(html: string, source: 'obilet', sourceUrl: string): SourceHotel[] {
  const hotels: SourceHotel[] = [];
  for (const h of jsonLdObjects(html, 'Hotel')) {
    const name = str(h.name);
    const url = str(h.url);
    if (!name || !url || !/^https?:\/\//i.test(url)) continue;
    const starObj = isObject(h.starRating) ? h.starRating : {};
    const starsRaw = num(starObj.ratingValue);
    const agg = isObject(h.aggregateRating) ? h.aggregateRating : {};
    const rating = num(agg.ratingValue);
    const best = num(agg.bestRating);
    const reviews = num(agg.reviewCount);
    const address = isObject(h.address) ? h.address : {};
    const geo = isObject(h.geo) ? h.geo : {};
    const features = Array.isArray(h.amenityFeature) ? h.amenityFeature : [];
    const amenities = features
      .filter(isObject)
      .filter((f) => f.value === true || f.value === 'True' || f.value === undefined)
      .map((f) => str(f.name))
      .filter((n): n is string => n !== null);
    const image = str(h.image);
    const description = str(h.description);
    hotels.push({
      source,
      kind: 'hotel',
      id: stableId(source, 'hotel', url),
      name,
      url,
      image: image && /^https?:\/\//i.test(image) ? image : null,
      stars: starsRaw !== null && starsRaw >= 1 && starsRaw <= 7 ? Math.round(starsRaw) : null,
      rating: rating !== null && rating > 0 ? Math.round(rating * 10) / 10 : null,
      ratingBest: best !== null && best > 0 ? best : 10,
      reviewCount: reviews !== null && reviews >= 0 ? Math.round(reviews) : null,
      city: str(address.addressLocality),
      street: str(address.streetAddress),
      latitude: num(geo.latitude),
      longitude: num(geo.longitude),
      description: description ? description.slice(0, 300) : null,
      amenities,
      sourceUrl,
    });
  }
  return hotels;
}
