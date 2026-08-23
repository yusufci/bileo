// Database Types and Contracts for Bileo Transportation Ticketing Platform
// Defines standard row schemas, interfaces for query execution, transactions, and dual-mode services.

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

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean | object;
  useMemoryDb?: boolean;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  surname: string;
  phone: string;
  tc_no_masked: string | null;
  tc_no_hash: string | null;
  gender: 'male' | 'female' | 'other' | null;
  role: 'customer' | 'admin' | 'operator' | 'auditor';
  avatar_initials: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarrierRow {
  id: string;
  name: string;
  code: string;
  transport_type: 'otobus' | 'ucak' | 'tren' | 'feribot';
  logo_url: string | null;
  rating: number;
  review_count: number;
  support_phone: string | null;
  support_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouteRow {
  id: string;
  carrier_id: string;
  transport_type: 'otobus' | 'ucak' | 'tren' | 'feribot';
  origin_city: string;
  origin_terminal: string;
  destination_city: string;
  destination_terminal: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  base_price: number;
  original_price: number | null;
  vehicle_type: string;
  seat_layout_type: 'bus_2_1' | 'bus_2_2' | 'plane_3_3' | 'train_2_2' | 'train_2_1' | 'ferry_deck';
  service_class: 'standard' | 'comfort' | 'business' | 'vip';
  gate_or_platform: string | null;
  badge: string | null;
  features: string | any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeatRow {
  id: string;
  route_id: string;
  seat_number: string;
  row_num: number;
  col_num: number;
  tier: 'standard' | 'single' | 'business' | 'extra_legroom' | 'table' | 'vip_lounge' | 'window' | 'aisle' | 'exit_row';
  seat_type: string;
  price_multiplier: number;
  surcharge: number;
  status: 'available' | 'reserved' | 'booked' | 'blocked' | 'disabled';
  gender_restriction: 'male' | 'female' | 'none' | null;
  cabin_class: 'economy' | 'business' | 'vip';
  deck: 'main' | 'upper';
  is_exit_row: boolean;
  is_table_seat: boolean;
  facing_direction: 'forward' | 'backward';
  has_power_socket: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface BookingRow {
  id: string;
  pnr: string;
  user_id: string | null;
  route_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  contact_email: string;
  contact_phone: string;
  base_price: number;
  seat_surcharges: number;
  luggage_surcharges: number;
  insurance_fee: number;
  service_fee: number;
  discount_amount: number;
  total_price: number;
  promo_code: string | null;
  qr_code_token: string;
  cancellation_reason: string | null;
  cancellation_fee: number;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketRow {
  id: string;
  booking_id: string;
  seat_id: string;
  seat_number: string;
  first_name: string;
  last_name: string;
  id_number_masked: string;
  id_number_hash: string;
  is_foreigner: boolean;
  nationality: string;
  gender: 'male' | 'female' | 'none';
  birth_date: string | null;
  passenger_email: string | null;
  passenger_phone: string | null;
  luggage_kg: number;
  has_insurance: boolean;
  ticket_price: number;
  ticket_status: 'active' | 'boarded' | 'cancelled' | 'refunded';
  qr_code_value: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  booking_id: string;
  payment_method: 'credit_card' | 'debit_card' | 'fast' | 'bkm_express';
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded' | 'partially_refunded';
  card_holder_masked: string;
  card_bin: string;
  card_last4: string;
  card_brand: 'visa' | 'mastercard' | 'troy' | 'amex' | 'unknown';
  card_token: string | null;
  gateway_transaction_id: string;
  error_code: string | null;
  error_message: string | null;
  refunded_amount: number;
  refund_transaction_id: string | null;
  refund_reason: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityAuditLogRow {
  id: string;
  timestamp: string;
  event_type: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL' | 'SECURITY_ALERT';
  user_id: string | null;
  ip_address: string;
  user_agent: string | null;
  endpoint: string;
  http_method: string;
  status_code: number;
  metadata: string | Record<string, any>;
  message: string;
}
