/**
 * Allowlist for the non-Turna landing pages bileo may fetch (KAYNAK_GENISLETME_PLANI.md, ilke 1).
 * Only https, only the www host, only dateless route or city landing paths, no query string, no hash.
 * Everything else (search results, dated pages, /api, /json, /ajax, account pages) is refused before a
 * request is made. Browser-safe: no Node imports.
 */
import type { SourceId } from './types';

const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*';

const RULES: ReadonlyArray<{ source: SourceId; re: RegExp }> = [
  { source: 'obilet', re: new RegExp(`^https://www\\.obilet\\.com/(?:otobus-bileti|ucak-bileti)/${SLUG}-${SLUG}$`) },
  { source: 'obilet', re: new RegExp(`^https://www\\.obilet\\.com/otel/${SLUG}-otelleri$`) },
  { source: 'biletall', re: new RegExp(`^https://www\\.biletall\\.com/otobus-bileti/${SLUG}-${SLUG}$`) },
  { source: 'otelz', re: new RegExp(`^https://www\\.otelz\\.com/${SLUG}-otelleri$`) },
  // enuygun route pages end with a slash; without it the site answers a redirect, which the fetcher refuses.
  { source: 'enuygun', re: new RegExp(`^https://www\\.enuygun\\.com/otobus-bileti/${SLUG}-${SLUG}/$`) },
  // Flight routes carry enuygun's own four-letter city codes after the slugs (istanbul-ankara-ista-anka).
  { source: 'enuygun', re: new RegExp(`^https://www\\.enuygun\\.com/ucak-bileti/${SLUG}-${SLUG}-[a-z]{3,5}-[a-z]{3,5}/$`) },
  // Hotel region pages carry enuygun's numeric region id after the slug (otel/bolge/antalya-481/); detail pages are not fetched.
  { source: 'enuygun', re: new RegExp(`^https://www\\.enuygun\\.com/otel/bolge/${SLUG}-\\d+/$`) },
  // flixbus route pages have no trailing slash and publish route facts only (no timetable); city pages are not fetched.
  { source: 'flixbus', re: new RegExp(`^https://www\\.flixbus\\.com\\.tr/otobus-seferleri/${SLUG}-${SLUG}$`) },
];

/** The source a landing URL belongs to, or null when no allowlist rule matches it exactly. */
export function sourceOfAllowedUrl(url: string): SourceId | null {
  for (const rule of RULES) if (rule.re.test(url)) return rule.source;
  return null;
}

export function isAllowedSourceUrl(url: string): boolean {
  return sourceOfAllowedUrl(url) !== null;
}

/** True only for URLs of the given source; used as the fetch layer's `allow` guard per adapter. */
export function allowedUrlGuard(source: SourceId): (url: string) => boolean {
  return (url) => sourceOfAllowedUrl(url) === source;
}
