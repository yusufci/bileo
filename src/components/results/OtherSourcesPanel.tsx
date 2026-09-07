import React from 'react';
import { BileoExternalLink, BileoStar } from '../icons/BileoIcons';
import type { SearchClientState } from '../../lib/sources/client';
import type { SourceBusTrip, SourceFailure, SourceFlight, SourceHotel, SourceId, SourceKind, SourceRouteFacts, SourceSuccess } from '../../lib/sources/types';
import { SOURCE_LABELS } from '../../lib/sources/types';
import { bileoDuration, formatDayChip, formatTrClock, priceTL } from '../../lib/turna/format';
import { SourceBadge } from './SourceBadge';

export const OTHER_SOURCES_TITLE = 'Diğer kaynaklar';
export const OTHER_SOURCES_DISCLOSURE =
  'Bu satırlar kaynak sitelerin landing sayfalarındaki yaklaşan seferlerdir; belirli bir güne ait tam tarife değildir. Gün etiketi yalnızca kaynağın tarih yayımladığı satırlarda görünür; satın alma kaynak sitede yapılır. flixbus.com.tr yalnızca rota bilgisi yayımlar (başlangıç fiyatı, tipik süre, ilk ve son kalkış); sefer listesi vermez.';
export const OTHER_SOURCES_LOADING = 'Diğer kaynaklar okunuyor...';
export const OTHER_SOURCES_EMPTY = 'Bu sorgu için başka kaynak yok.';
/** Printed inside the Turna error notice when at least one other source answered with rows (SearchResults). */
export const OTHER_SOURCES_BELOW_HINT = 'Diğer kaynakların sonuçları aşağıda.';
/** Rows shown per source before the "N daha" note. */
export const MAX_ROWS_PER_SOURCE = 10;

const KIND_NOUN: Record<SourceKind, string> = { bus: 'sefer', flight: 'uçuş', hotel: 'otel' };

export type OtherSourcesState = SearchClientState | { status: 'loading' };

export interface OtherSourcesPanelProps {
  state: OtherSourcesState | undefined;
  kind: SourceKind;
  /** Turna's page-wide minimum for the same query, when known; joins the cross-source comparison line. */
  turnaMinPrice?: number | null;
  className?: string;
}

interface PricedSource {
  label: string;
  price: number;
  /** True when the source publishes only a starting price (route facts), rendered as "999 TL'den". */
  from: boolean;
}

/** True when at least one source answered with rows; drives the hint inside the Turna error notice. */
export function hasOtherSourceRows(state: OtherSourcesState | undefined): boolean {
  return state?.status === 'ok' && state.envelope.results.some((r) => r.success && r.items.length > 0);
}

/** True when a source answered with route facts only (no departures). */
export function isFactsOnly(s: SourceSuccess): boolean {
  return s.items.length > 0 && s.items.every((i) => i.kind === 'route');
}

/** "Kaynaklar arası en düşük fiyat: Turna.com 500 TL, obilet.com 650 TL." Null with fewer than two priced sources. */
export function comparisonSentence(successes: SourceSuccess[], turnaMinPrice: number | null | undefined): string | null {
  const priced: PricedSource[] = [];
  if (typeof turnaMinPrice === 'number' && Number.isFinite(turnaMinPrice) && turnaMinPrice > 0) priced.push({ label: SOURCE_LABELS.turna, price: turnaMinPrice, from: false });
  for (const s of successes) if (s.minPrice !== null) priced.push({ label: SOURCE_LABELS[s.source], price: s.minPrice, from: isFactsOnly(s) });
  if (priced.length < 2) return null;
  priced.sort((a, b) => a.price - b.price);
  return `Kaynaklar arası en düşük fiyat: ${priced.map((p) => `${p.label} ${priceTL(p.price)}${p.from ? "'den" : ''}`).join(', ')}.`;
}

function fetchedLabel(s: SourceSuccess): string {
  const clock = formatTrClock(s.scrapedAt);
  const via = s.fetchedVia === 'cache' ? 'Önbellekten' : 'Canlı alındı';
  return clock ? `${via} ${clock}` : via;
}

const Row: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <li aria-label={label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 border-t border-[#F1ECE3] first:border-t-0 text-sm">
    {children}
  </li>
);

/** "Sal 8 Eyl" for rows whose source publishes a calendar date (enuygun); clock-only sources render no chip. */
function dateChip(isoDate: string): string {
  const chip = formatDayChip(isoDate);
  return chip.weekday ? `${chip.weekday} ${chip.day} ${chip.month}` : chip.day;
}

/** flixbus publishes route facts, not departures: starting price, typical duration, first and last planned departure, stops. */
function routeRow(r: SourceRouteFacts): React.ReactElement {
  const operator = r.operatorName ?? SOURCE_LABELS[r.source];
  const clocks =
    r.firstDeparture && r.lastDeparture ? `ilk ${r.firstDeparture}, son ${r.lastDeparture}` : r.firstDeparture ? `ilk ${r.firstDeparture}` : r.lastDeparture ? `son ${r.lastDeparture}` : null;
  const stops = `${r.departureStops.length > 0 ? r.departureStops.join(' / ') : r.fromCity} > ${r.arrivalStops.length > 0 ? r.arrivalStops.join(' / ') : r.toCity}`;
  return (
    <Row key={r.id} label={`${operator}, rota bilgisi, tarife yayımlanmıyor`}>
      <span className="font-bold text-charcoal min-w-0 truncate">{operator}</span>
      <span className="tabular-nums text-charcoal">
        {clocks ?? 'Kalkış saatleri yayımlanmıyor'}
        {r.durationMinutes !== null && <span className="text-charcoal-muted"> (yaklaşık {bileoDuration(r.durationMinutes)})</span>}
      </span>
      <span className="text-xs text-charcoal-muted truncate min-w-0" data-route-facts>
        {stops} · Tarife yayımlanmıyor; kalkış listesi için kaynak sayfa
      </span>
      <span className="font-black tabular-nums text-charcoal">{r.lowPrice !== null ? `${priceTL(r.lowPrice)}'den` : 'Fiyat yok'}</span>
    </Row>
  );
}

function busRow(t: SourceBusTrip): React.ReactElement {
  return (
    <Row key={t.id} label={`${t.company}, ${t.departureTime}, ${priceTL(t.price)}`}>
      <span className="font-bold text-charcoal min-w-0 truncate">{t.company}</span>
      <span className="tabular-nums text-charcoal">
        {t.date && (
          <span className="mr-2 inline-flex items-center rounded-lg bg-cream-200 px-1.5 py-0.5 text-[10px] font-bold text-charcoal" data-trip-date={t.date}>
            {dateChip(t.date)}
          </span>
        )}
        {t.departureTime} <span className="text-charcoal-muted">{'>'}</span> {t.arrivalTime}
        {t.durationMinutes !== null && <span className="text-charcoal-muted"> ({bileoDuration(t.durationMinutes)})</span>}
      </span>
      <span className="text-xs text-charcoal-muted truncate min-w-0">
        {t.fromStop ?? t.fromCity}
        {t.toStop || t.toCity ? ` > ${t.toStop ?? t.toCity}` : ''}
        {t.seatLayout ? ` · ${t.seatLayout}` : ''}
      </span>
      <span className="font-black tabular-nums text-charcoal">{priceTL(t.price)}</span>
    </Row>
  );
}

function flightRow(f: SourceFlight): React.ReactElement {
  return (
    <Row key={f.id} label={`${f.airline}, ${f.departureTime}, ${priceTL(f.price)}`}>
      <span className="font-bold text-charcoal min-w-0 truncate">
        {f.airline}
        {f.airlineCode ? <span className="text-charcoal-muted font-medium"> {f.airlineCode}</span> : null}
      </span>
      <span className="tabular-nums text-charcoal">
        {f.date && (
          <span className="mr-2 inline-flex items-center rounded-lg bg-cream-200 px-1.5 py-0.5 text-[10px] font-bold text-charcoal" data-trip-date={f.date}>
            {dateChip(f.date)}
          </span>
        )}
        {f.departureTime} <span className="text-charcoal-muted">{'>'}</span> {f.arrivalTime}
        {f.durationMinutes !== null && <span className="text-charcoal-muted"> ({bileoDuration(f.durationMinutes)})</span>}
      </span>
      <span className="text-xs text-charcoal-muted truncate min-w-0">
        {f.fromCode ?? f.fromName} {'>'} {f.toCode ?? f.toName}
      </span>
      <span className="font-black tabular-nums text-charcoal">{priceTL(f.price)}</span>
    </Row>
  );
}

function hotelRow(h: SourceHotel): React.ReactElement {
  return (
    <Row key={h.id} label={h.name}>
      <a href={h.url} target="_blank" rel="noopener noreferrer" className="font-bold text-charcoal hover:text-bordeaux-700 min-w-0 truncate">
        {h.name}
        <span className="sr-only"> (yeni sekmede açılır)</span>
      </a>
      {h.stars !== null && (
        <span className="inline-flex items-center gap-0.5" aria-label={`${h.stars} yıldız`}>
          {Array.from({ length: h.stars }, (_, i) => (
            <BileoStar key={i} className="w-3 h-3 text-amber-500" fill="currentColor" />
          ))}
        </span>
      )}
      <span className="text-xs text-charcoal-muted tabular-nums">
        {h.rating !== null ? `${h.rating.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}/${h.ratingBest}` : 'Puan yok'}
        {h.reviewCount !== null ? ` · ${h.reviewCount.toLocaleString('tr-TR')} yorum` : ''}
        {h.city ? ` · ${h.city}` : ''}
      </span>
      <span className="text-xs text-charcoal-muted">Fiyat kaynak sitede</span>
    </Row>
  );
}

function renderRows(kind: SourceKind, s: SourceSuccess): React.ReactElement[] {
  const shown = s.items.slice(0, MAX_ROWS_PER_SOURCE);
  return shown.map((item) => {
    if (kind === 'bus' && item.kind === 'bus') return busRow(item);
    if (kind === 'bus' && item.kind === 'route') return routeRow(item);
    if (kind === 'flight' && item.kind === 'flight') return flightRow(item);
    if (kind === 'hotel' && item.kind === 'hotel') return hotelRow(item);
    return <React.Fragment key={item.id} />;
  });
}

const SourceSection: React.FC<{ kind: SourceKind; result: SourceSuccess }> = ({ kind, result }) => {
  const factsOnly = isFactsOnly(result);
  const noun = factsOnly ? 'rota bilgisi' : KIND_NOUN[kind];
  const remaining = result.items.length - Math.min(result.items.length, MAX_ROWS_PER_SOURCE);
  return (
    <section aria-label={`${SOURCE_LABELS[result.source]} sonuçları`} data-source-section={result.source} className="bg-white rounded-3xl p-5 shadow-soft border border-[#FAF7F2]">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-charcoal-muted">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source={result.source} href={result.sourceUrl} size="md" />
          <span className="tabular-nums">
            {result.items.length} {noun}
            {result.minPrice !== null ? (factsOnly ? `, ${priceTL(result.minPrice)}'den başlayan fiyat` : `, en düşük ${priceTL(result.minPrice)}`) : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums" title={result.scrapedAt}>
            {fetchedLabel(result)}
          </span>
          <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-bordeaux-700 hover:text-bordeaux-800 underline-offset-2 hover:underline">
            <span>Kaynak sayfa</span>
            <BileoExternalLink className="w-3.5 h-3.5" />
            <span className="sr-only"> (yeni sekmede açılır)</span>
          </a>
        </div>
      </div>
      {result.items.length === 0 ? (
        <p className="mt-3 text-xs text-charcoal-muted">Sayfa alındı ancak yapısal {noun} listesi içermiyor.</p>
      ) : (
        <ul className="mt-3">{renderRows(kind, result)}</ul>
      )}
      {remaining > 0 && <p className="mt-2 text-xs text-charcoal-muted">Kaynak sayfada {remaining} {noun} daha var.</p>}
      {result.warnings.length > 0 && (
        <ul className="mt-2 text-[11px] text-charcoal-muted list-disc pl-4">
          {result.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </section>
  );
};

const FailureLine: React.FC<{ failure: SourceFailure }> = ({ failure }) => (
  <p data-source-failure={failure.source} className="text-xs text-charcoal-muted">
    <span className="font-bold text-charcoal">{SOURCE_LABELS[failure.source as SourceId] ?? failure.source}:</span> {failure.error}
    {failure.retryAfterSeconds !== undefined ? ` ${failure.retryAfterSeconds} sn sonra tekrar deneyin.` : ''}
  </p>
);

/**
 * Results of the non-Turna landing-page sources for the current query. Every figure sits next to its
 * source badge and a link to the page it came from; nothing is merged into the Turna list.
 * Accessibility: the panel is a labelled region in every state, loading is announced politely, a failed
 * request is an alert, and every link that opens a new tab says so for screen readers.
 */
export const OtherSourcesPanel: React.FC<OtherSourcesPanelProps> = ({ state, kind, turnaMinPrice, className = '' }) => {
  if (!state) return null;
  const heading = (
    <h3 className="text-sm font-extrabold uppercase tracking-wider text-charcoal-muted font-display">{OTHER_SOURCES_TITLE}</h3>
  );
  if (state.status === 'loading') {
    return (
      <section aria-label={OTHER_SOURCES_TITLE} className={`space-y-3 ${className}`} data-other-sources="loading">
        {heading}
        <p className="text-xs text-charcoal-muted" aria-live="polite">
          {OTHER_SOURCES_LOADING}
        </p>
      </section>
    );
  }
  if (state.status === 'error') {
    return (
      <section aria-label={OTHER_SOURCES_TITLE} className={`space-y-3 ${className}`} data-other-sources="error">
        {heading}
        <p role="alert" className="text-xs text-charcoal-muted">Diğer kaynaklar alınamadı: {state.message}</p>
      </section>
    );
  }
  const successes = state.envelope.results.filter((r): r is SourceSuccess => r.success);
  const failures = state.envelope.results.filter((r): r is SourceFailure => !r.success);
  if (successes.length === 0 && failures.length === 0) {
    return (
      <section aria-label={OTHER_SOURCES_TITLE} className={`space-y-3 ${className}`} data-other-sources="empty">
        {heading}
        <p className="text-xs text-charcoal-muted">{OTHER_SOURCES_EMPTY}</p>
      </section>
    );
  }
  const comparison = comparisonSentence(successes, turnaMinPrice);
  return (
    <section aria-label={OTHER_SOURCES_TITLE} className={`space-y-3 ${className}`} data-other-sources="ok">
      {heading}
      {comparison && <p className="text-sm font-bold text-charcoal tabular-nums">{comparison}</p>}
      {successes.map((s) => (
        <SourceSection key={s.source} kind={kind} result={s} />
      ))}
      {failures.map((f) => (
        <FailureLine key={f.source} failure={f} />
      ))}
      {state.dropped > 0 && <p className="text-xs text-charcoal-muted">{state.dropped} satır doğrulanamadı ve listelenmedi.</p>}
      <p className="text-[11px] text-charcoal-muted leading-relaxed">{OTHER_SOURCES_DISCLOSURE}</p>
    </section>
  );
};
