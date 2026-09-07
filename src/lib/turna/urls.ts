import type { TurnaKind, TurnaQuery } from './types';

export const TURNA_ORIGIN = 'https://www.turna.com';
export const TURNA_CDN = 'https://cdn.turna.com';

/** Turkish-aware slugify matching turna.com URL segments (İstanbul → istanbul, Çeşme → cesme). */
export function slugifyTr(input: string): string {
  const map: Record<string, string> = {
    ı: 'i', İ: 'i', I: 'i', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u', ş: 's', Ş: 's', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c',
  };
  return input
    .trim()
    .replace(/[ıİIğĞüÜşŞöÖçÇ]/g, (ch) => map[ch] ?? ch)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class TurnaQueryError extends Error {
  readonly errorCode = 'invalid_query';
  constructor(message: string) {
    super(message);
    this.name = 'TurnaQueryError';
  }
}

export interface ResolvedTurnaTarget {
  kind: TurnaKind;
  url: string;
  /** e.g. `flight:istanbul-ankara`, `hotel:antalya`, `car:istanbul` */
  routeKey: string;
  label: string;
  slugs: { from?: string; to?: string; city?: string };
}

/**
 * Landing-page path family per kind: `/ucak-bileti/{a}-{b}`, `/otobus-bileti/{a}-{b}`, `/otel/{city}`,
 * `/feribot-bileti/{a}-{b}`, `/arac-kiralama/sehir/{city}`.
 */
export const KIND_PATH: Record<TurnaKind, string> = {
  flight: 'ucak-bileti',
  bus: 'otobus-bileti',
  hotel: 'otel',
  ferry: 'feribot-bileti',
  car: 'arac-kiralama/sehir',
};

/** Kinds addressed by a single city rather than an origin/destination pair. */
export const CITY_KINDS: ReadonlySet<TurnaKind> = new Set<TurnaKind>(['hotel', 'car']);

export function isCityKind(kind: TurnaKind): boolean {
  return CITY_KINDS.has(kind);
}

/** Human-readable list of accepted kinds, shared by every `invalid_query` message. */
export const KIND_LIST_LABEL = 'flight | bus | hotel | ferry | car';

function requireSlug(value: string | undefined, field: string): string {
  const slug = slugifyTr(value ?? '');
  if (!slug || slug.length < 2 || slug.length > 60 || !SLUG_RE.test(slug)) {
    throw new TurnaQueryError(`'${field}' geçersiz veya boş (örn. istanbul, izmir, cesme).`);
  }
  return slug;
}

/**
 * Resolve a query into the public turna.com landing page for that route/city.
 * Only landing pages are used: they are allowed by turna.com/robots.txt and carry JSON-LD.
 * City kinds (hotel, car) read `city`, falling back to `to`, then `from`.
 */
export function resolveTurnaTarget(query: TurnaQuery): ResolvedTurnaTarget {
  const kind = query.kind;
  if (!(kind in KIND_PATH)) {
    throw new TurnaQueryError(`'kind' ${KIND_LIST_LABEL} olmalı (alınan: ${String(kind)}).`);
  }
  if (CITY_KINDS.has(kind)) {
    const city = requireSlug(query.city ?? query.to ?? query.from, 'city');
    return {
      kind,
      url: `${TURNA_ORIGIN}/${KIND_PATH[kind]}/${city}`,
      routeKey: `${kind}:${city}`,
      label: city,
      slugs: { city },
    };
  }
  const from = requireSlug(query.from, 'from');
  const to = requireSlug(query.to, 'to');
  if (from === to) {
    throw new TurnaQueryError("'from' ve 'to' aynı olamaz.");
  }
  return {
    kind,
    url: `${TURNA_ORIGIN}/${KIND_PATH[kind]}/${from}-${to}`,
    routeKey: `${kind}:${from}-${to}`,
    label: `${from} → ${to}`,
    slugs: { from, to },
  };
}

// ---------------------------------------------------------------------------
// Static assets (verified Sept 2026)
// ---------------------------------------------------------------------------

/**
 * `https://cdn.turna.com/Images/Flight/Airlines/{IATA}.png` (PC, TK verified). Null for a missing/invalid code.
 * The CDN serves a browser `<img>` fine but answers 403 to non-browser user agents, so consumers keep an
 * onError text fallback.
 */
export function airlineLogoUrl(iata: string | null | undefined): string | null {
  const code = (iata ?? '').trim().toUpperCase();
  return /^[A-Z0-9]{2,3}$/.test(code) ? `${TURNA_CDN}/Images/Flight/Airlines/${code}.png` : null;
}

/**
 * `https://cdn.turna.com/Images/Bus/BusCompanies/{slugifyTr(name)}.png`.
 * Works for nigde-inan-turizm, adiyaman-anka-turizm, pamukkale-turizm, metro-turizm, varan-turizm;
 * kamil-koc answers 403, so image consumers must keep an onError fallback.
 */
export function busCompanyLogoUrl(companyName: string | null | undefined): string | null {
  const slug = slugifyTr(companyName ?? '');
  return slug ? `${TURNA_CDN}/Images/Bus/BusCompanies/${slug}.png` : null;
}

// ---------------------------------------------------------------------------
// Outbound allowlist
// ---------------------------------------------------------------------------

/**
 * Allowlist for every outbound fetch: only the five undated landing-page families on
 * https://www.turna.com, lowercase slugs, no query string, no trailing slash. The private JSON
 * endpoints, the dated one-way search pages (which robots.txt disallows) and `/arac-kiralama/{city}`
 * without the `/sehir/` segment can never pass this check.
 */
const LANDING_URL_RE =
  /^https:\/\/www\.turna\.com\/(?:ucak-bileti|otobus-bileti|otel|feribot-bileti|arac-kiralama\/sehir)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isAllowedLandingUrl(url: string): boolean {
  return LANDING_URL_RE.test(url);
}
