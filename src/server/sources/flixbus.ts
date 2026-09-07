/**
 * SERVER ONLY. flixbus.com.tr route pages (`/otobus-seferleri/{from}-{to}`) publish no timetable. Their JSON-LD has a
 * `Product` with an `AggregateOffer` (lowest TRY price, offer count), a `BusTrip` naming the stops of both ends and a
 * `FAQPage` whose answers state the typical duration, the distance and the first and last planned departures. This
 * module turns that into route-level facts and never invents departures. Fetching lives in registry.ts / fetch.ts.
 */
import type { SourceRouteFacts } from '../../lib/sources/types';
import { SOURCE_ORIGINS } from '../../lib/sources/types';
import { slugifyTr } from '../../lib/turna/urls';
import { decodeEntities, stableId, stripTags } from '../turna/parse';
import { jsonLdObjects } from './obilet';

export const FLIXBUS_ROUTE_PATH = 'otobus-seferleri';

/** `https://www.flixbus.com.tr/otobus-seferleri/ankara-istanbul` (no trailing slash; the site redirects otherwise). */
export function flixbusRouteLandingUrl(from: string, to: string): string {
  return `${SOURCE_ORIGINS.flixbus}/${FLIXBUS_ROUTE_PATH}/${slugifyTr(from)}-${slugifyTr(to)}`;
}

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? decodeEntities(value).trim() : null;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
}

function stopNames(value: unknown): string[] {
  const names: string[] = [];
  for (const stop of asArray(value)) {
    if (!isObject(stop)) continue;
    const name = str(stop.name);
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

/** "yaklaşık 6 saat 45 dakika" -> 405; "7 saat" -> 420; "45 dakika" -> 45; null when neither part is present. */
export function parseTrDurationWords(text: string | null | undefined): number | null {
  if (!text) return null;
  const hours = /(\d+)\s*saat/i.exec(text);
  const minutes = /(\d+)\s*dakika/i.exec(text);
  if (!hours && !minutes) return null;
  const total = (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  return total > 0 ? total : null;
}

/** First "HH:MM" clock in a sentence, zero-padded; null when there is none or it is out of range. */
export function firstClockIn(text: string | null | undefined): string | null {
  const m = text ? /(?:^|\D)(\d{1,2}):(\d{2})(?!\d)/.exec(text) : null;
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return null;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

interface FaqEntry {
  question: string;
  answer: string;
}

function faqEntries(html: string): FaqEntry[] {
  const out: FaqEntry[] = [];
  for (const page of jsonLdObjects(html, 'FAQPage')) {
    for (const q of asArray(page.mainEntity)) {
      if (!isObject(q)) continue;
      const question = str(q.name);
      const accepted = isObject(q.acceptedAnswer) ? q.acceptedAnswer : {};
      const answer = typeof accepted.text === 'string' ? stripTags(accepted.text) : null;
      if (question && answer) out.push({ question, answer });
    }
  }
  return out;
}

function answerTo(faq: FaqEntry[], questionPattern: RegExp): string | null {
  const hit = faq.find((entry) => questionPattern.test(entry.question));
  return hit ? hit.answer : null;
}

/** "Ankara - İstanbul Avrupa" or "Ankara - İstanbul Otobüs Bileti" -> cities; null when the name has no " - ". */
export function splitRouteName(name: string | null | undefined): { fromCity: string; toCity: string } | null {
  if (!name) return null;
  const m = /^(.+?)\s+-\s+(.+?)$/.exec(name.replace(/\s+Otobüs Bileti$/i, '').trim());
  return m ? { fromCity: m[1].trim(), toCity: m[2].trim() } : null;
}

/**
 * Route facts of a flixbus route page, or null when the page is not one (no `BusTrip` linking to flixbus.com.tr).
 * The price comes only from a TRY `AggregateOffer`; duration, distance and first/last departures only from the FAQ
 * answers that state them. Anything not published stays null.
 */
export function parseFlixbusRouteFacts(html: string, sourceUrl: string): SourceRouteFacts | null {
  const origin = `${SOURCE_ORIGINS.flixbus}/`;
  const trip = jsonLdObjects(html, 'BusTrip').find((t) => (str(t.url) ?? '').startsWith(origin));
  if (!trip) return null;
  const product = jsonLdObjects(html, 'Product').find((p) => isObject(p.offers) && p.offers['@type'] === 'AggregateOffer') ?? null;
  const offers = product && isObject(product.offers) ? product.offers : {};
  const currency = str(offers.priceCurrency);
  const lowRaw = offers.lowPrice;
  const low = typeof lowRaw === 'number' ? lowRaw : typeof lowRaw === 'string' ? Number(lowRaw.trim().replace(',', '.')) : NaN;
  const currencyOk = !currency || /^(TRY|TL)$/i.test(currency);
  const lowPrice = currencyOk && Number.isFinite(low) && low > 0 ? Math.round(low * 100) / 100 : null;
  const countRaw = offers.offerCount;
  const offerCount =
    typeof countRaw === 'number' && countRaw > 0 ? Math.round(countRaw) : typeof countRaw === 'string' && /^\d+$/.test(countRaw.trim()) ? Number(countRaw) : null;
  const category = product && isObject(product.category) ? str(product.category.name) : null;
  const route = splitRouteName(category) ?? splitRouteName(str(trip.name));
  if (!route) return null;
  const faq = faqEntries(html);
  const durationAnswer = answerTo(faq, /ne kadar sür/i);
  const distance = durationAnswer ? /(\d+(?:[.,]\d+)?)\s*km/i.exec(durationAnswer) : null;
  const provider = isObject(trip.provider) ? trip.provider : {};
  const logo = str(provider.logo);
  return {
    source: 'flixbus',
    kind: 'route',
    id: stableId('flixbus', 'route', route.fromCity, route.toCity, lowPrice),
    fromCity: route.fromCity,
    toCity: route.toCity,
    lowPrice,
    currency: 'TRY',
    offerCount,
    durationMinutes: parseTrDurationWords(durationAnswer),
    distanceKm: distance ? Math.round(Number(distance[1].replace(',', '.'))) : null,
    firstDeparture: firstClockIn(answerTo(faq, /\bilk\b.*ne zaman/i)),
    lastDeparture: firstClockIn(answerTo(faq, /en son\b.*ne zaman/i)),
    departureStops: stopNames(trip.departureBusStop),
    arrivalStops: stopNames(trip.arrivalBusStop),
    operatorName: str(provider.name),
    operatorLogoUrl: logo && /^https?:\/\//.test(logo) ? logo : null,
    hasTimetable: false,
    sourceUrl,
  };
}
