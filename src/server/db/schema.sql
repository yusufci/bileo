-- ============================================================================
-- BILEO ENTERPRISE TRANSPORTATION PLATFORM - RELATIONAL DATABASE SCHEMA (3NF)
-- ============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    tc_no_masked VARCHAR(20) NULL,
    tc_no_hash VARCHAR(64) NULL,
    gender VARCHAR(10) NULL CHECK (gender IN ('male', 'female', 'other')),
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'operator', 'auditor')),
    avatar_initials VARCHAR(10) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_tc_hash ON users(tc_no_hash);

-- 2. CARRIERS TABLE
CREATE TABLE IF NOT EXISTS carriers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    transport_type VARCHAR(20) NOT NULL CHECK (transport_type IN ('otobus', 'ucak', 'tren', 'feribot')),
    logo_url TEXT NULL,
    rating NUMERIC(3,2) NOT NULL DEFAULT 4.50 CHECK (rating >= 1.00 AND rating <= 5.00),
    review_count INT NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    support_phone VARCHAR(30) NULL,
    support_email VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_carriers_type ON carriers(transport_type);
CREATE INDEX IF NOT EXISTS idx_carriers_code ON carriers(code);
CREATE INDEX IF NOT EXISTS idx_carriers_active ON carriers(is_active);

-- 3. ROUTES TABLE
CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(64) PRIMARY KEY,
    carrier_id VARCHAR(64) NOT NULL REFERENCES carriers(id) ON DELETE RESTRICT,
    transport_type VARCHAR(20) NOT NULL CHECK (transport_type IN ('otobus', 'ucak', 'tren', 'feribot')),
    origin_city VARCHAR(100) NOT NULL,
    origin_terminal VARCHAR(200) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_terminal VARCHAR(200) NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
    original_price NUMERIC(10,2) NULL CHECK (original_price >= base_price OR original_price IS NULL),
    vehicle_type VARCHAR(150) NOT NULL,
    seat_layout_type VARCHAR(50) NOT NULL CHECK (seat_layout_type IN ('bus_2_1', 'bus_2_2', 'plane_3_3', 'train_2_2', 'train_2_1', 'ferry_deck')),
    service_class VARCHAR(30) NOT NULL DEFAULT 'standard' CHECK (service_class IN ('standard', 'comfort', 'business', 'vip')),
    gate_or_platform VARCHAR(50) NULL,
    badge VARCHAR(50) NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_route_times CHECK (arrival_time > departure_time)
);

CREATE INDEX IF NOT EXISTS idx_routes_search ON routes(origin_city, destination_city, departure_time);
CREATE INDEX IF NOT EXISTS idx_routes_carrier ON routes(carrier_id);
CREATE INDEX IF NOT EXISTS idx_routes_type ON routes(transport_type);
CREATE INDEX IF NOT EXISTS idx_routes_price ON routes(base_price);

-- 4. SEATS TABLE
CREATE TABLE IF NOT EXISTS seats (
    id VARCHAR(128) PRIMARY KEY,
    route_id VARCHAR(64) NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    row_num INT NOT NULL CHECK (row_num >= 1),
    col_num INT NOT NULL CHECK (col_num >= 1),
    tier VARCHAR(30) NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'single', 'business', 'extra_legroom', 'table', 'vip_lounge', 'window', 'aisle', 'exit_row')),
    seat_type VARCHAR(30) NOT NULL DEFAULT 'standard',
    price_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (price_multiplier >= 0.5),
    surcharge NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (surcharge >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'booked', 'blocked', 'disabled')),
    gender_restriction VARCHAR(10) NULL CHECK (gender_restriction IN ('male', 'female', 'none')),
    cabin_class VARCHAR(20) NOT NULL DEFAULT 'economy' CHECK (cabin_class IN ('economy', 'business', 'vip')),
    deck VARCHAR(20) NOT NULL DEFAULT 'main' CHECK (deck IN ('main', 'upper')),
    is_exit_row BOOLEAN NOT NULL DEFAULT false,
    is_table_seat BOOLEAN NOT NULL DEFAULT false,
    facing_direction VARCHAR(20) NOT NULL DEFAULT 'forward' CHECK (facing_direction IN ('forward', 'backward')),
    has_power_socket BOOLEAN NOT NULL DEFAULT true,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_route_seat UNIQUE (route_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_seats_route_status ON seats(route_id, status);
CREATE INDEX IF NOT EXISTS idx_seats_lookup ON seats(route_id, seat_number);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) PRIMARY KEY,
    pnr VARCHAR(10) NOT NULL UNIQUE,
    user_id VARCHAR(64) NULL REFERENCES users(id) ON DELETE SET NULL,
    route_id VARCHAR(64) NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded')),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
    seat_surcharges NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    luggage_surcharges NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    insurance_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    service_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
    promo_code VARCHAR(50) NULL,
    qr_code_token VARCHAR(255) NOT NULL UNIQUE,
    cancellation_reason TEXT NULL,
    cancellation_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    cancelled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON bookings(pnr);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_route ON bookings(route_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_contact_email ON bookings(LOWER(contact_email));
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);

-- 6. TICKETS TABLE
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id VARCHAR(128) NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    seat_number VARCHAR(10) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    id_number_masked VARCHAR(20) NOT NULL,
    id_number_hash VARCHAR(64) NOT NULL,
    is_foreigner BOOLEAN NOT NULL DEFAULT false,
    nationality VARCHAR(10) NOT NULL DEFAULT 'TR',
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'none')),
    birth_date DATE NULL,
    passenger_email VARCHAR(255) NULL,
    passenger_phone VARCHAR(30) NULL,
    luggage_kg INT NOT NULL DEFAULT 20 CHECK (luggage_kg >= 0),
    has_insurance BOOLEAN NOT NULL DEFAULT false,
    ticket_price NUMERIC(10,2) NOT NULL CHECK (ticket_price >= 0),
    ticket_status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (ticket_status IN ('active', 'boarded', 'cancelled', 'refunded')),
    qr_code_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_booking ON tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_seat ON tickets(seat_id);
CREATE INDEX IF NOT EXISTS idx_tickets_id_hash ON tickets(id_number_hash);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(ticket_status);

-- 7. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'fast', 'bkm_express')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    status VARCHAR(30) NOT NULL DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed', 'refunded', 'partially_refunded')),
    card_holder_masked VARCHAR(100) NOT NULL,
    card_bin VARCHAR(6) NOT NULL,
    card_last4 VARCHAR(4) NOT NULL,
    card_brand VARCHAR(30) NOT NULL CHECK (card_brand IN ('visa', 'mastercard', 'troy', 'amex', 'unknown')),
    card_token VARCHAR(255) NULL,
    gateway_transaction_id VARCHAR(100) NOT NULL UNIQUE,
    error_code VARCHAR(50) NULL,
    error_message TEXT NULL,
    refunded_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (refunded_amount >= 0),
    refund_transaction_id VARCHAR(100) NULL,
    refund_reason TEXT NULL,
    refunded_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_tx ON payments(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- 8. SECURITY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARN', 'CRITICAL', 'SECURITY_ALERT')),
    user_id VARCHAR(64) NULL REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    endpoint VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    message TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON security_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_user ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON security_audit_logs(ip_address);

