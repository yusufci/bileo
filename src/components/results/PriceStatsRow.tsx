import React from 'react';
import type { PriceStats } from '../../lib/turna/types';
import { priceTL } from '../../lib/turna/format';

export interface PriceStatsRowProps {
  stats: PriceStats;
  className?: string;
  /** Appended to every value for non-ticket units, e.g. "/gün" for car rental daily prices. */
  unitSuffix?: string;
  /** Accessible name of the row; defaults to the per-ticket wording. */
  ariaLabel?: string;
}

/**
 * Borderless KPI row under the results heading: lowest (accent), median and highest fare.
 * Numbers only; no bars, tracks or colour scales (the values are the chart).
 */
export const PriceStatsRow: React.FC<PriceStatsRowProps> = ({
  stats,
  className = '',
  unitSuffix = '',
  ariaLabel = 'Fiyat özeti',
}) => {
  const cells: Array<{ label: string; value: string; accent: boolean }> = [
    { label: 'En düşük', value: `${priceTL(stats.min)}${unitSuffix}`, accent: true },
    { label: 'Ortanca', value: `${priceTL(stats.median)}${unitSuffix}`, accent: false },
    { label: 'En yüksek', value: `${priceTL(stats.max)}${unitSuffix}`, accent: false },
  ];

  return (
    <dl aria-label={ariaLabel} className={`flex flex-wrap items-baseline gap-x-6 gap-y-1 ${className}`}>
      {cells.map((cell) => (
        <div key={cell.label} className="flex items-baseline gap-1.5">
          <dt className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">{cell.label}</dt>
          <dd
            className={`text-base font-black font-display tabular-nums ${
              cell.accent ? 'text-bordeaux-700 dark:text-bordeaux-300' : 'text-charcoal'
            }`}
          >
            {cell.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};
