# Project: Bileo Transportation Ticketing Platform Backend & Security Architecture

## Architecture Overview
Bileo is an enterprise-grade multimodal transportation ticketing platform (Buses, Flights, Trains, Ferries) built with Node.js/Express, TypeScript, and PostgreSQL. The system implements multi-layered perimeter defense, zero-trust SQL injection immunity, cryptographic bcrypt/JWT authentication, rate limiting, and automated security test suites.

```
                                  [ CLIENTS / FRONTEND / REST CONSUMERS ]
                                                     │
                                                     ▼
                                        [ PERIMETER DEFENSE LAYER ]
                         ├── Helmet HTTP Security Headers (CSP, HSTS, X-Frame-Options, noSniff)
                         ├── Restrictive CORS Whitelist (Origin control, credentials)
                         ├── Express-Rate-Limit Defense (Login, Register, Payment, Global)
                         └── Express JSON Body Parser (10kb payload bounds)
                                                     │
                                                     ▼
                                    [ REQUEST VALIDATION & GATEKEEPING ]
                         ├── Zod Request Validation Middleware (Params, Query, Body)
                         ├── Algorithmic Validators (TCKN checksum, Passport, Luhn card verification)
                         └── Structured 400 Bad Request Error Envelope
                                                     │
                                                     ▼
                                        [ AUTHENTICATION SUBSYSTEM ]
                         ├── Bcrypt Salted Password Hashing (Work factor 12, timing attack defense)
                         ├── JWT Token Subsystem (HS256 cryptographic signatures, strict expiration)
                         └── Auth Middlewares: requireAuth, requireRole, optionalAuth
                                                     │
                                                     ▼
                                           [ API ROUTE HANDLERS ]
                         ├── Auth Routes (/api/auth/register, /api/auth/login, /api/auth/me)
                         ├── Discovery & Routes (/api/routes, /api/routes/:id/seats)
                         ├── Bookings & Checkout (/api/bookings, /api/bookings/checkout, /api/bookings/:pnr)
                         ├── Payments & Refunds (/api/payments, /api/bookings/:pnr/refund)
                         └── Admin & Security (/api/admin/audit-logs, /api/health)
                                                     │
                                                     ▼
                                      [ PRIVACY & COMPLIANCE ENGINE ]
                         ├── KVKK/GDPR Masking (TCKN, Passport, Phone, Email)
                         ├── PCI-DSS Data Stripping (PAN masking, zero CVV storage)
                         └── Recursive Deep Log Sanitizer (maskSensitiveFields)
                                                     │
                                                     ▼
                                     [ PARAMETERIZED QUERY ENGINE ]
                         ├── sql`...` Tagged Template Literal Engine ($1, $2, ...)
                         ├── Safe Dynamic WhereBuilder & Identifier Whitelist
                         └── 100% SQL Injection Immunity under Adversarial Fuzzing
                                                     │
                                                     ▼
                                    [ DUAL-MODE DATABASE SERVICE ]
                         ├── PostgresDatabaseService (pg.Pool, max=20, timeout=5s, transaction isolation)
                         ├── MemoryDatabaseService (Pure TS relational engine + seed loader for dev/tests)
                         └── DatabaseManager (Auto-probe Postgres -> graceful Memory fallback)
                                                     │
                                                     ▼
                                     [ RELATIONAL DATABASE SCHEMA ]
                         ├── users, carriers, routes, seats (OCC versioning & row locks)
                         └── bookings, tickets, payments, security_audit_logs
```

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Relational Schema DDL | 8 normalized 3NF tables with foreign keys, cascades, indexes, and constraints | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Dual-Mode DB Engine | `IDatabaseService` supporting `PostgresDatabaseService` and `MemoryDatabaseService` | M1 | ORIGINAL_REQUEST §R1 |
| 3 | DB Connection Pooling | Connection pool with health checks, connection timeouts, and lifecycle management | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Transaction Isolation | Atomic transaction manager (`BEGIN`, `COMMIT`, `ROLLBACK`) with Read Committed isolation | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Concurrency Control | Optimistic Concurrency Control (`version`) + pessimistic row locking (`FOR UPDATE`) for seats | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Seed Data Loader | Automated seeding of carriers, routes, terminals, and seat layouts from mock data | M1 | ORIGINAL_REQUEST §R1 |
| 7 | Parameterized Tagged SQL | `sql` template literal builder converting JS interpolations to `$1, $2, ...` positional params | M1 | ORIGINAL_REQUEST §R2 |
| 8 | Dynamic Query Builder | `WhereBuilder` for safe conditional filter accumulation without string concatenation | M1 | ORIGINAL_REQUEST §R2 |
| 9 | Identifier Whitelist | Compile-time column and table name whitelisting preventing identifier injection | M1 | ORIGINAL_REQUEST §R2 |
| 10 | Bcrypt Password Hashing | Work factor 12 salted hashing with unique salt generation and zero plaintext leakage | M2 | ORIGINAL_REQUEST §R3 |
| 11 | Constant-Time Auth | Timing attack defense with dummy hash comparison on non-existent users | M2 | ORIGINAL_REQUEST §R3 |
| 12 | JWT Issuance & Signing | Cryptographically signed tokens with user claims (`sub`, `email`, `role`), issued at, expiry | M2 | ORIGINAL_REQUEST §R3 |
| 13 | Dual-Transport Tokens | Support for `Authorization: Bearer <token>` header and HTTP-only secure cookie parsing | M2 | ORIGINAL_REQUEST §R3 |
| 14 | Auth Middlewares | `requireAuth`, `requireRole(['admin', ...])`, and `optionalAuth` route gatekeepers | M2 | ORIGINAL_REQUEST §R3 |
| 15 | Login Rate Limiter | Brute-force protection on `/api/auth/login` (5 attempts / 15 min per IP/account) | M2 | ORIGINAL_REQUEST §R3 |
| 16 | Register Rate Limiter | Bot registration defense on `/api/auth/register` (5 attempts / 1 hour per IP) | M2 | ORIGINAL_REQUEST §R3 |
| 17 | Payment Rate Limiter | Card testing / flooding defense on `/api/bookings` & `/api/payments` (5 req / 1 min) | M2 | ORIGINAL_REQUEST §R3 |
| 18 | Global Rate Limiter | Perimeter DoS protection across `/api/*` (300 req / 15 min per IP) | M2 | ORIGINAL_REQUEST §R3 |
| 19 | Standardized 429 Format | Uniform 429 response body + `RateLimit-Limit`, `Remaining`, `Reset`, `Retry-After` headers | M2 | ORIGINAL_REQUEST §R3 |
| 20 | Helmet Security Headers | CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, hidePoweredBy | M3 | ORIGINAL_REQUEST §R4 |
| 21 | Restrictive CORS | Strict origin whitelisting with credential support and preflight caching | M3 | ORIGINAL_REQUEST §R4 |
| 22 | Zod Request Validation | Universal validation middleware validating `params`, `query`, and `body` | M3 | ORIGINAL_REQUEST §R4 |
| 23 | Structured 400 Errors | Standardized `{ success: false, error: 'Validation Error', code: 'VALIDATION_ERROR', details: [...] }` | M3 | ORIGINAL_REQUEST §R4 |
| 24 | Auth & Profile Schemas | Zod schemas for login, registration, password confirmation, and profile updates | M3 | ORIGINAL_REQUEST §R4 |
| 25 | Search & Filter Schemas | Zod query schemas for multimodal route discovery, dates, transport types, and sorting | M3 | ORIGINAL_REQUEST §R4 |
| 26 | Passenger & Booking Schemas | Zod schemas enforcing TCKN checksums (11 digits), Passport formats, phone, and gender rules | M3 | ORIGINAL_REQUEST §R4 |
| 27 | Payment & Luhn Schemas | Zod schemas validating card numbers (Luhn modulo-10), expiry dates, and CVV | M3 | ORIGINAL_REQUEST §R4 |
| 28 | Express Server & App Setup | Express application initialization, middleware mounting order, and graceful shutdown | M3 | ORIGINAL_REQUEST §R1-R4 |
| 29 | REST API Endpoints | Complete controllers for Auth, Routes, Seats, Bookings, Tickets, Payments, and Health | M3 | ORIGINAL_REQUEST §R1-R4 |
| 30 | KVKK/GDPR Data Masking | Algorithms for masking TCKN (`*******1234`), Passports, Phones (`0532 *** ** 67`), Emails | M3 | ORIGINAL_REQUEST §R4 |
| 31 | PCI-DSS Card Masking | PAN masking (`**** **** **** 4242`) and zero CVV/CVC persistence rule | M3 | ORIGINAL_REQUEST §R4 |
| 32 | Recursive Log Sanitizer | `maskSensitiveFields` deeply cleaning logs before persistence in `security_audit_logs` | M3 | ORIGINAL_REQUEST §R4 |
| 33 | Global Error Redaction | Centralized error handler preventing stack trace or SQL error leakage in production | M3 | ORIGINAL_REQUEST §R4 |
| 34 | SQLi Fuzzing Test Suite | Automated fuzzing tests verifying neutralization of `' OR '1'='1`, `'; DROP TABLE`, `UNION` | M4 | ORIGINAL_REQUEST §R5 |
| 35 | XSS & Sanitization Tests | Verification of HTML escaping, `<script>` neutralization, DOM event stripping | M4 | ORIGINAL_REQUEST §R5 |
| 36 | Rate Limit Trigger Tests | Empirical tests verifying 429 responses, Retry-After headers, and IP isolation | M4 | ORIGINAL_REQUEST §R5 |
| 37 | JWT Security Tests | Tests verifying token tamper detection, expired tokens, algorithm manipulation, roles | M4 | ORIGINAL_REQUEST §R5 |
| 38 | Bcrypt Verification Tests | Tests validating work factor 12 format, salt uniqueness, and zero plaintext leakage | M4 | ORIGINAL_REQUEST §R5 |
| 39 | Zod Validation Tests | Tests validating rejection of malformed inputs with structured 400 envelopes | M4 | ORIGINAL_REQUEST §R5 |
| 40 | Production Docker Compose | `docker-compose.yml` with PostgreSQL 16 Alpine, persistent volume, and health checks | M4 | ORIGINAL_REQUEST §R5 |
| 41 | Environment Configuration | `.env.example` and environment configuration parser for production and local development | M4 | ORIGINAL_REQUEST §R5 |
| 42 | Full E2E Security Pass | 100% test pass rate across master test runner with zero TypeScript compilation errors | M-Final | Acceptance Criteria |
| 43 | Forensic Integrity Audit | Static and runtime integrity verification confirming zero placeholders or fake logic | M-Final | Acceptance Criteria |
| 44 | Turna Landing-Page Scraper (server) | `src/server/turna/*`: JSON-LD plus Next.js RSC parser (`parse.ts`: `extractRscText` / `extractRscArray` over the `self.__next_f.push` chunks, `parseHotels(blocks, html)` merging the 50-row `initialHotels` list with the 20 JSON-LD hotels by slug, `parseCars(html)` over the `cars` array; sha1 offer ids shared with the Python package), direct-only hardened fetcher (`fetch.ts`: URL allowlist, robots.txt, cache with real `fetchedAt`, negative cache, coalescing, per-host gate, rolling budget, Akamai block cooldown, retry with backoff), `pipeline.ts`, `http.ts`, `vitePlugin.ts`, opt-in Postgres history (`history.ts`) | M-Turna | TURNA_INTEGRATION.md §1-3 |
| 45 | `GET\|POST /api/turna` Contract | One handler module for Vercel (`api/turna.ts`) and Vite dev/preview; `kind=flight\|bus\|ferry` with `from`/`to`, `kind=hotel\|car` with `city` (`city ?? to ?? from`; car routeKey `car:{city}`, stats over `dailyPrice`, hotel stats null); `TurnaResponse` bodies, status map (400/403/404/405/429/502/503), `Cache-Control` variants, `X-Turna-Fetched-Via`, `X-Turna-Scraped-At`, `Retry-After`; no CORS header | M-Turna | TURNA_INTEGRATION.md §2 |
| 46 | Browser Turna Library | `src/lib/turna/*`: `urls` (five landing families incl. `arac-kiralama/sehir`, `isCityKind`, `airlineLogoUrl`, `busCompanyLogoUrl`), `types` (`TurnaKind` incl. `car`, `CarOffer`, rich `HotelOffer`), `analytics`, `format`, `guard` (structural validation, invalid items dropped and counted; cars strict, hotels tolerate an absent Phase 2 field and encode it as `null` / `[]`), `adapter` (offers to `RouteItem` with `provenance` incl. `logoUrl` / `companySlug` when published; hotel/car counted in `nonRouteItems`; `SearchKind` <-> `TurnaKind` maps), `client` (`fetchTurna` to `LiveSearchState`, `ok` for any kind with items), `places` (local autocomplete over the 81 provinces; `searchPlacesForKind` for the Otel/Araç tabs, `CAR_CITIES` = the 111 verified car landing slugs) | M-Turna | TURNA_INTEGRATION.md §1, §5, §10 |
| 47 | Honest Live Search UI | `SearchResults` states on `LiveSearchState` (idle, loading, ok with ProvenanceStrip/PriceStatsRow/DayStrip/RouteFactsLine, facts-only, unsupported, error), HeroSection local autocomplete, provenance-aware TicketExperienceScreen/SeatSelectionModal/CheckoutModal copy; Phase 2: Otel and Araç tabs with one city input, the `SearchResults` city branch ("Antalya otelleri" / "İstanbul araç kiralama", `countLabel` counter, quiet empty notice), `HotelResults` (card grid, no prices), `CarResults` (daily-price KPI row, company distribution), `BrandLogo` (bileo SVG mark, Turna CDN `<img>`, text logo) | M-Turna | TURNA_INTEGRATION.md §4, §6, §10 |
| 48 | Turna Scraper Test Suite | `src/tests/turna_scraper.test.ts` (196 offline tests, groups A to L; K = hotel and car Phase 2, J.11 to J.15 = hotel/car/logo SSR, L = Phase 2 to 4 UI static guards, E.22/F.10/J.16/J.17 = Phase 3 to 4 server and SSR) with fixtures in `src/tests/fixtures/turna_fixtures.ts` (JSON-LD pages plus RSC `initialHotels` / `cars` chunks); registered in `src/tests/test_runner.ts` | M-Turna | TURNA_INTEGRATION.md §7, §10.7 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| **M1** | Relational DB Layer & Parameterized Query Engine | DDL schemas, `IDatabaseService`, `PostgresDatabaseService`, `MemoryDatabaseService`, `sql` query builder, `WhereBuilder`, seed data loader, seat concurrency locks (`FOR UPDATE` + OCC) | none | DONE |
| **M2** | Cryptographic Auth, Token Security & Rate Limiting | Bcrypt (work factor 12) hashing, timing attack defense, JWT issuance & verification, `requireAuth` / `requireRole`, `express-rate-limit` handlers (login, register, payment, global), 429 envelopes | M1 | DONE |
| **M3** | Perimeter Defense, Zod Validation, REST API & Privacy | Helmet headers, CORS whitelist, Zod request validation middleware & schemas, KVKK/GDPR masking, PCI-DSS compliance, recursive log sanitizer, Express server & API routes (`auth`, `routes`, `bookings`, `payments`, `health`, `audit_logs`) | M1, M2 | PLANNED |
| **M4** | Security Test Suites & Docker Compose Deployment | Automated security test suite (`src/tests/security_tests.ts`), master test runner integration, `docker-compose.yml` (Postgres 16, `postgres_data` volume, `pg_isready` health check), `.env.example` | M1, M2, M3 | PLANNED |
| **M-Test** | E2E Security Testing Track | Opaque-box E2E test infra (`TEST_INFRA.md`, `TEST_READY.md`), adversarial fuzzing matrix, cross-tier integration | Parallel | PLANNED |
| **M-Turna** | Turna.com Live Search Integration | Landing-page scraper ported from nexora-panel/lib/turna (server-only under `src/server/turna`, browser-safe under `src/lib/turna`), shared `/api/turna` handler for Vercel and Vite, `LiveSearchState` driven results UI, local autocomplete, consumer honesty fixes, 196 offline tests (Phase 2 hotel/car kinds: `kind=car\|hotel&city=`, RSC payload parsing, logo URLs, group K; hotel/car/logo SSR in J; UI static guards in L); legacy `/api/live-scrape`, `/api/autocomplete` and `api/utils/scraper.ts` removed | M1, M-Test | DONE (2026-09-06; Phase 3 to 4 increments 2026-09-07; `npm test` 693 tests, all green) |
| **M-Final** | Final Verification, Hardening & Forensic Audit | Pass 100% of test suites (693 tests as of 2026-09-07), `npm run build` zero TS errors, adversarial fuzzing, forensic integrity audit | M1, M2, M3, M4, M-Test, M-Turna | PLANNED |

---

## Interface Contracts

### 1. Database Service (`src/server/db/types.ts`)
```typescript
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}

export interface ITransactionClient {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
}

export interface IDatabaseService {
  mode: 'postgres' | 'memory';
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  transaction<T>(callback: (client: ITransactionClient) => Promise<T>): Promise<T>;
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; mode: string; latencyMs: number; error?: string }>;
  initSchema(): Promise<void>;
  seedData(): Promise<void>;
  close(): Promise<void>;
}
```

### 2. Query Builder (`src/server/db/queryBuilder.ts`)
```typescript
export interface ParameterizedQuery {
  text: string;
  values: any[];
}

export function sql(strings: TemplateStringsArray, ...values: any[]): ParameterizedQuery;
export class WhereBuilder {
  where(condition: string, ...values: any[]): this;
  whereIf(clause: boolean, condition: string, ...values: any[]): this;
  build(): { clause: string; values: any[] };
}
```

### 3. Authentication & JWT (`src/server/auth/tokenService.ts`)
```typescript
export interface BileoJwtPayload {
  sub: string;
  email: string;
  role: 'customer' | 'admin' | 'operator' | 'auditor';
  name: string;
  surname: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export function hashPassword(password: string): Promise<string>;
export function verifyPassword(candidate: string, hash: string): Promise<boolean>;
export function generateToken(user: { id: string; email: string; role: string; name: string; surname: string }, expiresIn?: string): string;
export function verifyToken(token: string): BileoJwtPayload;
```

### 4. Middleware & Validation (`src/server/middleware/`)
```typescript
export function validateRequest(schemas: { params?: z.ZodType<any>; query?: z.ZodType<any>; body?: z.ZodType<any> }): RequestHandler;
export function requireAuth(req: Request, res: Response, next: NextFunction): void;
export function requireRole(roles: string[]): RequestHandler;
export function optionalAuth(req: Request, res: Response, next: NextFunction): void;
export const rateLimiters: {
  login: RequestHandler;
  register: RequestHandler;
  payment: RequestHandler;
  global: RequestHandler;
};
```

### 5. Turna Live Search (`src/lib/turna/*`, `src/server/turna/*`, `api/turna.ts`)
```typescript
// GET|POST /api/turna  (query for GET, JSON body for POST)
//   kind: 'flight' | 'bus' | 'ferry' | 'hotel' | 'car'  (required; TURNA_KINDS)
//   from, to: slug or display name (slugifyTr, 2..60 chars, from !== to)   city: hotel and car (city ?? to ?? from)   refresh: '1' | 'true'
// 200 -> TurnaSuccess (routeKey `flight:a-b`, `hotel:city`, `car:city`; stats null for hotel/ferry, over dailyPrice for car with byDay []);
// 400 invalid_query | invalid_json; 403 robots_disallowed; 404 route_not_found;
// 405 method_not_allowed (Allow: GET, POST, OPTIONS); 413 payload_too_large; 429 rate_limited (Retry-After: 2);
// 502 no_structured_data | upstream_unavailable; 503 blocked (Retry-After: remaining seconds); 500 internal_error
export type TurnaResponse = TurnaSuccess | TurnaFailure;            // src/lib/turna/types.ts (verbatim nexora contract)
export type TurnaOffer = FlightOffer | BusOffer | HotelOffer | CarOffer;   // flight/bus carry logoUrl (bus also companySlug); hotel has no price
export function resolveTurnaTarget(query: TurnaQuery): ResolvedTurnaTarget;   // src/lib/turna/urls.ts
export function isAllowedLandingUrl(url: string): boolean;          // only the five undated landing-page families (incl. /arac-kiralama/sehir/{slug})
export function isCityKind(kind: TurnaKind): boolean;               // hotel, car
export function airlineLogoUrl(iata: string | null | undefined): string | null;       // https://cdn.turna.com/Images/Flight/Airlines/{IATA}.png
export function busCompanyLogoUrl(name: string | null | undefined): string | null;    // https://cdn.turna.com/Images/Bus/BusCompanies/{slugifyTr(name)}.png
export function parseTurnaResponse(json: unknown): { response: TurnaResponse; dropped: number } | null;  // guard.ts
export function toRouteItems(result: TurnaSuccess, ctx: { fromCity: string; toCity: string }): { routes: RouteItem[]; dropped: number; nonRouteItems: number };
export function searchKindToTurnaKind(kind: SearchKind): TurnaKind | null;   // otobus bus, ucak flight, feribot ferry, tren null, otel hotel, arac car
export function fetchTurna(query: TurnaQuery, opts?: FetchTurnaOptions): Promise<LiveSearchState>;      // never idle/loading; ok for ANY kind with items (hotel/car: routes [])
export function searchPlaces(term: string, transportType: TransportType, limit?: number): PlaceSuggestion[];
export function searchPlacesForKind(term: string, kind: SearchKind, limit?: number): PlaceSuggestion[];  // otel: provinces + districts; arac: CAR_CITIES only
export function popularCities(kind: SearchKind, n?: number): PlaceSuggestion[];
export const CAR_CITIES: ReadonlyArray<{ cityName: string; slug: string; province?: string; abroad: boolean }>;  // 111 verified /arac-kiralama/sehir/{slug}
export function extractRscArray(text: string, key: string): unknown[] | null;   // src/server/turna/parse.ts (SERVER ONLY)
export function parseHotels(blocks: Json[], html?: string): HotelOffer[];  export function parseCars(html: string): CarOffer[];
export async function fetchTurnaHtml(target: Pick<ResolvedTurnaTarget, 'url'>, opts?: { refresh?: boolean; deps?: Partial<FetchDeps>; state?: TurnaRuntimeState }): Promise<FetchedPage>;
export async function runTurnaQuery(query: TurnaQuery, deps?: Partial<PipelineDeps>): Promise<TurnaOutcome>;
export async function handleTurnaHttp(req: { method: string; url: URL; body?: unknown }, deps?: Partial<PipelineDeps>): Promise<{ status: number; headers: Record<string, string>; body: string }>;
export interface TurnaHistoryStore { record(input: ObservationInput): Promise<{ id: string; observedAt: string }>; history(routeKey: string, limit?: number): Promise<HistoryPoint[]>; delta(routeKey: string, currentObservationId: string | null, currentMin: number | null): Promise<PriceDelta | null>; }
```
Rules: nothing Turna does not publish is invented (seat counts, ratings, amenities, vehicle type stay `undefined` on route rows and the UI renders their absence; hotel pages publish no price, so `stats` is null and the UI never shows one; a hotel `starRating 0` becomes `stars: null`); only landing pages are fetched; dev and prod share one handler module; durable history is opt-in (`TURNA_HISTORY=pg` plus `DATABASE_URL` or `PGHOST`; the default keeps the last 60 real observations per route in process memory and the results screen shows the change against the previous observation only when one exists; car observations store `price = dailyPrice`, `depart_at = null`).

### 6. Turna Phase 3 to 4 status (2026-09-07, five-minute development loop)

Everything below is live in the tree, covered by the suite and documented in `GELISTIRME_PLANI.md`; the loop log is
`<repo>/GELISIM_GUNLUGU.md`.

| Area | What landed | Where | Guard |
|---|---|---|---|
| Price history | `MemoryHistoryStore` is the default store (last 60 real observations per route, per process; `TURNA_HISTORY=off` keeps nothing, `pg` is durable). `PriceDeltaLine` states "HH:mm taramasına göre en düşük fiyat %x düştü/yükseldi" only when the server sent a `delta`; `PriceHistoryStrip` lists the newest five priced observations once two exist. | `src/server/turna/history.ts`, `src/components/results/PriceDeltaLine.tsx`, `PriceHistoryStrip.tsx` | F.10, J.16, J.17 |
| Price alerts | Browser-local (`localStorage`, one alert per route key, max 20); `checkPriceAlerts(result)` toasts once per `scrapedAt` when the real `stats.min` reaches the target. The modal promises no e-mail or SMS. | `src/lib/turna/alerts.ts`, `src/components/PriceAlertModal.tsx`, `src/App.tsx` | L.9 |
| Observability | `TurnaMetrics` counts every answered request (status, error code, kind, fetchedVia, cache-hit rate, p50/p95 latency over 200 samples, last error); `GET /api/turna?stats=1` returns the snapshot without touching Turna; nexora-panel relays it through `GET /api/turna/bileo-stats` (`BILEO_API_BASE`). | `src/server/turna/metrics.ts`, `http.ts`; panel `app/api/turna/bileo-stats/route.ts`, `components/dashboard/turna/bileo-stats.tsx` | E.22, panel smoke |
| Performance | `HotelResults` and `CarResults` are `React.lazy` chunks (about 9.5 kB and 8.5 kB); `preloadCityResults()` starts the download when the Otel or Araç tab is chosen; main bundle 326 kB to 310 kB. | `src/components/SearchResults.tsx`, `src/App.tsx` | L.8, SSR helper double pass |
| Accessibility | Screen-reader `h1` in the Hero; `useDialogFocus` (initial focus, Tab loop, Escape, focus return) on the price alert, sign-in and PNR dialogs; `useScreenEntry` (scroll to top, focus heading, focus return) on the ticket, seat and checkout screens; `charcoal.muted` darkened to `#6B655F` for AA on every cream surface; seats carry `aria-pressed`, a state-carrying `aria-label` and a visible focus ring. Hotel photos fall back through the gallery before the initial-letter block. | `src/lib/useDialogFocus.ts`, `src/lib/useScreenEntry.ts`, `tailwind.config.js`, `src/components/common/RealisticSeat.tsx`, `HotelResults.tsx` | I.8, L.10 to L.13 |

Not done and deliberately so: seat availability is not published on Turna landing pages, so seat maps stay representative; hotel
prices are date dependent and never shown; durable history needs `TURNA_HISTORY=pg`.

---

## Code Layout & Write Ownership

```
src/
├── server/                              [Backend Root]
│   ├── app.ts                           [Express App & Middleware Assembly]
│   ├── server.ts                        [HTTP Server Entry Point & Lifecycle]
│   ├── config/
│   │   └── env.ts                       [Zod-Validated Environment Configuration]
│   ├── db/                              [Database Layer - M1 Owner]
│   │   ├── types.ts                     [IDatabaseService & DB Contracts]
│   │   ├── schema.sql                   [PostgreSQL DDL Schemas & Indexes]
│   │   ├── queryBuilder.ts              [Tagged SQL & WhereBuilder]
│   │   ├── postgresService.ts           [PostgresDatabaseService with pg.Pool]
│   │   ├── memoryService.ts             [MemoryDatabaseService with Fallback Engine]
│   │   ├── seedLoader.ts                [Seed Data Importer from mockData.ts]
│   │   └── index.ts                     [DatabaseManager & Singleton Accessor]
│   ├── auth/                            [Auth Layer - M2 Owner]
│   │   ├── passwordService.ts           [Bcrypt Work Factor 12 & Timing Defense]
│   │   ├── tokenService.ts              [JWT Issuance, Verification & Claims]
│   │   └── index.ts                     [Auth Subsystem Facade]
│   ├── middleware/                      [Perimeter & Security - M3 Owner]
│   │   ├── security.ts                  [Helmet Security Headers & CORS]
│   │   ├── rateLimit.ts                 [Express-Rate-Limit Tiers & 429 Handlers]
│   │   ├── authMiddleware.ts            [requireAuth, requireRole, optionalAuth]
│   │   ├── validateRequest.ts           [Zod Request Validation Middleware]
│   │   ├── privacyMasking.ts            [KVKK/GDPR Masking & Log Sanitizer]
│   │   └── errorHandler.ts              [Global Production Error Redaction]
│   ├── schemas/                         [Validation Schemas - M3 Owner]
│   │   ├── authSchemas.ts               [Login, Register, Password Schemas]
│   │   ├── routeSchemas.ts              [Search, Filter, PNR Schemas]
│   │   └── bookingSchemas.ts            [Passenger, Seat, Payment, Refund Schemas]
│   ├── controllers/                     [API Controllers - M3 Owner]
│   │   ├── authController.ts            [Register, Login, Me, Logout]
│   │   ├── routeController.ts           [Search Routes, Get Route by ID, Get Seats]
│   │   ├── bookingController.ts         [Create Booking, Get Booking by PNR, Refund]
│   │   ├── paymentController.ts         [Process Payment, Payment Status]
│   │   └── healthController.ts          [Liveness, Readiness, DB Health]
│   └── routes/                          [API Route Definitions - M3 Owner]
│       ├── authRoutes.ts                [/api/auth]
│       ├── routeRoutes.ts               [/api/routes]
│       ├── bookingRoutes.ts             [/api/bookings]
│       ├── paymentRoutes.ts             [/api/payments]
│       └── index.ts                     [Master API Router Assembly]
├── lib/
│   └── turna/                           [Browser-safe Turna library - M-Turna, zero node: imports]
│       ├── types.ts / urls.ts / analytics.ts  [Verbatim nexora contract, slugifyTr, isAllowedLandingUrl]
│       ├── format.ts / adapter.ts / guard.ts  [Turkish formatting, offers -> RouteItem, structural validation]
│       ├── client.ts                    [fetchTurna -> LiveSearchState over GET /api/turna]
│       └── places.ts                    [Local autocomplete + recent searches (localStorage)]
├── server/turna/                        [SERVER ONLY Turna scraper - M-Turna]
│   ├── parse.ts                         [JSON-LD + RSC payload -> offers/facts (hotels merged by slug, cars), sha1 stableId (node:crypto)]
│   ├── fetch.ts / robots.ts             [Hardened direct fetcher, robots.txt best-effort check]
│   ├── history.ts                       [NoopHistoryStore (default) / PgHistoryStore (opt-in)]
│   ├── pipeline.ts / http.ts            [toQuery, runTurnaQuery, handleTurnaHttp, serveTurnaNode]
│   └── vitePlugin.ts                    [Mounts /api/turna in vite dev and preview]
├── tests/                               [Testing Track - M4 / M-Test / M-Turna Owner]
│   ├── security_tests.ts                [Comprehensive Security & Fuzzing Suite]
│   ├── turna_scraper.test.ts            [Turna scraper integration suite, groups A to L (196 tests)]
│   ├── fixtures/turna_fixtures.ts       [Offline JSON-LD pages + RSC initialHotels/cars chunks, robots bodies, fakeFetch factory]
│   ├── test_runner.ts                   [Master Test Runner]
│   └── ...                              [Existing Test Suites]
api/
└── turna.ts                             [Vercel function delegating to src/server/turna/http]
scripts/
└── turna_smoke.ts                       [Optional live smoke over TURNA_PRESETS + Phase 2 checks (car istanbul, hotel antalya), in-process or via TURNA_SMOKE_BASE_URL; not part of npm test]
├── docker-compose.yml                   [DevOps - M4 Owner]
└── .env.example                         [DevOps - M4 Owner]
```
