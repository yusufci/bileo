import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BileoSwapHorizontal,
  BileoCalendar,
  BileoClock,
  BileoPlane,
  BileoBus,
  BileoTrain,
  BileoFerry,
} from './icons';
import type { SearchFilterState, SearchKind } from '../types';
import { sound } from '../utils/sound';
import {
  searchPlacesForKind,
  popularCities,
  readRecentSearches,
  findCarCity,
  FERRY_STOPS,
  type PlaceSuggestion,
  type RecentSearch,
} from '../lib/turna/places';
import { slugifyTr } from '../lib/turna/urls';

interface HeroSectionProps {
  searchState: SearchFilterState;
  onUpdateSearchState: (updates: Partial<SearchFilterState>) => void;
  onPerformSearch: () => void;
  onSelectCarrier?: (brand: string) => void;
  onOpenPnrQuery?: () => void;
}

const HotelIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" />
    <circle cx="6" cy="11" r="2" />
  </svg>
);

const CarIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

type Endpoint = 'from' | 'to';

/** The two single-city tabs; everything else in SearchKind is a TransportType. */
type CityKind = 'otel' | 'arac';

function isCityKind(kind: SearchKind): kind is CityKind {
  return kind === 'otel' || kind === 'arac';
}

/** One selectable row or chip in the suggestion listbox. */
type HeroOption =
  | { kind: 'place'; suggestion: PlaceSuggestion }
  | { kind: 'stop'; cityName: string; slug: string }
  | { kind: 'recent'; entry: RecentSearch };

interface HeroOptionGroup {
  id: string;
  heading: string;
  layout: 'rows' | 'chips';
  options: HeroOption[];
}

interface HeroTab {
  kind: SearchKind;
  label: string;
  icon: React.ReactNode;
}

/** Tooltip for controls that are kept visible but drive no query yet (product decision deferred). */
const COMING_SOON_TITLE = 'Yakında; bu seçenek henüz arama yapmaz.';

const HERO_TABS: HeroTab[] = [
  { kind: 'otobus', label: 'Otobüs', icon: <BileoBus className="w-6 h-6" /> },
  { kind: 'ucak', label: 'Uçak', icon: <BileoPlane className="w-6 h-6" /> },
  { kind: 'tren', label: 'Tren', icon: <BileoTrain className="w-6 h-6" /> },
  { kind: 'feribot', label: 'Feribot', icon: <BileoFerry className="w-6 h-6" /> },
  { kind: 'otel', label: 'Otel', icon: <HotelIcon className="w-6 h-6" /> },
  { kind: 'arac', label: 'Araç', icon: <CarIcon className="w-6 h-6" /> },
];

const MODE_LABEL: Record<SearchKind, string> = {
  otobus: 'Otobüs',
  ucak: 'Uçak',
  tren: 'Tren',
  feribot: 'Feribot',
  otel: 'Otel',
  arac: 'Araç',
};

/** Footer hint for the single-city tabs; the Turna landing page owns dates and prices there. */
const CITY_KIND_HINT: Record<CityKind, string> = {
  otel: 'Tarih ve fiyat seçimi Turna sayfasında yapılır.',
  arac: 'Günlük fiyatlar Turna landing sayfasından alınır; müsaitlik tarih seçimine bağlıdır.',
};

const SUBMIT_LABEL: Record<CityKind, string> = {
  otel: 'Otel Ara',
  arac: 'Araç Ara',
};

const FROM_INPUT_ID = 'hero-from-input';
const TO_INPUT_ID = 'hero-to-input';
const LISTBOX_ID = 'hero-place-listbox';
const ERROR_ID = 'hero-search-error';
const optionId = (index: number): string => `hero-place-option-${index}`;
const groupHeadingId = (groupId: string): string => `hero-place-group-${groupId}`;

const ModeIcon: React.FC<{ kind: SearchKind; className?: string }> = ({ kind, className }) => {
  if (kind === 'ucak') return <BileoPlane className={className} />;
  if (kind === 'feribot') return <BileoFerry className={className} />;
  if (kind === 'tren') return <BileoTrain className={className} />;
  if (kind === 'otel') return <HotelIcon className={className} />;
  if (kind === 'arac') return <CarIcon className={className} />;
  return <BileoBus className={className} />;
};

function placeholderFor(kind: SearchKind): string {
  if (kind === 'ucak') return 'Şehir veya havalimanı yazın';
  if (kind === 'feribot') return 'Feribot durağı seçin';
  if (kind === 'tren') return 'Şehir yazın';
  if (kind === 'otel') return 'Şehir veya bölge yazın';
  if (kind === 'arac') return 'Teslim alma şehri yazın';
  return 'Şehir veya otogar yazın';
}

/**
 * Second line of a suggestion row: airport codes (ucak), a terminal (otobus), a port (feribot),
 * the region (otel) or "Yurt dışı" for rental cities outside Türkiye (arac).
 */
function suggestionDetail(s: PlaceSuggestion, kind: SearchKind, q: string): string {
  if (kind === 'ucak') {
    return s.airports.length > 0 ? s.airports.map((a) => a.code).join(', ') : s.region;
  }
  if (kind === 'feribot') {
    return s.ferryPorts[0] ?? s.region;
  }
  if (kind === 'arac') {
    return findCarCity(s.slug)?.abroad ? 'Yurt dışı' : s.region;
  }
  if (kind === 'otel') {
    return s.region;
  }
  if (s.matchedOn === 'terminal' && q) {
    const hit = s.terminals.find((t) => slugifyTr(t).includes(q));
    if (hit) return hit;
  }
  return s.terminals[0] ?? s.region;
}

/** IATA code carried for display only: the code the user typed, or the province's single airport. */
function pickAirportCode(s: PlaceSuggestion, q: string, kind: SearchKind): string | undefined {
  if (kind !== 'ucak' || s.airports.length === 0) return undefined;
  const exact = s.airports.find((a) => a.code.toLowerCase() === q);
  if (exact) return exact.code;
  return s.airports.length === 1 ? s.airports[0].code : undefined;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchState,
  onUpdateSearchState,
  onPerformSearch,
}) => {
  const { transportType } = searchState;
  /** Active tab. Otel and Araç leave transportType untouched so the transport form keeps its memory. */
  const activeKind: SearchKind = searchState.searchKind ?? transportType;
  const cityKind: CityKind | null = isCityKind(activeKind) ? activeKind : null;
  const fromCity = searchState.fromCity ?? '';
  const toCity = searchState.toCity ?? '';

  const [activeDropdown, setActiveDropdown] = useState<Endpoint | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [validation, setValidation] = useState<{ field: Endpoint; message: string } | null>(null);
  const [showPassengerModal, setShowPassengerModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setActiveIndex(-1);
        setShowPassengerModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recent searches are written by App after a successful search; re-read whenever the list opens.
  useEffect(() => {
    if (activeDropdown) setRecent(readRecentSearches());
  }, [activeDropdown]);

  // A slug is always slugifyTr(cityName). If another writer changed the city without touching the
  // slug (route pickers in modals), drop the stale slug so App falls back to the typed city.
  useEffect(() => {
    if (searchState.fromSlug !== undefined && searchState.fromSlug !== slugifyTr(fromCity)) {
      onUpdateSearchState({ fromSlug: undefined, fromCode: undefined });
    }
  }, [fromCity, searchState.fromSlug, onUpdateSearchState]);

  useEffect(() => {
    if (searchState.toSlug !== undefined && searchState.toSlug !== slugifyTr(toCity)) {
      onUpdateSearchState({ toSlug: undefined, toCode: undefined });
    }
  }, [toCity, searchState.toSlug, onUpdateSearchState]);

  // The Nereye field is not rendered for Otel/Araç; never leave the popover anchored to it.
  useEffect(() => {
    if (cityKind && activeDropdown === 'to') {
      setActiveDropdown(null);
      setActiveIndex(-1);
    }
  }, [cityKind, activeDropdown]);

  const currentQuery = activeDropdown === 'from' ? fromCity : activeDropdown === 'to' ? toCity : '';
  const trimmedQuery = currentQuery.trim();
  const normalizedQuery = slugifyTr(trimmedQuery);

  const groups = useMemo<HeroOptionGroup[]>(() => {
    if (!activeDropdown) return [];
    if (trimmedQuery.length > 0) {
      const found = searchPlacesForKind(trimmedQuery, activeKind);
      if (found.length === 0) return [];
      return [
        {
          id: 'results',
          heading: `Sonuçlar (${found.length})`,
          layout: 'rows',
          options: found.map((suggestion) => ({ kind: 'place', suggestion })),
        },
      ];
    }
    const out: HeroOptionGroup[] = [];
    const recentForKind = recent.filter((r) => (r.searchKind ?? r.transportType) === activeKind);
    if (recentForKind.length > 0) {
      out.push({
        id: 'recent',
        heading: 'Son aramalar',
        layout: 'rows',
        options: recentForKind.map((entry) => ({ kind: 'recent', entry })),
      });
    }
    if (activeKind === 'feribot') {
      out.push({
        id: 'stops',
        heading: 'Feribot durakları',
        layout: 'chips',
        options: FERRY_STOPS.map((stop) => ({ kind: 'stop', cityName: stop.cityName, slug: stop.slug })),
      });
    } else {
      const popular = popularCities(activeKind);
      if (popular.length > 0) {
        out.push({
          id: 'popular',
          heading: 'Popüler şehirler',
          layout: 'chips',
          options: popular.map((suggestion) => ({ kind: 'place', suggestion })),
        });
      }
    }
    return out;
  }, [activeDropdown, trimmedQuery, activeKind, recent]);

  const flatOptions = useMemo(() => groups.flatMap((g) => g.options), [groups]);

  const groupOffsets = useMemo(() => {
    const offsets: number[] = [];
    let n = 0;
    for (const g of groups) {
      offsets.push(n);
      n += g.options.length;
    }
    return offsets;
  }, [groups]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [trimmedQuery, activeDropdown, activeKind]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const el = document.getElementById(optionId(activeIndex));
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const closeList = () => {
    setActiveDropdown(null);
    setActiveIndex(-1);
  };

  const applyPlace = (target: Endpoint, cityName: string, slug: string, code?: string) => {
    sound.playTick();
    if (cityKind) {
      // Single-city tabs: the chosen city travels in the "from" keys; App reads fromSlug || slugifyTr(fromCity).
      onUpdateSearchState({
        fromCity: cityName,
        fromSlug: slug,
        fromCode: undefined,
        toCity: '',
        toSlug: undefined,
        toCode: undefined,
      });
      setValidation(null);
      closeList();
      return;
    }
    if (target === 'from') {
      onUpdateSearchState({ fromCity: cityName, fromSlug: slug, fromCode: code });
    } else {
      onUpdateSearchState({ toCity: cityName, toSlug: slug, toCode: code });
    }
    setValidation(null);
    setActiveIndex(-1);
    if (target === 'from' && toCity.trim().length === 0) {
      // Carry the user straight on to the destination field.
      setActiveDropdown('to');
      toInputRef.current?.focus();
    } else {
      setActiveDropdown(null);
    }
  };

  const applyRecent = (entry: RecentSearch) => {
    sound.playTick();
    if (cityKind) {
      onUpdateSearchState({
        fromCity: entry.fromCity,
        fromSlug: entry.fromSlug,
        fromCode: undefined,
        toCity: '',
        toSlug: undefined,
        toCode: undefined,
      });
    } else {
      onUpdateSearchState({
        fromCity: entry.fromCity,
        fromSlug: entry.fromSlug,
        fromCode: undefined,
        toCity: entry.toCity,
        toSlug: entry.toSlug,
        toCode: undefined,
      });
    }
    setValidation(null);
    closeList();
  };

  const chooseOption = (option: HeroOption) => {
    const target: Endpoint = activeDropdown ?? 'from';
    if (option.kind === 'recent') {
      applyRecent(option.entry);
      return;
    }
    if (option.kind === 'stop') {
      applyPlace(target, option.cityName, option.slug);
      return;
    }
    applyPlace(
      target,
      option.suggestion.cityName,
      option.suggestion.slug,
      pickAirportCode(option.suggestion, normalizedQuery, activeKind),
    );
  };

  // Free typing clears the slug and code so App re-derives them from the text at submit.
  const handleTyping = (target: Endpoint, value: string) => {
    if (target === 'from') {
      onUpdateSearchState({ fromCity: value, fromSlug: undefined, fromCode: undefined });
    } else {
      onUpdateSearchState({ toCity: value, toSlug: undefined, toCode: undefined });
    }
    setValidation(null);
    setActiveDropdown(target);
  };

  const handleSwap = () => {
    sound.playTick();
    onUpdateSearchState({
      fromCity: toCity,
      toCity: fromCity,
      fromSlug: searchState.toSlug,
      toSlug: searchState.fromSlug,
      fromCode: searchState.toCode,
      toCode: searchState.fromCode,
    });
    setValidation(null);
  };

  const handleInputKeyDown = (target: Endpoint) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isOpen = activeDropdown === target;
    const count = flatOptions.length;
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!isOpen) {
          setActiveDropdown(target);
          return;
        }
        if (count === 0) return;
        setActiveIndex((i) => (i + 1) % count);
        return;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!isOpen || count === 0) return;
        setActiveIndex((i) => (i <= 0 ? count - 1 : i - 1));
        return;
      }
      case 'Home': {
        if (isOpen && count > 0) {
          e.preventDefault();
          setActiveIndex(0);
        }
        return;
      }
      case 'End': {
        if (isOpen && count > 0) {
          e.preventDefault();
          setActiveIndex(count - 1);
        }
        return;
      }
      case 'Enter': {
        // With a highlighted option Enter picks it; otherwise the form submits natively.
        if (isOpen && activeIndex >= 0 && activeIndex < count) {
          e.preventDefault();
          chooseOption(flatOptions[activeIndex]);
        }
        return;
      }
      case 'Escape': {
        if (isOpen) {
          e.preventDefault();
          closeList();
        }
        return;
      }
      case 'Tab': {
        closeList();
        return;
      }
      default:
        return;
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    closeList();
    setShowPassengerModal(false);
    const fromSlug = searchState.fromSlug ?? slugifyTr(fromCity);
    if (cityKind) {
      if (fromSlug.length < 2) {
        setValidation({ field: 'from', message: 'Şehir adını yazın (en az 2 harf).' });
        return;
      }
      // Only the slugs linked from turna.com/arac-kiralama have a landing page; anything else would 404.
      if (cityKind === 'arac' && !findCarCity(fromSlug)) {
        setValidation({ field: 'from', message: 'Bu şehir için Turna araç kiralama sayfası yok; listeden bir şehir seçin.' });
        return;
      }
      setValidation(null);
      sound.playSuccess();
      onPerformSearch();
      return;
    }
    const toSlug = searchState.toSlug ?? slugifyTr(toCity);
    if (fromSlug.length < 2) {
      setValidation({ field: 'from', message: 'Kalkış şehrini yazın (en az 2 harf).' });
      return;
    }
    if (toSlug.length < 2) {
      setValidation({ field: 'to', message: 'Varış şehrini yazın (en az 2 harf).' });
      return;
    }
    if (fromSlug === toSlug) {
      setValidation({ field: 'to', message: 'Kalkış ve varış aynı olamaz.' });
      return;
    }
    setValidation(null);
    sound.playSuccess();
    onPerformSearch();
  };

  /**
   * Transport tabs set both transportType and searchKind. Otel/Araç set only searchKind (transportType
   * keeps the last transport choice) and clear the destination and code keys the city form does not use.
   */
  const selectTab = (kind: SearchKind) => {
    sound.playTick();
    if (isCityKind(kind)) {
      onUpdateSearchState({
        searchKind: kind,
        fromCode: undefined,
        toCity: '',
        toSlug: undefined,
        toCode: undefined,
      });
    } else {
      onUpdateSearchState({ transportType: kind, searchKind: kind });
    }
    setValidation(null);
    setActiveIndex(-1);
  };

  const inputBoxClass = (target: Endpoint): string => {
    if (activeDropdown === target) {
      return 'border-bordeaux-700 ring-2 ring-bordeaux-700/15 bg-bordeaux-50/40 dark:bg-bordeaux-950/20';
    }
    if (validation?.field === target) {
      return 'border-rose-300 dark:border-rose-800';
    }
    return 'border-transparent hover:bg-cream-50';
  };

  const renderRow = (option: HeroOption, index: number) => {
    const active = index === activeIndex;
    const rowClass = `w-full flex items-center justify-between gap-3 p-2.5 rounded-2xl text-left border transition-colors cursor-pointer ${
      active
        ? 'bg-bordeaux-50 border-bordeaux-200 dark:bg-bordeaux-950/40 dark:border-bordeaux-900'
        : 'border-transparent hover:bg-cream-100'
    }`;
    const shared = {
      type: 'button' as const,
      role: 'option',
      id: optionId(index),
      'aria-selected': active,
      tabIndex: -1,
      onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
      onMouseEnter: () => setActiveIndex(index),
      onClick: () => chooseOption(option),
      className: rowClass,
    };

    if (option.kind === 'recent') {
      const { entry } = option;
      const entryKind: SearchKind = entry.searchKind ?? entry.transportType;
      const singleCity = isCityKind(entryKind) || entry.toCity.length === 0;
      return (
        <button key={`recent-${entryKind}-${entry.fromSlug}-${entry.toSlug}`} {...shared}>
          <div className="flex items-center gap-3 min-w-0">
            <BileoClock className="w-4 h-4 text-bordeaux-700 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-[#1E1B18] font-display truncate">
                {singleCity ? entry.fromCity : `${entry.fromCity} → ${entry.toCity}`}
              </div>
              <div className="text-[11px] text-charcoal-muted truncate">{MODE_LABEL[entryKind]}</div>
            </div>
          </div>
        </button>
      );
    }

    if (option.kind === 'stop') {
      return (
        <button key={`stop-${option.slug}`} {...shared}>
          <div className="flex items-center gap-3 min-w-0">
            <BileoFerry className="w-4 h-4 text-charcoal-muted shrink-0" />
            <div className="text-xs font-extrabold text-[#1E1B18] font-display truncate">{option.cityName}</div>
          </div>
        </button>
      );
    }

    const s = option.suggestion;
    const detail = suggestionDetail(s, activeKind, normalizedQuery);
    return (
      <button key={`place-${s.slug}`} {...shared}>
        <div className="flex items-center gap-3 min-w-0">
          <ModeIcon kind={activeKind} className="w-4 h-4 text-charcoal-muted shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-[#1E1B18] font-display truncate">{s.cityName}</div>
            {detail && <div className="text-[11px] text-charcoal-muted truncate">{detail}</div>}
          </div>
        </div>
        {s.plate > 0 && (
          <span className="text-[10px] font-black tabular-nums text-charcoal-muted bg-cream-200 px-2 py-0.5 rounded-md shrink-0">
            {String(s.plate).padStart(2, '0')}
          </span>
        )}
      </button>
    );
  };

  const renderChip = (option: HeroOption, index: number) => {
    const active = index === activeIndex;
    const label =
      option.kind === 'place'
        ? option.suggestion.cityName
        : option.kind === 'stop'
          ? option.cityName
          : option.entry.toCity || option.entry.fromCity;
    const key = option.kind === 'place' ? `chip-${option.suggestion.slug}` : option.kind === 'stop' ? `chip-${option.slug}` : `chip-${index}`;
    return (
      <button
        key={key}
        type="button"
        role="option"
        id={optionId(index)}
        aria-selected={active}
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => chooseOption(option)}
        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
          active
            ? 'bg-bordeaux-700 border-bordeaux-700 text-white'
            : 'border-[#E8E1D5] bg-[#FAF7F2] text-charcoal hover:border-bordeaux-700 hover:text-bordeaux-700'
        }`}
      >
        {label}
      </button>
    );
  };

  const listLabel = cityKind ? 'Şehir önerileri' : activeDropdown === 'from' ? 'Kalkış önerileri' : 'Varış önerileri';
  // The listbox element exists only in the final branch of the popover; aria-controls must not
  // point at it while the popover shows a plain message (tren notice, empty state).
  const listboxRendered = activeDropdown !== null && activeKind !== 'tren' && groups.length > 0;
  const emptyStateText = trimmedQuery
    ? cityKind === 'arac'
      ? 'Listede eşleşen şehir yok; Turna yalnızca listedeki şehirlerde araç kiralama sunar.'
      : 'Listede eşleşen şehir yok; yazdığınız ad olduğu gibi aranır.'
    : 'Şehir adı yazmaya başlayın.';
  const formLabel = cityKind === 'otel' ? 'Otel arama' : cityKind === 'arac' ? 'Araç kiralama arama' : 'Sefer arama';
  const submitLabel = cityKind ? SUBMIT_LABEL[cityKind] : 'Ucuz Bilet Ara';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="w-full pt-10 sm:pt-16 pb-8">
        {/* Page heading for assistive tech and outline: the visual identity is the logo, so the h1 is screen-reader only. */}
        <h1 className="sr-only">Bileo: otobüs, uçak, feribot, otel ve araç kiralama araması</h1>
        {/* 1. Search tabs: four transport modes plus the single-city Otel and Araç tabs */}
        <div className="flex items-center gap-6 sm:gap-9 border-b border-[#E8E1D5] pb-4 mb-6 overflow-x-auto" role="group" aria-label="Arama türü">
          {HERO_TABS.map((tab) => {
            const active = tab.kind === activeKind;
            return (
              <button
                key={tab.kind}
                type="button"
                aria-pressed={active}
                onClick={() => selectTab(tab.kind)}
                className="flex flex-col items-center gap-1.5 group shrink-0 cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    active ? 'bg-bordeaux-700 text-white shadow-md' : 'text-charcoal-muted hover:bg-cream-100 hover:text-charcoal'
                  }`}
                >
                  {tab.icon}
                </div>
                <span
                  className={`text-xs font-black tracking-tight ${
                    active ? 'text-bordeaux-700 dark:text-bordeaux-300' : 'text-charcoal-muted group-hover:text-charcoal'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Trip type radios (transport tabs only). Turna landing pages are one-way only; the other options are shown disabled. */}
        {!cityKind && (
          <div className="flex items-center gap-6 mb-4 text-xs font-extrabold text-[#1E1B18]">
            <label className="flex items-center gap-2 cursor-default">
              <input
                type="radio"
                name="tripType"
                checked
                readOnly
                className="w-4 h-4 accent-bordeaux-700"
              />
              <span>Tek Yön</span>
            </label>
            <label className="flex items-center gap-2 cursor-not-allowed text-charcoal-muted opacity-60" title={COMING_SOON_TITLE}>
              <input type="radio" name="tripType" disabled className="w-4 h-4 accent-bordeaux-700" />
              <span>Gidiş Dönüş</span>
            </label>
            <label className="flex items-center gap-2 cursor-not-allowed text-charcoal-muted opacity-60" title={COMING_SOON_TITLE}>
              <input type="radio" name="tripType" disabled className="w-4 h-4 accent-bordeaux-700" />
              <span>Çoklu Uçuş</span>
            </label>
          </div>
        )}

        {/* 3. Search bar */}
        <form onSubmit={handleSubmit} noValidate aria-label={formLabel}>
          <div className="relative z-30" ref={containerRef}>
            <div className="bg-white rounded-3xl border border-[#E8E1D5] shadow-soft-lg p-2 flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
              {/* Nereden (transport) or the single Şehir field (otel, araç); both live in the "from" keys */}
              <div className={`flex-1 px-4 py-2.5 rounded-2xl transition-all border ${inputBoxClass('from')}`}>
                <label htmlFor={FROM_INPUT_ID} className="text-[11px] font-bold text-charcoal-muted block">
                  {cityKind ? 'Şehir' : 'Nereden?'}
                </label>
                <input
                  id={FROM_INPUT_ID}
                  ref={fromInputRef}
                  type="text"
                  role="combobox"
                  aria-expanded={activeDropdown === 'from'}
                  aria-controls={activeDropdown === 'from' && listboxRendered ? LISTBOX_ID : undefined}
                  aria-autocomplete="list"
                  aria-activedescendant={activeDropdown === 'from' && activeIndex >= 0 ? optionId(activeIndex) : undefined}
                  aria-invalid={validation?.field === 'from' || undefined}
                  aria-describedby={validation ? ERROR_ID : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  value={fromCity}
                  onFocus={() => setActiveDropdown('from')}
                  onClick={() => setActiveDropdown('from')}
                  onChange={(e) => handleTyping('from', e.target.value)}
                  onKeyDown={handleInputKeyDown('from')}
                  placeholder={placeholderFor(activeKind)}
                  className="w-full text-sm sm:text-base font-extrabold text-[#1E1B18] font-display bg-transparent border-0 p-0 focus:outline-none placeholder-gray-400 truncate"
                />
              </div>

              {!cityKind && (
                <>
                  {/* Swap */}
                  <button
                    type="button"
                    onClick={handleSwap}
                    aria-label="Kalkış ve varış noktalarını değiştir"
                    title="Kalkış ve varış noktalarını değiştir"
                    className="w-9 h-9 rounded-full bg-cream-100 hover:bg-cream-200 border border-[#E8E1D5] text-charcoal hover:text-bordeaux-700 flex items-center justify-center mx-auto lg:-mx-2 z-10 cursor-pointer shrink-0 transition-transform active:scale-95"
                  >
                    <BileoSwapHorizontal className="w-4 h-4" />
                  </button>

                  {/* Nereye */}
                  <div className={`flex-1 px-4 py-2.5 rounded-2xl transition-all border ${inputBoxClass('to')}`}>
                    <label htmlFor={TO_INPUT_ID} className="text-[11px] font-bold text-charcoal-muted block">
                      Nereye?
                    </label>
                    <input
                      id={TO_INPUT_ID}
                      ref={toInputRef}
                      type="text"
                      role="combobox"
                      aria-expanded={activeDropdown === 'to'}
                      aria-controls={activeDropdown === 'to' && listboxRendered ? LISTBOX_ID : undefined}
                      aria-autocomplete="list"
                      aria-activedescendant={activeDropdown === 'to' && activeIndex >= 0 ? optionId(activeIndex) : undefined}
                      aria-invalid={validation?.field === 'to' || undefined}
                      aria-describedby={validation ? ERROR_ID : undefined}
                      autoComplete="off"
                      spellCheck={false}
                      value={toCity}
                      onFocus={() => setActiveDropdown('to')}
                      onClick={() => setActiveDropdown('to')}
                      onChange={(e) => handleTyping('to', e.target.value)}
                      onKeyDown={handleInputKeyDown('to')}
                      placeholder={placeholderFor(activeKind)}
                      className="w-full text-sm sm:text-base font-extrabold text-[#1E1B18] font-display bg-transparent border-0 p-0 focus:outline-none placeholder-gray-400 truncate"
                    />
                  </div>
                </>
              )}

              <div className="w-px h-10 bg-[#E8E1D5] hidden lg:block mx-1" />

              {/* Date: landing pages list upcoming dates (transport) or hand the date over to Turna (otel, araç) */}
              <div
                className="flex-1 px-4 py-2.5 rounded-2xl flex items-center justify-between border border-transparent"
                title={cityKind ? 'Tarih seçimi Turna sayfasında yapılır' : 'Turna rota sayfaları tarih seçimi sunmaz'}
              >
                <div>
                  <span className="text-[11px] font-bold text-charcoal-muted block">Tarih</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#1E1B18] font-display block">
                    {cityKind ? 'Turna sayfasında seçilir' : 'Yaklaşan tarihler'}
                  </span>
                </div>
                <BileoCalendar className="w-5 h-5 text-charcoal-muted shrink-0" />
              </div>

              {!cityKind && (
                <>
                  <div className="w-px h-10 bg-[#E8E1D5] hidden lg:block mx-1" />

                  {/* Passengers and cabin class */}
                  <button
                    type="button"
                    onClick={() => setShowPassengerModal((v) => !v)}
                    aria-expanded={showPassengerModal}
                    aria-haspopup="dialog"
                    className="flex-1 px-4 py-2.5 rounded-2xl hover:bg-cream-50 cursor-pointer border border-transparent text-left"
                  >
                    <span className="text-[11px] font-bold text-charcoal-muted block">Yolcu ve Sınıf</span>
                    <span className="text-sm font-extrabold text-[#1E1B18] font-display block">
                      {searchState.passengerCount || 1} Yolcu, Ekonomi
                    </span>
                  </button>
                </>
              )}

              {/* Primary CTA */}
              <button
                type="submit"
                className="bg-bordeaux-700 hover:bg-bordeaux-800 text-white px-7 py-4 rounded-2xl font-black text-sm tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] shrink-0 min-h-[50px]"
              >
                <span>{submitLabel}</span>
                <span className="text-base font-black" aria-hidden="true">≫</span>
              </button>
            </div>

            {/* 4. Suggestions (local index, no network) */}
            {activeDropdown && (
              <div className="absolute top-full left-0 mt-3 w-full max-w-lg bg-white rounded-3xl shadow-soft-lg border border-[#E8E1D5] p-5 z-50 space-y-4">
                {activeKind === 'tren' ? (
                  <p className="text-xs font-bold text-charcoal-muted py-2">
                    Tren için canlı veri yok; Turna.com tren bileti sunmuyor.
                  </p>
                ) : groups.length === 0 ? (
                  <p className="text-xs font-bold text-charcoal-muted py-2">{emptyStateText}</p>
                ) : (
                  <div role="listbox" id={LISTBOX_ID} aria-label={listLabel} className="space-y-4">
                    {groups.map((group, gi) => {
                      const start = groupOffsets[gi] ?? 0;
                      return (
                        <div
                          key={group.id}
                          role="group"
                          aria-labelledby={groupHeadingId(group.id)}
                          className={gi > 0 ? 'pt-3 border-t border-[#E8E1D5]' : undefined}
                        >
                          <div
                            id={groupHeadingId(group.id)}
                            className="text-[11px] font-black uppercase tracking-wider text-charcoal-muted px-1 mb-2"
                          >
                            {group.heading}
                          </div>
                          {group.layout === 'rows' ? (
                            <div className="space-y-1 max-h-72 overflow-y-auto">
                              {group.options.map((option, j) => renderRow(option, start + j))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {group.options.map((option, j) => renderChip(option, start + j))}
                            </div>
                          )}
                          {group.id === 'stops' && (
                            <p className="text-[11px] text-charcoal-muted mt-2 px-1">
                              Turna.com feribot sayfaları bu duraklar için doğrulandı.
                            </p>
                          )}
                          {group.id === 'popular' && cityKind === 'arac' && (
                            <p className="text-[11px] text-charcoal-muted mt-2 px-1">
                              Yalnızca Turna.com araç kiralama sayfası bulunan şehirler listelenir.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Passenger and cabin popover (transport tabs only) */}
            {!cityKind && showPassengerModal && (
              <div
                role="dialog"
                aria-label="Yolcu sayısı ve kabin sınıfı"
                className="absolute top-full right-0 mt-3 w-72 bg-white rounded-3xl shadow-soft-lg border border-[#E8E1D5] p-5 z-50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#1E1B18]">Yolcu Sayısı</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Yolcu sayısını azalt"
                      onClick={() => onUpdateSearchState({ passengerCount: Math.max(1, (searchState.passengerCount || 1) - 1) })}
                      className="w-8 h-8 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-sm font-black text-charcoal tabular-nums">{searchState.passengerCount || 1}</span>
                    <button
                      type="button"
                      aria-label="Yolcu sayısını artır"
                      onClick={() => onUpdateSearchState({ passengerCount: Math.min(9, (searchState.passengerCount || 1) + 1) })}
                      className="w-8 h-8 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Cabin class: the landing page has no cabin dimension, so only Ekonomi is selectable. */}
                <div className="space-y-2 pt-2 border-t border-[#E8E1D5]">
                  <span className="text-xs font-extrabold text-[#1E1B18] block">Kabin Sınıfı</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed
                      className="py-2 rounded-xl text-xs font-black bg-bordeaux-700 text-white cursor-default"
                    >
                      Ekonomi
                    </button>
                    <button
                      type="button"
                      disabled
                      title={COMING_SOON_TITLE}
                      className="py-2 rounded-xl text-xs font-black bg-[#FAF7F2] text-charcoal-muted border border-[#E8E1D5] opacity-60 cursor-not-allowed"
                    >
                      Business
                    </button>
                  </div>
                  <p className="text-[11px] text-charcoal-muted">Turna rota sayfası kabin sınıfı ayrımı sunmaz.</p>
                </div>
              </div>
            )}
          </div>

          {/* 5. Validation, city-kind hint and footer line */}
          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="min-h-4 space-y-1">
              {validation && (
                <p id={ERROR_ID} role="alert" className="text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                  {validation.message}
                </p>
              )}
              {cityKind && <p className="text-[11px] text-charcoal-muted">{CITY_KIND_HINT[cityKind]}</p>}
            </div>
            <span className="text-[11px] text-charcoal-muted shrink-0">Demo uygulama; bilet satışı yapılmaz.</span>
          </div>
        </form>
      </div>
    </div>
  );
};
