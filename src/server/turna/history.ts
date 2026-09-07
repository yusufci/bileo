/**
 * SERVER ONLY. Price-history persistence for Turna observations.
 *
 * Async port of nexora-panel/lib/turna/store.ts (SQLite) to an interface with two
 * implementations: NoopHistoryStore (default, Vercel-safe, keeps nothing) and PgHistoryStore
 * (explicit opt-in via TURNA_HISTORY=pg plus DATABASE_URL or PGHOST; `pg` is imported lazily so
 * the handler module never loads a database driver unless asked to). Every store failure is
 * downgraded to a response warning by the pipeline; it never fails a request.
 */
import { randomUUID } from 'node:crypto';
import type { HistoryPoint, PriceDelta, PriceStats, RouteFacts, TurnaKind, TurnaOffer } from '../../lib/turna/types';

export interface ObservationInput {
  routeKey: string;
  kind: TurnaKind;
  sourceUrl: string;
  fetchedVia: string;
  latencyMs: number;
  items: TurnaOffer[];
  stats: PriceStats | null;
  facts: RouteFacts;
}

export interface TurnaHistoryStore {
  record(input: ObservationInput): Promise<{ id: string; observedAt: string }>;
  /** Oldest to newest, capped at `limit` observations (default 60). */
  history(routeKey: string, limit?: number): Promise<HistoryPoint[]>;
  /** Compare `currentMin` with the most recent earlier observation that had a price. */
  delta(routeKey: string, currentObservationId: string | null, currentMin: number | null): Promise<PriceDelta | null>;
}

// ---------------------------------------------------------------------------
// Noop store (default)
// ---------------------------------------------------------------------------

export class NoopHistoryStore implements TurnaHistoryStore {
  constructor(private readonly now: () => Date = () => new Date()) {}

  async record(): Promise<{ id: string; observedAt: string }> {
    return { id: 'noop', observedAt: this.now().toISOString() };
  }

  async history(): Promise<HistoryPoint[]> {
    return [];
  }

  async delta(): Promise<PriceDelta | null> {
    return null;
  }
}

// ---------------------------------------------------------------------------
// In-memory store (default): real observations of this process only, bounded, never persisted
// ---------------------------------------------------------------------------

export const MEMORY_HISTORY_LIMIT = 60;

interface MemoryObservation {
  id: string;
  observedAt: string;
  minPrice: number | null;
  avgPrice: number | null;
  count: number;
}

/**
 * Keeps the last MEMORY_HISTORY_LIMIT observations per route key in process memory. Every point is a real
 * fetch made by this server instance; nothing is invented, nothing survives a restart (serverless cold
 * starts begin empty). Use TURNA_HISTORY=pg for durable history and TURNA_HISTORY=off to keep nothing.
 */
export class MemoryHistoryStore implements TurnaHistoryStore {
  private readonly byRoute = new Map<string, MemoryObservation[]>();
  private seq = 0;

  constructor(private readonly now: () => Date = () => new Date(), private readonly limit: number = MEMORY_HISTORY_LIMIT) {}

  async record(input: ObservationInput): Promise<{ id: string; observedAt: string }> {
    this.seq += 1;
    const id = `mem_${this.seq}`;
    const observedAt = this.now().toISOString();
    const list = this.byRoute.get(input.routeKey) ?? [];
    list.push({ id, observedAt, minPrice: input.stats?.min ?? null, avgPrice: input.stats?.avg ?? null, count: input.items.length });
    if (list.length > this.limit) list.splice(0, list.length - this.limit);
    this.byRoute.set(input.routeKey, list);
    return { id, observedAt };
  }

  async history(routeKey: string, limit = MEMORY_HISTORY_LIMIT): Promise<HistoryPoint[]> {
    const list = this.byRoute.get(routeKey) ?? [];
    return list.slice(-Math.max(0, limit)).map(({ observedAt, minPrice, avgPrice, count }) => ({ observedAt, minPrice, avgPrice, count }));
  }

  async delta(routeKey: string, currentObservationId: string | null, currentMin: number | null): Promise<PriceDelta | null> {
    if (currentMin == null) return null;
    const list = this.byRoute.get(routeKey) ?? [];
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const obs = list[i];
      if (obs.id === currentObservationId || obs.minPrice === null) continue;
      const change = Math.round((currentMin - obs.minPrice) * 100) / 100;
      return {
        previousObservedAt: obs.observedAt,
        previousMin: obs.minPrice,
        currentMin,
        change,
        changePct: obs.minPrice > 0 ? Math.round((change / obs.minPrice) * 10000) / 100 : 0,
      };
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Postgres store (opt-in)
// ---------------------------------------------------------------------------

export interface PgQueryResult {
  rows: Array<Record<string, unknown>>;
}

export interface PgQueryable {
  query(text: string, values?: unknown[]): Promise<PgQueryResult>;
}

export interface PgPoolClientLike extends PgQueryable {
  release(): void;
}

export interface PgPoolLike extends PgQueryable {
  connect(): Promise<PgPoolClientLike>;
}

export const TURNA_HISTORY_DDL = `
CREATE TABLE IF NOT EXISTS turna_observations (
  id            TEXT PRIMARY KEY,
  route_key     TEXT NOT NULL,
  kind          TEXT NOT NULL,
  source_url    TEXT NOT NULL,
  observed_at   TIMESTAMPTZ NOT NULL,
  fetched_via   TEXT NOT NULL,
  latency_ms    INTEGER NOT NULL,
  item_count    INTEGER NOT NULL,
  min_price     NUMERIC(10,2),
  avg_price     NUMERIC(10,2),
  max_price     NUMERIC(10,2),
  facts_json    JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_turna_obs_route ON turna_observations(route_key, observed_at);
CREATE TABLE IF NOT EXISTS turna_offers (
  observation_id TEXT NOT NULL REFERENCES turna_observations(id) ON DELETE CASCADE,
  offer_id       TEXT NOT NULL,
  route_key      TEXT NOT NULL,
  kind           TEXT NOT NULL,
  company        TEXT,
  price          NUMERIC(10,2),
  depart_at      TIMESTAMPTZ,
  offer_json     JSONB NOT NULL,
  PRIMARY KEY (observation_id, offer_id)
);
CREATE INDEX IF NOT EXISTS idx_turna_offers_route ON turna_offers(route_key, offer_id);
`;

export const INSERT_OBSERVATION_SQL = `
INSERT INTO turna_observations
  (id, route_key, kind, source_url, observed_at, fetched_via, latency_ms, item_count, min_price, avg_price, max_price, facts_json)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)`;

export const INSERT_OFFER_SQL = `
INSERT INTO turna_offers (observation_id, offer_id, route_key, kind, company, price, depart_at, offer_json)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
ON CONFLICT (observation_id, offer_id) DO UPDATE SET price = EXCLUDED.price, offer_json = EXCLUDED.offer_json`;

export const SELECT_HISTORY_SQL = `
SELECT id, observed_at, min_price, avg_price, item_count
FROM turna_observations
WHERE route_key = $1
ORDER BY observed_at DESC
LIMIT $2`;

export const SELECT_PREVIOUS_SQL = `
SELECT id, observed_at, min_price, avg_price, item_count
FROM turna_observations
WHERE route_key = $1 AND min_price IS NOT NULL AND ($2::text IS NULL OR id <> $2::text)
ORDER BY observed_at DESC
LIMIT 1`;

export interface PgHistoryStoreOptions {
  now?: () => Date;
  newId?: () => string;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toISOString();
  }
  return String(value ?? '');
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toInt(value: unknown): number {
  const n = toNumberOrNull(value);
  return n === null ? 0 : Math.trunc(n);
}

export function newObservationId(): string {
  return `obs_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export class PgHistoryStore implements TurnaHistoryStore {
  private ensured: Promise<void> | null = null;
  private readonly now: () => Date;
  private readonly newId: () => string;

  constructor(
    private readonly poolSource: PgPoolLike | (() => Promise<PgPoolLike>),
    opts: PgHistoryStoreOptions = {},
  ) {
    this.now = opts.now ?? (() => new Date());
    this.newId = opts.newId ?? newObservationId;
  }

  private async pool(): Promise<PgPoolLike> {
    return typeof this.poolSource === 'function' ? this.poolSource() : this.poolSource;
  }

  /** Idempotent DDL, run once per store instance; a failure is retried on the next call. */
  private ensureSchema(): Promise<void> {
    if (!this.ensured) {
      this.ensured = this.pool()
        .then((pool) => pool.query(TURNA_HISTORY_DDL))
        .then(() => undefined)
        .catch((err: unknown) => {
          this.ensured = null;
          throw err;
        });
    }
    return this.ensured;
  }

  async record(input: ObservationInput): Promise<{ id: string; observedAt: string }> {
    await this.ensureSchema();
    const pool = await this.pool();
    const id = this.newId();
    const observedAt = this.now().toISOString();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(INSERT_OBSERVATION_SQL, [
        id,
        input.routeKey,
        input.kind,
        input.sourceUrl,
        observedAt,
        input.fetchedVia,
        input.latencyMs,
        input.items.length,
        input.stats?.min ?? null,
        input.stats?.avg ?? null,
        input.stats?.max ?? null,
        JSON.stringify(input.facts),
      ]);
      for (const item of input.items) {
        const company = item.kind === 'flight' ? item.airline : item.kind === 'hotel' ? item.name : item.company;
        const price = item.kind === 'hotel' ? null : item.kind === 'car' ? item.dailyPrice : item.price;
        const departAt = item.kind === 'hotel' || item.kind === 'car' ? null : item.departureAt;
        await client.query(INSERT_OFFER_SQL, [id, item.id, input.routeKey, input.kind, company, price, departAt, JSON.stringify(item)]);
      }
      await client.query('COMMIT');
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // The connection is broken; the pool will discard it.
      }
      throw err;
    } finally {
      client.release();
    }
    return { id, observedAt };
  }

  async history(routeKey: string, limit = 60): Promise<HistoryPoint[]> {
    await this.ensureSchema();
    const pool = await this.pool();
    const { rows } = await pool.query(SELECT_HISTORY_SQL, [routeKey, limit]);
    return rows
      .slice()
      .reverse()
      .map((r) => ({
        observedAt: toIso(r.observed_at),
        minPrice: toNumberOrNull(r.min_price),
        avgPrice: toNumberOrNull(r.avg_price),
        count: toInt(r.item_count),
      }));
  }

  async delta(routeKey: string, currentObservationId: string | null, currentMin: number | null): Promise<PriceDelta | null> {
    if (currentMin == null) return null;
    await this.ensureSchema();
    const pool = await this.pool();
    const { rows } = await pool.query(SELECT_PREVIOUS_SQL, [routeKey, currentObservationId]);
    const row = rows[0];
    if (!row) return null;
    const previousMin = toNumberOrNull(row.min_price);
    if (previousMin === null) return null;
    const change = Math.round((currentMin - previousMin) * 100) / 100;
    return {
      previousObservedAt: toIso(row.observed_at),
      previousMin,
      currentMin,
      change,
      changePct: previousMin > 0 ? Math.round((change / previousMin) * 10000) / 100 : 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

export type EnvLike = Record<string, string | undefined>;

/** Postgres history is opt-in: TURNA_HISTORY=pg AND (DATABASE_URL or PGHOST). */
export function historyEnabled(env: EnvLike = process.env): boolean {
  return env.TURNA_HISTORY === 'pg' && Boolean(env.DATABASE_URL || env.PGHOST);
}

type GlobalWithPool = typeof globalThis & { __bileoTurnaPgPool?: Promise<PgPoolLike> };

/** Lazily import `pg` and build one small pool per process (max 2 connections, 1.5 s connect timeout). */
export function createPgPool(env: EnvLike = process.env): Promise<PgPoolLike> {
  const g = globalThis as GlobalWithPool;
  if (!g.__bileoTurnaPgPool) {
    g.__bileoTurnaPgPool = (async () => {
      const mod = await import('pg');
      const PoolCtor = mod.Pool ?? mod.default.Pool;
      const ssl = env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
      const base = { max: 2, connectionTimeoutMillis: 1500, idleTimeoutMillis: 10_000, ssl };
      const config = env.DATABASE_URL
        ? { ...base, connectionString: env.DATABASE_URL }
        : {
            ...base,
            host: env.PGHOST,
            port: env.PGPORT ? Number(env.PGPORT) : undefined,
            user: env.PGUSER,
            password: env.PGPASSWORD,
            database: env.PGDATABASE,
          };
      const pool = new PoolCtor(config);
      pool.on('error', () => {
        // Idle-client errors must not crash the process; the next query surfaces the failure.
      });
      return pool as unknown as PgPoolLike;
    })().catch((err: unknown) => {
      g.__bileoTurnaPgPool = undefined;
      throw err;
    });
  }
  return g.__bileoTurnaPgPool;
}

/**
 * TURNA_HISTORY=pg (with DATABASE_URL or PGHOST) -> Postgres; TURNA_HISTORY=off -> nothing is kept;
 * anything else (unset, "memory") -> bounded in-process memory so price deltas appear from the second fetch.
 */
export function createHistoryStore(env: EnvLike = process.env): TurnaHistoryStore {
  if (historyEnabled(env)) return new PgHistoryStore(() => createPgPool(env));
  if ((env.TURNA_HISTORY ?? '').toLowerCase() === 'off') return new NoopHistoryStore();
  return new MemoryHistoryStore();
}
