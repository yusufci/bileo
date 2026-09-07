/**
 * SERVER ONLY. otelz.com city landing pages (`/{city}-otelleri`) publish two layers: a JSON-LD `ItemList`
 * of `Hotel` objects (name, url, image, address, aggregateRating) and a Next.js `__NEXT_DATA__` blob whose
 * `props.pageProps.data.facilities[]` carries coordinates, the district path and a short summary for the
 * same hotels (joined by the numeric id at the end of the JSON-LD url). The page publishes no usable
 * price: `netPrice` is 0 on every row we have seen, so SourceHotel keeps no price field for otelz either.
 */
import type { SourceHotel } from '../../lib/sources/types';
import { SOURCE_ORIGINS } from '../../lib/sources/types';
import { slugifyTr } from '../../lib/turna/urls';
import { decodeEntities, stableId } from '../turna/parse';
import { jsonLdObjects } from './obilet';

export const OTELZ_HOTEL_SUFFIX = '-otelleri';

/** `https://www.otelz.com/antalya-otelleri`. */
export function otelzHotelLandingUrl(city: string): string {
  return `${SOURCE_ORIGINS.otelz}/${slugifyTr(city)}${OTELZ_HOTEL_SUFFIX}`;
}

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? decodeEntities(value).trim() : null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export interface OtelzFacility {
  id: number;
  lat: number | null;
  lng: number | null;
  /** District path as printed, e.g. "Kundu, Aksu, Antalya". */
  placeName: string | null;
  summary: string | null;
  likes: number | null;
  hasFreeCancellation: boolean | null;
}

/** `props.pageProps.data.facilities[]` of the page's `__NEXT_DATA__`, keyed by hotel id; empty when absent or malformed. */
export function extractOtelzFacilities(html: string): Map<number, OtelzFacility> {
  const out = new Map<number, OtelzFacility>();
  const m = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i.exec(html);
  if (!m) return out;
  let parsed: unknown;
  try {
    parsed = JSON.parse(m[1]);
  } catch {
    return out;
  }
  const props = isObject(parsed) && isObject(parsed.props) ? parsed.props : null;
  const pageProps = props && isObject(props.pageProps) ? props.pageProps : null;
  const data = pageProps && isObject(pageProps.data) ? pageProps.data : null;
  const facilities = data && Array.isArray(data.facilities) ? data.facilities : [];
  for (const f of facilities) {
    if (!isObject(f)) continue;
    const id = num(f.id);
    if (id === null || !Number.isInteger(id) || id <= 0) continue;
    out.set(id, {
      id,
      lat: num(f.lat),
      lng: num(f.lng),
      placeName: str(f.pName),
      summary: str(f.sum),
      likes: num(f.likes),
      hasFreeCancellation: typeof f.hasFreeCancellation === 'boolean' ? f.hasFreeCancellation : null,
    });
  }
  return out;
}

function idFromUrl(url: string): number | null {
  const m = /\/(\d+)\/?$/.exec(url);
  return m ? Number(m[1]) : null;
}

/**
 * JSON-LD `Hotel` objects merged with their `facilities` row. Items without a name or an absolute URL are
 * skipped; duplicates (same url) are collapsed. Star class is not published, ratings come from JSON-LD only.
 */
export function parseOtelzHotels(html: string, sourceUrl: string): SourceHotel[] {
  const facilities = extractOtelzFacilities(html);
  const seen = new Set<string>();
  const hotels: SourceHotel[] = [];
  for (const h of jsonLdObjects(html, 'Hotel')) {
    const name = str(h.name);
    const url = str(h.url);
    if (!name || !url || !/^https:\/\/www\.otelz\.com\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    const agg = isObject(h.aggregateRating) ? h.aggregateRating : {};
    const rating = num(agg.ratingValue);
    const best = num(agg.bestRating);
    const reviews = num(agg.reviewCount);
    const address = isObject(h.address) ? h.address : {};
    const facility = idFromUrl(url) !== null ? facilities.get(idFromUrl(url) as number) : undefined;
    const image = str(h.image);
    const description = facility?.summary ?? null;
    hotels.push({
      source: 'otelz',
      kind: 'hotel',
      id: stableId('otelz', 'hotel', url),
      name,
      url,
      image: image && /^https?:\/\//i.test(image) ? image : null,
      stars: null,
      rating: rating !== null && rating > 0 ? Math.round(rating * 10) / 10 : null,
      ratingBest: best !== null && best > 0 ? best : 10,
      reviewCount: reviews !== null && reviews >= 0 ? Math.round(reviews) : null,
      city: str(address.addressLocality),
      street: facility?.placeName ?? str(address.streetAddress),
      latitude: facility?.lat ?? null,
      longitude: facility?.lng ?? null,
      description: description ? description.slice(0, 300) : null,
      amenities: [],
      sourceUrl,
    });
  }
  return hotels;
}
