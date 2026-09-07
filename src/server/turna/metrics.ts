/**
 * SERVER ONLY. In-process observability for /api/turna: request counters by status, error code, kind and
 * fetch path, cache-hit ratio and latency percentiles over a bounded ring of recent requests. Nothing is
 * persisted and nothing leaves the process; serverless instances start from zero. Read it with
 * `GET /api/turna?stats=1`, which is answered without touching Turna.
 */

export const METRICS_RING_SIZE = 200;

export interface MetricsSample {
  kind: string | null;
  status: number;
  errorCode?: string | null;
  fetchedVia?: string | null;
  refresh?: boolean;
  latencyMs: number;
}

export interface MetricsSnapshot {
  success: true;
  kind: 'metrics';
  /** ISO time the counters started (process start or last reset). */
  since: string;
  uptimeSeconds: number;
  requests: number;
  ok: number;
  failed: number;
  refreshRequests: number;
  byStatus: Record<string, number>;
  byErrorCode: Record<string, number>;
  byKind: Record<string, number>;
  fetchedVia: Record<string, number>;
  /** Share of successful answers served from the server cache, 0..1; null before the first success. */
  cacheHitRate: number | null;
  latencyMs: LatencySummary;
  lastError: { at: string; status: number; errorCode: string | null; kind: string | null } | null;
  /** Per landing-page source answered through /api/search: successes, failures and their error codes. */
  bySource: Record<string, SourceCounters>;
}

export interface LatencySummary {
  samples: number;
  p50: number | null;
  p95: number | null;
  max: number | null;
}

export interface SourceCounters {
  ok: number;
  failed: number;
  byErrorCode: Record<string, number>;
  fetchedVia: Record<string, number>;
  /** Upstream latency of this source's successful page fetches (cache hits included), last METRICS_RING_SIZE samples. */
  latencyMs: LatencySummary;
}

interface SourceState {
  ok: number;
  failed: number;
  byErrorCode: Record<string, number>;
  fetchedVia: Record<string, number>;
  latencies: number[];
}

export interface SourceSample {
  source: string;
  ok: boolean;
  errorCode?: string | null;
  fetchedVia?: string | null;
  /** Fetch latency of a successful answer; ignored for failures. */
  latencyMs?: number | null;
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function pushLatency(ring: number[], value: number | null | undefined, size: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return;
  ring.push(Math.round(value));
  if (ring.length > size) ring.splice(0, ring.length - size);
}

function summarize(latencies: number[]): LatencySummary {
  const sorted = [...latencies].sort((a, b) => a - b);
  return { samples: sorted.length, p50: percentile(sorted, 50), p95: percentile(sorted, 95), max: sorted.length ? sorted[sorted.length - 1] : null };
}

export class TurnaMetrics {
  private since: Date;
  private requests = 0;
  private ok = 0;
  private failed = 0;
  private refreshRequests = 0;
  private readonly byStatus: Record<string, number> = {};
  private readonly byErrorCode: Record<string, number> = {};
  private readonly byKind: Record<string, number> = {};
  private readonly fetchedVia: Record<string, number> = {};
  private readonly latencies: number[] = [];
  private lastError: MetricsSnapshot['lastError'] = null;
  private readonly bySource: Record<string, SourceState> = {};

  constructor(private readonly now: () => Date = () => new Date(), private readonly ringSize: number = METRICS_RING_SIZE) {
    this.since = this.now();
  }

  record(sample: MetricsSample): void {
    this.requests += 1;
    bump(this.byStatus, String(sample.status));
    bump(this.byKind, sample.kind ?? 'unknown');
    if (sample.refresh) this.refreshRequests += 1;
    pushLatency(this.latencies, sample.latencyMs, this.ringSize);
    if (sample.status >= 200 && sample.status < 300) {
      this.ok += 1;
      bump(this.fetchedVia, sample.fetchedVia ?? 'unknown');
    } else {
      this.failed += 1;
      bump(this.byErrorCode, sample.errorCode ?? 'unknown');
      this.lastError = { at: this.now().toISOString(), status: sample.status, errorCode: sample.errorCode ?? null, kind: sample.kind ?? null };
    }
  }

  /** One source-level answer of /api/search (the HTTP request itself is recorded separately via `record`). */
  recordSource(sample: SourceSample): void {
    const counters = (this.bySource[sample.source] ??= { ok: 0, failed: 0, byErrorCode: {}, fetchedVia: {}, latencies: [] });
    if (sample.ok) {
      counters.ok += 1;
      bump(counters.fetchedVia, sample.fetchedVia ?? 'unknown');
      pushLatency(counters.latencies, sample.latencyMs, this.ringSize);
    } else {
      counters.failed += 1;
      bump(counters.byErrorCode, sample.errorCode ?? 'unknown');
    }
  }

  snapshot(): MetricsSnapshot {
    const cache = this.fetchedVia.cache ?? 0;
    return {
      success: true,
      kind: 'metrics',
      since: this.since.toISOString(),
      uptimeSeconds: Math.max(0, Math.round((this.now().getTime() - this.since.getTime()) / 1000)),
      requests: this.requests,
      ok: this.ok,
      failed: this.failed,
      refreshRequests: this.refreshRequests,
      byStatus: { ...this.byStatus },
      byErrorCode: { ...this.byErrorCode },
      byKind: { ...this.byKind },
      fetchedVia: { ...this.fetchedVia },
      cacheHitRate: this.ok > 0 ? Math.round((cache / this.ok) * 1000) / 1000 : null,
      latencyMs: summarize(this.latencies),
      lastError: this.lastError ? { ...this.lastError } : null,
      bySource: Object.fromEntries(
        Object.entries(this.bySource).map(([id, c]) => [id, { ok: c.ok, failed: c.failed, byErrorCode: { ...c.byErrorCode }, fetchedVia: { ...c.fetchedVia }, latencyMs: summarize(c.latencies) }]),
      ),
    };
  }

  reset(): void {
    this.since = this.now();
    this.requests = 0;
    this.ok = 0;
    this.failed = 0;
    this.refreshRequests = 0;
    for (const map of [this.byStatus, this.byErrorCode, this.byKind, this.fetchedVia]) {
      for (const k of Object.keys(map)) delete map[k];
    }
    this.latencies.length = 0;
    this.lastError = null;
    for (const k of Object.keys(this.bySource)) delete this.bySource[k];
  }
}

/** Process-wide counters shared by the Vite plugin and the Vercel function within one instance. */
export const turnaMetrics = new TurnaMetrics();
