/**
 * Pure formatting helpers shared by the Turna adapter and the results UI.
 * Browser-safe: no Node imports. Turna timestamps carry a +03:00 offset and are read
 * textually so the browser timezone never shifts the displayed clock.
 */

/** YYYY-MM-DD */
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** YYYY-MM-DDTHH:MM... (offset optional) */
export const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
] as const;
const TR_MONTHS_SHORT = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
] as const;
/** Indexed by Date#getUTCDay (0 = Sunday). */
const TR_WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] as const;
const TR_WEEKDAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const;

interface UtcDateParts {
  year: number;
  /** 0-based */
  monthIndex: number;
  day: number;
  weekday: number;
}

/** Parse a YYYY-MM-DD string as a UTC calendar date; null when malformed or out of range. */
function parseIsoDateUtc(isoDate: string): UtcDateParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
  const ts = Date.UTC(year, monthIndex, day);
  const d = new Date(ts);
  // Reject roll-overs such as 2026-02-31.
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== monthIndex || d.getUTCDate() !== day) return null;
  return { year, monthIndex, day, weekday: d.getUTCDay() };
}

export function isIsoDate(value: string): boolean {
  return ISO_DATE_RE.test(value);
}

/** "2026-09-24T09:50:00+03:00" -> "09:50" (textual, no timezone conversion). */
export function isoClockHHMM(iso: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  return m ? `${m[1]}:${m[2]}` : '';
}

/** 60 -> "1s 00dk", 130 -> "2s 10dk" (bileo's legacy `Hs MMdk` format). */
export function bileoDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}s ${String(m).padStart(2, '0')}dk`;
}

/** "5s 30dk" -> 330, "2s" -> 120, "45dk" -> 45, "1 saat 25 dakika" -> 85; null when no duration is present. */
export function parseBileoDurationMinutes(label: string): number | null {
  if (!label) return null;
  const hours = /(\d+)\s*s(?:a|aat)?\b/i.exec(label);
  const mins = /(\d+)\s*d(?:k|akika)\b/i.exec(label);
  if (!hours && !mins) return null;
  return (hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
}

/** "2026-09-24" -> "24 Eylül Perşembe". Non-ISO input (legacy display strings) is returned unchanged. */
export function formatTrDate(isoDate: string): string {
  const parts = parseIsoDateUtc(isoDate);
  if (!parts) return isoDate;
  return `${parts.day} ${TR_MONTHS[parts.monthIndex]} ${TR_WEEKDAYS[parts.weekday]}`;
}

export interface DayChip {
  weekday: string;
  day: string;
  month: string;
}

/** "2026-09-24" -> { weekday: 'Per', day: '24', month: 'Eyl' }. Malformed input yields the raw string in `day`. */
export function formatDayChip(isoDate: string): DayChip {
  const parts = parseIsoDateUtc(isoDate);
  if (!parts) return { weekday: '', day: isoDate, month: '' };
  return {
    weekday: TR_WEEKDAYS_SHORT[parts.weekday],
    day: String(parts.day),
    month: TR_MONTHS_SHORT[parts.monthIndex],
  };
}

/** Local wall-clock HH:mm for an ISO timestamp (used for "alınma HH:mm"); '' when unparseable. */
export function formatTrClock(isoTs: string): string {
  const d = new Date(isoTs);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/** 1250 -> "1.250 TL"; priceTL(1250.5, 2) -> "1.250,50 TL". */
export function priceTL(n: number, digits = 0): string {
  return `${n.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} TL`;
}

/** "İstanbul (IST)" -> "İstanbul" (drops one trailing parenthetical). */
export function stripParenCode(name: string): string {
  return name.replace(/\s*\([^()]*\)\s*$/, '').trim();
}
