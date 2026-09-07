/**
 * Local, network-free autocomplete over the curated 81-province dataset.
 * One row per province (Turna URLs are city-level); airport codes, terminals and ports are
 * detail text and secondary match keys. Slugs come from the same slugifyTr the server uses,
 * so a selected suggestion and the fetched landing URL can never disagree.
 *
 * Phase 2: `searchPlacesForKind` and `popularCities` also serve the single-city Otel and Araç tabs.
 * Hotels accept every province plus EXTRA_DISTRICTS; cars accept only CAR_CITIES, the slugs verified
 * to have a `/arac-kiralama/sehir/{slug}` landing page, so neither tab can build a 404 URL.
 */
import type { SearchKind, TransportType } from '../../types';
import { TURKEY_81_PROVINCES, type ProvinceTransitInfo } from '../../data/turkeyProvinces';
import { SEARCH_KINDS } from './adapter';
import { slugifyTr } from './urls';

export interface PlaceSuggestion {
  cityName: string;
  /** turna.com URL segment, always slugifyTr(cityName). */
  slug: string;
  plate: number;
  region: string;
  /** 'otobus' for provinces and districts, 'ucak' when airports exist, 'feribot' only for FERRY_STOPS. */
  modes: TransportType[];
  airports: { code: string; name: string }[];
  terminals: string[];
  ferryPorts: string[];
  matchedOn: 'city' | 'code' | 'airport' | 'terminal' | 'port' | 'stop';
}

export interface RecentSearch {
  transportType: TransportType;
  /** Tab the search was made from; absent in entries written before the Otel/Araç tabs (then equal to transportType). */
  searchKind?: SearchKind;
  fromCity: string;
  toCity: string;
  fromSlug: string;
  toSlug: string;
  /** ISO timestamp of the search. */
  at: string;
}

/** Ferry landing pages verified through TURNA_PRESETS (yalova-yenikapi, pendik-yalova). */
export const FERRY_STOPS: ReadonlyArray<{ cityName: string; slug: string }> = [
  { cityName: 'Yalova', slug: 'yalova' },
  { cityName: 'Yenikapı', slug: 'yenikapi' },
  { cityName: 'Pendik', slug: 'pendik' },
];

/** Districts that have their own turna.com landing pages (verified through TURNA_PRESETS). */
export const EXTRA_DISTRICTS: ReadonlyArray<{ cityName: string; slug: string; province: string }> = [
  { cityName: 'Bodrum', slug: 'bodrum', province: 'Muğla' },
  { cityName: 'Çeşme', slug: 'cesme', province: 'İzmir' },
];

export const RECENT_SEARCHES_KEY = 'bileo_recent_searches';
export const RECENT_SEARCHES_MAX = 5;

const TRANSPORT_TYPES: readonly TransportType[] = ['otobus', 'ucak', 'tren', 'feribot'];

// ---------------------------------------------------------------------------
// Car rental cities (Araç tab)
// ---------------------------------------------------------------------------

export interface CarCity {
  cityName: string;
  /** turna.com URL segment of `/arac-kiralama/sehir/{slug}`; always slugifyTr(cityName). */
  slug: string;
  /** Province name from TURKEY_81_PROVINCES when the city is a Turkish province. */
  province?: string;
  /** True for cities outside Türkiye. */
  abroad: boolean;
}

/**
 * Slugs linked from https://www.turna.com/arac-kiralama as `/arac-kiralama/sehir/{slug}`, kept in the
 * page's own order (Turkish provinces first, then cities abroad). Verified 2026-09-06 with a
 * Chrome-impersonating fetch of that page: 111 links, 70 Turkish provinces + 41 cities abroad; the
 * first eight are Turna's most prominent rental cities. Only these slugs are offered in the Araç tab.
 * Re-verify (curl with a browser User-Agent, or the Python package's Fetcher) when Turna adds cities.
 */
const CAR_CITY_SLUGS_TR: readonly string[] = [
  'istanbul', 'ankara', 'izmir', 'antalya', 'adana', 'bursa', 'mugla', 'trabzon',
  'mersin', 'kayseri', 'gaziantep', 'konya', 'diyarbakir', 'samsun', 'elazig', 'mardin',
  'kocaeli', 'eskisehir', 'ordu', 'sivas', 'hatay', 'nevsehir', 'balikesir', 'erzurum',
  'sanliurfa', 'denizli', 'van', 'rize', 'kars', 'malatya', 'aydin', 'kahramanmaras',
  'batman', 'tokat', 'tekirdag', 'adiyaman', 'erzincan', 'sakarya', 'mus', 'manisa',
  'giresun', 'yalova', 'zonguldak', 'canakkale', 'corum', 'amasya', 'sinop', 'edirne',
  'bingol', 'igdir', 'agri', 'siirt', 'kirklareli', 'afyonkarahisar', 'sirnak', 'kutahya',
  'isparta', 'kastamonu', 'aksaray', 'artvin', 'osmaniye', 'bayburt', 'usak', 'bartin',
  'karaman', 'duzce', 'kirikkale', 'burdur', 'bitlis', 'bolu',
];

const CAR_CITY_SLUGS_ABROAD: readonly string[] = [
  'lefkosa', 'dubai', 'berlin', 'baku', 'kotor', 'uskup', 'londra', 'midilli',
  'tiran', 'podgorica', 'saraybosna', 'dusseldorf', 'munih', 'stuttgart', 'koln', 'samos',
  'grad-beograd', 'pristine', 'sarajevo', 'madrid', 'roma', 'budapeste', 'milano', 'los-angeles',
  'frankfurt', 'selanik', 'viyana', 'amsterdam', 'kos', 'atina', 'basel', 'barcelona',
  'prag', 'tiflis', 'paris', 'budva', 'bilbao', 'belgrade', 'medine', 'tallinn', 'phuket',
];

/** Turkish display names for slugs the Title-case fallback would render without diacritics. */
const CAR_CITY_LABELS: Readonly<Record<string, string>> = {
  lefkosa: 'Lefkoşa',
  baku: 'Bakü',
  uskup: 'Üsküp',
  dusseldorf: 'Düsseldorf',
  munih: 'Münih',
  koln: 'Köln',
  pristine: 'Priştine',
  budapeste: 'Budapeşte',
};

function titleCaseSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

let provinceBySlugIndex: Map<string, ProvinceTransitInfo> | null = null;
function provinceBySlug(slug: string): ProvinceTransitInfo | undefined {
  if (!provinceBySlugIndex) {
    provinceBySlugIndex = new Map(TURKEY_81_PROVINCES.map((p) => [slugifyTr(p.name), p] as const));
  }
  return provinceBySlugIndex.get(slug);
}

function carCity(slug: string, abroad: boolean): CarCity {
  const province = abroad ? undefined : provinceBySlug(slug);
  const city: CarCity = {
    cityName: province?.name ?? CAR_CITY_LABELS[slug] ?? titleCaseSlug(slug),
    slug,
    abroad,
  };
  if (province) city.province = province.name;
  return city;
}

/** Every city with a verified `/arac-kiralama/sehir/{slug}` landing page, Turkish provinces first. */
export const CAR_CITIES: ReadonlyArray<CarCity> = [
  ...CAR_CITY_SLUGS_TR.map((slug) => carCity(slug, false)),
  ...CAR_CITY_SLUGS_ABROAD.map((slug) => carCity(slug, true)),
];

export function findCarCity(slug: string): CarCity | undefined {
  const s = slugifyTr(slug);
  return s ? CAR_CITIES.find((c) => c.slug === s) : undefined;
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

interface PlaceRecord {
  cityName: string;
  slug: string;
  plate: number;
  region: string;
  modes: TransportType[];
  airports: { code: string; name: string }[];
  terminals: string[];
  ferryPorts: string[];
  /** True for provinces (used by popularCities); false for districts and standalone ferry stops. */
  isProvince: boolean;
  isFerryStop: boolean;
  airportCodes: string[];
  airportNameSlugs: string[];
  terminalSlugs: string[];
  portSlugs: string[];
}

function makeRecord(
  base: Pick<PlaceRecord, 'cityName' | 'slug' | 'plate' | 'region' | 'modes' | 'airports' | 'terminals' | 'ferryPorts' | 'isProvince' | 'isFerryStop'>,
): PlaceRecord {
  return {
    ...base,
    airportCodes: base.airports.map((a) => a.code.toLowerCase()),
    airportNameSlugs: base.airports.map((a) => slugifyTr(a.name)),
    terminalSlugs: base.terminals.map(slugifyTr),
    portSlugs: base.ferryPorts.map(slugifyTr),
  };
}

function provinceRecord(p: ProvinceTransitInfo): PlaceRecord {
  const airports = p.airports ?? [];
  const modes: TransportType[] = ['otobus'];
  if (airports.length > 0) modes.push('ucak');
  return makeRecord({
    cityName: p.name,
    slug: slugifyTr(p.name),
    plate: p.plate,
    region: p.region,
    modes,
    airports: [...airports],
    terminals: [...p.terminals],
    ferryPorts: [...(p.ferryPorts ?? [])],
    isProvince: true,
    isFerryStop: false,
  });
}

/** Province whose terminals/stations/ports mention the given place slug (e.g. yenikapi -> İstanbul). */
function parentProvinceOf(placeSlug: string): ProvinceTransitInfo | undefined {
  return TURKEY_81_PROVINCES.find((p) =>
    [...p.terminals, ...(p.trainStations ?? []), ...(p.ferryPorts ?? []), ...(p.airports ?? []).map((a) => a.name)]
      .some((label) => slugifyTr(label).includes(placeSlug)),
  );
}

function buildIndex(): PlaceRecord[] {
  const records: PlaceRecord[] = TURKEY_81_PROVINCES.map(provinceRecord);
  const provinceByName = new Map(TURKEY_81_PROVINCES.map((p) => [p.name, p] as const));

  for (const district of EXTRA_DISTRICTS) {
    const parent = provinceByName.get(district.province);
    const needle = slugifyTr(district.cityName);
    const airports = (parent?.airports ?? []).filter((a) => slugifyTr(a.name).includes(needle));
    const terminals = (parent?.terminals ?? []).filter((t) => slugifyTr(t).includes(needle));
    const ferryPorts = (parent?.ferryPorts ?? []).filter((f) => slugifyTr(f).includes(needle));
    const modes: TransportType[] = ['otobus'];
    if (airports.length > 0) modes.push('ucak');
    records.push(
      makeRecord({
        cityName: district.cityName,
        slug: district.slug,
        plate: parent?.plate ?? 0,
        region: parent?.region ?? '',
        modes,
        airports,
        terminals,
        ferryPorts,
        isProvince: false,
        isFerryStop: false,
      }),
    );
  }

  for (const stop of FERRY_STOPS) {
    const existing = records.find((r) => r.slug === stop.slug);
    if (existing) {
      if (!existing.modes.includes('feribot')) existing.modes.push('feribot');
      existing.isFerryStop = true;
      continue;
    }
    const parent = parentProvinceOf(stop.slug);
    const ferryPorts = (parent?.ferryPorts ?? []).filter((f) => slugifyTr(f).includes(stop.slug));
    records.push(
      makeRecord({
        cityName: stop.cityName,
        slug: stop.slug,
        plate: parent?.plate ?? 0,
        region: parent?.region ?? '',
        // Standalone ferry stops are not bus/flight destinations on turna.com; feribot only.
        modes: ['feribot'],
        airports: [],
        terminals: [],
        ferryPorts,
        isProvince: false,
        isFerryStop: true,
      }),
    );
  }
  return records;
}

let placeIndex: PlaceRecord[] | null = null;
function getIndex(): PlaceRecord[] {
  if (!placeIndex) placeIndex = buildIndex();
  return placeIndex;
}

function toSuggestion(rec: PlaceRecord, matchedOn: PlaceSuggestion['matchedOn']): PlaceSuggestion {
  return {
    cityName: rec.cityName,
    slug: rec.slug,
    plate: rec.plate,
    region: rec.region,
    modes: [...rec.modes],
    airports: rec.airports.map((a) => ({ ...a })),
    terminals: [...rec.terminals],
    ferryPorts: [...rec.ferryPorts],
    matchedOn,
  };
}

function candidatesFor(transportType: TransportType): PlaceRecord[] {
  const index = getIndex();
  if (transportType === 'tren') return [];
  if (transportType === 'feribot') return index.filter((r) => r.isFerryStop);
  return index.filter((r) => r.modes.includes(transportType));
}

interface Match {
  rank: number;
  matchedOn: PlaceSuggestion['matchedOn'];
}

/** Ranking: city-slug prefix > exact IATA code > airport name > terminal > port; then plate order. */
function matchRecord(rec: PlaceRecord, q: string, transportType: TransportType): Match | null {
  if (rec.slug.startsWith(q)) {
    return { rank: 0, matchedOn: transportType === 'feribot' && rec.isFerryStop ? 'stop' : 'city' };
  }
  if (rec.airportCodes.includes(q)) return { rank: 1, matchedOn: 'code' };
  if (q.length >= 2) {
    if (rec.airportNameSlugs.some((s) => s.includes(q))) return { rank: 2, matchedOn: 'airport' };
    if (rec.terminalSlugs.some((s) => s.includes(q))) return { rank: 3, matchedOn: 'terminal' };
    if (rec.portSlugs.some((s) => s.includes(q))) return { rank: 4, matchedOn: 'port' };
  }
  if (q.length >= 3 && rec.slug.includes(q)) return { rank: 5, matchedOn: 'city' };
  return null;
}

/**
 * Suggestions for a typed term. Term and candidates are both normalised with slugifyTr, so
 * "ıst", "IST" and "İst" all reach İstanbul. `feribot` yields only FERRY_STOPS; `tren` yields [].
 */
export function searchPlaces(term: string, transportType: TransportType, limit = 8): PlaceSuggestion[] {
  if (transportType === 'tren') return [];
  const q = slugifyTr(term);
  if (!q || limit <= 0) return [];
  const scored: Array<{ rec: PlaceRecord; match: Match }> = [];
  for (const rec of candidatesFor(transportType)) {
    const match = matchRecord(rec, q, transportType);
    if (match) scored.push({ rec, match });
  }
  scored.sort((a, b) => a.match.rank - b.match.rank || a.rec.plate - b.rec.plate || a.rec.slug.localeCompare(b.rec.slug));
  return scored.slice(0, limit).map(({ rec, match }) => toSuggestion(rec, match.matchedOn));
}

export function findPlaceBySlug(slug: string): PlaceSuggestion | undefined {
  const s = slugifyTr(slug);
  if (!s) return undefined;
  const rec = getIndex().find((r) => r.slug === s);
  return rec ? toSuggestion(rec, 'city') : undefined;
}

let popularityIndex: Map<string, number> | null = null;
/** How often a province is named in other provinces' popularIntercityRoutes. */
function popularity(): Map<string, number> {
  if (popularityIndex) return popularityIndex;
  const freq = new Map<string, number>();
  for (const p of TURKEY_81_PROVINCES) {
    for (const name of p.popularIntercityRoutes) {
      const slug = slugifyTr(name);
      freq.set(slug, (freq.get(slug) ?? 0) + 1);
    }
  }
  popularityIndex = freq;
  return freq;
}

// ---------------------------------------------------------------------------
// City lists for the single-city tabs (Otel, Araç)
// ---------------------------------------------------------------------------

let hotelRecordList: PlaceRecord[] | null = null;
/** Every province (ranked by intercity-route frequency, then plate) followed by EXTRA_DISTRICTS. */
function hotelRecords(): PlaceRecord[] {
  if (hotelRecordList) return hotelRecordList;
  const index = getIndex();
  const freq = popularity();
  const provinces = index
    .filter((r) => r.isProvince)
    .sort((a, b) => (freq.get(b.slug) ?? 0) - (freq.get(a.slug) ?? 0) || a.plate - b.plate);
  const districts = EXTRA_DISTRICTS
    .map((d) => index.find((r) => r.slug === d.slug))
    .filter((r): r is PlaceRecord => r !== undefined);
  hotelRecordList = [...provinces, ...districts];
  return hotelRecordList;
}

let carRecordList: PlaceRecord[] | null = null;
/** CAR_CITIES in verified order; Turkish provinces reuse their dataset row, cities abroad get a bare row. */
function carRecords(): PlaceRecord[] {
  if (carRecordList) return carRecordList;
  const index = getIndex();
  carRecordList = CAR_CITIES.map(
    (city) =>
      index.find((r) => r.slug === city.slug) ??
      makeRecord({
        cityName: city.cityName,
        slug: city.slug,
        plate: 0,
        region: city.abroad ? 'Yurt dışı' : '',
        modes: [],
        airports: [],
        terminals: [],
        ferryPorts: [],
        isProvince: false,
        isFerryStop: false,
      }),
  );
  return carRecordList;
}

/** City-name matching for the single-city tabs: slug prefix first, then substring (3+ chars), list order kept. */
function searchCityList(list: PlaceRecord[], term: string, limit: number): PlaceSuggestion[] {
  const q = slugifyTr(term);
  if (!q || limit <= 0) return [];
  const prefix = list.filter((r) => r.slug.startsWith(q));
  const contains = q.length >= 3 ? list.filter((r) => !r.slug.startsWith(q) && r.slug.includes(q)) : [];
  return [...prefix, ...contains].slice(0, limit).map((r) => toSuggestion(r, 'city'));
}

/**
 * Suggestions for any search tab. Transport kinds behave exactly like `searchPlaces`; `otel` searches
 * every province plus EXTRA_DISTRICTS; `arac` searches only CAR_CITIES. Rows match on the city name
 * only (`matchedOn: 'city'`) for the two single-city tabs.
 */
export function searchPlacesForKind(term: string, kind: SearchKind, limit = 8): PlaceSuggestion[] {
  if (kind === 'otel') return searchCityList(hotelRecords(), term, limit);
  if (kind === 'arac') return searchCityList(carRecords(), term, limit);
  return searchPlaces(term, kind, limit);
}

/**
 * Most-connected provinces for a mode (feribot -> FERRY_STOPS in preset order; tren -> []).
 * `otel` -> the first n of the hotel city list; `arac` -> the first n of CAR_CITIES.
 */
export function popularCities(kind: SearchKind, n = 8): PlaceSuggestion[] {
  if (kind === 'tren' || n <= 0) return [];
  if (kind === 'otel') return hotelRecords().slice(0, n).map((r) => toSuggestion(r, 'city'));
  if (kind === 'arac') return carRecords().slice(0, n).map((r) => toSuggestion(r, 'city'));
  if (kind === 'feribot') {
    const index = getIndex();
    return FERRY_STOPS
      .map((stop) => index.find((r) => r.slug === stop.slug))
      .filter((r): r is PlaceRecord => r !== undefined)
      .slice(0, n)
      .map((r) => toSuggestion(r, 'stop'));
  }
  const freq = popularity();
  return getIndex()
    .filter((r) => r.isProvince && r.modes.includes(kind))
    .sort((a, b) => (freq.get(b.slug) ?? 0) - (freq.get(a.slug) ?? 0) || a.plate - b.plate)
    .slice(0, n)
    .map((r) => toSuggestion(r, 'city'));
}

// ---------------------------------------------------------------------------
// Recent searches (localStorage, SSR-safe)
// ---------------------------------------------------------------------------

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecentSearch(v: unknown): v is RecentSearch {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.transportType === 'string' &&
    (TRANSPORT_TYPES as readonly string[]).includes(r.transportType) &&
    (r.searchKind === undefined || (typeof r.searchKind === 'string' && (SEARCH_KINDS as readonly string[]).includes(r.searchKind))) &&
    typeof r.fromCity === 'string' &&
    typeof r.toCity === 'string' &&
    typeof r.fromSlug === 'string' &&
    typeof r.toSlug === 'string' &&
    typeof r.at === 'string'
  );
}

export function readRecentSearches(): RecentSearch[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentSearch).slice(0, RECENT_SEARCHES_MAX);
  } catch {
    return [];
  }
}

const recentKey = (e: RecentSearch): string => `${e.searchKind ?? e.transportType}|${e.fromSlug}|${e.toSlug}`;

/** Prepend an entry (deduped by tab + slugs), keeping at most RECENT_SEARCHES_MAX. No-op without localStorage. */
export function writeRecentSearch(entry: RecentSearch): void {
  const store = storage();
  if (!store) return;
  const next = [entry, ...readRecentSearches().filter((e) => recentKey(e) !== recentKey(entry))].slice(0, RECENT_SEARCHES_MAX);
  try {
    store.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded or private mode: recent searches are a convenience only.
  }
}

export function clearRecentSearches(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // ignore
  }
}
