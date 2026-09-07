# Turna scraper integration: implementation specification

Status: authoritative spec for the integration of the Turna landing-page scraper (from
`C:\Users\cayma\Desktop\scraper\nexora-panel\lib\turna\*.ts`, Python twin `C:\Users\cayma\Desktop\scraper\turna\`)
into bileo. Produced from an 8-reader codebase map (`C:\Users\cayma\AppData\Local\Temp\turna_probe\bileo_map.json`)
and a judged 3-design panel. All file paths below are relative to this directory unless absolute.

## 0. Non-negotiables

1. Zero fabricated data on the live path. Fields Turna does not publish (seat counts, ratings, review counts,
   amenities, vehicle type, gate) stay `undefined`; the UI renders their absence, never a default.
2. Only turna.com landing pages are fetched: `/ucak-bileti/{a}-{b}`, `/otobus-bileti/{a}-{b}`, `/otel/{city}`,
   `/feribot-bileti/{a}-{b}`. `turna.com/api/*` and dated `/tek-yon/*` are structurally unreachable
   (`isAllowedLandingUrl` allowlist). The private autocomplete proxy is deleted.
3. Direct-only fetch (no CRW engine in bileo's deployment) with cache, per-host rate limit, retry, Akamai block
   detection and honest error codes. Vercel-compatible: no SQLite, no persistent FS.
4. Dev and prod share ONE handler module. No dev-only defaults, no swallowing errors into `200 []`.
5. The existing 497 tests keep passing. Constraints: `src/components/HeroSection.tsx` path must exist;
   no file under `src/components` or `src/data` may contain the string `lucide-react`; `POPULAR_ROUTES` stays
   exactly 10 routes; `export const TURNA_SCRAPED_ROUTES` in `src/data/turnaScrapedRoutes.ts` survives;
   mock `HH:MM` / `Hs MMdk` formats unchanged.
6. Design system: warm cream + single bordeaux accent (`bordeaux-700 #8A222B`, hover `bordeaux-800`), Satoshi /
   Cabinet Grotesk (`font-display` + `tabular-nums` for numbers), bespoke `Bileo*` icons only, Turkish copy,
   no em/en dashes in new copy, at most one middle dot per line, one semantic dot per section (no `animate-ping`
   halos), no "x saniye önce" relative times (absolute `HH:mm`), no badges such as "En Uygun".
   Dark mode: use only the class names overridden in `src/index.css:233-274` (`bg-white`, `bg-[#FAF7F2]`,
   `bg-cream-100/200`, `text-charcoal`, `text-charcoal-muted`, `text-[#1E1B18]`, `border-[#E8E1D5]`) or explicit
   `dark:` pairs (`dark:bg-[#1C1917]`, `dark:bg-[#211D1A]`, `dark:bg-[#2E2A27]`, `dark:border-[#2E2A27]`,
   `dark:text-[#F5F2EB]`, `dark:text-[#A39E98]`; tints `bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800
   dark:text-emerald-300`, same pattern for amber/rose). Do not use the no-op utilities `animate-fadeIn`,
   `shadow-2xs`, `shadow-xs`, `backdrop-blur-xs`, `no-scrollbar`.
7. Code and comments in English, UI strings in Turkish. No new npm dependencies.

## 1. Architecture and file plan

### Browser-safe (importable from components; zero `node:` imports)
- `src/lib/turna/types.ts`: verbatim copy of nexora `types.ts` (keep the full `FetchedVia` union and `TURNA_PRESETS`).
- `src/lib/turna/urls.ts`: verbatim copy of nexora `urls.ts` plus
  `export function isAllowedLandingUrl(url: string): boolean` matching
  `^https://www\.turna\.com/(ucak-bileti|otobus-bileti|otel|feribot-bileti)/[a-z0-9]+(?:-[a-z0-9]+)*$`
  and `export const KIND_PATH`.
- `src/lib/turna/analytics.ts`: verbatim copy (`computeStats`).
- `src/lib/turna/format.ts`: pure helpers:
  - `isoClockHHMM(iso)`: regex `/T(\d{2}):(\d{2})/` on the `+03:00` string (no TZ conversion) -> `"09:50"`.
  - `bileoDuration(min)`: `${h}s ${String(m).padStart(2,'0')}dk` (60 -> `1s 00dk`, 130 -> `2s 10dk`).
  - `formatTrDate(isoDate)`: static tables, `Date.UTC`: `2026-09-24` -> `24 Eylül Perşembe`
    (months Ocak..Aralık, weekdays via `getUTCDay`: Pazar, Pazartesi, Salı, Çarşamba, Perşembe, Cuma, Cumartesi).
  - `formatDayChip(isoDate)`: `{ weekday: 'Per', day: '24', month: 'Eyl' }` (short forms: Pzt Sal Çar Per Cum Cmt Paz;
    Oca Şub Mar Nis May Haz Tem Ağu Eyl Eki Kas Ara).
  - `formatTrClock(isoTs)`: local `HH:mm` via `toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})`.
  - `priceTL(n, digits = 0)`: `toLocaleString('tr-TR', {minimumFractionDigits: digits, maximumFractionDigits: digits}) + ' TL'`.
  - `stripParenCode('İstanbul (IST)')` -> `İstanbul`.
  - `parseBileoDurationMinutes('5s 30dk')` -> 330 (inverse, for mock rows in sorting).
- `src/lib/turna/adapter.ts`: `transportTypeToKind` (otobus->bus, ucak->flight, feribot->ferry, tren->null),
  `toRouteItems(result: TurnaSuccess, ctx: {fromCity, toCity}): { routes: RouteItem[]; dropped: number }`,
  `airportNameByCode(code)` over `TURKEY_81_PROVINCES` (skip appending `(CODE)` when the dataset name already
  contains `(`; first match wins for duplicated codes COV/OGU/RZV). Turna publishes CITY codes (`İstanbul (IST)`,
  `Ankara (ANK)`, `İzmir (IZM)`), so `airportTerminalLabel` enriches only when `isUnambiguousAirportCode(code)`
  (the code's province lists exactly one airport); IST/SAW keep Turna's text and are never resolved to İGA.
- `src/lib/turna/guard.ts`: `parseTurnaResponse(json: unknown): { response: TurnaResponse; dropped: number } | null`,
  hand-rolled structural validation (no zod in the browser). Invalid items are dropped and counted, never patched.
- `src/lib/turna/client.ts`: `fetchTurna(query: TurnaQuery, opts: {signal?, refresh?, fetchImpl?}): Promise<LiveSearchState>`
  (never `idle`/`loading`): canonical URL `/api/turna?kind=..&from=..&to=..[&refresh=1]` with slugified lowercase
  params in fixed order (edge-cache key coalescing), `AbortSignal.timeout(28000)` (`TURNA_CLIENT_TIMEOUT_MS`; it must
  exceed the server's worst case of robots 5 s + gate wait + 22 s budget + 1.2 s backoff + optional history-store
  timeouts, and stay under Vercel's 30 s `maxDuration`, so the retry path is reachable from the UI), maps HTTP status + `errorCode`
  to `status:'error'` (with `retryAfterSeconds` from `Retry-After`), `items.length === 0` -> `facts-only`,
  else `ok` with `toRouteItems`.
- `src/lib/turna/places.ts`: local autocomplete (section 5) importing `TURKEY_81_PROVINCES` from `../../data/turkeyProvinces`.

### Node-only (imported only by `api/turna.ts`, `vite.config.ts`, `src/server/turna/vitePlugin.ts`, tests)
- `src/server/turna/parse.ts`: verbatim copy of nexora `parse.ts` (`import { createHash } from 'node:crypto'` stays;
  header comment `SERVER ONLY`). Import types from `../../lib/turna/types` (relative; bileo has no path aliases).
- `src/server/turna/fetch.ts`: direct-only hardened fetcher (section 3). Keeps `BROWSER_HEADERS`, `looksBlocked`,
  `hasStructuredData` from nexora `fetch.ts`; removes every CRW reference.
- `src/server/turna/robots.ts`: best-effort robots.txt (24 h per-instance cache, `User-agent: *` group, longest-match
  Allow/Disallow; fetch failure -> allowed + warning `robots.txt alınamadı; izin var kabul edildi`).
- `src/server/turna/history.ts`: `TurnaHistoryStore` interface (async `record`, `history`, `delta`), `MemoryHistoryStore`
  (default when `TURNA_HISTORY` is unset or `memory`: last 60 real observations per route in process memory, nothing
  persisted, cold starts begin empty), `NoopHistoryStore` (`TURNA_HISTORY=off`), `PgHistoryStore` (opt-in: `TURNA_HISTORY === 'pg'` AND (`DATABASE_URL` or `PGHOST`); lazy
  `await import('pg')`; Pool max 2, connectionTimeoutMillis 1500, `ssl` from `DB_SSL === 'true'`; idempotent DDL).
- `src/server/turna/metrics.ts`: `TurnaMetrics` (in-process counters: requests, ok/failed, byStatus, byErrorCode, byKind,
  fetchedVia, cacheHitRate, latency p50/p95/max over a 200-sample ring, lastError) and the process-wide `turnaMetrics`;
  `handleTurnaHttp` records every answered GET/POST (OPTIONS and the stats read itself excluded) and answers
  `GET /api/turna?stats=1` locally with `Cache-Control: no-store`. `PipelineDeps.metrics` injects an instance for tests.
- `src/server/turna/pipeline.ts`: `toQuery(raw)` and `runTurnaQuery(query, deps)` lifted from nexora
  `app/api/turna/route.ts` handle(): resolve -> fetch -> `extractJsonLd` -> `parseOffers`/`parseFacts` ->
  `computeStats` -> record (only when `via === 'direct'`) -> history/delta -> `TurnaSuccess`.
  Corrections vs nexora: `scrapedAt` = the cache entry's `fetchedAt` on cache hits (not `now`); `kind` is REQUIRED
  (missing -> `invalid_query`); errors carry the status map of section 2.
- `src/server/turna/http.ts`: pure `handleTurnaHttp({method, url: URL, body?: unknown}, deps?) -> {status, headers, body}`
  and `serveTurnaNode(req: IncomingMessage & {query?, body?}, res: ServerResponse)` (reads `req.query`/`req.body` when
  Vercel pre-parsed them, else URL search params / streamed JSON body capped at 16 KiB). Parity rules: Vercel's lazy
  `req.body` getter throwing for malformed JSON is caught and answered as 400 `invalid_json`; `Content-Length` above the
  cap is 413 before any body is touched on both paths; a POST without `Content-Type` (which Vercel never pre-parses) is
  read from the stream in both environments.
- `src/server/turna/vitePlugin.ts`: `turnaApiPlugin(): Plugin` mounting `serveTurnaNode` at `/api/turna` in
  `configureServer` and `configurePreviewServer`.
- `api/turna.ts`: `import type { VercelRequest, VercelResponse } from '@vercel/node'; import { serveTurnaNode } from '../src/server/turna/http'; export const config = { maxDuration: 30 }; export default function handler(req, res) { return serveTurnaNode(req, res); }`
- `scripts/turna_smoke.ts`: optional live smoke over `TURNA_PRESETS` (not part of `npm test`).

### Types (`src/types/index.ts`)
- `RouteItem`: make `vehicleType?`, `availableSeats?`, `rating?`, `reviewCount?`, `features?` optional; add
  `durationMinutes?: number` and `provenance?: RouteProvenance`. `date` stays a display string (Turkish for both mock
  and Turna rows); the ISO date lives in `provenance.dateIso`.
- `RouteProvenance { source: 'turna'; kind: 'flight' | 'bus'; offerId: string; routeKey: string; sourceUrl: string;
  scrapedAt: string; fetchedVia: 'direct' | 'cache'; dateIso: string; departureAt: string; arrivalAt: string;
  durationMinutes: number | null; isDirect: boolean | null; currency: 'TRY'; sampling: 'cheapest-upcoming';
  airlineCode?: string | null; companyUrl?: string | null }`
- `SearchFilterState`: add optional `fromSlug`, `toSlug`, `fromCode`, `toCode`, `selectedDay` (ISO `YYYY-MM-DD`).
  `departureDate` keeps its type; App initialises it to `''` (no fabricated `24 Mayıs Cuma`).
- `LiveSearchState` (discriminated union, imports `type { TurnaQuery, TurnaSuccess } from '../lib/turna/types'`):
  `{status:'idle'} | {status:'loading'; query; startedAt: number} | {status:'ok'; query; result: TurnaSuccess; routes: RouteItem[]; droppedItems: number; receivedAt: string} | {status:'facts-only'; query; result; receivedAt} | {status:'unsupported'; transportType: 'tren'; reason: string} | {status:'error'; query: TurnaQuery | null; httpStatus: number | null; errorCode: string; message: string; retryAfterSeconds?: number}`
- `TransportType` unchanged.

### Build / deploy config
- `tsconfig.json` include: `["src", "api", "vite.config.ts"]` (only valid once `api/utils/scraper.ts` is deleted).
- `package.json`: add `"engines": {"node": "22.x"}`, scripts `"typecheck": "tsc --noEmit"`, `"smoke:turna": "tsx scripts/turna_smoke.ts"`.
- `vercel.json`: add `"functions": {"api/turna.ts": {"maxDuration": 30}}` (rewrites unchanged).
- `vite.config.ts`: `defineConfig(({ mode }) => ...)` calls `loadEnv(mode, process.cwd(), ['TURNA_', 'DATABASE_URL',
  'PG', 'DB_SSL'])` and copies the keys into `process.env` when unset, because Vite never populates `process.env`
  from `.env` while Vercel injects the dashboard environment; without the bridge `.env` would configure prod only.
- `.env.example`: add `TURNA_CACHE_TTL_MS=600000`, `TURNA_MIN_INTERVAL_MS=1200`, `TURNA_BLOCK_COOLDOWN_MS=300000`,
  `TURNA_REFRESH_MIN_MS=60000`, `TURNA_NEG_CACHE_TTL_MS=60000`, `TURNA_MAX_FETCHES_PER_MIN=20`,
  `TURNA_RESPECT_ROBOTS=1`, `TURNA_HISTORY=memory`, and a note that history reads `DATABASE_URL` or
  `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE/DB_SSL` (the `POSTGRES_*` names are read by nothing).

### Deletions
`api/utils/scraper.ts`, `api/live-scrape.ts`, `api/autocomplete.ts`, `scratch.ts`, `scratch_fetch.ts`,
`scratch_fetch2.ts`, `turna_test.html`, `turna_test2.html`, `turna_sanliurfa.html`, `tools/turna_live_api.py` (and the
empty `tools/`), `src/data/turnaScrapedRoutes.json`, `test_output.log`.
Keep `src/data/turnaScrapedRoutes.ts` (fix the misleading comment, strip the UTF-8 BOM).

## 2. HTTP contract: `GET|POST /api/turna`

Params (query for GET, JSON body for POST): `kind` (required: `flight|bus|ferry|hotel`), `from`, `to` (slug or display
name; normalised with `slugifyTr`, validated 2..60 chars `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, `from !== to`),
`city` (hotel), `refresh` (`1|true`).

Response body is exactly `TurnaResponse` (`TurnaSuccess | TurnaFailure`). `fetchedVia` is `direct` or `cache`;
`scrapedAt` is when the HTML was actually fetched.

Status map: 200 success; 400 `invalid_query` / `invalid_json`; 403 `robots_disallowed`; 404 `route_not_found`
(upstream 404, any upstream 3xx (redirects are never followed: `redirect: 'manual'`, so the homepage redirect is
detected without a second request), or upstream 200 whose final URL pathname differs from the target pathname);
405 `method_not_allowed` (header `Allow: GET, POST, OPTIONS`; OPTIONS -> 204); 413 `payload_too_large`; 429 `rate_limited`
(`Retry-After: 2` for the queue-depth fast-fail, `2..60` for the per-minute budget: the seconds until the oldest
request leaves the window); 502 `no_structured_data` (200 on the right path but zero JSON-LD) / `upstream_unavailable`
(429/5xx/timeout/network after retries); 503 `blocked` (Akamai markers or HTTP 403, or an active cooldown;
`Retry-After` = remaining seconds); 500 `internal_error`.

Headers: `Content-Type: application/json; charset=utf-8`; 200 without refresh ->
`Cache-Control: public, max-age=0, s-maxage=600, stale-while-revalidate=300`; 200 with refresh -> `private, no-store`;
any 4xx/5xx -> `no-store`; `X-Turna-Fetched-Via`, `X-Turna-Scraped-At`. No `Access-Control-Allow-Origin` (same-origin SPA).

`/api/live-scrape` and `/api/autocomplete` no longer exist.

## 3. Fetch hardening (`src/server/turna/fetch.ts`)

All mutable state lives in one injectable `TurnaRuntimeState` (default instance on `globalThis.__bileoTurna`);
deps `{ fetchImpl, now, sleep, random, env }` are injectable so tests never touch the network.

1. `assertAllowedTurnaUrl(url)` (uses `isAllowedLandingUrl`) before any network call; robots.txt best-effort check.
2. Positive cache: `Map<url, {html, fetchedAt}>`, TTL `TURNA_CACHE_TTL_MS` (600 000), max 64 entries, oldest evicted;
   hits return `via: 'cache'` with the original `fetchedAt`. `refresh` bypasses the read but is throttled per URL by
   `TURNA_REFRESH_MIN_MS` (warning `Yenileme sınırı: dakikada bir`).
3. Negative cache: deterministic failures (`route_not_found`, `no_structured_data`) cached 60 s.
4. In-flight coalescing: concurrent identical URLs share one upstream promise.
5. Per-host gate: min interval `TURNA_MIN_INTERVAL_MS` (1200) + jitter 0..300 ms; queue depth > 4 -> `rate_limited`
   fast-fail (`Retry-After: 2`); `RollingBudget` of `TURNA_MAX_FETCHES_PER_MIN` (20) per instance -> `rate_limited`
   with `Retry-After` = seconds until the window frees a slot (2..60).
6. Block cooldown: HTTP 403 or `looksBlocked(html)` sets `blockedUntil[host] = now + TURNA_BLOCK_COOLDOWN_MS`
   (300 000) and throws `blocked`; during cooldown serve stale cache (warning `Turna erişimi engelli; önbellek
   gösteriliyor`) or answer 503 with `Retry-After`.
7. Redirect/404 detection -> `route_not_found`; 200 with no JSON-LD -> `no_structured_data`.
8. Retry: transient = network error, timeout, 429, 5xx; 2 attempts, backoff 800 ms + jitter 0..400 ms; deterministic
   failures fail fast. Per attempt `AbortSignal.timeout(10000)`, total budget 22 s.
9. Body cap 6 MB. Never send cookies. Drop undici's ignored `cache: 'no-store'`.
10. `TurnaFetchError extends Error { errorCode; httpStatus?; retryAfterSeconds? }`.

## 4. Search UX

Guiding fact: a landing page lists the cheapest upcoming fares across several dates, not a timetable for one day.
The UI states this once, shows the date on every card, and turns it into a feature.

App (`src/App.tsx`):
- Replace `routes/isLiveScraping` with `live: LiveSearchState`; `routes` is derived (`live.status === 'ok' ? live.routes : []`).
- `handlePerformSearch`: keep the auth gate and scroll; build `TurnaQuery {kind, from: fromSlug ?? slugifyTr(fromCity),
  to: toSlug ?? slugifyTr(toCity)}`; run `resolveTurnaTarget` client-side first (TurnaQueryError -> error toast, no fetch);
  `tren` -> `unsupported`; else `loading` then `fetchTurna`. Every outcome replaces the previous result. AbortController
  cancels an in-flight search when a new one starts.
- Remove the 60 s `setInterval`. Add one `visibilitychange` effect: when visible, `live` is `ok|facts-only`,
  `Date.now() - receivedAt > 600000`, a user is signed in and no handoff screen is open, re-run the same query without refresh.
- `onRefresh` -> `fetchTurna(query, {refresh: true})`, disabled while loading and for 30 s after use.
- Toasts: success `promo` with `Turna.com: N teklif alındı (canlı|önbellek, HH:mm)`; facts-only `info`; errors `error`
  (rose) with the server message; unsupported no toast.
- Fix `App.tsx:708-709`: bind `handleTicketPurchased` to `onBookingCompleted` only (CheckoutModal fires both callbacks).
- Persist recent searches to `localStorage['bileo_recent_searches']` (max 5) on `ok|facts-only`.
- Props to SearchResults: `{ routes, searchState, live, onRefresh, onUpdateSearchState, onSelectRoute, onOpenPriceAlert }`
  plus keep `isLiveScraping` (derived) and `onTriggerLiveScrape` (alias of `onRefresh`) for compatibility.

SearchResults (`src/components/SearchResults.tsx` + `src/components/results/*`), five states on `live`:
1. `idle`: quiet notice `Aramayı başlatmak için giriş yapın.`
2. `loading`: `ResultsSkeleton` (strip + three card skeletons, `h-4 rounded-md bg-cream-200 animate-pulse`).
3. `ok`: `ProvenanceStrip` (same shell `p-3.5 rounded-2xl bg-white border border-[#E8E1D5]`): `Turna.com` wordmark
   with a `Kaynak sayfa` link (`target=_blank rel="noopener noreferrer"`), second line
   `Canlı alındı HH:mm` or `Önbellekten HH:mm`, `N teklif`, `M tarih`; exactly ONE static semantic dot
   (emerald live and < 10 min, amber cache/stale), none while loading; refresh button; `Notlar (N)` toggle listing
   warnings and `N teklif doğrulanamadı`; always-visible disclosure `Bu liste Turna.com rota sayfasındaki yaklaşan
   tarihlerin en ucuz seferleridir; belirli bir güne ait tam sefer listesi değildir.`
   `PriceStatsRow` under the h2 (En düşük in `text-bordeaux-700`, Ortanca, En yüksek; `font-display tabular-nums`; no bars).
   `DayStrip` above the list from `stats.byDay`: `role="radiogroup"`, scroll-snap chips (`Tümü` + one per date with
   weekday/day/min price), selected `bg-bordeaux-700 text-white`, cheapest day marked typographically only
   (`text-bordeaux-700` price + `title="En ucuz gün"`), ArrowLeft/ArrowRight, `sound.playTick()`, filters routes by
   `provenance.dateIso`, `onUpdateSearchState({selectedDay})`.
   `RouteFactsLine` under the company chips: quiet `text-[11px] text-charcoal-muted` facts from `result.facts`
   (`N firma`, up to 5 `CompanyLogo size="sm"` for popularCarriers, `En ucuz gün: X`, `Günde N sefer`,
   `En kısa süre ...`), labelled `Turna rota bilgisi`; each omitted when null.
   Cards: per-card date line (`route.date`), `vehicleType` line only when defined, rating row only when
   `typeof rating === 'number'`, seats chip only when `typeof availableSeats === 'number'`, `Direkt Sefer` only when
   `provenance.isDirect === true`, amenities column renders `route.features?.slice(0,3)` or nothing, price guarded,
   CTA `İncele` for provenance routes. Sort `fastest` by `durationMinutes ?? parseBileoDurationMinutes(duration)`,
   `earliest` by `provenance.departureAt` when present; `rating` option hidden when no route has a rating;
   `Sadece 2+1` shown only when some route has `vehicleType`; `vehicleType?.includes('2+1')`.
   Remove the duplicate `id="search-results-section"` from the section (App's wrapper keeps it). List container
   `aria-live="polite"` and `aria-busy` while loading. Mode label map otobus/ucak/tren/feribot.
4. `facts-only`: feribot -> `FerryFactsPanel` (facts + FAQ as native `<details>` items, source link, scrapedAt);
   flight/bus without offers -> notice `Turna bu rota için yapısal teklif yayımlamamış` with facts, warnings, link.
5. `unsupported`: `Turna.com tren bileti sunmuyor; bu sekmede canlı veri yok.`
6. `error`: `SearchStateNotice` keyed by errorCode (blocked with retry seconds, route_not_found, no_structured_data,
   upstream_unavailable, rate_limited, robots_disallowed, invalid_query, network) plus `Tekrar dene`.
The filter-blaming empty state stays only for `routes.length > 0 && filtered.length === 0`.
Icons from `./icons` / `../icons`; add `BileoExternalLink` to `BileoIcons.tsx` (forwardRef, 24x24, stroke currentColor)
and export it from the barrel if no glyph fits.

Detail/purchase surfaces: TicketExperienceScreen header line `Kaynak: Turna.com, alınma HH:mm` + link when
`route.provenance`; SeatSelectionModal legend note `Koltuk düzeni temsilidir; canlı doluluk Turna sayfasında
yayımlanmaz.`; CheckoutModal visible note `Demo rezervasyon: gerçek ödeme alınmaz, PNR üretilmez.`

## 5. Autocomplete (local, no network)

`src/lib/turna/places.ts`:
```ts
export interface PlaceSuggestion {
  cityName: string; slug: string; plate: number; region: string;
  modes: TransportType[];            // 'otobus' always, 'ucak' if airports, 'feribot' only for FERRY_STOPS
  airports: { code: string; name: string }[]; terminals: string[]; ferryPorts: string[];
  matchedOn: 'city' | 'code' | 'airport' | 'terminal' | 'port' | 'stop';
}
export function searchPlaces(term: string, transportType: TransportType, limit = 8): PlaceSuggestion[]
export function findPlaceBySlug(slug: string): PlaceSuggestion | undefined
export function popularCities(transportType: TransportType, n = 8): PlaceSuggestion[]  // ranked by popularIntercityRoutes frequency
export const FERRY_STOPS = [ { cityName: 'Yalova', slug: 'yalova' }, { cityName: 'Yenikapı', slug: 'yenikapi' }, { cityName: 'Pendik', slug: 'pendik' } ]  // preset-verified only
export const EXTRA_DISTRICTS = [ { cityName: 'Bodrum', slug: 'bodrum', province: 'Muğla' }, { cityName: 'Çeşme', slug: 'cesme', province: 'İzmir' } ]  // preset-verified
export function readRecentSearches(): RecentSearch[]; export function writeRecentSearch(entry: RecentSearch): void  // localStorage 'bileo_recent_searches', SSR-safe
```
Normalisation: both term and candidates via `slugifyTr` (so `ıst`, `IST`, `İst` all match İstanbul). Ranking:
city-slug prefix > exact IATA code > airport name contains > terminal contains > port contains, then plate order.
One row per province (Turna URLs are city-level); airport codes are detail text. `tren` -> `[]`.
For `feribot`, suggestions are ONLY `FERRY_STOPS` (so the Feribot tab cannot produce a 404 landing URL).

HeroSection (`src/components/HeroSection.tsx`, path and 3-prop contract unchanged, `BileoSwapHorizontal` import kept):
- Replace the `/api/autocomplete` effect with synchronous `searchPlaces` (keep a short debounce or `useMemo`);
  remove `isLoadingSuggestions`, `Turna veritabanından aranıyor...`, the bus `OTG`/`${city} Otogarı` fabrication,
  the `Hatay` default, the fake `Son Aramalar` row (use `readRecentSearches()` or hide), `POPULAR_CHIPS`
  (use `popularCities`), `countryName: 'Dünya'`.
- Selection writes `{fromCity, fromSlug, fromCode}` (or `to*`); swap swaps all; free typing clears slug/code.
- Inline validation at submit (`from === to`, slug too short) shown under the bar; do not call `onPerformSearch`.
- Wrap in `<form onSubmit>` (Enter submits); inputs `role="combobox" aria-expanded aria-controls aria-autocomplete="list"`;
  rows `<button type="button" role="option">` in `role="listbox"`; ArrowUp/Down/Enter/Escape; swap button `aria-label`.
- Replace the off-system navy `#0a1172`/`#070b4f` with `bordeaux-700`/`bordeaux-800` (single accent).
- Remove the always-null `Sadece direkt` checkbox and the no-op `+ Dönüş Ekle`. Keep tabs (Uçak/Otel/Otobüs/Araç/
  Feribot/Puan), trip-type radios and cabin class as they are (product decision deferred).
- Date box: non-interactive label `Yaklaşan tarihler` with `BileoCalendar` (no fabricated `28 Ağu, Cum`).

## 6. Consumer honesty fixes (exact sites; verify line numbers in the file before editing)

- `TicketExperienceScreen.tsx`: delete `DEFAULT_REVIEWS` (32-83) and the `Pamukkale Müşteri Deneyimi` reply;
  `reviewsList` starts from `route.reviews ?? []` with empty state `Henüz değerlendirme yok`; `currentScore: number | null =
  route.rating ?? null`, `currentReviewCount = route.reviewCount ?? 0` (no `|| 4.8`, `|| 1420`); score block shows
  `Puan verisi yok` when null; `Doğrulanmış Yolcu Değerlendirmesi` only when count > 0; category scores (812-851)
  computed from `reviews[].scores` or hidden; amenities (857-863) and `30 KG Bagaj Hakkı / %100 İade Güvencesi`
  (642-646) features-driven or hidden for provenance routes; `getPassengerLimit` accepts `number | undefined` with
  copy `Koltuk bilgisi Turna sayfasında yok`; review `travelType` default derived from transportType (148);
  `PNR: TR-...` labels (516, 610, 1300) become `Önizleme kodu`; provenance line in the header (363-384);
  `vehicleType` guard (372).
- `SeatSelectionModal.tsx`: legend note (270-295); `vehicleType` guards (51, 135).
- `CheckoutModal.tsx`: demo-booking note near the pay CTA; no behavioural change.
- `CarrierDetailScreen.tsx`: guards at 331 (rating sort), 454 (vehicleType), 459 (availableSeats), 515 (originalPrice).
- `TicketWalletModal.tsx:361`: vehicleType guard.
- `LiveTransitScraperModal.tsx`: remove the Turna tab (button ~318-324, panel ~360-425), the `TURNA_SCRAPED_ROUTES`
  import and the tab union member; default tab `flights`.
- `PartnerLogosRibbon.tsx:13`: `n.includes('ba')` -> `n.includes('british airways') || n === 'ba'`.
- `PriceAlertModal.tsx:22`: sync `targetPrice` with `currentMinPrice` via `useEffect` (currently frozen at 340).
- `src/server/db/seedLoader.ts`: only if tsc requires it (`r.vehicleType ?? ''`).
Leave (documented, not on the Turna path): `POPULAR_ROUTES`, `CarrierDetailScreen` templates, `LiveTransitTicker`,
`FareMatrixModal`, OpenSky tabs, procedural seat generators (now labelled representative).

## 7. Tests (`src/tests/turna_scraper.test.ts`, `src/tests/fixtures/turna_fixtures.ts`)

Framework: `import { describe, it, expect } from './test_framework'`; export `runTurnaScraperTests()`; register in
`src/tests/test_runner.ts` (import after the last suite import, call before `await runner.runAll()`). Matchers: toBe,
toEqual (JSON), toBeTruthy/Falsy, comparisons, toContain/toNotContain, toMatch, toBeNull/Defined/Undefined,
toHaveLength, sync toThrow only (catch async errors manually). No network: inject `fetchImpl`/HTML.

Fixtures: TypeScript port of `C:\Users\cayma\Desktop\scraper\turna\tests\fixtures.py` (FLIGHT_PAGE with 5 items incl.
duplicate and unpriced, BUS_PAGE, HOTEL_PAGE, FERRY_PAGE, BLOCKED_PAGE) plus HOMEPAGE_PAGE (6 KB, zero JSON-LD),
ROBOTS_ALLOW / ROBOTS_DENY_ALL, and a `fakeFetch(scenario)` factory with a call log.

Groups: A urls (slugifyTr, resolveTurnaTarget, every TURNA_PRESETS entry resolves, isAllowedLandingUrl rejects
`https://www.turna.com/api/proxy/v1/meta/autocomplete/flight` and `/ucak-bileti/tek-yon/istanbul-ankara/2026-08-28`);
B parse (port of test_parse.py; stableId: determinism + 12 hex; parity constant flight `eee39b67f15c`; compute bus
constants with the TS function itself rather than hand-typing); C analytics; D fetch (cache hit keeps fetchedAt, TTL,
refresh throttle, blocked -> cooldown with zero upstream calls, 404 and redirect -> route_not_found, no JSON-LD ->
no_structured_data, 429 then 200 retry with recorded backoff, two timeouts -> upstream_unavailable after 2 attempts,
rate gate spacing, in-flight coalescing, robots deny/allow/fail-open); E pipeline + http (status codes, headers,
Cache-Control variants, POST invalid JSON 400, PUT 405 with Allow, ferry facts-only, cache-hit scrapedAt equality,
store throwing -> warning); F history (Noop contract; Pg SQL text with a fake pool: `ON CONFLICT (observation_id, offer_id)`,
placeholders, BEGIN/COMMIT, delta excludes current id); G guard + adapter (drops string price; ids; `09:50`/`10:50`
regardless of process TZ; duration `1s 00dk`/`2s 10dk`; date `24 Eylül Perşembe`; provenance fields; all unknown fields
undefined; bus `İstanbul Avrupa`, `7s 00dk`, `6s 15dk`; client URL canonicalisation); H places (`ist` -> İstanbul with
IST/SAW, `ıst`/`IST` equivalent, `adb` -> İzmir, `esenler` terminal -> İstanbul for otobus, feribot -> only FERRY_STOPS,
tren -> [], every slug equals slugifyTr(cityName)); I static guards (no `node:` imports or `server/turna` specifiers under
src/lib, src/components, src/data, App.tsx, main.tsx; no `lucide-react` under src/components and src/data; api/, src/,
vite.config.ts contain none of `turna.com/api`, `tek-yon`, `scrapeTurnaDirect`, `live-scrape`, `/api/autocomplete`;
NEW files under src/components/results and src/lib/turna contain no em dash; TicketExperienceScreen.tsx contains none of
`DEFAULT_REVIEWS`, `|| 4.8`, `|| 1420`, `Pamukkale Müşteri Deneyimi`). Optional J: SSR `renderToStaticMarkup` of
SearchResults states only if it renders cleanly in Node; drop if brittle.

## 8. Verification gates
```
npm test                       # Failed 0; total >= 497 + new suite; git status clean of test artefacts
npx tsc --noEmit -p tsconfig.json
npm run build                  # tsc && vite build
grep -rl "createHash\|node:crypto" dist/assets/ ; echo "(must print nothing)"
grep -rn "lucide-react" src/components src/data ; echo "(must print nothing)"
grep -rn "turna.com/api\|tek-yon\|scrapeTurnaDirect\|live-scrape\|/api/autocomplete" api src vite.config.ts ; echo "(must print nothing)"
# dev server (npm run dev or the running one on :5173):
curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:5173/api/turna?kind=flight&from=istanbul&to=istanbul'   # 400
curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:5173/api/turna?from=a&to=b'                             # 400 (kind required)
curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:5173/api/live-scrape?from=a&to=b&type=ucak'             # 404
curl -s -D - -o /dev/null 'http://localhost:5173/api/turna?kind=flight&from=istanbul&to=ankara' | grep -i 'cache-control\|x-turna\|access-control'
curl -s 'http://localhost:5173/api/turna?kind=flight&from=istanbul&to=ankara' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const b=JSON.parse(s);console.log(b.success,b.items?.length,b.fetchedVia,b.scrapedAt,b.warnings)})"
```
Second identical call must return `fetchedVia: cache` with the SAME `scrapedAt`. Ferry `yalova`/`yenikapi` -> 200,
items `[]`, `facts.shortestDurationLabel` set.

## 9. Workstreams and ownership (each file has exactly one owner)
- WS-B Contracts (runs first, alone): `src/types/index.ts`, `src/lib/turna/*.ts`, `src/data/turnaScrapedRoutes.ts`,
  delete `src/data/turnaScrapedRoutes.json`.
- WS-A Server + API + config + deletions: `src/server/turna/*.ts`, `api/**`, `vite.config.ts`, `tsconfig.json`,
  `package.json`, `vercel.json`, `.env.example`, `scripts/turna_smoke.ts`, listed deletions.
- WS-C App: `src/App.tsx`.
- WS-D Hero: `src/components/HeroSection.tsx`.
- WS-E Results: `src/components/SearchResults.tsx`, `src/components/results/*`, `src/components/icons/BileoIcons.tsx`,
  `src/components/icons/index.ts`, `src/index.css` (only if unavoidable).
- WS-G Consumer honesty: `TicketExperienceScreen.tsx`, `SeatSelectionModal.tsx`, `CheckoutModal.tsx`,
  `CarrierDetailScreen.tsx`, `LiveTransitScraperModal.tsx`, `TicketWalletModal.tsx`, `PartnerLogosRibbon.tsx`,
  `PriceAlertModal.tsx`, `src/server/db/seedLoader.ts`.
- WS-F Tests + docs: `src/tests/turna_scraper.test.ts`, `src/tests/fixtures/turna_fixtures.ts`,
  `src/tests/test_runner.ts`, `TEST_INFRA.md`, `TEST_READY.md`, `PROJECT.md`.

## 10. Faz 2: hotel, car, logos

Status: contracts + server landed 2026-09-06 (workstream P2-A; see `GELISTIRME_PLANI.md` "Faz 2"). Where this section
disagrees with sections 0.2, 1 and 2 it wins: there are now FIVE landing-page families, the fifth being
`/arac-kiralama/sehir/{city}` (turna.com/robots.txt: `Allow: /arac-kiralama`). Section 0.1 still holds: hotel pages
publish no prices, car pages publish a daily price; nothing else is inferred.

### 10.1 Types (`src/lib/turna/types.ts`, verbatim nexora `types.ts`)
- `TurnaKind = 'flight' | 'bus' | 'hotel' | 'ferry' | 'car'`; `export const TURNA_KINDS: readonly TurnaKind[]`.
- `FlightOffer.logoUrl: string | null` (airline logo by IATA). `BusOffer.companySlug: string | null` (last segment of
  `companyUrl`, Turkish-folded) and `BusOffer.logoUrl: string | null`.
- `HotelOffer` (rich, from the RSC `initialHotels` array merged with JSON-LD `Hotel`): `slug`, `image`, `images[]`,
  `locality`, `district`, `city`, `region`, `country`, `rating` (0..10), `ratingBest`, `ratingText` ("Harika"),
  `reviewCount`, `stars` (null when the page says 0), `amenities[]`, `tags[]`, `breakfast`, `turnaId`. No price field.
- `CarOffer`: `brand`, `model`, `vehicleClass: CarVehicleClass` (`economy|standard|fullsize|premium|luxury|other`;
  `VehicleClassMiniElite` -> `other`), `vehicleClassRaw`, `fuelType: CarFuelType`, `fuelTypeRaw`,
  `transmission: CarTransmission` (`auto|manual|other`; the site's `TransmissionManuel` -> `manual`), `mileageLimitKm`
  (null when 0), `imageUrl`, `company`, `companySlug`, `companyLogoUrl` (Turna's own Cloudinary URL), `dailyPrice`,
  `currency: 'TRY'`.
- `TurnaSuccess.routeKey` is `car:{city}` for cars; `stats` is PRESENT for cars (over `dailyPrice`, `byDay` empty) and
  null for hotel/ferry. `TURNA_PRESETS` has 20 entries (4 new `car` presets: istanbul, ankara, izmir, antalya).

### 10.2 URLs and logos (`src/lib/turna/urls.ts`)
- `KIND_PATH.car = 'arac-kiralama/sehir'`; `CITY_KINDS: ReadonlySet<TurnaKind>` (`hotel`, `car`); `isCityKind(kind)`;
  `KIND_LIST_LABEL = 'flight | bus | hotel | ferry | car'` (used by every invalid_query message).
- `resolveTurnaTarget({ kind: 'car', city })` reads `city ?? to ?? from` exactly like hotel.
- `isAllowedLandingUrl` still requires `https://www.turna.com`, lowercase slugs, no query, no trailing slash; it now also
  accepts `/arac-kiralama/sehir/{slug}` and still rejects `/arac-kiralama/{slug}`.
- `TURNA_CDN = 'https://cdn.turna.com'`; `airlineLogoUrl(iata) -> https://cdn.turna.com/Images/Flight/Airlines/{IATA}.png | null`;
  `busCompanyLogoUrl(name) -> https://cdn.turna.com/Images/Bus/BusCompanies/{slugifyTr(name)}.png | null`. The CDN
  serves browser `<img>` requests but answers 403 to non-browser agents and for some slugs (kamil-koc), so EVERY logo
  `<img>` needs an `onError` text fallback; server-side probes need a browser User-Agent.

### 10.3 Endpoint additions (`GET|POST /api/turna`)
- `kind=hotel&city=` and `kind=car&city=` (city ?? to ?? from; missing -> 400 `invalid_query`). Same cache, rate limit,
  robots and error map as section 2. `kind` messages now list `flight | bus | hotel | ferry | car`.
- Server: `parseOffers(kind, blocks, html)` (html is required for hotel enrichment and for cars, whose JSON-LD is only
  an `AutoRental` descriptor); `extractRscText(html)` / `extractRscArray(text, key)` decode the Next.js
  `self.__next_f.push` chunks; `parseHotels(blocks, html = '')`, `parseCars(html)`. `pipeline.ts` passes `page.html`;
  `history.ts` records cars with `price = dailyPrice`, `depart_at = null`.
- Live check 2026-09-06: `car&city=istanbul` -> 35 items, stats 778.34..4500 TRY/day, 12 companies, every row with
  image and company logo; `hotel&city=antalya` -> 50 items with stars/ratingText/amenities/tags/images/district.
  Re-verified the same day by `scripts/turna_smoke.ts` (in-process and `TURNA_SMOKE_BASE_URL=http://127.0.0.1:5173`
  HTTP mode, identical numbers): car median 1672 TRY/day, `stats.byDay` empty, 35/35 images and logos; hotel `stats`
  null, 49 of 50 rows with `stars` (one `starRating 0` -> null), 50/50 with amenities or tags and with images.
  `kind=car` without a city -> 400 `invalid_query`; `kind=car&city=bodrum` -> 404 `route_not_found` (no such page).

### 10.4 Client (`client.ts`) and guard (`guard.ts`)
- Canonical URLs: `/api/turna?kind=hotel&city=antalya`, `/api/turna?kind=car&city=istanbul` (`isCityKind`).
- Status rule: `ok` whenever `result.items.length > 0` for ANY kind; for hotel/car `routes` is `[]` and the offers are
  read from `live.result.items`, narrowing on `kind`. `facts-only` only when `items` is empty. `TURNA_CLIENT_TIMEOUT_MS`
  unchanged (28 s, must exceed the server worst case and stay under Vercel's 30 s).
- Guard: flight/bus/car are validated field by field (car: `brand`/`model` strings, `dailyPrice` finite > 0, enums
  checked). Hotels require `kind/id/name/url/locality/image/country/rating/ratingBest/reviewCount`; the Phase 2 fields
  (`slug`, `images`, `district`, `city`, `region`, `ratingText`, `stars`, `amenities`, `tags`, `breakfast`, `turnaId`)
  and flight/bus `logoUrl`/`companySlug` may be ABSENT (a Phase 1 body can still come out of the edge cache for
  `s-maxage`) but must have the right type when present. Absent hotel fields are returned as `null` / `[]`, the
  contract's own "not published" encoding, with one deliberate exception: an absent `images` becomes `[image]` when
  `image` is set (the single URL a Phase 1 body did publish) and `[]` otherwise; nothing is invented. Invalid items
  are dropped and counted as before (a car with `dailyPrice` 0/NaN/string or an unknown enum value is dropped whole).

### 10.5 Adapter (`adapter.ts`) and `src/types/index.ts`
- `export type SearchKind = TransportType | 'otel' | 'arac'`; `SearchFilterState.searchKind?: SearchKind` (derive the
  active tab as `searchKind ?? transportType`; `transportType` stays the seat-layout/mode field).
- `export const SEARCH_KINDS`, `isSearchKind(v)`, `searchKindToTurnaKind(k): TurnaKind | null` (otobus->bus,
  ucak->flight, feribot->ferry, tren->null, otel->hotel, arac->car), `turnaKindToSearchKind(kind): SearchKind`,
  `turnaKindLabelTr(kind)` (Uçak, Otobüs, Feribot, Otel, Araç). `kindToTransportType('car') === null`.
- `toRouteItems(result, ctx): RouteAdaptation = { routes, dropped, nonRouteItems }`: hotel/car offers are counted in
  `nonRouteItems`, never in `dropped`.
- `RouteProvenance.logoUrl?: string | null` and `companySlug?: string | null` (bus only) are copied from the offer when
  the offer carries the key; Phase 1-shaped offers produce the Phase 1 provenance unchanged.

### 10.6 Places (`places.ts`)
- `searchPlacesForKind(term, kind: SearchKind, limit = 8)`: transport kinds behave exactly like `searchPlaces`;
  `otel` searches all 81 provinces plus `EXTRA_DISTRICTS` (Bodrum, Çeşme), `arac` searches ONLY `CAR_CITIES`; rows for
  the two single-city tabs have `matchedOn: 'city'`. Matching is slug prefix first, then a 3+ character substring in list
  order (so `ist` in the Araç tab yields İstanbul and then Priştine; `bod` yields nothing because Bodrum has no car page).
- `popularCities(kind: SearchKind, n = 8)`: `otel` -> first n of the hotel list (provinces ranked by intercity-route
  frequency, then the districts); `arac` -> first n of `CAR_CITIES` (İstanbul, Ankara, İzmir, Antalya, Adana, Bursa,
  Muğla, Trabzon); transport kinds unchanged.
- `CAR_CITIES: ReadonlyArray<CarCity>` with `CarCity { cityName; slug; province?; abroad }`, `findCarCity(slug)`. The
  slugs are the 111 `/arac-kiralama/sehir/{slug}` links on https://www.turna.com/arac-kiralama (verified 2026-09-06 with a
  Chrome-impersonating fetch): 70 Turkish provinces (dataset names) first, then 41 cities abroad (`abroad: true`,
  region `Yurt dışı`, Title-cased labels with Turkish diacritics where the slug is Turkish, e.g. Lefkoşa, Bakü).
  Bodrum/Çeşme have no car landing page and are deliberately absent. `slug === slugifyTr(cityName)` holds for every row.
- `RecentSearch.searchKind?: SearchKind` (optional; old entries without it are still accepted).

### 10.7 Test deltas for WS-F (contract-pinned assertions that must move with the contract)
- A.6 `TURNA_PRESETS` length 16 -> 20 (car presets). A.7 `KIND_PATH` gains `car: 'arac-kiralama/sehir'`.
- E.12 exact message `'kind' zorunludur: flight | bus | hotel | ferry | car.`
- G.8 `parseTurnaResponse({ ...base, kind: 'car' })` is now a valid envelope (use an unknown kind such as `'train'`).
- Landed (P2-E part 1, 2026-09-06): fixtures `rscScripts(key, items, extraPrefix)` (two `self.__next_f.push([1,"..."])`
  chunks split mid-array), `HOTEL_PAGE_RSC_HTML` (2 JSON-LD + 3 RSC hotels, one overlapping slug, one `starRating 0`,
  a `]` inside a string), `CAR_PAGE_HTML` (JSON-LD descriptor only plus 6 `cars` rows -> 4 offers, empty `"cars":[]`
  decoy first), `SAMPLE_CAR_OFFERS`, `PHASE1_HOTEL_WIRE`; `SAMPLE_FLIGHT_OFFERS` / `SAMPLE_BUS_OFFERS` now carry
  `logoUrl` / `companySlug`, so G.13 pins `logoUrl` in the flight provenance. Group `Turna K: hotel and car (Phase 2)`
  (K.1 to K.22) covers `extractRscText`/`extractRscArray`, `parseCars`, `parseHotels` merge and JSON-LD fallback, the
  car URL family and logo builders, `kind=car|hotel&city=` through `handleTurnaHttp` (stats, guard round trip, 400
  without city), the car/hotel guard, `SEARCH_KINDS` maps, `nonRouteItems` and logo provenance, `fetchTurna` for car
  and hotel payloads, `searchPlacesForKind` / `popularCities` / `CAR_CITIES`, and car observations in the history
  store.
- Landed (P2-E part 2, 2026-09-06): I.7 pins the ten files of `src/components/results` (now including `BrandLogo.tsx`,
  `CarResults.tsx`, `HotelResults.tsx`). Group J gained the city screens through `SearchResults`: J.11 hotel ok (heading
  "Antalya otelleri", `countLabel` "5 otel", exactly `stars` star icons and none for `stars: null`, ratings and review counts
  only from present fields, no " TL" or "₺" anywhere, the hotel disclosure instead of the route one, one semantic dot);
  J.12 car ok ("İstanbul araç kiralama", "4 araç", `aria-label="Günlük fiyat özeti"` with `/gün`, "4 firma: ..." distribution,
  class / fuel / transmission / km chips with `Km limiti belirtilmemiş`, every card linking `result.sourceUrl`); J.13
  facts-only hotel and car (quiet "Turna bu şehir için liste yayımlamamış.", zero dots) plus an ok body with zero items;
  J.14 the route-card logo chain (Pegasus SVG mark, unknown airline with `logoUrl` -> `<img referrerPolicy="no-referrer">`,
  unknown airline without a logo or from a Phase 1 body -> text logo); J.15 `ProvenanceStrip` directly (`countLabel` wins,
  `dayCount` 0 prints "N teklif" and never "0 tarih", "N teklif, 3 tarih", `freshnessTone`). New group `Turna L: Phase 2 UI
  static guards` (L.1 to L.8): HeroSection tabs and copy, App mapping and toasts (no `|| 'Ankara'`; the weather widget's
  `initialCity` default is the only literal city left), `getNormalizedBrandName` whole-word aliases, `hasBrandMark` /
  `isRenderableLogoUrl`, the pure helpers of HotelResults / CarResults / SearchResults, source pins of the results
  components. Note for SSR assertions: React 18 emits the attribute as `referrerPolicy="no-referrer"` (camelCase kept), so
  tests match it case-insensitively. `npm test`: 684 tests, 684 green (Turna suite 187, groups A to L). Nothing in this
  section remains open.
