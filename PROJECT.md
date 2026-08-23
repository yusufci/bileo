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

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| **M1** | Relational DB Layer & Parameterized Query Engine | DDL schemas, `IDatabaseService`, `PostgresDatabaseService`, `MemoryDatabaseService`, `sql` query builder, `WhereBuilder`, seed data loader, seat concurrency locks (`FOR UPDATE` + OCC) | none | DONE |
| **M2** | Cryptographic Auth, Token Security & Rate Limiting | Bcrypt (work factor 12) hashing, timing attack defense, JWT issuance & verification, `requireAuth` / `requireRole`, `express-rate-limit` handlers (login, register, payment, global), 429 envelopes | M1 | DONE |
| **M3** | Perimeter Defense, Zod Validation, REST API & Privacy | Helmet headers, CORS whitelist, Zod request validation middleware & schemas, KVKK/GDPR masking, PCI-DSS compliance, recursive log sanitizer, Express server & API routes (`auth`, `routes`, `bookings`, `payments`, `health`, `audit_logs`) | M1, M2 | PLANNED |
| **M4** | Security Test Suites & Docker Compose Deployment | Automated security test suite (`src/tests/security_tests.ts`), master test runner integration, `docker-compose.yml` (Postgres 16, `postgres_data` volume, `pg_isready` health check), `.env.example` | M1, M2, M3 | PLANNED |
| **M-Test** | E2E Security Testing Track | Opaque-box E2E test infra (`TEST_INFRA.md`, `TEST_READY.md`), adversarial fuzzing matrix, cross-tier integration | Parallel | PLANNED |
| **M-Final** | Final Verification, Hardening & Forensic Audit | Pass 100% of test suites (375+ tests), `npm run build` zero TS errors, adversarial fuzzing, forensic integrity audit | M1, M2, M3, M4, M-Test | PLANNED |

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
├── tests/                               [Testing Track - M4 / M-Test Owner]
│   ├── security_tests.ts                [Comprehensive Security & Fuzzing Suite]
│   ├── test_runner.ts                   [Master Test Runner]
│   └── ...                              [Existing Test Suites]
├── docker-compose.yml                   [DevOps - M4 Owner]
└── .env.example                         [DevOps - M4 Owner]
```
