import React, { useMemo, useRef } from 'react';
import type { DayStat } from '../../lib/turna/types';
import { formatDayChip, formatTrDate, priceTL } from '../../lib/turna/format';
import { sound } from '../../utils/sound';

export interface DayStripProps {
  days: DayStat[];
  /** ISO YYYY-MM-DD, or null when all dates are shown. */
  selectedDay: string | null;
  onSelect: (day: string | null) => void;
}

/** Lowest per-day minimum, or null for an empty strip. */
export function cheapestDayPrice(days: DayStat[]): number | null {
  if (days.length === 0) return null;
  return days.reduce((min, d) => Math.min(min, d.minPrice), Number.POSITIVE_INFINITY);
}

function chipClass(selected: boolean): string {
  return `snap-start shrink-0 text-left px-3 py-1.5 rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-bordeaux-700/40 ${
    selected ? 'bg-bordeaux-700 text-white' : 'bg-cream-200 hover:bg-cream-300 text-charcoal'
  }`;
}

/**
 * Date filter built from stats.byDay: `Tümü` plus one chip per departure date with its lowest fare.
 * Radiogroup semantics with roving focus (ArrowLeft/ArrowRight/Home/End). The cheapest day is
 * marked typographically only (accent price + title); there is no colour scale and no badge.
 */
export const DayStrip: React.FC<DayStripProps> = ({ days, selectedDay, onSelect }) => {
  const sorted = useMemo(() => [...days].sort((a, b) => a.date.localeCompare(b.date)), [days]);
  const minPrice = cheapestDayPrice(sorted);
  const options = useMemo<Array<string | null>>(() => [null, ...sorted.map((d) => d.date)], [sorted]);
  const selectedIndex = Math.max(0, options.indexOf(selectedDay));
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const choose = (day: string | null, moveFocus: boolean) => {
    if (day !== selectedDay) {
      sound.playTick();
      onSelect(day);
    }
    if (moveFocus) refs.current[options.indexOf(day)]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (selectedIndex + 1) % options.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (selectedIndex - 1 + options.length) % options.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = options.length - 1;
    if (next === null) return;
    e.preventDefault();
    choose(options[next], true);
  };

  if (sorted.length === 0) return null;
  const allSelected = selectedDay === null || !options.includes(selectedDay);

  return (
    <div
      role="radiogroup"
      aria-label="Tarihe göre filtrele"
      onKeyDown={handleKeyDown}
      className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1"
    >
      <button
        type="button"
        role="radio"
        aria-checked={allSelected}
        tabIndex={allSelected ? 0 : -1}
        ref={(el) => {
          refs.current[0] = el;
        }}
        onClick={() => choose(null, false)}
        className={chipClass(allSelected)}
      >
        <span className="block text-[11px] font-extrabold">Tümü</span>
        <span className={`block text-[11px] font-bold tabular-nums ${allSelected ? 'text-white' : 'text-charcoal-muted'}`}>
          {sorted.length} tarih
        </span>
      </button>

      {sorted.map((day, i) => {
        const chip = formatDayChip(day.date);
        const selected = !allSelected && day.date === selectedDay;
        const cheapest = minPrice !== null && day.minPrice === minPrice;
        const longDate = formatTrDate(day.date);
        return (
          <button
            key={day.date}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            ref={(el) => {
              refs.current[i + 1] = el;
            }}
            onClick={() => choose(day.date, false)}
            title={cheapest ? 'En ucuz gün' : longDate}
            aria-label={`${longDate}, en düşük ${priceTL(day.minPrice)}, ${day.count} teklif${cheapest ? ', en ucuz gün' : ''}`}
            className={chipClass(selected)}
          >
            <span className="block text-[11px] font-extrabold">
              {chip.weekday ? `${chip.weekday} ${chip.day} ${chip.month}` : chip.day}
            </span>
            <span
              className={`block text-[11px] font-bold tabular-nums ${
                selected ? 'text-white' : cheapest ? 'text-bordeaux-700 dark:text-bordeaux-300' : 'text-charcoal-muted'
              }`}
            >
              {priceTL(day.minPrice)}
            </span>
          </button>
        );
      })}
    </div>
  );
};
