/**
 * SERVER ONLY: imports node:crypto (sha1 offer ids shared with the nexora panel and the Python
 * package). Never import this module from src/components, src/lib or src/data.
 *
 * JSON-LD (+ Next.js RSC payload) → normalised offers for turna.com landing pages.
 * Verbatim port of nexora-panel/lib/turna/parse.ts; only the import paths differ.
 *
 * Verified shapes (Sept 2026):
 *  - flight page : ItemList of `Flight` {provider{name,iataCode}, departureAirport{name,iataCode},
 *                  arrivalAirport{...}, departureTime/arrivalTime ISO+03:00, estimatedFlightDuration "2s 10d",
 *                  offers{price: number, priceCurrency:"TRY"}}
 *  - bus page    : several standalone `BusTrip` {busName, provider{name,url}, departureBusStop{name,address{addressLocality}},
 *                  arrivalBusStop{...}, departureTime "13.09.2026 11:29:00", offers{price:"500,00", priceCurrency:"TL"}}
 *  - hotel page  : ItemList of 20 `Hotel` {name,url,image,address{addressLocality,addressCountry},
 *                  aggregateRating{ratingValue:"9.4",bestRating:"10.0",reviewCount:"1735"}}
 *                  PLUS an RSC array `"initialHotels":[...]` of 50 {id, name, hotelSlug, starRating (0 = unknown),
 *                  location, rating (0-10), ratingText, reviewCount, breakfast, amenities[{Code,Name}], link "/otel/{slug}",
 *                  imageUrl[url], Images[url...], Address{District,City,Country,Region}, Tags[{slug,name,usage}]}. No prices.
 *  - car page    : `/arac-kiralama/sehir/{city}` has a JSON-LD `AutoRental` descriptor only; offers live in the RSC array
 *                  `"cars":[...]` of {Brand, Model, Class "VehicleClassEconomy|Standard|FullSize|Premium|LuxuryElite|MiniElite",
 *                  FuelType "FuelTypeGasoline|Diesel|Hybrid|Electric", Transmission "TransmissionAuto|TransmissionManuel",
 *                  MileageLimit (0 = not stated), VehicleImages[{ImageUrl}], Company{Name,Id,LogoUrl,LogoSlug},
 *                  DailyPrice: number, CurrencyCode "TRY"} (istanbul 35 rows, ankara 25).
 *  - all pages   : `FAQPage` with route facts in Turkish prose, `BreadcrumbList`.
 *
 * The RSC payload is streamed as `self.__next_f.push([1,"<js string>"])` chunks; each chunk decodes with
 * JSON.parse('"' + chunk + '"') and objects may straddle chunk boundaries, so the chunks are concatenated first.
 */
import { createHash } from 'node:crypto';
import type { BusOffer, CarOffer, FlightOffer, HotelOffer, RouteFacts, TurnaKind, TurnaOffer } from '../../lib/turna/types';
import { airlineLogoUrl, busCompanyLogoUrl, slugifyTr, TURNA_ORIGIN } from '../../lib/turna/urls';

type Json = Record<string, unknown>;

const LD_JSON_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extract every parseable JSON-LD block (objects inside arrays / @graph are flattened). */
export function extractJsonLd(html: string): Json[] {
  const out: Json[] = [];
  for (const match of html.matchAll(LD_JSON_RE)) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      pushLd(parsed, out);
    } catch {
      // Malformed block: skip, the page still renders without it.
    }
  }
  return out;
}

function pushLd(node: unknown, out: Json[]): void {
  if (Array.isArray(node)) {
    node.forEach((n) => pushLd(n, out));
    return;
  }
  if (node && typeof node === 'object') {
    const obj = node as Json;
    if (Array.isArray(obj['@graph'])) {
      pushLd(obj['@graph'], out);
    }
    out.push(obj);
  }
}

export function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() || null : null;
}

// ---------------------------------------------------------------------------
// Normalisers
// ---------------------------------------------------------------------------

/** "1s" → 60, "2s 10d" → 130, "1 sa 25 dk" → 85, "45 dakika" → 45, "1 saat" → 60. */
export function parseDurationMinutes(label: string | null | undefined): number | null {
  if (!label) return null;
  const text = label.toLowerCase().replace(/\s+/g, ' ').trim();
  const hours = text.match(/(\d+)\s*(?:saat|sa|s)\b/);
  const minutes = text.match(/(\d+)\s*(?:dakika|dk|d)\b/);
  if (!hours && !minutes) return null;
  const total = (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  return Number.isFinite(total) && total > 0 ? total : null;
}

export function formatDuration(minutes: number | null, fallback = ''): string {
  if (minutes == null) return fallback;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} sa ${m} dk`;
  if (h) return `${h} sa`;
  return `${m} dk`;
}

/** "13.09.2026 11:29:00" or "13.09.2026 11:29" → 2026-09-13T11:29:00+03:00 (Türkiye is UTC+3 all year). Accepts ISO input. */
export function parseTrDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  const tr = v.match(/^(\d{2})\.(\d{2})\.(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (tr) {
    const [, dd, mm, yyyy, hh, mi, ss] = tr;
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss ?? '00'}+03:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) {
    return v.length === 16 ? `${v}:00+03:00` : v;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** 1401.11 → 1401.11, "500,00" → 500, "1.401,11" → 1401.11, "1.500" → 1500, "1401.11" → 1401.11. */
export function parsePrice(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== 'string') return null;
  let s = value.replace(/[^\d.,]/g, '');
  if (!s) return null;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    s = s.replace(',', '.');
  } else if (hasDot) {
    const [, frac = ''] = s.split('.');
    if (frac.length === 3) s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

export function stableId(...parts: Array<string | number | null | undefined>): string {
  return createHash('sha1').update(parts.map((p) => String(p ?? '')).join('|')).digest('hex').slice(0, 12);
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
}

export function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');
const obj = (v: unknown): Json => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {});

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

function itemsOfType(blocks: Json[], type: string): Json[] {
  const items: Json[] = [];
  for (const block of blocks) {
    if (block['@type'] === 'ItemList' && Array.isArray(block.itemListElement)) {
      for (const el of block.itemListElement as unknown[]) {
        const item = obj(obj(el).item ?? el);
        if (item['@type'] === type) items.push(item);
      }
    } else if (block['@type'] === type) {
      items.push(block);
    }
  }
  return items;
}

export function parseFlights(blocks: Json[]): FlightOffer[] {
  const seen = new Set<string>();
  const offers: FlightOffer[] = [];
  for (const it of itemsOfType(blocks, 'Flight')) {
    const provider = obj(it.provider);
    const dep = obj(it.departureAirport);
    const arr = obj(it.arrivalAirport);
    const offer = obj(it.offers);
    const price = parsePrice(offer.price);
    const departureAt = parseTrDateTime(str(it.departureTime));
    const arrivalAt = parseTrDateTime(str(it.arrivalTime));
    if (!price || !departureAt) continue;
    const airline = str(provider.name) || 'Bilinmeyen havayolu';
    const durationLabelRaw = str(it.estimatedFlightDuration);
    const durationMinutes = parseDurationMinutes(durationLabelRaw);
    const airlineCode = str(provider.iataCode) || null;
    const id = stableId('flight', airline, departureAt, arrivalAt, price);
    if (seen.has(id)) continue;
    seen.add(id);
    offers.push({
      kind: 'flight',
      source: 'turna',
      id,
      airline,
      airlineCode,
      logoUrl: airlineLogoUrl(airlineCode),
      fromName: str(dep.name),
      fromCode: str(dep.iataCode) || null,
      toName: str(arr.name),
      toCode: str(arr.iataCode) || null,
      departureAt,
      arrivalAt: arrivalAt ?? departureAt,
      date: departureAt.slice(0, 10),
      durationMinutes,
      durationLabel: formatDuration(durationMinutes, durationLabelRaw),
      price,
      currency: 'TRY',
      isDirect: null,
    });
  }
  return offers.sort((a, b) => a.price - b.price || a.departureAt.localeCompare(b.departureAt));
}

export function parseBuses(blocks: Json[]): BusOffer[] {
  const seen = new Set<string>();
  const offers: BusOffer[] = [];
  for (const it of itemsOfType(blocks, 'BusTrip')) {
    const provider = obj(it.provider);
    const dep = obj(it.departureBusStop);
    const arr = obj(it.arrivalBusStop);
    const offer = obj(it.offers);
    const price = parsePrice(offer.price);
    const departureAt = parseTrDateTime(str(it.departureTime));
    const arrivalAt = parseTrDateTime(str(it.arrivalTime));
    if (!price || !departureAt) continue;
    const company = str(it.busName) || str(provider.name) || 'Bilinmeyen firma';
    const durationMinutes =
      arrivalAt && departureAt
        ? Math.max(0, Math.round((new Date(arrivalAt).getTime() - new Date(departureAt).getTime()) / 60000)) || null
        : null;
    const id = stableId('bus', company, departureAt, str(dep.name), price);
    if (seen.has(id)) continue;
    seen.add(id);
    offers.push({
      kind: 'bus',
      source: 'turna',
      id,
      company,
      companyUrl: str(provider.url) || null,
      companySlug: busCompanySlug(str(provider.url), company),
      logoUrl: busCompanyLogoUrl(company),
      fromStop: str(dep.name),
      fromCity: str(obj(dep.address).addressLocality) || str(dep.name),
      toStop: str(arr.name),
      toCity: str(obj(arr.address).addressLocality) || str(arr.name),
      departureAt,
      arrivalAt: arrivalAt ?? departureAt,
      date: departureAt.slice(0, 10),
      durationMinutes,
      durationLabel: formatDuration(durationMinutes),
      price,
      currency: 'TRY',
    });
  }
  return offers.sort((a, b) => a.price - b.price || a.departureAt.localeCompare(b.departureAt));
}

/** Last path segment of a URL or path, percent-decoded when possible (".../otobus-bileti/elazığ-hazar-turizm" → "elazığ-hazar-turizm"). */
function lastPathSegment(urlOrPath: string): string {
  const path = urlOrPath.split(/[?#]/)[0].replace(/\/+$/, '');
  const segment = path.slice(path.lastIndexOf('/') + 1);
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Bus companies are addressed by the slug in `provider.url`; fall back to the folded company name. */
function busCompanySlug(providerUrl: string, company: string): string | null {
  return slugifyTr(providerUrl ? lastPathSegment(providerUrl) : '') || slugifyTr(company) || null;
}

// ---------------------------------------------------------------------------
// Next.js RSC payload (`self.__next_f.push([1,"..."])` chunks)
// ---------------------------------------------------------------------------

const RSC_CHUNK_RE = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;

/** Decode and concatenate every RSC chunk. Malformed chunks are skipped; objects may straddle chunk boundaries. */
export function extractRscText(html: string): string {
  let text = '';
  for (const match of html.matchAll(RSC_CHUNK_RE)) {
    try {
      const decoded: unknown = JSON.parse(`"${match[1]}"`);
      if (typeof decoded === 'string') text += decoded;
    } catch {
      // Unexpected escape sequence in this chunk: the rest of the payload is still useful.
    }
  }
  return text;
}

/** Index of the bracket closing the one at `start`, skipping string literals; -1 when unbalanced. */
function closingBracket(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '[' || ch === '{') depth += 1;
    else if (ch === ']' || ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** The JSON array following `"key":[` in the RSC text; a populated occurrence wins over an empty one. Null when absent. */
export function extractRscArray(text: string, key: string): unknown[] | null {
  const needle = `"${key}":[`;
  let empty: unknown[] | null = null;
  let from = 0;
  for (;;) {
    const idx = text.indexOf(needle, from);
    if (idx < 0) return empty;
    const start = idx + needle.length - 1;
    from = idx + needle.length;
    const end = closingBracket(text, start);
    if (end < 0) continue;
    try {
      const parsed: unknown = JSON.parse(text.slice(start, end + 1));
      if (Array.isArray(parsed)) {
        if (parsed.length > 0) return parsed;
        empty = parsed;
      }
    } catch {
      // Not plain JSON at this position (e.g. RSC "$L..." references): try the next occurrence.
    }
  }
}

const num = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
const unique = <T,>(values: T[]): T[] => [...new Set(values)];
const positive = (n: number | null): number | null => (n != null && n > 0 ? n : null);

// ---------------------------------------------------------------------------
// Hotels: RSC `initialHotels` (rich, 50 rows) merged with JSON-LD `Hotel` (20 rows)
// ---------------------------------------------------------------------------

function hotelFromRsc(it: Json): HotelOffer | null {
  const name = str(it.name);
  if (!name) return null;
  const link = str(it.link);
  const slug = str(it.hotelSlug) || (link ? lastPathSegment(link) : '') || null;
  const url = link
    ? /^https?:\/\//i.test(link)
      ? link
      : `${TURNA_ORIGIN}${link.startsWith('/') ? '' : '/'}${link}`
    : slug
      ? `${TURNA_ORIGIN}/otel/${slug}`
      : '';
  const address = obj(it.Address);
  const images = unique(strList(it.Images));
  const district = str(address.District) || null;
  const city = str(address.City) || null;
  const reviewCount = num(it.reviewCount);
  return {
    kind: 'hotel',
    source: 'turna',
    id: stableId('hotel', url || slug || name),
    name,
    url,
    slug,
    image: strList(it.imageUrl)[0] ?? images[0] ?? null,
    images,
    locality: str(it.location) || [district, city].filter(Boolean).join(', '),
    district,
    city,
    region: str(address.Region) || null,
    country: str(address.Country) || null,
    rating: positive(num(it.rating)),
    ratingBest: 10,
    ratingText: str(it.ratingText) || null,
    reviewCount: reviewCount != null && reviewCount >= 0 ? reviewCount : null,
    stars: positive(num(it.starRating)),
    amenities: unique((Array.isArray(it.amenities) ? it.amenities : []).map((a) => str(obj(a).Name)).filter(Boolean)),
    tags: unique((Array.isArray(it.Tags) ? it.Tags : []).map((t) => str(obj(t).name)).filter(Boolean)),
    breakfast: str(it.breakfast) || null,
    turnaId: positive(num(it.id)),
  };
}

function hotelFromJsonLd(it: Json): HotelOffer | null {
  const name = str(it.name);
  if (!name) return null;
  const address = obj(it.address);
  const rating = obj(it.aggregateRating);
  const url = str(it.url);
  const slug = (url ? lastPathSegment(url) : '') || null;
  const ratingBest = num(str(rating.bestRating));
  const reviewCount = parseInt(str(rating.reviewCount).replace(/\D/g, ''), 10);
  const image = (str(Array.isArray(it.image) ? it.image[0] : it.image) || str(obj(it.image).url)) || null;
  return {
    kind: 'hotel',
    source: 'turna',
    id: stableId('hotel', url || slug || name),
    name,
    url,
    slug,
    image,
    images: image ? [image] : [],
    locality: str(address.addressLocality),
    district: null,
    city: null,
    region: null,
    country: str(address.addressCountry) || null,
    rating: positive(num(str(rating.ratingValue))),
    ratingBest: positive(ratingBest) ?? 10,
    ratingText: null,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : null,
    stars: null,
    amenities: [],
    tags: [],
    breakfast: null,
    turnaId: null,
  };
}

/**
 * RSC `initialHotels` is the primary list (richer, 50 rows); JSON-LD `Hotel` items are merged in for anything
 * the RSC list lacks (and are the whole result when the RSC payload is absent). Deduped by slug, then url, then name.
 */
export function parseHotels(blocks: Json[], html = ''): HotelOffer[] {
  const seen = new Set<string>();
  const offers: HotelOffer[] = [];
  const add = (offer: HotelOffer | null): void => {
    if (!offer) return;
    const key = (offer.slug || offer.url || offer.name).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    offers.push(offer);
  };
  const rsc = html ? extractRscArray(extractRscText(html), 'initialHotels') : null;
  for (const raw of rsc ?? []) add(hotelFromRsc(obj(raw)));
  for (const it of itemsOfType(blocks, 'Hotel')) add(hotelFromJsonLd(it));
  return offers.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
}

// ---------------------------------------------------------------------------
// Cars: RSC `cars` array (no JSON-LD offers on car landing pages)
// ---------------------------------------------------------------------------

function normalizeVehicleClass(raw: string): CarOffer['vehicleClass'] {
  const s = raw.replace(/^VehicleClass/i, '').toLowerCase();
  if (s.startsWith('economy')) return 'economy';
  if (s.startsWith('standard')) return 'standard';
  if (s.startsWith('fullsize') || s.startsWith('full_size')) return 'fullsize';
  if (s.startsWith('premium')) return 'premium';
  if (s.startsWith('luxury')) return 'luxury';
  return 'other';
}

function normalizeFuelType(raw: string): CarOffer['fuelType'] {
  const s = raw.replace(/^FuelType/i, '').toLowerCase();
  if (/gasoline|petrol|benzin/.test(s)) return 'gasoline';
  if (/diesel|dizel/.test(s)) return 'diesel';
  if (/hybrid|hibrit/.test(s)) return 'hybrid';
  if (/electric|elektrik/.test(s)) return 'electric';
  if (/lpg/.test(s)) return 'lpg';
  return 'other';
}

/** "TransmissionAuto" → auto; "TransmissionManual" and the site's "TransmissionManuel" → manual. */
function normalizeTransmission(raw: string): CarOffer['transmission'] {
  const s = raw.replace(/^Transmission/i, '').toLowerCase();
  if (s.startsWith('auto') || s.startsWith('otomatik')) return 'auto';
  if (s.startsWith('manu')) return 'manual';
  return 'other';
}

export function parseCars(html: string): CarOffer[] {
  const rows = html ? extractRscArray(extractRscText(html), 'cars') : null;
  if (!rows) return [];
  const seen = new Set<string>();
  const offers: CarOffer[] = [];
  for (const raw of rows) {
    const it = obj(raw);
    const brand = str(it.Brand);
    const model = str(it.Model);
    const dailyPrice = parsePrice(it.DailyPrice);
    const currency = str(it.CurrencyCode).toUpperCase();
    if (!dailyPrice || (!brand && !model) || (currency && currency !== 'TRY' && currency !== 'TL')) continue;
    const companyObj = obj(it.Company);
    const company = str(companyObj.Name) || 'Bilinmeyen firma';
    const vehicleClassRaw = str(it.Class);
    const fuelTypeRaw = str(it.FuelType);
    const id = stableId('car', company, brand, model, vehicleClassRaw, dailyPrice);
    if (seen.has(id)) continue;
    seen.add(id);
    const imageUrl =
      (Array.isArray(it.VehicleImages) ? it.VehicleImages : []).map((im) => str(obj(im).ImageUrl)).find(Boolean) ?? null;
    offers.push({
      kind: 'car',
      source: 'turna',
      id,
      brand,
      model,
      vehicleClass: normalizeVehicleClass(vehicleClassRaw),
      vehicleClassRaw,
      fuelType: normalizeFuelType(fuelTypeRaw),
      fuelTypeRaw,
      transmission: normalizeTransmission(str(it.Transmission)),
      mileageLimitKm: positive(num(it.MileageLimit)),
      imageUrl,
      company,
      companySlug: str(companyObj.LogoSlug) || slugifyTr(company) || null,
      companyLogoUrl: str(companyObj.LogoUrl) || null,
      dailyPrice,
      currency: 'TRY',
    });
  }
  return offers.sort((a, b) => a.dailyPrice - b.dailyPrice || a.company.localeCompare(b.company, 'tr'));
}

/** `html` is needed for kinds whose offers live in the RSC payload (hotel enrichment, car). */
export function parseOffers(kind: TurnaKind, blocks: Json[], html = ''): TurnaOffer[] {
  switch (kind) {
    case 'flight':
      return parseFlights(blocks);
    case 'bus':
      return parseBuses(blocks);
    case 'hotel':
      return parseHotels(blocks, html);
    case 'car':
      return parseCars(html);
    case 'ferry':
      return [];
  }
}

// ---------------------------------------------------------------------------
// Route facts from the FAQ block
// ---------------------------------------------------------------------------

const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const WEEKDAY_RE = new RegExp(`\\b(${WEEKDAYS.join('|')})\\b`, 'i');

function splitList(text: string): string[] {
  return text
    .replace(/\s+ve\s+/gi, ', ')
    .split(/,|;/)
    .map((s) => s.replace(/[.:]+$/g, '').trim())
    .filter((s) => s.length > 1 && s.length < 60 && !/^(vb|gibi|şu|şunlardır)$/i.test(s));
}

function toInt(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v.replace(/\./g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

const TR_WORD = '[\\wçğıöşüÇĞİÖŞÜ ]';
const GENERIC_CARRIER_WORDS = /firma|hava\s*yol|şirket|otobüs|feribot|uçak/i;
const MAX_POPULAR_CARRIERS = 15;

/** "50 adet otobüs firması" / "sayısı 3" / "3 tanesi" / "3 firma bu rotada" */
function carriersCount(answer: string): number | null {
  const patterns = [
    new RegExp(`(\\d+)\\s+adet\\s+${TR_WORD}*?firma`, 'i'),
    /sayısı\s+(\d+)/i,
    /(\d+)\s+tanesi/i,
    /(\d+)\s+(?:hava\s*yolu\s+)?firma\b/i,
  ];
  for (const re of patterns) {
    const m = answer.match(re);
    if (m) return toInt(m[1]);
  }
  return null;
}

/**
 * Carrier lists appear in a few prose shapes:
 *  - "En sık sefer düzenleyen otobüs firmaları, Seç Turizm, Villa Seyahat ve Lüks Mersin."
 *  - "... firmalar şunlardır: Pegasus, Ajet ve Türk Hava Yolları."
 *  - "Hava yolu firmalarından Türk Hava Yolları, Pegasus ve Ajet bu hatta uçuş hizmeti sunmaktadır."
 *  - "Pegasus, Ajet ve Türk Hava Yolları bu hatta en çok sefer gerçekleştiren uçak firmalarıdır."
 */
function popularCarriers(answer: string): string[] {
  let candidates: string[] = [];
  let m = answer.match(/firmalar[ıi]?\s*(?:şunlardır|şu şekildedir)?\s*[:,]\s*([^.]+)\./i);
  if (m) candidates = splitList(m[1]);
  if (candidates.length === 0) {
    m = answer.match(/firmalar[ıi]ndan\s+(.+?)\s+bu\s+(?:hatta|rotada)/i);
    if (m) candidates = splitList(m[1]);
  }
  if (candidates.length === 0) {
    for (const sentence of answer.split(/(?<=\.)\s+/)) {
      m = sentence.match(/^(.+?)\s+bu\s+(?:hatta|rotada)\s+en\s+(?:çok|sık)/i);
      if (m) {
        candidates = splitList(m[1]);
        break;
      }
    }
  }
  const cleaned = candidates.filter((c) => {
    if (!GENERIC_CARRIER_WORDS.test(c)) return true;
    const lower = c.toLowerCase();
    return c.split(' ').length >= 2 && !['hava yolu', 'uçak', 'otobüs', 'feribot'].some((w) => lower.startsWith(w));
  });
  return cleaned.slice(0, MAX_POPULAR_CARRIERS);
}

export function parseFacts(blocks: Json[]): RouteFacts {
  const faq: Array<{ question: string; answer: string }> = [];
  for (const block of blocks) {
    if (block['@type'] !== 'FAQPage' || !Array.isArray(block.mainEntity)) continue;
    for (const q of block.mainEntity as unknown[]) {
      const qo = obj(q);
      const question = stripTags(str(qo.name));
      const answer = stripTags(str(obj(qo.acceptedAnswer).text));
      if (question && answer) faq.push({ question, answer });
    }
  }
  const facts: RouteFacts = {
    carriersCount: null,
    popularCarriers: [],
    cheapestWeekday: null,
    tripsPerWeek: null,
    tripsPerDay: null,
    departureHubs: [],
    arrivalHubs: [],
    shortestDurationMinutes: null,
    shortestDurationLabel: null,
    faq,
  };

  for (const { answer } of faq) {
    if (facts.carriersCount == null) facts.carriersCount = carriersCount(answer);
    if (facts.popularCarriers.length === 0) facts.popularCarriers = popularCarriers(answer);
    // "haftanın en ucuz günü Cuma" / "Otobüs biletlerinde Perşembe en ucuz"
    if (!facts.cheapestWeekday) {
      const m = answer.match(/en\s+ucuz\s+gün[üu]?\s+(\p{L}+)/iu) ?? answer.match(WEEKDAY_RE);
      const day = m?.[1];
      if (day && WEEKDAYS.some((w) => w.toLowerCase() === day.toLowerCase())) {
        facts.cheapestWeekday = WEEKDAYS.find((w) => w.toLowerCase() === day.toLowerCase()) ?? null;
      }
    }
    // "Bu rotada haftada 210, günlük 30 uçuş vardır."
    if (facts.tripsPerWeek == null) facts.tripsPerWeek = toInt(answer.match(/haftada\s+(\d[\d.]*)/i)?.[1]);
    if (facts.tripsPerDay == null) facts.tripsPerDay = toInt(answer.match(/günl[üu]k\s+(\d[\d.]*)/i)?.[1]);
    // "şu havaalanlarından birini kullanacaksın: A, B. Bu havalimanlarından birine ineceksin: C."
    if (facts.departureHubs.length === 0) {
      const m = answer.match(/kullanacaksın:\s*([^.]+)\./i);
      if (m) facts.departureHubs = splitList(m[1]);
    }
    if (facts.arrivalHubs.length === 0) {
      const m = answer.match(/ineceksin:\s*([^.]+)\./i);
      if (m) facts.arrivalHubs = splitList(m[1]);
    }
    // "En kısa feribot seyahati 1 saat 25 dakika sürmektedir."
    if (facts.shortestDurationMinutes == null) {
      const m = answer.match(/en\s+kısa\s+[\wçğıöşüÇĞİÖŞÜ ]*?seyahati?\s+(.+?)\s+sürmektedir/i);
      if (m) {
        facts.shortestDurationMinutes = parseDurationMinutes(m[1]);
        facts.shortestDurationLabel = facts.shortestDurationMinutes ? formatDuration(facts.shortestDurationMinutes) : m[1];
      }
    }
  }
  return facts;
}
