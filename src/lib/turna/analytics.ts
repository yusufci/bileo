import type { CompanyStat, DayStat, PriceStats, TurnaOffer } from './types';

interface Priced {
  price: number;
  company: string;
  /** YYYY-MM-DD; empty when the offer has no travel date (car rentals are priced per day, not per date). */
  date: string;
}

function priced(items: TurnaOffer[]): Priced[] {
  const out: Priced[] = [];
  for (const it of items) {
    if (it.kind === 'flight') out.push({ price: it.price, company: it.airline, date: it.date });
    else if (it.kind === 'bus') out.push({ price: it.price, company: it.company, date: it.date });
    else if (it.kind === 'car') out.push({ price: it.dailyPrice, company: it.company, date: '' });
  }
  return out;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function computeStats(items: TurnaOffer[]): PriceStats | null {
  const rows = priced(items);
  if (rows.length === 0) return null;
  const prices = rows.map((r) => r.price).sort((a, b) => a - b);
  const sum = prices.reduce((a, b) => a + b, 0);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;

  const byCompanyMap = new Map<string, { count: number; min: number; sum: number }>();
  const byDayMap = new Map<string, { count: number; min: number }>();
  for (const r of rows) {
    const c = byCompanyMap.get(r.company) ?? { count: 0, min: Infinity, sum: 0 };
    c.count += 1;
    c.min = Math.min(c.min, r.price);
    c.sum += r.price;
    byCompanyMap.set(r.company, c);
    if (!r.date) continue; // undated offers (cars) contribute to price stats but not to the per-day series
    const d = byDayMap.get(r.date) ?? { count: 0, min: Infinity };
    d.count += 1;
    d.min = Math.min(d.min, r.price);
    byDayMap.set(r.date, d);
  }

  const byCompany: CompanyStat[] = [...byCompanyMap.entries()]
    .map(([name, c]) => ({ name, count: c.count, minPrice: round2(c.min), avgPrice: round2(c.sum / c.count) }))
    .sort((a, b) => b.count - a.count || a.minPrice - b.minPrice);
  const byDay: DayStat[] = [...byDayMap.entries()]
    .map(([date, d]) => ({ date, minPrice: round2(d.min), count: d.count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    count: rows.length,
    min: round2(prices[0]),
    max: round2(prices[prices.length - 1]),
    avg: round2(sum / prices.length),
    median: round2(median),
    byCompany,
    byDay,
  };
}
