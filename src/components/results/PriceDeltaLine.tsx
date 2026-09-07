import React from 'react';
import type { PriceDelta } from '../../lib/turna/types';
import { formatTrClock, priceTL } from '../../lib/turna/format';

export interface PriceDeltaLineProps {
  delta: PriceDelta;
  /** Appended to every price for non-ticket units, e.g. "/gün" for car rental daily prices. */
  unitSuffix?: string;
  className?: string;
}

/**
 * One Turkish sentence comparing the current cheapest price with the previous real observation of the same
 * route. Only rendered when the server sent a `delta`, i.e. when an earlier observation actually exists.
 */
export function priceDeltaSentence(delta: PriceDelta, unitSuffix = ''): string {
  const clock = formatTrClock(delta.previousObservedAt);
  const when = clock ? `${clock} taramasına göre` : 'Önceki taramaya göre';
  const current = `${priceTL(delta.currentMin)}${unitSuffix}`;
  if (delta.change === 0) return `${when} en düşük fiyat değişmedi (${current}).`;
  const pct = Math.abs(delta.changePct).toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  const verb = delta.change < 0 ? 'düştü' : 'yükseldi';
  return `${when} en düşük fiyat %${pct} ${verb}: ${priceTL(delta.previousMin)}${unitSuffix} yerine ${current}.`;
}

export const PriceDeltaLine: React.FC<PriceDeltaLineProps> = ({ delta, unitSuffix = '', className = '' }) => (
  <p className={`text-xs text-charcoal-muted tabular-nums ${className}`} data-price-delta={delta.change < 0 ? 'down' : delta.change > 0 ? 'up' : 'flat'}>
    {priceDeltaSentence(delta, unitSuffix)}
  </p>
);
