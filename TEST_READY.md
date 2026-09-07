# E2E Test Suite Ready: Bileo Platform, Icon Design System and Turna.com Scraper Integration

## Test Runner
- Command: `npm test` (`tsx src/tests/test_runner.ts`)
- Secondary Benchmarks: `npx tsx src/tests/stress_benchmark_harness.ts`
- Type Check: `npm run typecheck` (`tsc --noEmit`; tsconfig `include` covers `src`, `api` and `vite.config.ts`, `src/tests` stays excluded)
- Build: `npm run build` (`tsc && vite build`)
- Live smoke (optional, network, NOT part of `npm test`): `npm run smoke:turna` (`tsx scripts/turna_smoke.ts`); sweeps `TURNA_PRESETS` in-process, then runs the Phase 2 checks (`kind=car&city=istanbul`: items > 0, stats present, every `dailyPrice > 0`; `kind=hotel&city=antalya`: items > 0, stats null). `TURNA_SMOKE_BASE_URL=http://127.0.0.1:5173` sends the same queries through a running `/api/turna`; `TURNA_SMOKE_PRESETS=0` runs only the checks; `TURNA_SMOKE_CHECKS=2` or `=3` selects the Phase 2 or the Phase 3 checks alone. Phase 3 checks go through the real HTTP handler (in-process `handleTurnaHttp`, or the server): `kind=flight` must return a well-formed `history` (ISO timestamps, positive or null `minPrice`, at most 60 points, non-empty after a live fetch) and a `delta` consistent with `stats.min` when present; `GET /api/turna?stats=1` must return a `metrics` snapshot that counted that request (`requests >= 1`, `byKind.flight >= 1`, `ok + failed === requests`, `Cache-Control: no-store`). Documented network error codes are SKIP, never FAIL; exit code 1 only when a check fails on an HTTP 200 body.
- Expected: all suites pass with exit code 0 (100% pass rate); `git status --short` shows no test artefacts after a run

## Coverage Summary (measured 2026-09-06)
| Tier | Count | Description |
|------|------:|-------------|
| Tier 1: Static AST / Codebase Scanner | 14 tests | Scans src/ for lucide-react, asserts 0 imports in the icons subsystem and identifies consumer migration targets |
| Tier 2: Component Exports & SVG DOM Validation | 8 tests | Validates the canonical icons and aliases, prop interfaces (size, className, strokeWidth, color, title, aria-hidden, forwardRef) and SVG DOM elements |
| Tier 3: Backward Compatibility & Aliases | 4 tests | Validates IconProps alias, BileoTransportIcons compatibility and getTransportModeIcon |
| Tier 4: Master Integration & Performance | 4 tests | Validates master runner integration, SLA latency budget, SSR throughput |
| Baseline Core Suites (M1 & M2) | 186 tests | Core travel platform unit, integration, store, booking, search and pricing tests |
| Stress & Challenger Hardening (Tier 5) | 81 tests | Adversarial edge cases, extreme props and Web Audio isolation stress tests |
| Auth, DB, Security, Concurrency, Journeys | 200 tests | Bcrypt/JWT, in-memory relational engine, SQLi fuzzing, OCC locks, E2E journeys, Google auth |
| Turna.com Scraper Integration (groups A to L) | 196 tests | `src/tests/turna_scraper.test.ts` with offline fixtures in `src/tests/fixtures/turna_fixtures.ts`: urls (10), JSON-LD parser (19), analytics (5), fetch hardening (30), pipeline and HTTP contract (22: E.22 in-process metrics and `GET ?stats=1`), history store (10: F.10 `MemoryHistoryStore`), guard/adapter/format/client (22), places autocomplete (12), static guards (14), SearchResults SSR (17: every `LiveSearchState` branch, the hotel and car city screens, the route-card logo chain, `ProvenanceStrip` on its own, J.16 `PriceDeltaLine`, J.17 `PriceHistoryStrip`), hotel and car Phase 2 (22), Phase 2 to 4 UI static guards (13: Hero tabs and single-city copy, App kind mapping and toasts, whole-word brand aliases, `BrandLogo` predicates, results helpers, L.9 local price alerts, L.10 `useDialogFocus`, L.11 WCAG contrast of the muted token, L.12 `useScreenEntry`, L.13 seat buttons) |
| **Total Test Suite** | **693 tests** | **693 passed, 0 failed, about 37 s sequential (bcrypt work-factor-12 suites dominate). Every suite is green; I.7 pins the twelve files of `src/components/results` (including `PriceDeltaLine.tsx` and `PriceHistoryStrip.tsx`), I.2 pins `src/lib/turna` including `alerts.ts`** |

## Turna Suite Facts
- Zero network: every `fetch` is injected through `fakeFetch(scenario)`; HTML comes from TypeScript ports of the Python fixtures (`FLIGHT_PAGE` with a duplicate and an unpriced item, `BUS_PAGE`, `HOTEL_PAGE`, `FERRY_PAGE`, `BLOCKED_PAGE`) plus `HOMEPAGE_PAGE` (6 KB, zero JSON-LD) and `ROBOTS_ALLOW` / `ROBOTS_DENY_ALL`.
- Phase 2 fixtures (ports of `fixtures.py` `_rsc_scripts`, `HOTEL_PAGE_RSC`, `CAR_PAGE`): `rscScripts(key, items, extraPrefix)` emits the Next.js `self.__next_f.push([1,"..."])` chunks with the payload split mid-array; `HOTEL_PAGE_RSC_HTML` = 2 JSON-LD hotels + 3 RSC `initialHotels` with one overlapping slug and one `starRating 0` (4 merged rows); `CAR_PAGE_HTML` = JSON-LD descriptor only (`BreadcrumbList`, `AutoRental`, `FAQPage`) plus a `cars` array of 6 rows (duplicate and unpriced dropped, an earlier empty `"cars":[]` decoy skipped) giving 4 offers with exact stats min 1250 / avg 1772 / median 1669 / max 2500; `SAMPLE_CAR_OFFERS` and `PHASE1_HOTEL_WIRE` for the browser-side guard. `SAMPLE_FLIGHT_OFFERS` / `SAMPLE_BUS_OFFERS` carry the Phase 2 `logoUrl` / `companySlug` fields.
- Parity constants: first fixture flight id `eee39b67f15c` (identical to the Python package and the nexora panel); bus and car ids are recomputed through the TS `stableId` rather than hand-typed.
- Static guards fail the build on: `node:` or `server/turna` imports under `src/lib`, `src/components`, `src/data`, `App.tsx`, `main.tsx`; `lucide-react` under `src/components` and `src/data`; retired scraper or private-API literals anywhere under `api/`, `src/` and `vite.config.ts`; em or en dashes in the new source files; fabricated review defaults in TicketExperienceScreen. Group L adds the Phase 2 UI pins: Hero tab labels in `SEARCH_KINDS` order (Otobüs, Uçak, Tren, Feribot, Otel, Araç; no Puan) and the single-city copy; App's `searchKindToTurnaKind` / `isCityKind` wiring and kind-aware toast copy with no `|| 'Ankara'` and no literal city around the price alert (the weather widget's `initialCity` default is the one tolerated literal); `getNormalizedBrandName` matching thy / klm / ba / vib / ido as whole words only; HotelResults never importing `priceTL`, CarResults showing only `dailyPrice`, every remote logo carrying an `onError` fallback.
- The SSR group renders `SearchResults` for every `LiveSearchState` branch (idle, loading, ok, facts-only ferry and bus, unsupported, error) with `renderToStaticMarkup`, plus the legacy no-`live` path. Phase 2 adds the hotel screen (heading "Antalya otelleri", `countLabel` "5 otel", exactly `stars` star icons and none for `stars: null`, ratings and review counts only from present fields, no " TL" or "₺" anywhere, one semantic dot), the car screen ("İstanbul araç kiralama", "4 araç", `aria-label="Günlük fiyat özeti"` with `/gün`, "4 firma: ..." distribution, class / fuel / transmission / km chips with `Km limiti belirtilmemiş`, every card linking `result.sourceUrl`), facts-only hotel and car (quiet "Turna bu şehir için liste yayımlamamış.", zero dots), the route-card logo chain (Pegasus SVG mark, unknown airline with `logoUrl` as `<img referrerPolicy="no-referrer">`, unknown airline without a logo or from a Phase 1 body as a text logo) and `ProvenanceStrip` rendered directly (`countLabel` wins; `dayCount` 0 prints "N teklif" and never "0 tarih").

## Feature Checklist
| Feature | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 | Status |
|---------|:------:|:------:|:------:|:------:|:------:|:------:|
| 35 Core UI & Booking Icons | ✓ | ✓ | ✓ | ✓ | ✓ | VERIFIED |
| 6 Transport Modality Icons | ✓ | ✓ | ✓ | ✓ | ✓ | VERIFIED |
| Zero-Lucide AST Scanner | ✓ | ✓ | ✓ | ✓ | ✓ | VERIFIED |
| Prop & Style Forwarding | ✓ | ✓ | ✓ | ✓ | ✓ | VERIFIED |
| Accessibility & Titles | ✓ | ✓ | ✓ | ✓ | ✓ | VERIFIED |
| Backward-Compat Aliases | ✓ | ✓ | ✓ | ✓ | ✓ | VERIFIED |
| Master Runner Integration | ✓ | ✓ | ✓ | ✓ | ✓ | VERIFIED |
| Turna.com live search (offline fixtures, honest empty states) | ✓ | ✓ | ✓ | ✓ | ✓ | VERIFIED |
| Turna.com hotel and car kinds (`kind=car|hotel&city=`, RSC payload, logo URLs, `CAR_CITIES`) | ✓ | ✓ | ✓ | ✓ | ✓ | VERIFIED (group K) |
| Otel / Araç tabs, HotelResults, CarResults, BrandLogo chain, city ProvenanceStrip counter | ✓ | ✓ | ✓ | ✓ | ✓ | VERIFIED (J.11 to J.15, group L) |
| Phase 3 to 4: price delta line and history strip, browser-local price alerts, `/api/turna?stats=1` counters, lazy city panels, dialog and screen focus hooks, AA contrast token, accessible seats | ✓ | ✓ | ✓ | ✓ | ✓ | VERIFIED (E.22, F.10, J.16, J.17, L.9 to L.13) |
