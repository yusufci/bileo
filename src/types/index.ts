// Bileo Ultra-Premium Multi-Modal Transportation Platform
// Domain Type Definitions & Interface Contracts

import type { TurnaQuery, TurnaSuccess } from '../lib/turna/types';

export type TransportType = 'otobus' | 'ucak' | 'tren' | 'feribot';
/**
 * Every search tab: the four transport modes plus the single-city Otel and Araç tabs.
 * Maps to Turna kinds via src/lib/turna/adapter.ts `searchKindToTurnaKind` (otel -> hotel, arac -> car).
 */
export type SearchKind = TransportType | 'otel' | 'arac';
export type TransportMode = 'bus' | 'flight' | 'train' | 'ferry' | 'otobus' | 'ucak' | 'tren' | 'feribot';

export type SeatGender = 'male' | 'female' | 'none' | null;
export type SeatStatus = 'empty' | 'available' | 'taken_male' | 'taken_female' | 'booked' | 'selected' | 'disabled';
export type SeatTier = 'standard' | 'single' | 'business' | 'extra_legroom' | 'table' | 'vip_lounge' | 'window' | 'aisle' | 'exit_row';
export type SeatType = 'single' | 'window' | 'aisle' | 'table' | 'extra_legroom' | 'business' | 'standard' | 'vip_lounge' | 'exit_row';

export type SeatLayoutType = 'bus_2_1' | 'bus_2_2' | 'plane_3_3' | 'train_2_2' | 'train_2_1' | 'ferry_deck';

export interface SeatItem {
  id: string;
  number: number | string;
  seatNumber?: string;
  row: number;
  col: number;
  status: SeatStatus;
  tier: SeatTier;
  type?: SeatType;
  price: number;
  gender?: SeatGender;
  cabinClass?: 'economy' | 'business' | 'vip';
  carriageNumber?: number;
  deck?: 'main' | 'upper';
  isExitRow?: boolean;
  isTableSeat?: boolean;
  isTable?: boolean;
  facingDirection?: 'forward' | 'backward';
  label?: string;
  wingPosition?: boolean;
  hasPowerSocket?: boolean;
}

export interface ReviewReply {
  id: string;
  author: string;
  date: string;
  text: string;
  isCompany?: boolean;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  travelType: string;
  verified: boolean;
  scores?: {
    cleanliness: number;
    punctuality: number;
    comfort: number;
    service: number;
  };
  likes?: number;
  dislikes?: number;
  userVote?: 'like' | 'dislike' | null;
  replies?: ReviewReply[];
}

export interface RouteItem {
  id: string;
  from: string;
  fromTerminal: string;
  to: string;
  toTerminal: string;
  departureTime: string;
  arrivalTime: string;
  /** Display label, `Hs MMdk` (e.g. "2s 10dk"); numeric source in durationMinutes when known. */
  duration: string;
  /** Total minutes when the source publishes it; undefined for legacy mock rows. */
  durationMinutes?: number;
  /** Turkish display string for both mock and Turna rows (e.g. "24 Eylül Perşembe"); the ISO date lives in provenance.dateIso. */
  date: string;
  price: number;
  originalPrice?: number;
  company: string;
  companyLogo?: string;
  transportType: TransportType;
  /** The following fields are optional because Turna landing pages do not publish them; never default them. */
  vehicleType?: string;
  availableSeats?: number;
  rating?: number;
  reviewCount?: number;
  features?: string[];
  badge?: string;
  serviceClass?: 'standard' | 'comfort' | 'business' | 'vip';
  vesselType?: string;
  aircraftModel?: string;
  trainSeries?: string;
  seatLayoutType?: SeatLayoutType;
  gateOrPlatform?: string;
  reviews?: ReviewItem[];
  restStop?: {
    name: string;
    duration: string;
    description: string;
  };
  /** Present only on rows adapted from a Turna.com landing page. */
  provenance?: RouteProvenance;
}

/** Where a live RouteItem came from. Attached by src/lib/turna/adapter.ts, never by mock data. */
export interface RouteProvenance {
  source: 'turna';
  kind: 'flight' | 'bus';
  /** 12-hex stable offer id (parity with turna/parse.py). */
  offerId: string;
  /** e.g. `flight:istanbul-ankara` */
  routeKey: string;
  sourceUrl: string;
  /** ISO timestamp of when the HTML was actually fetched (cache hits keep the original). */
  scrapedAt: string;
  fetchedVia: 'direct' | 'cache';
  /** YYYY-MM-DD local departure date. */
  dateIso: string;
  /** ISO-8601 with +03:00 offset. */
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number | null;
  /** null = the landing page is silent about stops (flights); buses never publish it. */
  isDirect: boolean | null;
  currency: 'TRY';
  /** Landing pages list the cheapest upcoming fares across several dates, not a timetable for one day. */
  sampling: 'cheapest-upcoming';
  airlineCode?: string | null;
  companyUrl?: string | null;
  /** Turna CDN logo (airline by IATA, bus company by slug); may 403/404, so render with an onError text fallback. */
  logoUrl?: string | null;
  /** Bus company ASCII slug (last segment of companyUrl); null for flights. */
  companySlug?: string | null;
}

export interface PassengerInfo {
  id: string;
  seatNumber: number | string;
  firstName: string;
  lastName: string;
  isForeigner?: boolean;
  idNumber: string;
  nationality?: string;
  gender: 'male' | 'female' | 'none' | null;
  birthDate?: string;
  email: string;
  phone: string;
  luggageKg?: number;
  hasInsurance?: boolean;
  hesCode?: string;
}

export interface CheckoutAddOns {
  luggageKg: number;
  insurance: boolean;
  smsNotification?: boolean;
}

export interface RefundDetails {
  refundedAmount: number;
  refundDate: string;
  receiptId: string;
  reason?: string;
  deductionAmount?: number;
  originalAmount?: number;
  refundedAt?: string;
  referenceId?: string;
}

export interface BookingTicket {
  id?: string;
  pnr: string;
  route: RouteItem;
  passengers: PassengerInfo[];
  seats: (number | string)[] | SeatItem[];
  basePrice?: number;
  seatTierSurcharges?: number;
  luggageSurcharges?: number;
  insuranceFee?: number;
  discountAmount?: number;
  serviceFee?: number;
  totalPrice: number;
  status: 'active' | 'completed' | 'cancelled' | 'refunded' | 'confirmed';
  bookingDate?: string;
  purchaseDate: string;
  purchaseTimestamp?: number;
  paymentMethod?: 'credit_card' | 'debit_card' | 'fast';
  cardMasked?: string;
  promoCode?: string;
  addOns?: CheckoutAddOns;
  refundDetails?: RefundDetails;
  qrCodeValue: string;
}

export interface DiscoveryCardItem {
  id: string;
  from: string;
  to: string;
  company: string;
  date: string;
  time: string;
  price: number;
  transportType: TransportType;
  badge?: string;
  image: string;
  tagTitle?: string;
  categoryTag?: string;
  regionTag?: string;
  cityCodeFrom?: string;
  cityCodeTo?: string;
  duration?: string;
  vehicleModel?: string;
}

export interface SearchFilterState {
  transportType: TransportType;
  /** Active search tab; undefined means the tab equals transportType (derive with `searchKind ?? transportType`). */
  searchKind?: SearchKind;
  fromCity: string;
  toCity: string;
  /** turna.com URL segments (slugifyTr) set by HeroSection on selection/swap; App falls back to slugifyTr(fromCity). */
  fromSlug?: string;
  toSlug?: string;
  /** Optional IATA code carried for display only. */
  fromCode?: string;
  toCode?: string;
  /** Display only; Turna landing pages are date-agnostic. App initialises it to ''. */
  departureDate: string;
  returnDate?: string;
  /** ISO YYYY-MM-DD chosen in the DayStrip; filters routes by provenance.dateIso. */
  selectedDay?: string;
  passengerCount: number;
  maxPrice: number;
  selectedCompanies: string[];
  departureTimeRange: 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
  onlyDirect: boolean;
  seatTypePreference: 'all' | 'single' | 'window' | 'aisle' | 'table' | 'business' | 'exit_row';
  sortBy: 'cheapest' | 'fastest' | 'earliest' | 'rating';
}

export interface PricingBreakdown {
  baseFare: number;
  seatSurcharges: number;
  luggageFare: number;
  insuranceFare: number;
  discount: number;
  serviceFee: number;
  total: number;
  isCouponApplied: boolean;
}

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  tcNo?: string;
  gender?: 'male' | 'female';
  avatarInitials?: string;
  createdAt?: string;
}

export type AuthMode = 'login' | 'register' | 'forgot_password';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

/**
 * Lifecycle of one live Turna.com search. `routes` in App is derived from the `ok` branch only;
 * every other branch renders its own honest state (see SearchResults).
 */
export type LiveSearchState =
  | { status: 'idle' }
  | { status: 'loading'; query: TurnaQuery; startedAt: number }
  | {
      status: 'ok';
      query: TurnaQuery;
      result: TurnaSuccess;
      /** Adapted flight/bus rows; `[]` for hotel/car, whose offers are read from `result.items`. */
      routes: RouteItem[];
      /** Items rejected by guard/adapter validation (surfaced as "N teklif doğrulanamadı"). */
      droppedItems: number;
      receivedAt: string;
    }
  /** items.length === 0: ferry pages, or a flight/bus page without structured offers. */
  | { status: 'facts-only'; query: TurnaQuery; result: TurnaSuccess; receivedAt: string }
  | { status: 'unsupported'; transportType: 'tren'; reason: string }
  | {
      status: 'error';
      query: TurnaQuery | null;
      httpStatus: number | null;
      errorCode: string;
      message: string;
      retryAfterSeconds?: number;
    };
