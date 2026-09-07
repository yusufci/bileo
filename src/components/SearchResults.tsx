import React, { Suspense, lazy, useEffect, useId, useMemo, useState } from 'react';
import {
  BileoStar,
  BileoArrowRight,
  BileoCalendar,
  BileoChevronRight,
  BileoBus,
  BileoPlane,
  BileoTrain,
  BileoFerry,
  BileoRotateCcw,
  BileoSparkles,
  BileoExternalLink,
} from './icons';
import type { LiveSearchState, RouteItem, SearchFilterState, TransportType } from '../types';
import type { CarOffer, HotelOffer, TurnaKind, TurnaQuery, TurnaSuccess } from '../lib/turna/types';
import { kindToTransportType, turnaKindLabelTr } from '../lib/turna/adapter';
import { formatTrClock, formatTrDate, parseBileoDurationMinutes, priceTL } from '../lib/turna/format';
import { findCarCity, findPlaceBySlug } from '../lib/turna/places';
import { isCityKind } from '../lib/turna/urls';
import { sound } from '../utils/sound';
import { ProvenanceStrip } from './results/ProvenanceStrip';
import { PriceStatsRow } from './results/PriceStatsRow';
import { PriceDeltaLine } from './results/PriceDeltaLine';
import { PriceHistoryStrip } from './results/PriceHistoryStrip';
import { DayStrip } from './results/DayStrip';
import { RouteFactsLine, hasRouteFacts } from './results/RouteFactsLine';
import { ResultsSkeleton } from './results/ResultsSkeleton';
import { SearchStateNotice, errorNoticeCopy } from './results/SearchStateNotice';
import { FerryFactsPanel } from './results/FerryFactsPanel';
// Hotel and car panels are only needed for city searches, so they ship as separate chunks. The
// loaders memoise their promise so `preloadCityResults` and React.lazy share one download.
let hotelResultsModule: Promise<typeof import('./results/HotelResults')> | null = null;
let carResultsModule: Promise<typeof import('./results/CarResults')> | null = null;
const loadHotelResults = () => (hotelResultsModule ??= import('./results/HotelResults'));
const loadCarResults = () => (carResultsModule ??= import('./results/CarResults'));
const HotelResults = lazy(() => loadHotelResults().then((m) => ({ default: m.HotelResults })));
const CarResults = lazy(() => loadCarResults().then((m) => ({ default: m.CarResults })));

/** Warms both city panels (used by the Hero on tab hover/focus and by SSR tests). */
export function preloadCityResults(): Promise<void> {
  return Promise.all([loadHotelResults(), loadCarResults()]).then(() => undefined);
}

/** Shown while a city panel chunk downloads; never on the server-rendered path once preloaded. */
export const CITY_PANEL_LOADING_COPY = 'Liste hazırlanıyor...';
import { BrandLogo } from './results/BrandLogo';
import { OTHER_SOURCES_BELOW_HINT, OtherSourcesPanel, hasOtherSourceRows } from './results/OtherSourcesPanel';
import type { OtherSourcesState } from './results/OtherSourcesPanel';
import type { SourceHotel, SourceKind } from '../lib/sources/types';
import { matchHotelRatings } from '../lib/sources/hotelMatch';

export interface SearchResultsProps {
  routes: RouteItem[];
  searchState: SearchFilterState;
  /** Lifecycle of the live Turna search. When omitted the component falls back to isLiveScraping/routes. */
  live?: LiveSearchState;
  /** Re-run the current query bypassing the server cache (throttled locally for 30 s). */
  onRefresh?: () => void;
  /** Legacy loading flag, used only when `live` is undefined. */
  isLiveScraping?: boolean;
  /** Legacy alias of onRefresh. */
  onTriggerLiveScrape?: () => void;
  onUpdateSearchState?: (updates: Partial<SearchFilterState>) => void;
  onSelectRoute: (route: RouteItem) => void;
  onOpenPriceAlert?: (minPrice: number) => void;
  /** Non-Turna landing-page sources for the same query; rendered under the Turna list with their own attribution. */
  otherSources?: OtherSourcesState;
}

type TimeFilter = 'all' | 'morning' | 'afternoon' | 'evening';
type SortKey = 'cheapest' | 'fastest' | 'earliest' | 'rating';
type ErrorState = Extract<LiveSearchState, { status: 'error' }>;

/** Internal view state: `live` when provided, else derived from the legacy props. */
type EffectiveState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; result: TurnaSuccess | null; routes: RouteItem[]; droppedItems: number }
  | { kind: 'facts-only'; result: TurnaSuccess }
  | { kind: 'unsupported'; reason: string }
  | { kind: 'error'; state: ErrorState };

const REFRESH_COOLDOWN_MS = 30_000;
const REFRESH_COOLDOWN_TITLE = 'Yenileme sınırı: 30 saniye';

const MODE_LABEL: Record<TransportType, string> = {
  otobus: 'Otobüs',
  ucak: 'Uçak',
  tren: 'Tren',
  feribot: 'Feribot',
};

const TRANSPORT_ICON: Record<TransportType, React.ComponentType<{ className?: string }>> = {
  otobus: BileoBus,
  ucak: BileoPlane,
  tren: BileoTrain,
  feribot: BileoFerry,
};

const TIME_FILTERS: Array<{ id: TimeFilter; label: string }> = [
  { id: 'all', label: 'Tüm Saatler' },
  { id: 'morning', label: 'Sabah (06:00 - 12:00)' },
  { id: 'afternoon', label: 'Öğle (12:00 - 18:00)' },
  { id: 'evening', label: 'Akşam (18:00+)' },
];

function deriveState(live: LiveSearchState | undefined, routes: RouteItem[], isLiveScraping: boolean): EffectiveState {
  if (live) {
    switch (live.status) {
      case 'idle':
        return { kind: 'idle' };
      case 'loading':
        return { kind: 'loading' };
      case 'ok':
        return { kind: 'ok', result: live.result, routes: live.routes, droppedItems: live.droppedItems };
      case 'facts-only':
        return { kind: 'facts-only', result: live.result };
      case 'unsupported':
        return { kind: 'unsupported', reason: live.reason };
      case 'error':
        return { kind: 'error', state: live };
    }
  }
  if (isLiveScraping) return { kind: 'loading' };
  return { kind: 'ok', result: null, routes, droppedItems: 0 };
}

/** Transport mode the current view is about: the live query's kind when known, else the tab. */
function deriveMode(live: LiveSearchState | undefined, fallback: TransportType): TransportType {
  if (!live) return fallback;
  if (live.status === 'unsupported') return live.transportType;
  if (live.status === 'ok' || live.status === 'facts-only') return kindToTransportType(live.result.kind) ?? fallback;
  if ((live.status === 'loading' || live.status === 'error') && live.query) return kindToTransportType(live.query.kind) ?? fallback;
  return fallback;
}

/** Turna kind of the live query when one is known (ok, facts-only, loading, error with query). */
function liveKindOf(live: LiveSearchState | undefined): TurnaKind | null {
  if (!live) return null;
  if (live.status === 'ok' || live.status === 'facts-only') return live.result.kind;
  if ((live.status === 'loading' || live.status === 'error') && live.query) return live.query.kind;
  return null;
}

/** City slug of a hotel/car query (the server accepts `city`, falling back to `to`, then `from`). */
function citySlugOf(query: TurnaQuery | null | undefined): string | null {
  if (!query) return null;
  const slug = (query.city ?? query.to ?? query.from ?? '').trim();
  return slug || null;
}

function liveQueryOf(live: LiveSearchState | undefined): TurnaQuery | null {
  if (!live) return null;
  if (live.status === 'ok' || live.status === 'facts-only') return live.result.query;
  if (live.status === 'loading' || live.status === 'error') return live.query;
  return null;
}

/**
 * Display name of the city behind a hotel/car page: the curated places dataset first (İstanbul, Çeşme),
 * then the leading segment of Turna's own page title ("Antalya Otelleri - ..." -> "Antalya"), then the
 * slug with its first letter upper-cased.
 */
export function cityDisplayName(slug: string | null, pageTitle: string | null): string {
  if (slug) {
    const known = findCarCity(slug)?.cityName ?? findPlaceBySlug(slug)?.cityName;
    if (known) return known;
  }
  if (pageTitle) {
    const head = pageTitle.split(/\s+[-|]\s+/)[0]?.trim() ?? '';
    const city = head.replace(/\s+(?:[Oo]telleri|[Aa]raç [Kk]iralama)$/u, '').trim();
    if (city && city.length <= 40) return city;
  }
  if (slug) return slug.charAt(0).toLocaleUpperCase('tr-TR') + slug.slice(1);
  return 'Şehir';
}

/** "Antalya otelleri" / "İstanbul araç kiralama". */
export function cityHeading(kind: TurnaKind, city: string): string {
  return kind === 'hotel' ? `${city} otelleri` : `${city} araç kiralama`;
}

/** Replaces the route-page disclosure of ProvenanceStrip, which speaks of fares and departure dates. */
const CITY_DISCLOSURE: Record<'hotel' | 'car', string> = {
  hotel: 'Bu liste Turna.com şehir sayfasında listelenen otellerdir; fiyatlar tarih seçimine bağlı olduğu için burada gösterilmez.',
  car: 'Bu liste Turna.com şehir sayfasında yayımlanan araçların günlük fiyatlarıdır; tarih ve teslim noktasına göre değişebilir.',
};

const CITY_EMPTY_TITLE = 'Turna bu şehir için liste yayımlamamış.';
const CITY_EMPTY_MESSAGE: Record<'hotel' | 'car', string> = {
  hotel: 'Şehir sayfası alındı ancak otel listesi içermiyor. Güncel oteller için kaynak sayfayı açabilirsiniz.',
  car: 'Şehir sayfası alındı ancak araç listesi içermiyor. Güncel araçlar için kaynak sayfayı açabilirsiniz.',
};

function departureHour(route: RouteItem): number {
  const hour = parseInt(route.departureTime.split(':')[0] ?? '', 10);
  return Number.isFinite(hour) ? hour : -1;
}

function durationMinutesOf(route: RouteItem): number {
  return route.durationMinutes ?? parseBileoDurationMinutes(route.duration) ?? Number.MAX_SAFE_INTEGER;
}

function compareEarliest(a: RouteItem, b: RouteItem): number {
  const aAt = a.provenance?.departureAt;
  const bAt = b.provenance?.departureAt;
  if (aAt && bAt) return aAt.localeCompare(bAt);
  return a.departureTime.localeCompare(b.departureTime);
}

function hasFinitePrice(route: RouteItem): boolean {
  return typeof route.price === 'number' && Number.isFinite(route.price);
}

const SeatChip: React.FC<{ seats: number }> = ({ seats }) => {
  if (seats <= 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
        Boş koltuk yok
      </span>
    );
  }
  if (seats <= 6) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
        Son {seats} koltuk
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
      {seats} boş koltuk
    </span>
  );
};

export const SearchResults: React.FC<SearchResultsProps> = ({
  routes,
  searchState,
  live,
  onRefresh,
  isLiveScraping = false,
  onTriggerLiveScrape,
  onUpdateSearchState,
  onSelectRoute,
  onOpenPriceAlert,
  otherSources,
}) => {
  const state = deriveState(live, routes, isLiveScraping);
  const modeType = deriveMode(live, searchState.transportType);
  const sortId = useId();

  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('all');
  const [only2Plus1, setOnly2Plus1] = useState(false);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('cheapest');
  const [localDay, setLocalDay] = useState<string | null>(null);

  // Manual refresh is throttled locally: disabled while loading and for 30 s after use.
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const wait = cooldownUntil - Date.now();
    if (wait <= 0) return undefined;
    const id = setTimeout(() => setNowTick(Date.now()), wait + 50);
    return () => clearTimeout(id);
  }, [cooldownUntil, nowTick]);
  const inCooldown = cooldownUntil > nowTick;
  const refreshHandler = onRefresh ?? onTriggerLiveScrape;
  const refreshDisabled = state.kind === 'loading' || inCooldown;
  const handleRefresh = refreshHandler
    ? () => {
        if (refreshDisabled) return;
        sound.playTick();
        setCooldownUntil(Date.now() + REFRESH_COOLDOWN_MS);
        refreshHandler();
      }
    : undefined;
  const retryHandler = refreshHandler
    ? () => {
        sound.playTick();
        refreshHandler();
      }
    : undefined;

  const okRoutes: RouteItem[] = state.kind === 'ok' ? state.routes : [];
  const result: TurnaSuccess | null = state.kind === 'ok' ? state.result : null;
  const stats = result?.stats ?? null;
  const otherSourcesKind: SourceKind | null = result
    ? result.kind === 'bus' || result.kind === 'flight' || result.kind === 'hotel'
      ? result.kind
      : null
    : searchState.searchKind === 'otel'
      ? 'hotel'
      : searchState.transportType === 'otobus'
        ? 'bus'
        : searchState.transportType === 'ucak'
          ? 'flight'
          : null;
  const otherSourcesPanel =
    otherSources && otherSourcesKind ? <OtherSourcesPanel state={otherSources} kind={otherSourcesKind} turnaMinPrice={stats?.min ?? null} className="mt-8" /> : null;
  const days = stats?.byDay ?? [];

  // Hotel and car pages are about one city, not a route: they get their own eyebrow, heading and body.
  const liveKind = liveKindOf(live);
  const cityMode = liveKind !== null && isCityKind(liveKind);
  const cityResult: TurnaSuccess | null = result && isCityKind(result.kind) ? result : null;
  const liveResultTitle =
    state.kind === 'ok' ? state.result?.pageTitle ?? null : state.kind === 'facts-only' ? state.result.pageTitle : null;
  const cityName = cityMode ? cityDisplayName(citySlugOf(liveQueryOf(live)), liveResultTitle) : '';

  // The selected day lives in searchState when App wires onUpdateSearchState, else locally.
  const requestedDay = onUpdateSearchState ? searchState.selectedDay ?? null : localDay;
  const selectedDay = requestedDay && days.some((d) => d.date === requestedDay) ? requestedDay : null;
  const handleSelectDay = (day: string | null) => {
    setLocalDay(day);
    onUpdateSearchState?.({ selectedDay: day ?? undefined });
  };

  const modalRoutes = useMemo(() => okRoutes.filter((r) => r.transportType === modeType), [okRoutes, modeType]);
  const hasRating = useMemo(() => modalRoutes.some((r) => typeof r.rating === 'number'), [modalRoutes]);
  const hasVehicleType = useMemo(
    () => modalRoutes.some((r) => typeof r.vehicleType === 'string' && r.vehicleType.length > 0),
    [modalRoutes],
  );
  const currentModalCompanies = useMemo(() => Array.from(new Set(modalRoutes.map((r) => r.company))), [modalRoutes]);
  const companyFilter = currentModalCompanies.includes(selectedCompanyFilter) ? selectedCompanyFilter : 'all';
  const effectiveSort: SortKey = sortBy === 'rating' && !hasRating ? 'cheapest' : sortBy;
  const effectiveOnly2Plus1 = only2Plus1 && hasVehicleType;

  const filteredRoutes = useMemo(() => {
    return modalRoutes
      .filter((route) => {
        if (selectedDay && route.provenance?.dateIso !== selectedDay) return false;
        if (companyFilter !== 'all' && route.company !== companyFilter) return false;
        if (selectedTimeFilter !== 'all') {
          const hour = departureHour(route);
          if (selectedTimeFilter === 'morning' && (hour < 6 || hour >= 12)) return false;
          if (selectedTimeFilter === 'afternoon' && (hour < 12 || hour >= 18)) return false;
          if (selectedTimeFilter === 'evening' && hour < 18) return false;
        }
        if (effectiveOnly2Plus1 && !route.vehicleType?.includes('2+1')) return false;
        return true;
      })
      .sort((a, b) => {
        if (effectiveSort === 'cheapest') return a.price - b.price;
        if (effectiveSort === 'rating') return (b.rating ?? -1) - (a.rating ?? -1);
        if (effectiveSort === 'earliest') return compareEarliest(a, b);
        if (effectiveSort === 'fastest') return durationMinutesOf(a) - durationMinutesOf(b);
        return 0;
      });
  }, [modalRoutes, selectedDay, companyFilter, selectedTimeFilter, effectiveOnly2Plus1, effectiveSort]);

  const handleResetFilters = () => {
    setSelectedTimeFilter('all');
    setOnly2Plus1(false);
    setSelectedCompanyFilter('all');
    setSortBy('cheapest');
    handleSelectDay(null);
  };

  const fromLabel = searchState.fromCity || 'Kalkış';
  const toLabel = searchState.toCity || 'Varış';
  const dateLabel = selectedDay
    ? formatTrDate(selectedDay)
    : result
      ? 'Yaklaşan tarihler'
      : searchState.departureDate;

  const renderEyebrow = () => {
    if (cityMode && liveKind) {
      return (
        <div className="flex flex-wrap items-center gap-2 text-xs font-black text-bordeaux-700 dark:text-bordeaux-300 uppercase tracking-wider">
          <span>{cityName}</span>
          <span className="text-charcoal-muted normal-case tracking-normal font-bold">
            <span aria-hidden="true">· </span>
            {turnaKindLabelTr(liveKind)}
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs font-black text-bordeaux-700 dark:text-bordeaux-300 uppercase tracking-wider">
        <span>{fromLabel}</span>
        <BileoArrowRight className="w-3.5 h-3.5" />
        <span>{toLabel}</span>
        <span className="text-charcoal-muted normal-case tracking-normal font-bold">
          <span aria-hidden="true">· </span>
          {MODE_LABEL[modeType]}
          {dateLabel ? `, ${dateLabel}` : ''}
        </span>
      </div>
    );
  };

  const renderSourceLine = (res: TurnaSuccess) => {
    const clock = formatTrClock(res.scrapedAt);
    const via = res.fetchedVia === 'cache' ? 'Önbellekten' : 'Canlı alındı';
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-charcoal-muted">
        <span className="tabular-nums" title={res.scrapedAt}>
          {clock ? `${via} ${clock}` : via}
        </span>
        <a
          href={res.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-bordeaux-700 dark:text-bordeaux-300 hover:text-bordeaux-800 underline-offset-2 hover:underline"
        >
          <span>Kaynak sayfa</span>
          <BileoExternalLink className="w-3.5 h-3.5" />
          <span className="sr-only"> (yeni sekmede açılır)</span>
        </a>
      </div>
    );
  };

  const renderRouteCard = (route: RouteItem) => {
    const features = route.features?.slice(0, 3) ?? [];
    const hasAmenities = features.length > 0;
    const TransportIcon = TRANSPORT_ICON[route.transportType] ?? BileoBus;
    const priced = hasFinitePrice(route);
    return (
      <article
        key={route.id}
        aria-label={`${route.company}, ${route.departureTime} ${route.from}${route.date ? `, ${route.date}` : ''}`}
        className="bg-white rounded-3xl p-6 shadow-soft transition-all hover:shadow-soft-lg border border-[#FAF7F2]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-3 space-y-2">
            <div className="h-8 flex items-center">
              <BrandLogo
                name={route.company}
                transportType={route.transportType}
                logoUrl={route.provenance?.logoUrl ?? route.companyLogo ?? null}
                size="lg"
              />
            </div>
            {route.vehicleType && <p className="text-xs text-charcoal-muted font-medium">{route.vehicleType}</p>}
            {typeof route.rating === 'number' && (
              <div className="flex items-center gap-1 text-xs">
                <BileoStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="font-bold text-charcoal tabular-nums">{route.rating}</span>
                {typeof route.reviewCount === 'number' && (
                  <span className="text-[11px] text-charcoal-muted tabular-nums">({route.reviewCount} Değerlendirme)</span>
                )}
              </div>
            )}
            {typeof route.availableSeats === 'number' && (
              <div className="pt-0.5">
                <SeatChip seats={route.availableSeats} />
              </div>
            )}
          </div>

          <div className={hasAmenities ? 'lg:col-span-5' : 'lg:col-span-7'}>
            {route.date && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-charcoal mb-2">
                <BileoCalendar className="w-3.5 h-3.5 text-charcoal-muted" />
                <span>{route.date}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-charcoal font-display tabular-nums">{route.departureTime}</span>
                <p className="text-xs font-bold text-charcoal">{route.from}</p>
                <p className="text-[10px] text-charcoal-muted truncate max-w-[140px]">{route.fromTerminal}</p>
              </div>
              <div className="flex-1 px-4 text-center">
                {route.duration && (
                  <span className="text-[11px] font-bold text-charcoal-muted block tabular-nums">{route.duration}</span>
                )}
                <div className="relative flex items-center justify-center my-1.5 gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-bordeaux-700 flex-shrink-0" />
                  <div className="flex-1 h-[1px] bg-[#E8E1D5]" />
                  <TransportIcon className="w-3.5 h-3.5 text-bordeaux-700 flex-shrink-0" />
                  <div className="flex-1 h-[1px] bg-[#E8E1D5]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-bordeaux-700/40 flex-shrink-0" />
                </div>
                {route.provenance?.isDirect === true && (
                  <span className="text-[10px] text-charcoal font-bold">Direkt Sefer</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-charcoal font-display tabular-nums">{route.arrivalTime}</span>
                <p className="text-xs font-bold text-charcoal">{route.to}</p>
                <p className="text-[10px] text-charcoal-muted truncate max-w-[140px] ml-auto">{route.toTerminal}</p>
              </div>
            </div>
          </div>

          {hasAmenities && (
            <div className="lg:col-span-2 hidden xl:flex flex-col gap-1 text-[11px] text-charcoal-muted pl-2">
              {features.map((feature) => (
                <span key={feature}>{feature}</span>
              ))}
            </div>
          )}

          <div
            className={`${
              hasAmenities ? 'lg:col-span-4 xl:col-span-2' : 'lg:col-span-2'
            } flex lg:flex-col items-center lg:items-end justify-between gap-3 pt-2 lg:pt-0`}
          >
            <div>
              <span className="text-[10px] text-charcoal-muted block text-left lg:text-right">Bilet Fiyatı</span>
              <span className="text-2xl font-black text-charcoal font-display tabular-nums">
                {priced ? priceTL(route.price, 2) : 'Fiyat yok'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playTick();
                onSelectRoute(route);
              }}
              className="px-6 py-3.5 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-bordeaux cursor-pointer transition-all flex items-center justify-center gap-2 min-h-[46px] hover:shadow-md"
            >
              <span>{route.provenance ? 'İncele' : 'Bilet Al / İncele'}</span>
              <BileoChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>
    );
  };

  /** Quiet notice for a hotel/car page that lists nothing (facts-only, or an ok body with zero offers). */
  const renderCityEmpty = (res: TurnaSuccess, kind: 'hotel' | 'car') => (
    <SearchStateNotice
      tone="quiet"
      announce={false}
      title={CITY_EMPTY_TITLE}
      message={CITY_EMPTY_MESSAGE[kind]}
      action={retryHandler ? { label: 'Tekrar dene', onClick: retryHandler } : undefined}
    >
      {renderSourceLine(res)}
    </SearchStateNotice>
  );

  const renderCityResults = (res: TurnaSuccess) => {
    const kind: 'hotel' | 'car' = res.kind === 'hotel' ? 'hotel' : 'car';
    const hotels = kind === 'hotel' ? res.items.filter((item): item is HotelOffer => item.kind === 'hotel') : [];
    const otherHotels: SourceHotel[] =
      kind === 'hotel' && otherSources?.status === 'ok'
        ? otherSources.envelope.results.flatMap((r) => (r.success ? r.items.filter((i): i is SourceHotel => i.kind === 'hotel') : []))
        : [];
    const otherRatings = kind === 'hotel' && otherHotels.length > 0 ? matchHotelRatings(hotels, otherHotels) : undefined;
    const cars = kind === 'car' ? res.items.filter((item): item is CarOffer => item.kind === 'car') : [];
    const count = kind === 'hotel' ? hotels.length : cars.length;
    const dropped = state.kind === 'ok' ? state.droppedItems : 0;
    return (
      <>
        <div className="mb-4">
          <ProvenanceStrip
            result={res}
            offerCount={count}
            dayCount={0}
            countLabel={`${count} ${kind === 'hotel' ? 'otel' : 'araç'}`}
            droppedItems={dropped}
            onRefresh={handleRefresh}
            refreshDisabled={refreshDisabled}
            refreshTitle={inCooldown ? REFRESH_COOLDOWN_TITLE : undefined}
            showDisclosure={false}
          />
          <p className="px-1 pt-2 text-[11px] text-charcoal-muted">{CITY_DISCLOSURE[kind]}</p>
        </div>

        <div className="pb-4 mb-6 space-y-1">
          {renderEyebrow()}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B18] font-display">
            {cityHeading(kind, cityName)} <span className="tabular-nums">({count})</span>
          </h2>
        </div>

        {count === 0 ? (
          renderCityEmpty(res, kind)
        ) : (
          <Suspense
            fallback={
              <p className="text-xs text-charcoal-muted" data-lazy-fallback="city-results" aria-live="polite">
                {CITY_PANEL_LOADING_COPY}
              </p>
            }
          >
            {kind === 'hotel' ? <HotelResults items={hotels} result={res} otherRatings={otherRatings} /> : <CarResults items={cars} result={res} />}
          </Suspense>
        )}
        {otherSourcesPanel}
      </>
    );
  };

  const renderOk = () => {
    if (cityResult) return renderCityResults(cityResult);

    if (okRoutes.length === 0) {
      // `ok` implies the source returned items; an empty list here means every one of them was
      // rejected by the guard or the adapter (or none was a transport offer). Say so, with the count.
      const dropped = state.kind === 'ok' ? state.droppedItems : 0;
      const emptyMessage = result
        ? dropped > 0
          ? `Turna ${dropped} teklif döndürdü ancak hiçbiri doğrulanamadı.`
          : 'Turna yanıtı bu sekmede listelenebilir sefer içermiyor.'
        : 'Kaynak, bu rota için sefer döndürmedi.';
      return (
        <>
          {result && (
            <div className="mb-4">
              <ProvenanceStrip
                result={result}
                offerCount={0}
                dayCount={days.length}
                droppedItems={dropped}
                onRefresh={handleRefresh}
                refreshDisabled={refreshDisabled}
                refreshTitle={inCooldown ? REFRESH_COOLDOWN_TITLE : undefined}
              />
            </div>
          )}
          <SearchStateNotice
            tone="quiet"
            announce={false}
            title="Bu arama için listelenecek sefer bulunamadı"
            message={emptyMessage}
            action={retryHandler ? { label: 'Tekrar dene', onClick: retryHandler } : undefined}
          />
          {otherSourcesPanel}
        </>
      );
    }

    const priceAlertMin =
      stats?.min ?? (filteredRoutes.length > 0 ? Math.min(...filteredRoutes.filter(hasFinitePrice).map((r) => r.price)) : null);

    return (
      <>
        {result && (
          <div className="mb-4">
            <ProvenanceStrip
              result={result}
              offerCount={okRoutes.length}
              dayCount={days.length}
              droppedItems={state.kind === 'ok' ? state.droppedItems : 0}
              onRefresh={handleRefresh}
              refreshDisabled={refreshDisabled}
              refreshTitle={inCooldown ? REFRESH_COOLDOWN_TITLE : undefined}
            />
          </div>
        )}

        <div className="pb-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 flex-1">
              <div className="space-y-1">
                {renderEyebrow()}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B18] font-display">
                  Bulunan Teklifler ({filteredRoutes.length})
                </h2>
                {stats && <PriceStatsRow stats={stats} className="pt-1" />}
                {result?.delta && <PriceDeltaLine delta={result.delta} className="pt-0.5" />}
                {result && <PriceHistoryStrip history={result.history} className="pt-1" />}
              </div>

              {onOpenPriceAlert && priceAlertMin !== null && Number.isFinite(priceAlertMin) && (
                <button
                  type="button"
                  onClick={() => onOpenPriceAlert(priceAlertMin)}
                  className="self-start px-3 py-1.5 rounded-xl bg-cream-200 hover:bg-cream-300 text-charcoal text-xs font-extrabold transition-colors cursor-pointer"
                  title="Fiyatlar düştüğünde e-posta ile bildirim al"
                >
                  <span>Fiyat Alarmı Kur</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {TIME_FILTERS.map((time) => (
                  <button
                    key={time.id}
                    type="button"
                    aria-pressed={selectedTimeFilter === time.id}
                    onClick={() => setSelectedTimeFilter(time.id)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-colors cursor-pointer ${
                      selectedTimeFilter === time.id
                        ? 'bg-bordeaux-700 text-white'
                        : 'bg-cream-200 hover:bg-cream-300 text-charcoal'
                    }`}
                  >
                    {time.label}
                  </button>
                ))}

                {hasVehicleType && (
                  <button
                    type="button"
                    aria-pressed={only2Plus1}
                    onClick={() => setOnly2Plus1(!only2Plus1)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-colors cursor-pointer ${
                      only2Plus1 ? 'bg-bordeaux-700 text-white' : 'bg-cream-200 hover:bg-cream-300 text-charcoal'
                    }`}
                  >
                    Sadece 2+1
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor={sortId} className="text-charcoal-muted font-bold">
                  Sıralama:
                </label>
                <select
                  id={sortId}
                  value={effectiveSort}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="bg-cream-200 hover:bg-cream-300 px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-charcoal focus:outline-none cursor-pointer border-0"
                >
                  <option value="cheapest">En Düşük Fiyat</option>
                  <option value="earliest">En Erken Kalkış</option>
                  <option value="fastest">En Hızlı Sefer</option>
                  {hasRating && <option value="rating">En Yüksek Puanlı</option>}
                </select>
              </div>
            </div>
          </div>

          {currentModalCompanies.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-3">
              <span className="text-[10px] font-extrabold text-charcoal-muted uppercase shrink-0">Firma:</span>
              <button
                type="button"
                aria-pressed={companyFilter === 'all'}
                onClick={() => setSelectedCompanyFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  companyFilter === 'all' ? 'bg-[#1E1B18] text-white' : 'bg-cream-200 hover:bg-cream-300 text-charcoal'
                }`}
              >
                Tümü ({modalRoutes.length})
              </button>
              {currentModalCompanies.map((comp) => (
                <button
                  key={comp}
                  type="button"
                  aria-pressed={companyFilter === comp}
                  onClick={() => setSelectedCompanyFilter(comp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    companyFilter === comp ? 'bg-[#1E1B18] text-white' : 'bg-cream-200 hover:bg-cream-300 text-charcoal'
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          )}

          {result && hasRouteFacts(result.facts) && (
            <RouteFactsLine facts={result.facts} transportType={modeType} className="pt-3" />
          )}
        </div>

        {days.length > 0 && (
          <div className="mb-4">
            <DayStrip days={days} selectedDay={selectedDay} onSelect={handleSelectDay} />
          </div>
        )}

        {filteredRoutes.length > 0 ? (
          <div className="space-y-4">{filteredRoutes.map(renderRouteCard)}</div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E1D5] space-y-4 shadow-soft">
            {/* Accent on the icon itself: index.css forces `color` on .bg-cream-100 in dark mode. */}
            <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto">
              <BileoSparkles className="w-8 h-8 text-bordeaux-700 dark:text-bordeaux-300" />
            </div>
            <div className="text-lg font-black text-[#1E1B18] font-display">Seçilen Filtrelerle Eşleşen Sefer Bulunamadı</div>
            <p className="text-xs text-charcoal-muted max-w-md mx-auto">
              Uyguladığınız tarih, saat, firma veya 2+1 koltuk filtrelerine uygun sefer bulunamadı. Filtreleri temizleyerek tüm seferleri görüntüleyebilirsiniz.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-bold shadow-bordeaux flex items-center gap-2 mx-auto cursor-pointer transition-colors"
            >
              <BileoRotateCcw className="w-4 h-4" />
              <span>Filtreleri Temizle</span>
            </button>
          </div>
        )}
        {otherSourcesPanel}
      </>
    );
  };

  const renderFactsOnly = (res: TurnaSuccess) => {
    if (res.kind === 'hotel' || res.kind === 'car') return renderCityEmpty(res, res.kind);
    if (res.kind === 'ferry') {
      return (
        <FerryFactsPanel
          result={res}
          onRefresh={handleRefresh}
          refreshDisabled={refreshDisabled}
          refreshTitle={inCooldown ? REFRESH_COOLDOWN_TITLE : undefined}
        />
      );
    }
    return (
      <>
      <SearchStateNotice
        tone="info"
        announce={false}
        title="Turna bu rota için yapısal teklif yayımlamamış"
        message="Rota sayfası alındı ancak fiyatlı sefer bilgisi içermiyor. Rota bilgisi aşağıda; güncel teklifler için kaynak sayfayı açabilirsiniz."
        action={retryHandler ? { label: 'Tekrar dene', onClick: retryHandler } : undefined}
      >
        {hasRouteFacts(res.facts) && (
          <RouteFactsLine facts={res.facts} transportType={modeType} className="justify-center" />
        )}
        {res.warnings.length > 0 && (
          <ul className="text-[11px] text-charcoal-muted list-disc list-inside space-y-0.5 max-w-md mx-auto text-left">
            {res.warnings.map((warning, i) => (
              <li key={`${i}-${warning}`}>{warning}</li>
            ))}
          </ul>
        )}
        {renderSourceLine(res)}
      </SearchStateNotice>
        {otherSourcesPanel}
      </>
    );
  };

  // A Turna failure (blocked, rate limited, upstream down) must not hide what the other sources answered:
  // the panel stays under the error notice with its own attribution and nothing from Turna is invented.
  const renderError = (err: ErrorState) => {
    const copy = errorNoticeCopy(err, { fromCity: searchState.fromCity, toCity: searchState.toCity });
    const detail = `Hata kodu: ${err.errorCode}${err.httpStatus ? `, HTTP ${err.httpStatus}` : ''}`;
    return (
      <>
        <SearchStateNotice
          tone="error"
          announce={false}
          title={copy.title}
          message={copy.message}
          detail={detail}
          retryAfterSeconds={err.retryAfterSeconds}
          action={retryHandler && err.errorCode !== 'aborted' ? { label: 'Tekrar dene', onClick: retryHandler } : undefined}
        >
          {otherSourcesPanel && hasOtherSourceRows(otherSources) && <p className="text-xs font-bold text-charcoal">{OTHER_SOURCES_BELOW_HINT}</p>}
        </SearchStateNotice>
        {otherSourcesPanel}
      </>
    );
  };

  const renderBody = () => {
    switch (state.kind) {
      case 'idle':
        return <SearchStateNotice tone="quiet" announce={false} title="Aramayı başlatmak için giriş yapın." />;
      case 'loading':
        // Turna may use its whole host budget (retries, block cooldown) while obilet or enuygun answer in well under a
        // second. Sources that already answered are shown under the skeleton with their own attribution; their loading
        // line is not repeated here, so the screen never shows two loading indicators.
        return (
          <>
            <ResultsSkeleton announce={false} />
            {otherSources?.status === 'ok' ? otherSourcesPanel : null}
          </>
        );
      case 'ok':
        return renderOk();
      case 'facts-only':
        return renderFactsOnly(state.result);
      case 'unsupported': {
        const message = 'Turna.com tren bileti sunmuyor; bu sekmede canlı veri yok.';
        return (
          <SearchStateNotice
            tone="quiet"
            announce={false}
            title="Tren için canlı veri yok"
            message={message}
            detail={state.reason && state.reason !== message ? state.reason : undefined}
          />
        );
      }
      case 'error':
        return renderError(state.state);
    }
  };

  // The city branch renders its own eyebrow above its heading, like the route branch does.
  const showStandaloneEyebrow = state.kind !== 'ok' || (okRoutes.length === 0 && !cityResult);

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showStandaloneEyebrow && <div className="mb-4">{renderEyebrow()}</div>}
        {/* The one live region of the section; the notices and skeleton inside it do not re-announce. */}
        <div aria-live="polite" aria-busy={state.kind === 'loading'}>
          {renderBody()}
        </div>
      </div>
    </section>
  );
};
