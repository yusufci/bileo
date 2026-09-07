/**
 * Structural validation of `/api/turna` JSON before it reaches the adapter or the UI.
 * Hand-rolled (no zod in the browser bundle). Malformed envelopes return null; malformed
 * items are dropped and counted, never patched with defaults.
 *
 * Phase 2 tolerance: for up to `s-maxage` after a deploy the edge cache can still hand a Phase 2
 * client a Phase 1 body, whose flights/buses lack `logoUrl`/`companySlug` and whose hotels lack the
 * rich fields. Those fields may therefore be ABSENT (undefined); when present they must have the
 * right type. Absent hotel fields are returned in the contract's own "not published" encoding
 * (`null` / `[]`), which is a statement of absence, not a substitute value.
 */
import type {
  BusOffer,
  CarFuelType,
  CarOffer,
  CarTransmission,
  CarVehicleClass,
  FetchedVia,
  FlightOffer,
  HistoryPoint,
  HotelOffer,
  PriceDelta,
  PriceStats,
  RouteFacts,
  TurnaFailure,
  TurnaKind,
  TurnaOffer,
  TurnaQuery,
  TurnaResponse,
  TurnaSuccess,
} from './types';
import { TURNA_KINDS } from './types';
import { computeStats } from './analytics';
import { ISO_DATE_RE, ISO_DATETIME_RE } from './format';

type Dict = Record<string, unknown>;

const KINDS: readonly TurnaKind[] = TURNA_KINDS;
const FETCHED_VIA: readonly FetchedVia[] = ['crw-stealth', 'crw-js', 'direct', 'cache'];
const CAR_CLASSES: readonly CarVehicleClass[] = ['economy', 'standard', 'fullsize', 'premium', 'luxury', 'other'];
const CAR_FUELS: readonly CarFuelType[] = ['gasoline', 'diesel', 'hybrid', 'electric', 'lpg', 'other'];
const CAR_TRANSMISSIONS: readonly CarTransmission[] = ['auto', 'manual', 'other'];

const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isPositiveNum = (v: unknown): v is number => isNum(v) && v > 0;
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isStrOrNull = (v: unknown): v is string | null => v === null || isStr(v);
const isNumOrNull = (v: unknown): v is number | null => v === null || isNum(v);
const isBoolOrNull = (v: unknown): v is boolean | null => v === null || isBool(v);
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const isKind = (v: unknown): v is TurnaKind => isStr(v) && (KINDS as readonly string[]).includes(v);
const isFetchedVia = (v: unknown): v is FetchedVia => isStr(v) && (FETCHED_VIA as readonly string[]).includes(v);
const isIsoDateTime = (v: unknown): v is string => isStr(v) && ISO_DATETIME_RE.test(v);
const isIsoDate = (v: unknown): v is string => isStr(v) && ISO_DATE_RE.test(v);
const isOneOf =
  <T extends string>(list: readonly T[]) =>
  (v: unknown): v is T =>
    isStr(v) && (list as readonly string[]).includes(v);
const isCarClass = isOneOf(CAR_CLASSES);
const isCarFuel = isOneOf(CAR_FUELS);
const isCarTransmission = isOneOf(CAR_TRANSMISSIONS);
/** Field absent (undefined) or of the given shape. */
const absentOr =
  <T,>(guard: (v: unknown) => v is T) =>
  (v: unknown): v is T | undefined =>
    v === undefined || guard(v);
const absentOrStrOrNull = absentOr(isStrOrNull);
const absentOrNumOrNull = absentOr(isNumOrNull);
const absentOrStrArray = absentOr(isStrArray);

/** Cached bodies written before Phase A6 carry no `source`; anything other than absent or 'turna' is foreign. */
const absentOrTurna = (v: unknown): boolean => v === undefined || v === 'turna';

function validFlight(it: Dict): it is Dict & FlightOffer {
  return (
    it.kind === 'flight' &&
    absentOrTurna(it.source) &&
    isStr(it.id) && it.id.length > 0 &&
    isStr(it.airline) &&
    isStrOrNull(it.airlineCode) &&
    absentOrStrOrNull(it.logoUrl) &&
    isStr(it.fromName) &&
    isStrOrNull(it.fromCode) &&
    isStr(it.toName) &&
    isStrOrNull(it.toCode) &&
    isIsoDateTime(it.departureAt) &&
    isIsoDateTime(it.arrivalAt) &&
    isIsoDate(it.date) &&
    isNumOrNull(it.durationMinutes) &&
    isStr(it.durationLabel) &&
    isPositiveNum(it.price) &&
    it.currency === 'TRY' &&
    isBoolOrNull(it.isDirect)
  );
}

function validBus(it: Dict): it is Dict & BusOffer {
  return (
    it.kind === 'bus' &&
    absentOrTurna(it.source) &&
    isStr(it.id) && it.id.length > 0 &&
    isStr(it.company) &&
    isStrOrNull(it.companyUrl) &&
    absentOrStrOrNull(it.companySlug) &&
    absentOrStrOrNull(it.logoUrl) &&
    isStr(it.fromStop) &&
    isStr(it.fromCity) &&
    isStr(it.toStop) &&
    isStr(it.toCity) &&
    isIsoDateTime(it.departureAt) &&
    isIsoDateTime(it.arrivalAt) &&
    isIsoDate(it.date) &&
    isNumOrNull(it.durationMinutes) &&
    isStr(it.durationLabel) &&
    isPositiveNum(it.price) &&
    it.currency === 'TRY'
  );
}

/** Cars have no Phase 1 wire shape to tolerate: the full CarOffer is required. */
function validCar(it: Dict): it is Dict & CarOffer {
  return (
    it.kind === 'car' &&
    absentOrTurna(it.source) &&
    isStr(it.id) && it.id.length > 0 &&
    isStr(it.brand) &&
    isStr(it.model) &&
    isCarClass(it.vehicleClass) &&
    isStr(it.vehicleClassRaw) &&
    isCarFuel(it.fuelType) &&
    isStr(it.fuelTypeRaw) &&
    isCarTransmission(it.transmission) &&
    isNumOrNull(it.mileageLimitKm) &&
    isStrOrNull(it.imageUrl) &&
    isStr(it.company) &&
    isStrOrNull(it.companySlug) &&
    isStrOrNull(it.companyLogoUrl) &&
    isPositiveNum(it.dailyPrice) &&
    it.currency === 'TRY'
  );
}

/**
 * Hotel: `kind`, `id`, `name`, `url`, `locality`, `image`, `country`, `rating`, `ratingBest`, `reviewCount`
 * are required (both wire generations emit them); the Phase 2 fields may be absent. Returns a fresh
 * object so absent fields carry the contract's absence encoding.
 */
function hotelOffer(it: Dict): HotelOffer | null {
  if (!absentOrTurna(it.source)) return null;
  const { id, name, url, image, locality, country, rating, ratingBest, reviewCount } = it;
  if (
    it.kind !== 'hotel' ||
    !isStr(id) || id.length === 0 ||
    !isStr(name) ||
    !isStr(url) ||
    !isStrOrNull(image) ||
    !isStr(locality) ||
    !isStrOrNull(country) ||
    !isNumOrNull(rating) ||
    !isNum(ratingBest) ||
    !isNumOrNull(reviewCount)
  ) {
    return null;
  }
  const { slug, images, district, city, region, ratingText, stars, amenities, tags, breakfast, turnaId } = it;
  if (
    !absentOrStrOrNull(slug) ||
    !absentOrStrArray(images) ||
    !absentOrStrOrNull(district) ||
    !absentOrStrOrNull(city) ||
    !absentOrStrOrNull(region) ||
    !absentOrStrOrNull(ratingText) ||
    !absentOrNumOrNull(stars) ||
    !absentOrStrArray(amenities) ||
    !absentOrStrArray(tags) ||
    !absentOrStrOrNull(breakfast) ||
    !absentOrNumOrNull(turnaId)
  ) {
    return null;
  }
  return {
    kind: 'hotel',
    source: 'turna',
    id,
    name,
    url,
    slug: slug ?? null,
    image,
    images: images ?? (image ? [image] : []),
    locality,
    district: district ?? null,
    city: city ?? null,
    region: region ?? null,
    country,
    rating,
    ratingBest,
    ratingText: ratingText ?? null,
    reviewCount,
    stars: stars ?? null,
    amenities: amenities ?? [],
    tags: tags ?? [],
    breakfast: breakfast ?? null,
    turnaId: turnaId ?? null,
  };
}

/** Validate one raw item; null when it is not a well-formed TurnaOffer. */
export function validateTurnaOffer(raw: unknown): TurnaOffer | null {
  if (!isDict(raw)) return null;
  // Well-formed bodies pass through untouched (identity preserved); only pre-A6 cached rows get the field filled in.
  if (validFlight(raw)) return raw.source === 'turna' ? raw : { ...raw, source: 'turna' };
  if (validBus(raw)) return raw.source === 'turna' ? raw : { ...raw, source: 'turna' };
  if (validCar(raw)) return raw.source === 'turna' ? raw : { ...raw, source: 'turna' };
  return hotelOffer(raw);
}

function validQuery(v: unknown): v is TurnaQuery {
  return (
    isDict(v) &&
    isKind(v.kind) &&
    (v.from === undefined || isStr(v.from)) &&
    (v.to === undefined || isStr(v.to)) &&
    (v.city === undefined || isStr(v.city)) &&
    (v.refresh === undefined || isBool(v.refresh))
  );
}

function validFacts(v: unknown): v is RouteFacts {
  return (
    isDict(v) &&
    isNumOrNull(v.carriersCount) &&
    isStrArray(v.popularCarriers) &&
    isStrOrNull(v.cheapestWeekday) &&
    isNumOrNull(v.tripsPerWeek) &&
    isNumOrNull(v.tripsPerDay) &&
    isStrArray(v.departureHubs) &&
    isStrArray(v.arrivalHubs) &&
    isNumOrNull(v.shortestDurationMinutes) &&
    isStrOrNull(v.shortestDurationLabel) &&
    Array.isArray(v.faq) &&
    v.faq.every((q) => isDict(q) && isStr(q.question) && isStr(q.answer))
  );
}

function validStats(v: unknown): v is PriceStats | null {
  if (v === null) return true;
  return (
    isDict(v) &&
    isNum(v.count) &&
    isNum(v.min) &&
    isNum(v.max) &&
    isNum(v.avg) &&
    isNum(v.median) &&
    Array.isArray(v.byCompany) &&
    v.byCompany.every((c) => isDict(c) && isStr(c.name) && isNum(c.count) && isNum(c.minPrice) && isNum(c.avgPrice)) &&
    Array.isArray(v.byDay) &&
    v.byDay.every((d) => isDict(d) && isIsoDate(d.date) && isNum(d.minPrice) && isNum(d.count))
  );
}

function validHistory(v: unknown): v is HistoryPoint[] {
  return (
    Array.isArray(v) &&
    v.every((h) => isDict(h) && isStr(h.observedAt) && isNumOrNull(h.minPrice) && isNumOrNull(h.avgPrice) && isNum(h.count))
  );
}

function validDelta(v: unknown): v is PriceDelta | null {
  if (v === null) return true;
  return (
    isDict(v) &&
    isStr(v.previousObservedAt) &&
    isNum(v.previousMin) &&
    isNum(v.currentMin) &&
    isNum(v.change) &&
    isNum(v.changePct)
  );
}

/**
 * Validate a raw `/api/turna` body. Returns null when the envelope is not a TurnaResponse.
 * For successes, invalid items are removed and counted in `dropped`; when anything was dropped
 * the price stats are recomputed from the surviving items so the UI never shows numbers
 * derived from data it refused to display.
 */
export function parseTurnaResponse(json: unknown): { response: TurnaResponse; dropped: number } | null {
  if (!isDict(json) || !isBool(json.success)) return null;

  if (json.success === false) {
    if (!isStr(json.error) || !isStr(json.errorCode)) return null;
    const failure: TurnaFailure = { success: false, error: json.error, errorCode: json.errorCode };
    return { response: failure, dropped: 0 };
  }

  if (
    !isKind(json.kind) ||
    !validQuery(json.query) ||
    !isStr(json.routeKey) ||
    !isStr(json.sourceUrl) ||
    !isStrOrNull(json.pageTitle) ||
    !isFetchedVia(json.fetchedVia) ||
    !isNum(json.latencyMs) ||
    !isStr(json.scrapedAt) ||
    !Array.isArray(json.items) ||
    !validFacts(json.facts) ||
    !validStats(json.stats) ||
    !validHistory(json.history) ||
    !validDelta(json.delta) ||
    !isStrArray(json.warnings)
  ) {
    return null;
  }

  const items: TurnaOffer[] = [];
  let dropped = 0;
  for (const raw of json.items) {
    const offer = validateTurnaOffer(raw);
    if (offer) items.push(offer);
    else dropped += 1;
  }

  const response: TurnaSuccess = {
    success: true,
    kind: json.kind,
    query: json.query,
    routeKey: json.routeKey,
    sourceUrl: json.sourceUrl,
    pageTitle: json.pageTitle,
    fetchedVia: json.fetchedVia,
    latencyMs: json.latencyMs,
    scrapedAt: json.scrapedAt,
    items,
    facts: json.facts,
    stats: dropped > 0 ? computeStats(items) : json.stats,
    history: json.history,
    delta: json.delta,
    warnings: json.warnings,
  };
  return { response, dropped };
}
