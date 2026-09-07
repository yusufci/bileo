/**
 * Conservative cross-source hotel matching (KAYNAK_GENISLETME_PLANI.md B2). Two listings are the same
 * hotel only when their normalised names are identical and their locations do not contradict each
 * other; an ambiguous name (two candidates) is never matched. False negatives are acceptable, false
 * positives are not, because a wrong match would attach another hotel's rating. Browser-safe.
 */
import type { HotelOffer } from '../turna/types';
import { slugifyTr } from '../turna/urls';
import type { SourceHotel, SourceId } from './types';

/** Generic words that do not identify a hotel and vary between sites. */
const NOISE_WORDS = new Set(['hotel', 'otel', 'hotels', 'the', 've', 'and', '&']);

/**
 * "Akra Kemer - All Inclusive" -> "akra kemer"; "Concorde De Luxe Resort Lara Antalya- Prive Ultra All Inclusive"
 * -> "concorde de luxe resort lara antalya". Marketing suffixes after a dash and generic words are dropped,
 * Turkish letters folded, punctuation removed.
 */
export function normalizeHotelName(name: string): string {
  const head = name.split(/\s+-\s+|-\s+|\s+\|\s+|\(/)[0] ?? name;
  return slugifyTr(head)
    .split('-')
    .filter((w) => w && !NOISE_WORDS.has(w))
    .join(' ');
}

/** Lower-cased, folded location tokens (district, city) of a Turna hotel. */
function turnaPlaceTokens(h: HotelOffer): string[] {
  return [h.district, h.city, h.region, h.locality]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .flatMap((v) => v.split(/[,/]/))
    .map((v) => slugifyTr(v))
    .filter(Boolean);
}

function sourcePlaceTokens(h: SourceHotel): string[] {
  return [h.street, h.city]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .flatMap((v) => v.split(/[,/]/))
    .map((v) => slugifyTr(v))
    .filter(Boolean);
}

/**
 * Locations are compatible when either side is silent or they share at least one token (district or city).
 * Two sides that both name places and share none are treated as different hotels.
 */
export function placesCompatible(turna: HotelOffer, other: SourceHotel): boolean {
  const a = turnaPlaceTokens(turna);
  const b = sourcePlaceTokens(other);
  if (a.length === 0 || b.length === 0) return true;
  return a.some((t) => b.includes(t));
}

export interface HotelRatingRef {
  source: SourceId;
  url: string;
  rating: number | null;
  ratingBest: number;
  reviewCount: number | null;
  stars: number | null;
}

/**
 * For every Turna hotel, the same hotel's rating on each other source. A Turna hotel gets at most one
 * reference per source; when a source has two candidates with the same normalised name, none is used.
 */
export function matchHotelRatings(turnaHotels: HotelOffer[], sourceHotels: SourceHotel[]): Map<string, HotelRatingRef[]> {
  const out = new Map<string, HotelRatingRef[]>();
  const bySource = new Map<SourceId, Map<string, SourceHotel[]>>();
  for (const h of sourceHotels) {
    const key = normalizeHotelName(h.name);
    if (!key) continue;
    const perSource = bySource.get(h.source) ?? new Map<string, SourceHotel[]>();
    perSource.set(key, [...(perSource.get(key) ?? []), h]);
    bySource.set(h.source, perSource);
  }
  for (const t of turnaHotels) {
    const key = normalizeHotelName(t.name);
    if (!key) continue;
    const refs: HotelRatingRef[] = [];
    for (const [source, perSource] of bySource) {
      const candidates = (perSource.get(key) ?? []).filter((c) => placesCompatible(t, c));
      if (candidates.length !== 1) continue;
      const c = candidates[0];
      refs.push({ source, url: c.url, rating: c.rating, ratingBest: c.ratingBest, reviewCount: c.reviewCount, stars: c.stars });
    }
    if (refs.length > 0) out.set(t.id, refs);
  }
  return out;
}

/** "obilet.com 8,8/10 (18 yorum)" style fragment for one reference; null when the source has no rating either. */
export function ratingRefLabel(ref: HotelRatingRef): string | null {
  if (ref.rating === null) return null;
  const score = `${ref.rating.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}/${ref.ratingBest}`;
  return ref.reviewCount !== null ? `${score} (${ref.reviewCount.toLocaleString('tr-TR')} yorum)` : score;
}
