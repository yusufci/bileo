# E2E Test Infra: Bileo Transportation Ticketing Platform

## 1. Test Philosophy & Architecture
- **Philosophy**: Opaque-box, requirement-driven, zero-regression verification. Tests exercise the platform strictly through public API boundaries, schemas, database interfaces, and security perimeters.
- **Methodology**: Systematic 4-tier testing (Category-Partition, Boundary Value Analysis, Pairwise Combinatorial Testing, Real-World Workloads) plus dedicated Enterprise Security & Fuzzing Suites.
- **Harness & Runner**: Zero external test runner dependencies. Uses in-house `test_framework.ts` executed via `tsx src/tests/test_runner.ts`. High-precision microsecond execution profiling and colorized TAP/ANSI summaries.

```
                                      [ MASTER TEST RUNNER ]
                                     (src/tests/test_runner.ts)
                                                 │
       ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
       ▼                                         ▼                                         ▼
 [ Tiers 1-4 Feature Tests ]           [ Security Test Suites ]                  [ Specialized Stress Tests ]
 ├── Tier 1: Feature Coverage (60+)    ├── Suite 1: SQLi Fuzzing (8)             ├── Adversarial OCC Locks (12)
 ├── Tier 2: Boundary & Corner (60+)   ├── Suite 2: XSS Sanitization (6)         ├── Multithread Simulation (8)
 ├── Tier 3: Pairwise Combos (40+)     ├── Suite 3: Rate Limiting 429 (6)        └── Icon System Matrices (24)
 └── Tier 4: E2E Scenarios (8)         ├── Suite 4: JWT Cryptography (8)
                                       ├── Suite 5: Bcrypt Hashing (6)
                                       └── Suite 6: Zod Perimeter (8)
```

---

## 2. Comprehensive Feature Inventory & Test Mapping (43 Features)

| # | Feature | Requirement Source | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Security Suite |
|---|---------|-------------------|:------:|:------:|:------:|:------:|:--------------:|
| 1 | Relational Schema DDL (3NF, 8 tables) | ORIGINAL_REQUEST §R1 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 1 |
| 2 | Dual-Mode DB Engine (Postgres + Memory) | ORIGINAL_REQUEST §R1 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 1 |
| 3 | DB Connection Pooling & Healthchecks | ORIGINAL_REQUEST §R1 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 1 |
| 4 | Transaction Isolation (Atomic rollback) | ORIGINAL_REQUEST §R1 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 1 |
| 5 | Concurrency Control (OCC + Row Locks) | ORIGINAL_REQUEST §R1 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 1, OCC Stress |
| 6 | Seed Data Loader (Mock routes/seats) | ORIGINAL_REQUEST §R1 | ✓ (5) | ✓ (5) | ✓ | ✓ | Tier 1-4 |
| 7 | Parameterized Tagged SQL (`sql` literal) | ORIGINAL_REQUEST §R2 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 1 (SQLi) |
| 8 | Dynamic Query Builder (`WhereBuilder`) | ORIGINAL_REQUEST §R2 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 1 (SQLi) |
| 9 | Identifier Whitelist (Column/table guard) | ORIGINAL_REQUEST §R2 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 1 (SQLi) |
| 10 | Bcrypt Password Hashing (Work factor 12) | ORIGINAL_REQUEST §R3 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 5 (Bcrypt) |
| 11 | Constant-Time Auth (Timing attack defense) | ORIGINAL_REQUEST §R3 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 5 (Bcrypt) |
| 12 | JWT Issuance & Cryptographic Signing | ORIGINAL_REQUEST §R3 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 4 (JWT) |
| 13 | Dual-Transport Tokens (Bearer & Cookie) | ORIGINAL_REQUEST §R3 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 4 (JWT) |
| 14 | Auth Middlewares (`requireAuth`, `requireRole`) | ORIGINAL_REQUEST §R3 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 4 (JWT) |
| 15 | Login Rate Limiter (Brute-force defense) | ORIGINAL_REQUEST §R3 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 3 (429) |
| 16 | Register Rate Limiter (Bot registration) | ORIGINAL_REQUEST §R3 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 3 (429) |
| 17 | Payment Rate Limiter (Card testing defense) | ORIGINAL_REQUEST §R3 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 3 (429) |
| 18 | Global Rate Limiter (DoS perimeter) | ORIGINAL_REQUEST §R3 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 3 (429) |
| 19 | Standardized 429 Format & Retry Headers | ORIGINAL_REQUEST §R3 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 3 (429) |
| 20 | Helmet HTTP Security Headers (CSP, HSTS) | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 2 (XSS/Headers) |
| 21 | Restrictive CORS Whitelisting | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 2 (XSS/Headers) |
| 22 | Zod Universal Request Validation | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 6 (Zod) |
| 23 | Structured 400 Bad Request Envelopes | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 6 (Zod) |
| 24 | Auth & Profile Validation Schemas | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 6 (Zod) |
| 25 | Multimodal Route Search & Filter Schemas | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 6 (Zod) |
| 26 | Passenger & TCKN / Passport Schemas | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 6 (Zod) |
| 27 | Payment & Luhn Modulo-10 Schemas | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 6 (Zod) |
| 28 | Express Server & App Middleware Mounting | ORIGINAL_REQUEST §R1-R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Tier 4 E2E |
| 29 | REST API Endpoints (Auth, Routes, Bookings) | ORIGINAL_REQUEST §R1-R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Tier 4 E2E |
| 30 | KVKK/GDPR Personal Data Masking | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 2 & 5 |
| 31 | PCI-DSS Card Masking & Zero CVV Storage | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 5 (Bcrypt/PCI) |
| 32 | Recursive Deep Log Sanitizer | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 5 (Bcrypt/PCI) |
| 33 | Global Error Redaction (No stack leakage) | ORIGINAL_REQUEST §R4 | ✓ (5) | ✓ (5) | ✓ | ✓ | Suite 6 (Zod/Errors) |
| 34 | SQLi Fuzzing Test Suite | ORIGINAL_REQUEST §R5 | ✓ | ✓ | ✓ | ✓ | Suite 1 (8 tests) |
| 35 | XSS & Sanitization Test Suite | ORIGINAL_REQUEST §R5 | ✓ | ✓ | ✓ | ✓ | Suite 2 (6 tests) |
| 36 | Rate Limit Trigger Test Suite | ORIGINAL_REQUEST §R5 | ✓ | ✓ | ✓ | ✓ | Suite 3 (6 tests) |
| 37 | JWT Security & Claims Test Suite | ORIGINAL_REQUEST §R5 | ✓ | ✓ | ✓ | ✓ | Suite 4 (8 tests) |
| 38 | Bcrypt Verification Test Suite | ORIGINAL_REQUEST §R5 | ✓ | ✓ | ✓ | ✓ | Suite 5 (6 tests) |
| 39 | Zod Validation Test Suite | ORIGINAL_REQUEST §R5 | ✓ | ✓ | ✓ | ✓ | Suite 6 (8 tests) |
| 40 | Production Docker Compose Configuration | ORIGINAL_REQUEST §R5 | ✓ | ✓ | ✓ | ✓ | Infra Validation |
| 41 | Environment Configuration Parser | ORIGINAL_REQUEST §R5 | ✓ | ✓ | ✓ | ✓ | Infra Validation |
| 42 | Full E2E Security Pass (100% test pass) | Acceptance Criteria | ✓ | ✓ | ✓ | ✓ | Master Runner |
| 43 | Forensic Integrity Audit (Zero fake logic) | Acceptance Criteria | ✓ | ✓ | ✓ | ✓ | Forensic Audit |

---

## 3. Test Suites Structure & Breakdown

### Tier 1: Feature Coverage (Isolation Testing)
- **Objective**: Verify individual units, functions, and services in isolation under standard happy-path conditions.
- **Files**: `src/tests/tier1_features.test.ts`, `src/tests/auth_gatekeeping.test.ts`.

### Tier 2: Boundary & Corner Cases (Edge Testing)
- **Objective**: Stress boundary conditions, extreme values, empty inputs, maximum payload limits, invalid dates, and Turkish locale character handling.
- **Files**: `src/tests/tier2_boundaries.test.ts`.

### Tier 3: Cross-Feature Combinations (Pairwise Testing)
- **Objective**: Verify interactions between interdependent subsystems:
  - Auth + Booking (Authorized vs. Guest checkouts)
  - Search + Seat Selection + Pricing discounts
  - OCC Seat Locking + Payment Processing + Atomic Ticket Issuance
- **Files**: `src/tests/tier3_interactions.test.ts`.

### Tier 4: Real-World Application Scenarios (E2E Workflows)
- **Objective**: Full end-to-end simulated user journeys:
  - Scenario 1: Complete Multimodal Round-Trip Booking (Bus + Ferry)
  - Scenario 2: High-Speed Train VIP Seat Booking with TCKN Validation & Discount
  - Scenario 3: Flight Booking with Passport Validation, Dynamic Baggage, and Payment
  - Scenario 4: Guest Checkout with Automatic User Registration
  - Scenario 5: Booking Cancellation, Seat Release, and Prorated Refund Calculation
  - Scenario 6: High-Concurrency Race Condition on Last Remaining Seat
  - Scenario 7: Session Expiry, Token Renewal, and Resumed Checkout
  - Scenario 8: Multimodal Disruption & Alternative Route Re-routing
- **Files**: `src/tests/tier4_scenarios.test.ts`, `src/tests/e2e_user_journeys.test.ts`.

### Security Test Suites (`src/tests/security_tests.ts`)
- **Suite 1: SQL Injection (SQLi) Defense & Parameterization Fuzzing (8 tests)**
  - 1.1 Classic Tautology / Boolean Bypass (`' OR '1'='1`)
  - 1.2 Stacked / Piggybacked Queries (`'; DROP TABLE users; --`)
  - 1.3 Union-Based Information Extraction (`' UNION SELECT id, password_hash FROM users --`)
  - 1.4 Time-Based Blind Injection (`1; SELECT pg_sleep(5)--`)
  - 1.5 Identifier Whitelist Defense (Blocks column/table injection)
  - 1.6 Search Filter Fuzzing (Multimodal origin/destination fuzzing vectors)
  - 1.7 PNR Lookup Vector Neutralization
  - 1.8 Seat Map Concurrency Parameterization Invariant
- **Suite 2: Cross-Site Scripting (XSS) & HTML Sanitization (6 tests)**
  - 2.1 Stored XSS Script Tag Escaping (`<script>alert("XSS")</script>`)
  - 2.2 DOM Event Handler Injection Neutralization (`<img src=x onerror=...>`)
  - 2.3 Pseudo-Protocol Injection Defense (`javascript:`, `data:`, `vbscript:`)
  - 2.4 Passenger Name & Note Sanitization (Preserves Turkish Unicode `ğ, ü, ş, ı, ö, ç`)
  - 2.5 Attribute Breaking Vector Neutralization
  - 2.6 SVG Vector Script Injection Escaping (`<svg onload=...>`)
- **Suite 3: Rate Limiter Trigger & Brute-Force Defense (HTTP 429) (6 tests)**
  - 3.1 Auth Login Rate Limit: 5 attempts threshold breach returns HTTP 429
  - 3.2 Registration Rate Limit: 3 attempts threshold breach returns HTTP 429
  - 3.3 Payment / Checkout Rate Limit: 10 requests threshold breach returns HTTP 429
  - 3.4 IP Isolation: Rate limiting Client A does not block Client B
  - 3.5 Rate Limit Window Reset: Automatic reset after window expiry
  - 3.6 Header Verification: Conforms to IETF `RateLimit-Limit`, `Remaining`, `Reset`, `Retry-After`
- **Suite 4: Cryptographic Authentication & JWT Token Security (8 tests)**
  - 4.1 Valid JWT Flow: Signs and verifies token with standard claims (`sub`, `email`, `role`)
  - 4.2 Tampered Signature Rejection: 1-byte modification returns invalid signature
  - 4.3 Expired Token Rejection: Token created in the past returns Token expired
  - 4.4 Algorithm Confusion Attack: Rejects token with `alg: "none"`
  - 4.5 Malformed Authorization Header: Rejects missing/malformed Bearer header
  - 4.6 Wrong Secret Key Rejection: Signing with secret A and verifying with secret B fails
  - 4.7 Role-Based Access Control Gatekeeper: Distinguishes Customer vs. Operator vs. Admin vs. Auditor
  - 4.8 Token Expiry Bounds: Enforces strict TTL limits
- **Suite 5: Cryptographic Password Hashing (Bcrypt) & Privacy (6 tests)**
  - 5.1 Work Factor 12 Format: Hash contains `$2a$12$` or `$2b$12$`
  - 5.2 Salt Uniqueness: Identical passwords produce distinct random salts
  - 5.3 Zero Plaintext Password Leakage: Sanitizes password fields in responses
  - 5.4 Password Complexity Enforcement: Min 8 chars, uppercase, lowercase, number, symbol
  - 5.5 Constant-Time Buffer Comparison: Protects against timing attacks
  - 5.6 Raw Password & Card Sanitization in Logs: Deep redaction of credentials
- **Suite 6: Zod Schema Perimeter Validation & Structured 400 Errors (8 tests)**
  - 6.1 Missing Required Fields: Returns structured 400 with missing field details
  - 6.2 Data Type Mismatch: Rejects string in numeric fields
  - 6.3 Algorithmic TCKN Validation: Rejects invalid 11-digit checksums
  - 6.4 Passport Format Validation: Enforces alphanumeric passport regex
  - 6.5 Email Format & Length Constraints: Validates RFC-compliant email formats
  - 6.6 Luhn Credit Card Validation: Enforces modulo-10 algorithm
  - 6.7 Unknown Property Stripping: Strips prototype pollution vectors
  - 6.8 Standardized Structured 400 Response Format: Conforms to `{ success: false, error: ..., details: [...] }`

---

## 4. Execution Commands & Verification Pass Criteria

- **Command**: `npm test` (`npx tsx src/tests/test_runner.ts`)
- **Expected Outcome**:
  - 100% Pass Rate across all registered test suites (375+ total tests).
  - 0 Failed Tests.
  - Duration < 3.0 seconds.
  - Exit code `0`.
- **Production Build Verification**:
  - Command: `npm run build` (`tsc && vite build`)
  - Expected Outcome: 0 TypeScript errors, successful bundle generation.
