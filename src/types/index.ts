// Bileo Ultra-Premium Multi-Modal Transportation Platform
// Domain Type Definitions & Interface Contracts

export type TransportType = 'otobus' | 'ucak' | 'tren' | 'feribot';
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
  duration: string;
  date: string;
  price: number;
  originalPrice?: number;
  company: string;
  companyLogo?: string;
  transportType: TransportType;
  vehicleType: string;
  availableSeats: number;
  rating: number;
  reviewCount: number;
  features: string[];
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
  fromCity: string;
  toCity: string;
  departureDate: string;
  returnDate?: string;
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
