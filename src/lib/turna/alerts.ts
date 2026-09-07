/**
 * Local price alerts (browser only, SSR-safe). An alert remembers a route key and a target price in
 * localStorage; nothing leaves the browser and no e-mail is ever promised. After each successful live
 * search, `checkPriceAlerts` compares the real page-wide minimum with the stored targets and reports
 * the alerts that are met, once per observation (`scrapedAt`).
 */
import type { TurnaSuccess } from './types';

export const PRICE_ALERTS_KEY = 'bileo_price_alerts';
export const PRICE_ALERTS_MAX = 20;

export interface PriceAlert {
  /** e.g. `flight:istanbul-ankara`, `car:istanbul` */
  routeKey: string;
  /** Human label shown in toasts, e.g. "İstanbul - Ankara (Uçak)". */
  label: string;
  targetPrice: number;
  /** Minimum price seen when the alert was created (for display only). */
  baselinePrice: number;
  createdAt: string;
  /** `scrapedAt` of the last observation that triggered a notification. */
  lastNotifiedScrapedAt?: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function isAlert(value: unknown): value is PriceAlert {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.routeKey === 'string' &&
    v.routeKey.length > 0 &&
    typeof v.label === 'string' &&
    typeof v.targetPrice === 'number' &&
    Number.isFinite(v.targetPrice) &&
    v.targetPrice > 0 &&
    typeof v.baselinePrice === 'number' &&
    typeof v.createdAt === 'string' &&
    (v.lastNotifiedScrapedAt === undefined || typeof v.lastNotifiedScrapedAt === 'string')
  );
}

export function readPriceAlerts(store: StorageLike | null = defaultStorage()): PriceAlert[] {
  if (!store) return [];
  try {
    const parsed: unknown = JSON.parse(store.getItem(PRICE_ALERTS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isAlert).slice(0, PRICE_ALERTS_MAX) : [];
  } catch {
    return [];
  }
}

function writePriceAlerts(alerts: PriceAlert[], store: StorageLike | null): void {
  if (!store) return;
  try {
    store.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts.slice(0, PRICE_ALERTS_MAX)));
  } catch {
    // Quota or privacy mode: the alert simply is not remembered.
  }
}

/** One alert per route key: saving again replaces the previous target. Returns the stored list. */
export function savePriceAlert(alert: Omit<PriceAlert, 'createdAt' | 'lastNotifiedScrapedAt'>, store: StorageLike | null = defaultStorage(), now: () => Date = () => new Date()): PriceAlert[] {
  const next: PriceAlert = { ...alert, targetPrice: Math.round(alert.targetPrice), createdAt: now().toISOString() };
  if (!isAlert(next)) return readPriceAlerts(store);
  const alerts = [next, ...readPriceAlerts(store).filter((a) => a.routeKey !== alert.routeKey)];
  writePriceAlerts(alerts, store);
  return alerts;
}

export function removePriceAlert(routeKey: string, store: StorageLike | null = defaultStorage()): PriceAlert[] {
  const alerts = readPriceAlerts(store).filter((a) => a.routeKey !== routeKey);
  writePriceAlerts(alerts, store);
  return alerts;
}

export function findPriceAlert(routeKey: string | null | undefined, store: StorageLike | null = defaultStorage()): PriceAlert | undefined {
  if (!routeKey) return undefined;
  return readPriceAlerts(store).find((a) => a.routeKey === routeKey);
}

/**
 * Alerts for `result.routeKey` whose target is reached by the real page-wide minimum, not yet reported
 * for this `scrapedAt`. The returned alerts are marked as notified in storage so a cache hit of the same
 * observation does not toast twice. Results without a price (hotels, ferries) never trigger anything.
 */
export function checkPriceAlerts(result: Pick<TurnaSuccess, 'routeKey' | 'scrapedAt' | 'stats'>, store: StorageLike | null = defaultStorage()): PriceAlert[] {
  const min = result.stats?.min;
  if (typeof min !== 'number' || !Number.isFinite(min)) return [];
  const alerts = readPriceAlerts(store);
  const hits = alerts.filter((a) => a.routeKey === result.routeKey && min <= a.targetPrice && a.lastNotifiedScrapedAt !== result.scrapedAt);
  if (hits.length === 0) return [];
  writePriceAlerts(
    alerts.map((a) => (hits.includes(a) ? { ...a, lastNotifiedScrapedAt: result.scrapedAt } : a)),
    store,
  );
  return hits.map((a) => ({ ...a, lastNotifiedScrapedAt: result.scrapedAt }));
}
