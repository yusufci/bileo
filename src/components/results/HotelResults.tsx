import React, { useId, useMemo, useState } from 'react';
import type { HotelOffer, TurnaSuccess } from '../../lib/turna/types';
import type { HotelRatingRef } from '../../lib/sources/hotelMatch';
import { ratingRefLabel } from '../../lib/sources/hotelMatch';
import { SOURCE_LABELS } from '../../lib/sources/types';
import { BileoCoffee, BileoExternalLink, BileoMapPin, BileoRotateCcw, BileoStar } from '../icons';

export interface HotelResultsProps {
  items: HotelOffer[];
  result: TurnaSuccess;
  /** Same hotel's rating on other landing-page sources, keyed by Turna hotel id (src/lib/sources/hotelMatch.ts). */
  otherRatings?: Map<string, HotelRatingRef[]>;
}

export const OTHER_RATINGS_LABEL = 'Diğer kaynaklarda:';

type HotelSort = 'rating' | 'reviews' | 'stars' | 'name';

/** Shown instead of a price: Turna hotel landing pages carry no rates (they depend on the dates). */
export const HOTEL_PRICE_NOTE = 'Fiyat tarih seçimine bağlıdır; Turna sayfasında görüntülenir.';
export const HOTEL_LINK_LABEL = "Turna'da gör";
export const HOTEL_EMPTY_FILTER_COPY = 'Filtrelere uyan otel yok.';
const STARS_UNKNOWN_KEY = 'none';
const STARS_UNKNOWN_LABEL = 'Belirtilmemiş';
const MAX_AMENITIES = 4;
const MAX_TAGS = 3;
const TOP_FACETS = 8;
const TURNA_ORIGIN_PREFIX = 'https://www.turna.com/';

/** Per-hotel link only when it is a turna.com page; anything else falls back to the source page. */
export function hotelLinkHref(offer: HotelOffer, result: TurnaSuccess): string {
  return typeof offer.url === 'string' && offer.url.startsWith(TURNA_ORIGIN_PREFIX) ? offer.url : result.sourceUrl;
}

/** 9.4 -> "9,4"; 10 -> "10". */
export function formatHotelRating(rating: number): string {
  return rating.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
}

/** 1735 -> "1.735 yorum". */
export function formatReviewCount(count: number): string {
  return `${count.toLocaleString('tr-TR')} yorum`;
}

/** "Muratpaşa, Antalya" from district + city (deduplicated), else the free-text locality, else null. */
export function hotelLocationLine(offer: HotelOffer): string | null {
  const parts: string[] = [];
  for (const part of [offer.district, offer.city]) {
    const text = (part ?? '').trim();
    if (text && !parts.includes(text)) parts.push(text);
  }
  if (parts.length > 0) return parts.join(', ');
  const locality = (offer.locality ?? '').trim();
  return locality || null;
}

/** "50 otel; 49 tanesinde yıldız bilgisi; puan verisi 50 otelde", each clause only when the data exists. */
export function hotelSummaryLine(items: HotelOffer[]): string {
  const withStars = items.filter((h) => typeof h.stars === 'number' && h.stars > 0).length;
  const withRating = items.filter((h) => typeof h.rating === 'number').length;
  const parts = [`${items.length} otel`];
  if (withStars > 0) parts.push(`${withStars} tanesinde yıldız bilgisi`);
  if (withRating > 0) parts.push(`puan verisi ${withRating} otelde`);
  return parts.join('; ');
}

/** Distinct values ordered by frequency (desc), then alphabetically (tr), capped at `limit`. */
export function topByFrequency(values: string[], limit: number): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'tr'))
    .slice(0, limit);
}

function starsKey(stars: number | null): string {
  return typeof stars === 'number' && stars > 0 ? String(stars) : STARS_UNKNOWN_KEY;
}

function descNullsLast(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

function compareHotels(a: HotelOffer, b: HotelOffer, sort: HotelSort): number {
  let primary = 0;
  if (sort === 'rating') primary = descNullsLast(a.rating, b.rating);
  else if (sort === 'reviews') primary = descNullsLast(a.reviewCount, b.reviewCount);
  else if (sort === 'stars') primary = descNullsLast(a.stars, b.stars);
  return primary || a.name.localeCompare(b.name, 'tr');
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

interface ChipGroupProps {
  label: string;
  options: Array<{ key: string; label: string; count?: number }>;
  selected: string[];
  onToggle: (key: string) => void;
}

/** One facet row of multi-select toggle chips; hidden when the facet has fewer than two values. */
const ChipGroup: React.FC<ChipGroupProps> = ({ label, options, selected, onToggle }) => {
  if (options.length < 2) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      <span className="text-[10px] font-extrabold text-charcoal-muted uppercase shrink-0">{label}:</span>
      {options.map((option) => {
        const active = selected.includes(option.key);
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option.key)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors motion-reduce:transition-none cursor-pointer shrink-0 ${
              active ? 'bg-bordeaux-700 text-white' : 'bg-cream-200 hover:bg-cream-300 text-charcoal'
            }`}
          >
            {option.label}
            {typeof option.count === 'number' && <span className="tabular-nums opacity-70"> {option.count}</span>}
          </button>
        );
      })}
    </div>
  );
};

/** Candidate photo URLs in display order: the primary image first, then the gallery, deduplicated, https only. */
export function hotelPhotoSources(hotel: Pick<HotelOffer, 'image' | 'images'>): string[] {
  const out: string[] = [];
  for (const candidate of [hotel.image, ...hotel.images]) {
    if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate) && !out.includes(candidate)) out.push(candidate);
  }
  return out;
}

/**
 * Lazy hotel photo. When the primary image fails to load (some CDN hosts refuse certain clients) the next
 * gallery photo is tried; only after every candidate fails does the cream initial-letter block appear.
 */
const HotelPhoto: React.FC<{ sources: string[]; name: string }> = ({ sources, name }) => {
  const [failedCount, setFailedCount] = useState(0);
  const src = sources[failedCount];
  const initial = (name.trim().charAt(0) || '?').toLocaleUpperCase('tr-TR');
  return (
    <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-cream-200">
      {src ? (
        <img
          key={src}
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedCount((n) => (sources[n] === src ? n + 1 : n))}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center" aria-hidden="true">
          <span className="font-display text-5xl font-black text-bordeaux-700 dark:text-bordeaux-300">{initial}</span>
        </div>
      )}
    </div>
  );
};

const StarRow: React.FC<{ stars: number }> = ({ stars }) => {
  const count = Math.min(Math.round(stars), 7);
  if (count <= 0) return null;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} yıldız`} title={`${count} yıldız`}>
      {Array.from({ length: count }, (_, i) => (
        <BileoStar key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
      ))}
    </div>
  );
};

/**
 * Hotel offers of one Turna city page: a responsive card grid with sort and facet chips.
 * No prices anywhere (the source publishes none); every field renders only when present.
 */
export const HotelResults: React.FC<HotelResultsProps> = ({ items, result, otherRatings }) => {
  const sortId = useId();
  const [sort, setSort] = useState<HotelSort>('rating');
  const [starFilter, setStarFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [districtFilter, setDistrictFilter] = useState<string[]>([]);

  const starOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const hotel of items) {
      const key = starsKey(hotel.stars);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => {
        if (a === STARS_UNKNOWN_KEY) return 1;
        if (b === STARS_UNKNOWN_KEY) return -1;
        return Number(b) - Number(a);
      })
      .map(([key, count]) => ({ key, label: key === STARS_UNKNOWN_KEY ? STARS_UNKNOWN_LABEL : `${key} yıldız`, count }));
  }, [items]);
  const tagOptions = useMemo(
    () => topByFrequency(items.flatMap((h) => h.tags), TOP_FACETS).map((t) => ({ key: t.value, label: t.value, count: t.count })),
    [items],
  );
  const districtOptions = useMemo(
    () =>
      topByFrequency(items.map((h) => h.district ?? ''), TOP_FACETS).map((d) => ({ key: d.value, label: d.value, count: d.count })),
    [items],
  );
  const hasRating = useMemo(() => items.some((h) => typeof h.rating === 'number'), [items]);
  const hasReviews = useMemo(() => items.some((h) => typeof h.reviewCount === 'number'), [items]);
  const hasStars = useMemo(() => items.some((h) => typeof h.stars === 'number' && h.stars > 0), [items]);
  const effectiveSort: HotelSort =
    (sort === 'rating' && !hasRating) || (sort === 'reviews' && !hasReviews) || (sort === 'stars' && !hasStars) ? 'name' : sort;

  const filtered = useMemo(() => {
    return items
      .filter((hotel) => {
        if (starFilter.length > 0 && !starFilter.includes(starsKey(hotel.stars))) return false;
        if (tagFilter.length > 0 && !hotel.tags.some((t) => tagFilter.includes(t.trim()))) return false;
        if (districtFilter.length > 0 && !districtFilter.includes((hotel.district ?? '').trim())) return false;
        return true;
      })
      .sort((a, b) => compareHotels(a, b, effectiveSort));
  }, [items, starFilter, tagFilter, districtFilter, effectiveSort]);

  const filtersActive = starFilter.length + tagFilter.length + districtFilter.length > 0;
  const resetFilters = () => {
    setStarFilter([]);
    setTagFilter([]);
    setDistrictFilter([]);
  };
  const summary = hotelSummaryLine(items);

  const renderCard = (hotel: HotelOffer) => {
    const location = hotelLocationLine(hotel);
    const amenities = hotel.amenities.filter((a) => a.trim());
    const tags = hotel.tags.filter((t) => t.trim());
    const hasScore = typeof hotel.rating === 'number' || Boolean(hotel.ratingText) || typeof hotel.reviewCount === 'number';
    const showStars = typeof hotel.stars === 'number' && hotel.stars > 0;
    return (
      <article
        key={hotel.id}
        aria-label={hotel.name}
        className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-shadow motion-reduce:transition-none border border-[#FAF7F2] flex flex-col gap-4"
      >
        <HotelPhoto sources={hotelPhotoSources(hotel)} name={hotel.name} />

        <div className="flex-1 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3 className="text-lg font-black text-charcoal font-display leading-tight">{hotel.name}</h3>
              {showStars && <StarRow stars={hotel.stars as number} />}
            </div>
            {hasScore && (
              <div className="flex flex-col items-end text-right shrink-0">
                {typeof hotel.rating === 'number' && (
                  <span className="text-xl font-black font-display tabular-nums leading-none text-bordeaux-700 dark:text-bordeaux-300">
                    {formatHotelRating(hotel.rating)}
                    <span className="text-[10px] font-bold text-charcoal-muted">/{hotel.ratingBest}</span>
                  </span>
                )}
                {hotel.ratingText && <span className="text-[11px] font-bold text-charcoal">{hotel.ratingText}</span>}
                {typeof hotel.reviewCount === 'number' && (
                  <span className="text-[10px] text-charcoal-muted tabular-nums">{formatReviewCount(hotel.reviewCount)}</span>
                )}
              </div>
            )}
          </div>

          {location && (
            <p className="flex items-center gap-1.5 text-xs text-charcoal-muted">
              <BileoMapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          )}

          {amenities.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Olanaklar">
              {amenities.slice(0, MAX_AMENITIES).map((amenity) => (
                <li key={amenity} className="px-2 py-0.5 rounded-lg bg-cream-200 text-charcoal text-[11px] font-bold">
                  {amenity}
                </li>
              ))}
              {amenities.length > MAX_AMENITIES && (
                <li className="px-2 py-0.5 rounded-lg bg-cream-200 text-charcoal text-[11px] font-bold tabular-nums">
                  +{amenities.length - MAX_AMENITIES}
                </li>
              )}
            </ul>
          )}

          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Etiketler">
              {tags.slice(0, MAX_TAGS).map((tag) => (
                <li key={tag} className="px-2 py-0.5 rounded-lg border border-[#E8E1D5] text-charcoal-muted text-[11px] font-bold">
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {hotel.breakfast && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-charcoal">
              <BileoCoffee className="w-3.5 h-3.5 text-charcoal-muted shrink-0" />
              <span>{hotel.breakfast}</span>
            </p>
          )}

          {(() => {
            const refs = (otherRatings?.get(hotel.id) ?? []).filter((r) => ratingRefLabel(r) !== null);
            if (refs.length === 0) return null;
            return (
              <p className="text-xs text-charcoal-muted tabular-nums" data-other-ratings={refs.length}>
                <span className="font-bold text-charcoal">{OTHER_RATINGS_LABEL}</span>{' '}
                {refs.map((r, i) => (
                  <React.Fragment key={r.source}>
                    {i > 0 ? ' · ' : ''}
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-bold text-bordeaux-700 hover:text-bordeaux-800 underline-offset-2 hover:underline">
                      {SOURCE_LABELS[r.source]}
                      <span className="sr-only"> (yeni sekmede açılır)</span>
                    </a>{' '}
                    {ratingRefLabel(r)}
                  </React.Fragment>
                ))}
              </p>
            );
          })()}
        </div>

        <div className="pt-4 border-t border-[#E8E1D5] flex items-center justify-between gap-3">
          <p className="text-[11px] text-charcoal-muted leading-snug">{HOTEL_PRICE_NOTE}</p>
          <a
            href={hotelLinkHref(hotel, result)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2.5 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-bordeaux transition-colors motion-reduce:transition-none inline-flex items-center gap-1.5"
          >
            <span>{HOTEL_LINK_LABEL}</span>
            <BileoExternalLink className="w-3.5 h-3.5" />
            <span className="sr-only"> (yeni sekmede açılır)</span>
          </a>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-charcoal-muted">
            <span>{summary}</span>
            {filtersActive && (
              <span className="tabular-nums">
                {'; '}
                {filtered.length} tanesi filtrelere uyuyor
              </span>
            )}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor={sortId} className="text-charcoal-muted font-bold">
              Sıralama:
            </label>
            <select
              id={sortId}
              value={effectiveSort}
              onChange={(e) => setSort(e.target.value as HotelSort)}
              className="bg-cream-200 hover:bg-cream-300 px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-charcoal focus:outline-none cursor-pointer border-0"
            >
              {hasRating && <option value="rating">Puan</option>}
              {hasReviews && <option value="reviews">Yorum sayısı</option>}
              {hasStars && <option value="stars">Yıldız</option>}
              <option value="name">Ad A-Z</option>
            </select>
          </div>
        </div>
        <ChipGroup label="Yıldız" options={starOptions} selected={starFilter} onToggle={(k) => setStarFilter((s) => toggleValue(s, k))} />
        <ChipGroup label="Etiket" options={tagOptions} selected={tagFilter} onToggle={(k) => setTagFilter((s) => toggleValue(s, k))} />
        <ChipGroup label="Bölge" options={districtOptions} selected={districtFilter} onToggle={(k) => setDistrictFilter((s) => toggleValue(s, k))} />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map(renderCard)}</div>
      ) : (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E8E1D5] space-y-3 shadow-soft">
          <p className="text-base font-black text-[#1E1B18] font-display">{HOTEL_EMPTY_FILTER_COPY}</p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-bold shadow-bordeaux inline-flex items-center gap-2 cursor-pointer transition-colors motion-reduce:transition-none"
          >
            <BileoRotateCcw className="w-4 h-4" />
            <span>Filtreleri Temizle</span>
          </button>
        </div>
      )}
    </div>
  );
};
