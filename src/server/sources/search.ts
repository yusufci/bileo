/**
 * SERVER ONLY. Runs one query against several landing-page sources in parallel and returns one envelope
 * with a per-source result: success with parsed items, or an honest failure carrying the source's own
 * error code. Nothing is merged across sources here beyond `cheapestBySource`; every item keeps its
 * `source` so the UI can attribute it. Turna keeps its own pipeline (`runTurnaQuery`) and is combined
 * with these results by the caller (Phase A5).
 */
import type { SearchEnvelope, SourceFailure, SourceId, SourceOffer, SourceQuery, SourceResult, SourceSuccess } from '../../lib/sources/types';
import { SOURCE_IDS } from '../../lib/sources/types';
import { TurnaFetchError } from '../turna/fetch';
import type { FetchedPage } from '../turna/fetch';
import { adaptersForKind, fetchSourcePage, getSourceAdapter } from './registry';
import type { SourceAdapter, SourceTarget } from './registry';

export const WARNING_NO_ITEMS = 'Landing sayfasında yapısal teklif bulunamadı.';

export interface SourceSearchDeps {
  /** `opts.refresh` carries the request's refresh flag so the fetch layer bypasses its page cache (throttled per URL). */
  fetchPage: (target: SourceTarget, opts: { refresh: boolean }) => Promise<FetchedPage>;
  now: () => Date;
  refresh: boolean;
}

function defaultDeps(): SourceSearchDeps {
  return { fetchPage: (target, opts) => fetchSourcePage(target, { refresh: opts.refresh }), now: () => new Date(), refresh: false };
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Lowest price among priced items (bus, flight) or the starting price of route facts; null for hotels or empty lists. */
export function minPriceOf(items: SourceOffer[]): number | null {
  let min: number | null = null;
  for (const item of items) {
    const price = 'price' in item ? item.price : 'lowPrice' in item ? item.lowPrice : null;
    if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
      min = min === null ? price : Math.min(min, price);
    }
  }
  return min;
}

function failure(source: SourceId, errorCode: string, error: string, retryAfterSeconds?: number): SourceFailure {
  const out: SourceFailure = { success: false, source, errorCode, error };
  if (retryAfterSeconds !== undefined) out.retryAfterSeconds = retryAfterSeconds;
  return out;
}

async function runOne(adapter: SourceAdapter, query: SourceQuery, deps: SourceSearchDeps): Promise<SourceResult> {
  const target = adapter.resolve(query);
  if (!target) return failure(adapter.id, 'invalid_query', `${adapter.id} bu sorguyu çözümleyemedi (eksik veya aynı yer adları).`);
  let page: FetchedPage;
  try {
    page = await deps.fetchPage(target, { refresh: deps.refresh });
  } catch (err) {
    if (err instanceof TurnaFetchError) return failure(adapter.id, err.errorCode, err.message, err.retryAfterSeconds);
    return failure(adapter.id, 'internal_error', describe(err));
  }
  const items = adapter.parse(target.kind, page.html, target.url);
  const warnings = [...page.warnings];
  if (items.length === 0) warnings.push(WARNING_NO_ITEMS);
  const success: SourceSuccess = {
    success: true,
    source: adapter.id,
    kind: target.kind,
    routeKey: target.routeKey,
    sourceUrl: target.url,
    fetchedVia: page.via,
    scrapedAt: page.fetchedAt,
    latencyMs: page.latencyMs,
    items,
    minPrice: minPriceOf(items),
    warnings,
  };
  return success;
}

/**
 * `sources` limits the run to the given ids (unknown ids and ids that do not serve the kind become
 * failures in the envelope); omitted or empty means every adapter that serves the kind.
 */
export async function runSourceSearch(query: SourceQuery, sources?: readonly string[], overrides: Partial<SourceSearchDeps> = {}): Promise<SearchEnvelope> {
  const deps: SourceSearchDeps = { ...defaultDeps(), ...overrides };
  const requested: SourceId[] = [];
  const results: SourceResult[] = [];
  const jobs: Array<Promise<SourceResult>> = [];

  if (sources && sources.length > 0) {
    for (const raw of sources) {
      const id = raw.trim().toLowerCase();
      if (!(SOURCE_IDS as readonly string[]).includes(id)) {
        results.push(failure(id as SourceId, 'unknown_source', `Bilinmeyen kaynak: ${raw}`));
        continue;
      }
      const source = id as SourceId;
      requested.push(source);
      const adapter = getSourceAdapter(source);
      if (!adapter) {
        results.push(failure(source, 'source_not_available', `${source} bu uçta henüz sunulmuyor (Turna için /api/turna kullanın).`));
        continue;
      }
      if (!adapter.kinds.includes(query.kind)) {
        results.push(failure(source, 'kind_not_supported', `${source} ${query.kind} türünü yayımlamaz.`));
        continue;
      }
      jobs.push(runOne(adapter, query, deps));
    }
  } else {
    for (const adapter of adaptersForKind(query.kind)) {
      requested.push(adapter.id);
      jobs.push(runOne(adapter, query, deps));
    }
  }

  const settled = await Promise.allSettled(jobs);
  for (const s of settled) {
    results.push(s.status === 'fulfilled' ? s.value : failure('obilet', 'internal_error', describe(s.reason)));
  }

  const cheapestBySource: Record<string, number | null> = {};
  for (const r of results) if (r.success) cheapestBySource[r.source] = r.minPrice;

  return {
    success: true,
    kind: query.kind,
    query: { from: query.from, to: query.to, city: query.city },
    requested,
    results,
    cheapestBySource,
    generatedAt: deps.now().toISOString(),
  };
}
