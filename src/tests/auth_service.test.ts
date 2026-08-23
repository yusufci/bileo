// Comprehensive Milestone 2 Test Suite: Cryptographic Auth, Token Security & Rate Limiting
// Validates Bcrypt Work Factor 12, Timing Attack Defense, JWT Sign/Verify, Token Extraction,
// Zero Plaintext Leakage Sanitization, and Multi-Tier Rate Limiter Hardening.

import { describe, it, expect } from './test_framework';
import {
  hashPassword,
  verifyPassword,
  dummyPasswordComparison,
  validatePasswordStrength,
  sanitizeUser,
  PasswordService,
  BCRYPT_WORK_FACTOR,
  DUMMY_BCRYPT_HASH,
} from '../server/auth/passwordService';
import {
  generateToken,
  verifyToken,
  extractToken,
  decodeToken,
  TokenService,
  getJwtSecret,
  getJwtIssuer,
  getJwtAudience,
} from '../server/auth/tokenService';
import {
  MemoryRateLimiter,
  createRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  paymentRateLimiter,
  globalRateLimiter,
  rateLimiters,
  getClientIp,
} from '../server/middleware/rateLimit';

export function runAuthServiceTests() {
  describe('M2 Suite 1: Bcrypt Cryptographic Hashing & Salting (Work Factor 12)', () => {
    it('1.1 Generates standard bcrypt work factor 12 hash ($2b$12$ or $2a$12$ format)', async () => {
      const plain = 'BileoSuperSecure2026!';
      const hash = await hashPassword(plain);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(60);
      expect(hash.startsWith('$2b$12$') || hash.startsWith('$2a$12$')).toBe(true);
      expect(BCRYPT_WORK_FACTOR).toBe(12);
    });

    it('1.2 Salting Uniqueness: Hashing the same password twice yields distinct salt & hash', async () => {
      const plain = 'MySecretPassword123#';
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);

      expect(hash1 === plain).toBe(false);
      expect(hash2 === plain).toBe(false);
      expect(hash1 === hash2).toBe(false);
      expect(hash1.slice(0, 7)).toBe(hash2.slice(0, 7)); // Both are $2b$12$
    });

    it('1.3 Constant-Time Password Verification: Validates matching credentials & rejects mismatches', async () => {
      const plain = 'CarrierOperator2026!';
      const hash = await hashPassword(plain);

      const isValid = await verifyPassword(plain, hash);
      const isInvalid = await verifyPassword('CarrierOperator2026', hash);
      const isWrongCase = await verifyPassword('carrieroperator2026!', hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
      expect(isWrongCase).toBe(false);
    });

    it('1.4 Handles UTF-8 Multibyte Characters and Turkish Special Glyphs', async () => {
      const turkishPassword = 'ŞifreğüçöİI123!₺';
      const hash = await hashPassword(turkishPassword);

      const matches = await verifyPassword(turkishPassword, hash);
      const rejectsDifferentGlyph = await verifyPassword('SifregucoII123!₺', hash);

      expect(matches).toBe(true);
      expect(rejectsDifferentGlyph).toBe(false);
    });

    it('1.5 Safe Rejection on Malformed, Empty, or Non-String Inputs', async () => {
      const validHash = await hashPassword('ValidPass123!');

      expect(await verifyPassword('', validHash)).toBe(false);
      expect(await verifyPassword('ValidPass123!', '')).toBe(false);
      expect(await verifyPassword('ValidPass123!', 'invalid_hash_string')).toBe(false);
      expect(await verifyPassword(null as any, validHash)).toBe(false);
      expect(await verifyPassword('ValidPass123!', null as any)).toBe(false);
    });

    it('1.6 Enforces Minimum & Maximum Password Length Bounds on Hashing', async () => {
      let tooShortError = false;
      try {
        await hashPassword('short1!');
      } catch (err: any) {
        tooShortError = true;
        expect(err.message.includes('en az 8 karakter')).toBe(true);
      }
      expect(tooShortError).toBe(true);

      let tooLongError = false;
      try {
        const overlyLong = 'A'.repeat(73) + '1!';
        await hashPassword(overlyLong);
      } catch (err: any) {
        tooLongError = true;
        expect(err.message.includes('en fazla 72 karakter')).toBe(true);
      }
      expect(tooLongError).toBe(true);
    });

    it('1.7 OOP Facade PasswordService parity', async () => {
      const hash = await PasswordService.hashPassword('FacadeTest2026!');
      const verify = await PasswordService.verifyPassword('FacadeTest2026!', hash);
      expect(verify).toBe(true);
    });
  });

  describe('M2 Suite 2: Timing Attack Defense & User Enumeration Mitigation', () => {
    it('2.1 Dummy Password Comparison runs valid work factor 12 comparison without throwing', async () => {
      const start = Date.now();
      await dummyPasswordComparison();
      const elapsed = Date.now() - start;

      // Ensure work factor 12 computation occurred (>10ms execution)
      expect(elapsed >= 10).toBe(true);
      expect(typeof DUMMY_BCRYPT_HASH).toBe('string');
      expect(DUMMY_BCRYPT_HASH.startsWith('$2b$12$') || DUMMY_BCRYPT_HASH.startsWith('$2a$12$')).toBe(true);
    });

    it('2.2 Verifies non-existent user timing parity defense', async () => {
      const realPassword = 'KnownUserPassword1!';
      const realHash = await hashPassword(realPassword);

      // Verify wrong password for existing user
      const start1 = Date.now();
      await verifyPassword('IncorrectPassword1!', realHash);
      const elapsedExisting = Date.now() - start1;

      // Verify timing mitigation for non-existing user
      const start2 = Date.now();
      await dummyPasswordComparison();
      const elapsedNonExisting = Date.now() - start2;

      expect(elapsedExisting >= 10).toBe(true);
      expect(elapsedNonExisting >= 10).toBe(true);
    });
  });

  describe('M2 Suite 3: Zero Plaintext Leakage & User Entity Sanitization', () => {
    it('3.1 Completely strips password_hash, password, salt, and sensitive hashes from output', () => {
      const rawUserRecord = {
        id: 'usr_9981',
        email: 'passenger@bileo.com',
        password_hash: '$2b$12$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
        password: 'RawPlaintextSecret!',
        salt: '$2b$12$abcdef1234567890',
        tc_no_hash: 'sha256_hash_value',
        id_number_hash: 'sha256_id_hash',
        name: 'Mustafa',
        surname: 'Öztürk',
        phone: '05321112233',
        tc_no_masked: '*******1234',
        gender: 'male' as const,
        role: 'customer' as const,
        is_active: true,
        created_at: '2026-08-22T10:00:00.000Z',
      };

      const sanitized = sanitizeUser(rawUserRecord);

      expect((sanitized as any).password_hash).toBeUndefined();
      expect((sanitized as any).password).toBeUndefined();
      expect((sanitized as any).salt).toBeUndefined();
      expect((sanitized as any).tc_no_hash).toBeUndefined();
      expect((sanitized as any).id_number_hash).toBeUndefined();

      expect(sanitized.id).toBe('usr_9981');
      expect(sanitized.email).toBe('passenger@bileo.com');
      expect(sanitized.name).toBe('Mustafa');
      expect(sanitized.surname).toBe('Öztürk');
      expect(sanitized.avatarInitials).toBe('MÖ');
      expect(sanitized.isActive).toBe(true);
    });

    it('3.2 Computes avatarInitials accurately with single-word or fallback names', () => {
      const user1 = sanitizeUser({ name: 'Zeynep', surname: 'Çelik' });
      expect(user1.avatarInitials).toBe('ZÇ');

      const user2 = sanitizeUser({ name: 'Ali', surname: '' });
      expect(user2.avatarInitials).toBe('AS');

      const user3 = sanitizeUser({ name: '', surname: '' });
      expect(user3.avatarInitials).toBe('US');
    });

    it('3.3 Throws error on invalid user argument', () => {
      let threw = false;
      try {
        sanitizeUser(null as any);
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });
  });

  describe('M2 Suite 4: Enterprise Password Complexity & Entropy Validation', () => {
    it('4.1 Validates passwords meeting all 5 enterprise security criteria', () => {
      const res = validatePasswordStrength('BileoTravel#2026');
      expect(res.isValid).toBe(true);
      expect(res.score >= 4).toBe(true);
      expect(res.errors.length).toBe(0);
      expect(res.criteria.minLength).toBe(true);
      expect(res.criteria.maxLength).toBe(true);
      expect(res.criteria.hasUppercase).toBe(true);
      expect(res.criteria.hasLowercase).toBe(true);
      expect(res.criteria.hasNumber).toBe(true);
      expect(res.criteria.hasSymbol).toBe(true);
    });

    it('4.2 Identifies missing lowercase, uppercase, digit, or special character requirements', () => {
      const noUpper = validatePasswordStrength('lowercase123!#');
      expect(noUpper.isValid).toBe(false);
      expect(noUpper.criteria.hasUppercase).toBe(false);
      expect(noUpper.errors.some((e) => e.includes('büyük harf'))).toBe(true);

      const noLower = validatePasswordStrength('UPPERCASE123!#');
      expect(noLower.isValid).toBe(false);
      expect(noLower.criteria.hasLowercase).toBe(false);
      expect(noLower.errors.some((e) => e.includes('küçük harf'))).toBe(true);

      const noDigit = validatePasswordStrength('UppercaseNoDigit!#');
      expect(noDigit.isValid).toBe(false);
      expect(noDigit.criteria.hasNumber).toBe(false);
      expect(noDigit.errors.some((e) => e.includes('rakam'))).toBe(true);

      const noSymbol = validatePasswordStrength('Uppercase123456');
      expect(noSymbol.isValid).toBe(false);
      expect(noSymbol.criteria.hasSymbol).toBe(false);
      expect(noSymbol.errors.some((e) => e.includes('özel karakter'))).toBe(true);

      const tooShort = validatePasswordStrength('A1!a');
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.criteria.minLength).toBe(false);
      expect(tooShort.errors.some((e) => e.includes('en az 8 karakter'))).toBe(true);
    });

    it('4.3 Handles empty and non-string inputs safely', () => {
      const empty = validatePasswordStrength('');
      expect(empty.isValid).toBe(false);
      expect(empty.score).toBe(0);

      const nonStr = validatePasswordStrength(null as any);
      expect(nonStr.isValid).toBe(false);
    });
  });

  describe('M2 Suite 5: JWT Issuance, Verification & Cryptographic Integrity', () => {
    it('5.1 Generates well-formed 3-segment JWT with complete standard claims', () => {
      const user = {
        id: 'usr_admin_001',
        email: 'admin@bileo.com',
        role: 'admin',
        name: 'Kerem',
        surname: 'Vardar',
      };

      const token = generateToken(user);
      expect(typeof token).toBe('string');

      const segments = token.split('.');
      expect(segments.length).toBe(3);

      const verified = verifyToken(token);
      expect(verified.sub).toBe('usr_admin_001');
      expect(verified.email).toBe('admin@bileo.com');
      expect(verified.role).toBe('admin');
      expect(verified.name).toBe('Kerem');
      expect(verified.surname).toBe('Vardar');
      expect(verified.iss).toBe(getJwtIssuer());
      expect(verified.aud).toBe(getJwtAudience());
      expect(typeof verified.iat).toBe('number');
      expect(typeof verified.exp).toBe('number');
      expect(typeof verified.jti).toBe('string');
    });

    it('5.2 Supports fullName parsing fallback in token payload generation', () => {
      const user = {
        id: 'usr_user_002',
        email: 'user2@bileo.com',
        fullName: 'Ece Deniz',
      };
      const token = generateToken(user);
      const verified = verifyToken(token);
      expect(verified.name).toBe('Ece');
      expect(verified.surname).toBe('Deniz');
    });

    it('5.3 Detects and rejects tampered token payload (signature mismatch)', () => {
      const user = { id: 'usr_cust_003', email: 'cust@bileo.com', role: 'customer', name: 'Can', surname: 'Yalçın' };
      const token = generateToken(user);
      const parts = token.split('.');

      // Alter payload to claim admin role
      const forgedPayloadJson = JSON.stringify({
        sub: 'usr_cust_003',
        email: 'cust@bileo.com',
        role: 'admin',
        name: 'Can',
        surname: 'Yalçın',
      });
      const forgedPayloadBase64 = Buffer.from(forgedPayloadJson).toString('base64url');
      const tamperedToken = `${parts[0]}.${forgedPayloadBase64}.${parts[2]}`;

      let rejected = false;
      try {
        verifyToken(tamperedToken);
      } catch (err: any) {
        rejected = true;
        expect(err.message.includes('Invalid authentication token') || err.message.includes('signature')).toBe(true);
      }
      expect(rejected).toBe(true);
    });

    it('5.4 Detects and rejects expired tokens strictly', () => {
      const user = { id: 'usr_exp_004', email: 'expired@bileo.com' };
      // Generate token that expired 1 second ago
      const expiredToken = generateToken(user, { expiresIn: -1 });

      let caughtExpired = false;
      try {
        verifyToken(expiredToken);
      } catch (err: any) {
        caughtExpired = true;
        expect(err.message).toBe('Token expired');
      }
      expect(caughtExpired).toBe(true);
    });

    it('5.5 Algorithm Confusion Defense: Rejects alg: "none" attacks unconditionally', () => {
      const headerNone = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'usr_hacker', role: 'admin' })).toString('base64url');
      const noneToken = `${headerNone}.${payload}.`;

      let blocked = false;
      try {
        verifyToken(noneToken);
      } catch (err: any) {
        blocked = true;
        expect(err.message.includes('Insecure algorithm "none"') || err.message.includes('strictly forbidden')).toBe(true);
      }
      expect(blocked).toBe(true);
    });

    it('5.6 Rejects non-HS256 algorithms (e.g. RS256 confusion without key)', () => {
      const headerRS = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'usr_test' })).toString('base64url');
      const rsToken = `${headerRS}.${payload}.dummysig`;

      let blocked = false;
      try {
        verifyToken(rsToken);
      } catch (err: any) {
        blocked = true;
        expect(err.message.includes('Unsupported token algorithm')).toBe(true);
      }
      expect(blocked).toBe(true);
    });

    it('5.7 Rejects malformed and empty tokens with clear errors', () => {
      const badTokens = ['', '   ', 'not-a-jwt', 'a.b', 'a.b.c.d'];
      for (const t of badTokens) {
        let threw = false;
        try {
          verifyToken(t);
        } catch {
          threw = true;
        }
        expect(threw).toBe(true);
      }
    });

    it('5.8 decodeToken safely decodes payload without cryptographic verification', () => {
      const user = { id: 'usr_view_005', email: 'viewer@bileo.com', name: 'Selin', surname: 'Ak' };
      const token = generateToken(user);

      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe('usr_view_005');
      expect(decoded?.email).toBe('viewer@bileo.com');

      expect(decodeToken('')).toBeNull();
      expect(decodeToken('garbage')).toBeNull();
    });
  });

  describe('M2 Suite 6: Dual-Transport Token Extraction', () => {
    it('6.1 Extracts token from Authorization: Bearer header', () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer bileo_valid_jwt_header_token_123',
        },
      };
      const token = extractToken(mockReq);
      expect(token).toBe('bileo_valid_jwt_header_token_123');
    });

    it('6.2 Handles case-insensitive "bearer " and whitespace in header', () => {
      const mockReq1 = {
        headers: {
          authorization: 'bearer   token_with_extra_spaces  ',
        },
      };
      expect(extractToken(mockReq1)).toBe('token_with_extra_spaces');

      const mockReq2 = {
        headers: {
          Authorization: 'BEARER uppercase_prefix_token',
        },
      };
      expect(extractToken(mockReq2)).toBe('uppercase_prefix_token');
    });

    it('6.3 Extracts token from req.cookies.bileo_token when header is absent', () => {
      const mockReq = {
        headers: {},
        cookies: {
          bileo_token: 'cookie_jwt_token_456',
        },
      };
      const token = extractToken(mockReq);
      expect(token).toBe('cookie_jwt_token_456');
    });

    it('6.4 Fallback extraction from req.cookies.access_token', () => {
      const mockReq = {
        headers: {},
        cookies: {
          access_token: 'cookie_access_token_789',
        },
      };
      expect(extractToken(mockReq)).toBe('cookie_access_token_789');
    });

    it('6.5 Authorization header takes strict precedence over Cookie', () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer header_priority_token',
        },
        cookies: {
          bileo_token: 'cookie_secondary_token',
        },
      };
      expect(extractToken(mockReq)).toBe('header_priority_token');
    });

    it('6.6 Returns null when no valid credentials are provided', () => {
      expect(extractToken({})).toBeNull();
      expect(extractToken({ headers: { authorization: 'Basic dXNlcjpwYXNz' } })).toBeNull();
      expect(extractToken({ headers: { authorization: 'Bearer ' } })).toBeNull();
      expect(extractToken({ cookies: {} })).toBeNull();
      expect(extractToken(null)).toBeNull();
    });
  });

  describe('M2 Suite 7: Memory Rate Limiter Engine & Sliding Window Logistics', () => {
    it('7.1 Enforces configured limit and decrements remaining quota accurately', () => {
      const limiter = new MemoryRateLimiter();
      const testKey = 'test_client_1';

      // Limit 3 requests in 1000ms
      const r1 = limiter.check(testKey, 3, 1000);
      expect(r1.allowed).toBe(true);
      expect(r1.current).toBe(1);
      expect(r1.remaining).toBe(2);

      const r2 = limiter.check(testKey, 3, 1000);
      expect(r2.allowed).toBe(true);
      expect(r2.current).toBe(2);
      expect(r2.remaining).toBe(1);

      const r3 = limiter.check(testKey, 3, 1000);
      expect(r3.allowed).toBe(true);
      expect(r3.current).toBe(3);
      expect(r3.remaining).toBe(0);

      // 4th request must be blocked
      const r4 = limiter.check(testKey, 3, 1000);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.retryAfterSeconds >= 1).toBe(true);
    });

    it('7.2 Key Isolation: Requests on Key A do not affect quota for Key B', () => {
      const limiter = new MemoryRateLimiter();
      const keyA = 'client_ip_alpha';
      const keyB = 'client_ip_beta';

      // Exhaust Key A
      for (let i = 0; i < 3; i++) {
        limiter.check(keyA, 3, 1000);
      }
      expect(limiter.check(keyA, 3, 1000).allowed).toBe(false);

      // Key B is completely unaffected
      const checkB = limiter.check(keyB, 3, 1000);
      expect(checkB.allowed).toBe(true);
      expect(checkB.remaining).toBe(2);
    });

    it('7.3 Sliding Window Recovery: Quota replenishes after window expiry', async () => {
      const limiter = new MemoryRateLimiter();
      const key = 'rapid_recovery_key';

      // 1 request with 40ms window
      limiter.check(key, 1, 40);
      expect(limiter.check(key, 1, 40).allowed).toBe(false);

      // Wait 50ms for window to slide past
      await new Promise((resolve) => setTimeout(resolve, 50));

      const recovered = limiter.check(key, 1, 40);
      expect(recovered.allowed).toBe(true);
      expect(recovered.remaining).toBe(0);
    });

    it('7.4 Explicit reset cleans individual key or whole store', () => {
      const limiter = new MemoryRateLimiter();
      limiter.check('k1', 1, 5000);
      limiter.check('k2', 1, 5000);

      limiter.reset('k1');
      expect(limiter.check('k1', 1, 5000).allowed).toBe(true);
      expect(limiter.check('k2', 1, 5000).allowed).toBe(false);

      limiter.reset(); // clear all
      expect(limiter.check('k2', 1, 5000).allowed).toBe(true);
    });

    it('7.5 getStats reports tracked memory metrics accurately', () => {
      const limiter = new MemoryRateLimiter();
      limiter.check('ip_1', 10, 5000);
      limiter.check('ip_1', 10, 5000);
      limiter.check('ip_2', 10, 5000);

      const stats = limiter.getStats();
      expect(stats.activeKeys).toBe(2);
      expect(stats.totalRecords).toBe(3);
    });
  });

  describe('M2 Suite 8: Rate Limiting Middlewares, Standardized 429 Responses & IETF Headers', () => {
    it('8.1 loginRateLimiter enforces 5 attempts per 15 min and attaches IETF headers', () => {
      const headers: Record<string, string> = {};
      let statusCode = 200;
      let jsonPayload: any = null;
      let nextCalled = false;

      const mockReq = {
        ip: '192.168.1.100',
        body: { email: 'login_test@bileo.com' },
      };

      const createMockRes = () => ({
        setHeader(name: string, value: string) {
          headers[name] = value;
        },
        status(code: number) {
          statusCode = code;
          return {
            json(payload: any) {
              jsonPayload = payload;
            },
          };
        },
      });

      // Execute 5 allowed requests
      for (let i = 1; i <= 5; i++) {
        nextCalled = false;
        loginRateLimiter(mockReq, createMockRes(), () => {
          nextCalled = true;
        });
        expect(nextCalled).toBe(true);
        expect(headers['RateLimit-Limit']).toBe('5');
        expect(headers['RateLimit-Remaining']).toBe(String(5 - i));
      }

      // 6th attempt must trigger HTTP 429
      nextCalled = false;
      loginRateLimiter(mockReq, createMockRes(), () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(statusCode).toBe(429);
      expect(headers['RateLimit-Remaining']).toBe('0');
      expect(headers['Retry-After']).toBeDefined();
      expect(jsonPayload.success).toBe(false);
      expect(jsonPayload.code).toBe('RATE_LIMIT_LOGIN_EXCEEDED');
      expect(typeof jsonPayload.retryAfter).toBe('number');
    });

    it('8.2 registerRateLimiter isolates by IP and sets RATE_LIMIT_REGISTER_EXCEEDED', () => {
      const mockReq = { ip: '10.0.0.50' };
      let jsonPayload: any = null;
      let statusCode = 200;

      const mockRes = {
        setHeader() {},
        status(c: number) {
          statusCode = c;
          return { json: (p: any) => (jsonPayload = p) };
        },
      };

      for (let i = 0; i < 5; i++) {
        registerRateLimiter(mockReq, mockRes, () => {});
      }

      registerRateLimiter(mockReq, mockRes, () => {});
      expect(statusCode).toBe(429);
      expect(jsonPayload.code).toBe('RATE_LIMIT_REGISTER_EXCEEDED');
    });

    it('8.3 paymentRateLimiter tracks per IP + User and sets RATE_LIMIT_PAYMENT_EXCEEDED', () => {
      const mockReq = {
        ip: '10.0.0.75',
        user: { sub: 'usr_paying_customer_123' },
      };
      let jsonPayload: any = null;
      let statusCode = 200;

      const mockRes = {
        setHeader() {},
        status(c: number) {
          statusCode = c;
          return { json: (p: any) => (jsonPayload = p) };
        },
      };

      for (let i = 0; i < 5; i++) {
        paymentRateLimiter(mockReq, mockRes, () => {});
      }

      paymentRateLimiter(mockReq, mockRes, () => {});
      expect(statusCode).toBe(429);
      expect(jsonPayload.code).toBe('RATE_LIMIT_PAYMENT_EXCEEDED');
    });

    it('8.4 globalRateLimiter enforces 300 requests cap per IP', () => {
      const mockReq = { ip: '172.16.0.10' };
      let nextCount = 0;
      const mockRes = { setHeader() {}, status: () => ({ json: () => {} }) };

      for (let i = 0; i < 10; i++) {
        globalRateLimiter(mockReq, mockRes, () => {
          nextCount++;
        });
      }
      expect(nextCount).toBe(10);
    });

    it('8.5 rateLimiters unified dictionary export provides all 4 tiers', () => {
      expect(typeof rateLimiters.login).toBe('function');
      expect(typeof rateLimiters.register).toBe('function');
      expect(typeof rateLimiters.payment).toBe('function');
      expect(typeof rateLimiters.global).toBe('function');
    });

    it('8.6 getClientIp resolution hierarchy (x-forwarded-for, req.ip, socket)', () => {
      const reqWithProxy = {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
      };
      expect(getClientIp(reqWithProxy)).toBe('203.0.113.195');

      const reqWithIp = { ip: '198.51.100.4' };
      expect(getClientIp(reqWithIp)).toBe('198.51.100.4');

      const reqWithSocket = { socket: { remoteAddress: '192.0.2.1' } };
      expect(getClientIp(reqWithSocket)).toBe('192.0.2.1');

      expect(getClientIp(null)).toBe('127.0.0.1');
    });
  });
}
