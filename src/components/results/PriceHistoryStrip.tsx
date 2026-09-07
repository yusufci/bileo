import React from 'react';
import type { HistoryPoint } from '../../lib/turna/types';
import { priceTL } from '../../lib/turna/format';

export interface PriceHistoryStripProps {
  history: HistoryPoint[];
  /** Appended to every price for non-ticket units, e.g. "/gün" for car rental daily prices. */
  unitSuffix?: string;
  /** How many of the newest priced observations to show. */
  max?: number;
  className?: string;
}

export const HISTORY_STRIP_MAX = 5;
export const HISTORY_STRIP_LABEL = 'Son taramalarda en düşük fiyat';

export interface HistoryStripPoint {
  observedAt: string;
  minPrice: number;
  label: string;
}

function clockOf(d: Date): string {
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/** dd.MM in local time, built by hand because ICU builds disagree on the tr-TR separator. */
function dayOf(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * The newest `max` observations that carried a price, oldest first. Returns [] unless at least two exist,
 * because a single point is not a history. Labels are clocks; when the points span more than one calendar
 * day the day is prefixed so 09:10 yesterday cannot be mistaken for 09:10 today.
 */
export function historyStripPoints(history: HistoryPoint[], max = HISTORY_STRIP_MAX): HistoryStripPoint[] {
  const priced = history
    .filter((h): h is HistoryPoint & { minPrice: number } => typeof h.minPrice === 'number' && Number.isFinite(h.minPrice))
    .map((h) => ({ observedAt: h.observedAt, minPrice: h.minPrice, date: new Date(h.observedAt) }))
    .filter((h) => !Number.isNaN(h.date.getTime()));
  if (priced.length < 2) return [];
  const tail = priced.slice(-Math.max(2, max));
  const days = new Set(tail.map((h) => h.date.toDateString()));
  return tail.map((h) => ({
    observedAt: h.observedAt,
    minPrice: h.minPrice,
    label: days.size > 1 ? `${dayOf(h.date)} ${clockOf(h.date)}` : clockOf(h.date),
  }));
}

/** Numbers-only timeline of the cheapest fare seen in the last real observations of this route. */
export const PriceHistoryStrip: React.FC<PriceHistoryStripProps> = ({ history, unitSuffix = '', max = HISTORY_STRIP_MAX, className = '' }) => {
  const points = historyStripPoints(history, max);
  if (points.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs ${className}`} data-price-history={points.length}>
      <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">{HISTORY_STRIP_LABEL}</span>
      <ol aria-label={HISTORY_STRIP_LABEL} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {points.map((p, i) => (
          <li key={p.observedAt} className="flex items-baseline gap-1 tabular-nums">
            <time dateTime={p.observedAt} className="text-charcoal-muted">
              {p.label}
            </time>
            <span className={i === points.length - 1 ? 'font-black text-charcoal' : 'font-bold text-charcoal-muted'}>
              {priceTL(p.minPrice)}
              {unitSuffix}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};
