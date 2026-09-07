import React, { useId, useMemo, useState } from 'react';
import type { CarFuelType, CarOffer, CarTransmission, CarVehicleClass, TurnaSuccess } from '../../lib/turna/types';
import { priceTL } from '../../lib/turna/format';
import { BileoExternalLink, BileoRotateCcw } from '../icons';
import { BrandLogo } from './BrandLogo';
import { PriceStatsRow } from './PriceStatsRow';
import { PriceDeltaLine } from './PriceDeltaLine';
import { PriceHistoryStrip } from './PriceHistoryStrip';

export interface CarResultsProps {
  items: CarOffer[];
  result: TurnaSuccess;
}

type CarSort = 'price-asc' | 'price-desc' | 'class';

export const CAR_LINK_LABEL = "Turna'da kirala";
export const CAR_PRICE_UNIT = '/gün';
export const CAR_PRICE_SOURCE_NOTE = 'Turna landing fiyatı';
export const CAR_EMPTY_FILTER_COPY = 'Filtrelere uyan araç yok.';
export const CAR_MILEAGE_UNKNOWN = 'Km limiti belirtilmemiş';
const TOP_COMPANIES = 6;

export const CAR_CLASS_LABEL: Record<CarVehicleClass, string> = {
  economy: 'Ekonomi',
  standard: 'Standart',
  fullsize: 'Geniş',
  premium: 'Premium',
  luxury: 'Lüks',
  other: 'Diğer',
};

export const CAR_FUEL_LABEL: Record<CarFuelType, string> = {
  gasoline: 'Benzin',
  diesel: 'Dizel',
  hybrid: 'Hibrit',
  electric: 'Elektrik',
  lpg: 'LPG',
  other: 'Diğer',
};

export const CAR_TRANSMISSION_LABEL: Record<CarTransmission, string> = {
  auto: 'Otomatik',
  manual: 'Manuel',
  other: 'Belirtilmemiş',
};

const CLASS_ORDER: readonly CarVehicleClass[] = ['economy', 'standard', 'fullsize', 'premium', 'luxury', 'other'];
const FUEL_ORDER: readonly CarFuelType[] = ['gasoline', 'diesel', 'hybrid', 'electric', 'lpg', 'other'];
const TRANSMISSION_ORDER: readonly CarTransmission[] = ['auto', 'manual', 'other'];

/** 200 -> "200 km/gün"; null or 0 -> the "not stated" sentence (never a made-up limit). */
export function mileageLabel(km: number | null): string {
  return typeof km === 'number' && Number.isFinite(km) && km > 0 ? `${km.toLocaleString('tr-TR')} km/gün` : CAR_MILEAGE_UNKNOWN;
}

/** Companies by offer count (desc), then name (tr). */
export function companyDistribution(items: CarOffer[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const car of items) {
    const name = car.company.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'));
}

/** "12 firma: Circular 8, Torlak 6, Mobilup 4, Qcar Mobilite 3, Sixtb2b 3, Garenta 2, +6". */
export function companyDistributionLine(items: CarOffer[], top = TOP_COMPANIES): string {
  const dist = companyDistribution(items);
  if (dist.length === 0) return '';
  const shown = dist.slice(0, top).map((d) => `${d.name} ${d.count}`);
  const rest = dist.length - shown.length;
  return `${dist.length} firma: ${shown.join(', ')}${rest > 0 ? `, +${rest}` : ''}`;
}

function classRank(vehicleClass: CarVehicleClass): number {
  const index = CLASS_ORDER.indexOf(vehicleClass);
  return index === -1 ? CLASS_ORDER.length : index;
}

function compareCars(a: CarOffer, b: CarOffer, sort: CarSort): number {
  if (sort === 'price-desc') return b.dailyPrice - a.dailyPrice || a.brand.localeCompare(b.brand, 'tr');
  if (sort === 'class') return classRank(a.vehicleClass) - classRank(b.vehicleClass) || a.dailyPrice - b.dailyPrice;
  return a.dailyPrice - b.dailyPrice || a.brand.localeCompare(b.brand, 'tr');
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function countBy<T extends string>(items: CarOffer[], pick: (car: CarOffer) => T): Map<T, number> {
  const counts = new Map<T, number>();
  for (const car of items) {
    const key = pick(car);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function orderedOptions<T extends string>(counts: Map<T, number>, order: readonly T[], labels: Record<T, string>) {
  return order.filter((key) => counts.has(key)).map((key) => ({ key, label: labels[key], count: counts.get(key) ?? 0 }));
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

/** Simple line-art car used when the vehicle image is missing or fails to load. */
const CarPlaceholder: React.FC = () => (
  <svg viewBox="0 0 64 32" className="w-20 h-10 text-charcoal-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 22h52l-3-8-7-8H22l-9 8-7 2z" />
    <path d="M22 6l-6 8h32" />
    <circle cx="18" cy="24" r="4" fill="currentColor" stroke="none" />
    <circle cx="48" cy="24" r="4" fill="currentColor" stroke="none" />
  </svg>
);

const CarPhoto: React.FC<{ src: string | null; alt: string }> = ({ src, alt }) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = typeof src === 'string' && /^https?:\/\//i.test(src) && failedSrc !== src;
  return (
    <div className="aspect-[4/3] w-full rounded-2xl bg-cream-100 flex items-center justify-center overflow-hidden">
      {usable ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <CarPlaceholder />
      )}
    </div>
  );
};

/**
 * Car rental offers of one Turna city page: daily-price KPI row, company distribution, facet chips and
 * one list card per vehicle. The only number shown per car is Turna's own `dailyPrice`.
 */
export const CarResults: React.FC<CarResultsProps> = ({ items, result }) => {
  const sortId = useId();
  const [sort, setSort] = useState<CarSort>('price-asc');
  const [classFilter, setClassFilter] = useState<string[]>([]);
  const [transmissionFilter, setTransmissionFilter] = useState<string[]>([]);
  const [fuelFilter, setFuelFilter] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string[]>([]);

  const classOptions = useMemo(() => orderedOptions(countBy(items, (c) => c.vehicleClass), CLASS_ORDER, CAR_CLASS_LABEL), [items]);
  const transmissionOptions = useMemo(
    () => orderedOptions(countBy(items, (c) => c.transmission), TRANSMISSION_ORDER, CAR_TRANSMISSION_LABEL),
    [items],
  );
  const fuelOptions = useMemo(() => orderedOptions(countBy(items, (c) => c.fuelType), FUEL_ORDER, CAR_FUEL_LABEL), [items]);
  const companies = useMemo(() => companyDistribution(items), [items]);
  const companyOptions = useMemo(() => companies.map((c) => ({ key: c.name, label: c.name, count: c.count })), [companies]);
  const distributionLine = useMemo(() => companyDistributionLine(items), [items]);

  const filtered = useMemo(() => {
    return items
      .filter((car) => {
        if (classFilter.length > 0 && !classFilter.includes(car.vehicleClass)) return false;
        if (transmissionFilter.length > 0 && !transmissionFilter.includes(car.transmission)) return false;
        if (fuelFilter.length > 0 && !fuelFilter.includes(car.fuelType)) return false;
        if (companyFilter.length > 0 && !companyFilter.includes(car.company.trim())) return false;
        return true;
      })
      .sort((a, b) => compareCars(a, b, sort));
  }, [items, classFilter, transmissionFilter, fuelFilter, companyFilter, sort]);

  const filtersActive = classFilter.length + transmissionFilter.length + fuelFilter.length + companyFilter.length > 0;
  const resetFilters = () => {
    setClassFilter([]);
    setTransmissionFilter([]);
    setFuelFilter([]);
    setCompanyFilter([]);
  };

  const renderCard = (car: CarOffer) => {
    const title = `${car.brand} ${car.model}`.trim();
    const chips = [
      CAR_CLASS_LABEL[car.vehicleClass] ?? CAR_CLASS_LABEL.other,
      CAR_FUEL_LABEL[car.fuelType] ?? CAR_FUEL_LABEL.other,
      CAR_TRANSMISSION_LABEL[car.transmission] ?? CAR_TRANSMISSION_LABEL.other,
      mileageLabel(car.mileageLimitKm),
    ];
    return (
      <article
        key={car.id}
        aria-label={`${title}, ${car.company}, ${priceTL(car.dailyPrice, 2)} günlük`}
        className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-shadow motion-reduce:transition-none border border-[#FAF7F2]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-3">
            <CarPhoto src={car.imageUrl} alt={title} />
          </div>

          <div className="lg:col-span-4 space-y-2.5">
            <h3 className="text-xl font-black text-charcoal font-display leading-tight">{title}</h3>
            <ul className="flex flex-wrap gap-1.5" aria-label="Araç özellikleri">
              {chips.map((chip) => (
                <li key={chip} className="px-2 py-0.5 rounded-lg bg-cream-200 text-charcoal text-[11px] font-bold tabular-nums">
                  {chip}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-1">
            <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider block">Firma</span>
            <BrandLogo name={car.company} logoUrl={car.companyLogoUrl} size="md" />
          </div>

          <div className="lg:col-span-3 flex lg:flex-col items-center lg:items-end justify-between gap-3 pt-2 lg:pt-0">
            <div className="text-left lg:text-right">
              <span className="text-[10px] text-charcoal-muted block">Günlük fiyat</span>
              <span className="text-2xl font-black text-charcoal font-display tabular-nums">{priceTL(car.dailyPrice, 2)}</span>
              <span className="text-xs font-bold text-charcoal-muted">{CAR_PRICE_UNIT}</span>
              <span className="text-[10px] text-charcoal-muted block">{CAR_PRICE_SOURCE_NOTE}</span>
            </div>
            <a
              href={result.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-bordeaux transition-colors motion-reduce:transition-none inline-flex items-center justify-center gap-2 min-h-[46px]"
            >
              <span>{CAR_LINK_LABEL}</span>
              <BileoExternalLink className="w-4 h-4" />
              <span className="sr-only"> (yeni sekmede açılır)</span>
            </a>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {result.stats && <PriceStatsRow stats={result.stats} unitSuffix={CAR_PRICE_UNIT} ariaLabel="Günlük fiyat özeti" />}
        {result.delta && <PriceDeltaLine delta={result.delta} unitSuffix={CAR_PRICE_UNIT} />}
        <PriceHistoryStrip history={result.history} unitSuffix={CAR_PRICE_UNIT} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-charcoal-muted tabular-nums">
            {distributionLine && <span>{distributionLine}</span>}
            {filtersActive && (
              <span>
                {distributionLine ? '; ' : ''}
                {filtered.length} araç filtrelere uyuyor
              </span>
            )}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor={sortId} className="text-charcoal-muted font-bold">
              Sıralama:
            </label>
            <select
              id={sortId}
              value={sort}
              onChange={(e) => setSort(e.target.value as CarSort)}
              className="bg-cream-200 hover:bg-cream-300 px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-charcoal focus:outline-none cursor-pointer border-0"
            >
              <option value="price-asc">Fiyat artan</option>
              <option value="price-desc">Fiyat azalan</option>
              <option value="class">Sınıf</option>
            </select>
          </div>
        </div>
        <ChipGroup label="Sınıf" options={classOptions} selected={classFilter} onToggle={(k) => setClassFilter((s) => toggleValue(s, k))} />
        <ChipGroup label="Vites" options={transmissionOptions} selected={transmissionFilter} onToggle={(k) => setTransmissionFilter((s) => toggleValue(s, k))} />
        <ChipGroup label="Yakıt" options={fuelOptions} selected={fuelFilter} onToggle={(k) => setFuelFilter((s) => toggleValue(s, k))} />
        <ChipGroup label="Firma" options={companyOptions} selected={companyFilter} onToggle={(k) => setCompanyFilter((s) => toggleValue(s, k))} />
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-4">{filtered.map(renderCard)}</div>
      ) : (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E8E1D5] space-y-3 shadow-soft">
          <p className="text-base font-black text-[#1E1B18] font-display">{CAR_EMPTY_FILTER_COPY}</p>
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
