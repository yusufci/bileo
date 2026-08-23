// Empirical Challenger 2 Test Suite for Milestone 2 (M2)
// Deep Stress-Testing: JWT Cryptographic Subsystem, Tampered Signatures, alg: "none" Attacks,
// Malformed Bearer Headers, Rate Limiter Burst Traffic (>5 -> 429), Retry-After Headers, and IP Isolation.

import { describe, it, expect } from './test_framework';
import {
  generateToken,
  verifyToken,
  extractToken,
  decodeToken,
  getJwtSecret,
  getJwtIssuer,
  getJwtAudience,
  TokenService,
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

export function runChallengerM2_2EmpiricalTests() {
  describe('Challenger M2.2 Suite 1: JWT Cryptographic Integrity, Tampering, alg: "none" & Header Robustness', () => {
    it('1.1 Tampered Signature Rejection: Any bit-flip or modification in signature segment invalidates token', () => {
      const validToken = generateToken({
        id: 'usr_challenger_001',
        email: 'challenger@bileo.com',
        role: 'customer',
        name: 'Adversary',
        surname: 'Tester',
      });

      const parts = validToken.split('.');
      expect(parts.length).toBe(3);

      // Bit-flip / mutate last character of signature
      const sig = parts[2];
      const corruptedSig = sig.slice(0, -1) + (sig.endsWith('a') ? 'b' : 'a');
      const tamperedToken = `${parts[0]}.${parts[1]}.${corruptedSig}`;

      let rejected = false;
      try {
        verifyToken(tamperedToken);
      } catch (err: any) {
        rejected = true;
        expect(err.message.includes('Invalid authentication token') || err.message.includes('signature')).toBe(true);
      }
      expect(rejected).toBe(true);
    });

    it('1.2 Tampered Payload Rejection: Modifying claims without valid signature throws signature error', () => {
      const validToken = generateToken({
        id: 'usr_customer_normal',
        email: 'normal@bileo.com',
        role: 'customer',
        name: 'Normal',
        surname: 'User',
      });

      const parts = validToken.split('.');
      const rawPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      rawPayload.role = 'admin';
      rawPayload.sub = 'usr_admin_root';
      const hostilePayloadB64 = Buffer.from(JSON.stringify(rawPayload)).toString('base64url');
      const forgedToken = `${parts[0]}.${hostilePayloadB64}.${parts[2]}`;

      let rejected = false;
      try {
        verifyToken(forgedToken);
      } catch (err: any) {
        rejected = true;
        expect(err.message.includes('Invalid authentication token') || err.message.includes('signature')).toBe(true);
      }
      expect(rejected).toBe(true);
    });

    it('1.3 Strict Expiration Rejection: Expired tokens fail with exact "Token expired" message', () => {
      const expiredTokens = [
        generateToken({ id: 'u1', email: 'e1@b.com' }, { expiresIn: -1 }),
        generateToken({ id: 'u2', email: 'e2@b.com' }, { expiresIn: -3600 }),
        generateToken({ id: 'u3', email: 'e3@b.com' }, { expiresIn: -86400 }),
      ];

      for (const t of expiredTokens) {
        let threw = false;
        try {
          verifyToken(t);
        } catch (err: any) {
          threw = true;
          expect(err.message).toBe('Token expired');
        }
        expect(threw).toBe(true);
      }
    });

    it('1.4 alg: "none" Attack Rejection: Comprehensive matrix of case permutations and unsigned tokens', () => {
      const nonePermutations = ['none', 'None', 'NONE', 'nOnE', 'nONE', 'NonE'];
      for (const alg of nonePermutations) {
        const header = Buffer.from(JSON.stringify({ alg, typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({ sub: 'usr_root', role: 'admin', email: 'root@bileo.com' })).toString('base64url');
        const tokensToTest = [
          `${header}.${payload}.`,
          `${header}.${payload}.dummysignature`,
          `${header}.${payload}`,
        ];

        for (const badToken of tokensToTest) {
          let blocked = false;
          try {
            verifyToken(badToken);
          } catch (err: any) {
            blocked = true;
            expect(
              err.message.includes('Insecure algorithm "none"') ||
              err.message.includes('strictly forbidden') ||
              err.message.includes('Malformed token format')
            ).toBe(true);
          }
          expect(blocked).toBe(true);
        }
      }
    });

    it('1.5 Algorithm Confusion Rejection: Rejects RS256, ES256, HS384, HS512, PS256 when expecting HS256', () => {
      const unsupportedAlgs = ['RS256', 'ES256', 'HS384', 'HS512', 'PS256', 'none', 'HS128'];
      for (const alg of unsupportedAlgs) {
        const header = Buffer.from(JSON.stringify({ alg, typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({ sub: 'usr_test', email: 'test@bileo.com' })).toString('base64url');
        const token = `${header}.${payload}.fakesignature`;

        let blocked = false;
        try {
          verifyToken(token);
        } catch (err: any) {
          blocked = true;
          expect(
            err.message.includes('Unsupported token algorithm') ||
            err.message.includes('strictly forbidden')
          ).toBe(true);
        }
        expect(blocked).toBe(true);
      }
    });

    it('1.6 Cross-Secret Attack Rejection: Tokens signed with attacker secret key are rejected', () => {
      const attackerSecret = 'attacker_private_secret_key_9999999999999999999999999999999';
      const tokenWithAttackerSecret = generateToken(
        { id: 'usr_attacker', email: 'attacker@evil.com', role: 'admin' },
        { secret: attackerSecret }
      );

      let blocked = false;
      try {
        verifyToken(tokenWithAttackerSecret);
      } catch (err: any) {
        blocked = true;
        expect(err.message.includes('Invalid authentication token') || err.message.includes('signature')).toBe(true);
      }
      expect(blocked).toBe(true);
    });

    it('1.7 Malformed Token Format: Rejects empty strings, invalid structures, non-base64 segments', () => {
      const malformedTokens = [
        '',
        '   ',
        'justastring',
        'segment1.segment2',
        'seg1.seg2.seg3.seg4',
        'invalid@@@base64.invalid@@@payload.signature',
        '{}.{}.{}',
        'null.null.null',
      ];

      for (const token of malformedTokens) {
        let threw = false;
        try {
          verifyToken(token);
        } catch {
          threw = true;
        }
        expect(threw).toBe(true);
      }
    });

    it('1.8 Dual-Transport Extraction: Authorization Bearer header permutations & whitespace resilience', () => {
      const rawToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMSJ9.signature';

      // Standard Bearer
      expect(extractToken({ headers: { authorization: `Bearer ${rawToken}` } })).toBe(rawToken);

      // Lowercase bearer
      expect(extractToken({ headers: { authorization: `bearer ${rawToken}` } })).toBe(rawToken);

      // Uppercase BEARER
      expect(extractToken({ headers: { authorization: `BEARER ${rawToken}` } })).toBe(rawToken);

      // Extra whitespace
      expect(extractToken({ headers: { authorization: `  Bearer    ${rawToken}   ` } })).toBe(rawToken);

      // Header with capitalized key 'Authorization'
      expect(extractToken({ headers: { Authorization: `Bearer ${rawToken}` } })).toBe(rawToken);
    });

    it('1.9 Dual-Transport Extraction: Malformed headers return null safely', () => {
      const badHeaders = [
        'Bearer',
        'Bearer ',
        'bearer   ',
        'BEARER',
        'Basic dXNlcjpwYXNz',
        'Token 123456',
        'OAuth 123456',
        'raw_token_without_prefix',
        '',
      ];

      for (const authHeader of badHeaders) {
        const result = extractToken({ headers: { authorization: authHeader } });
        expect(result).toBeNull();
      }
    });

    it('1.10 Dual-Transport Extraction: Cookie extraction hierarchy and Header Precedence', () => {
      const headerToken = 'header_token_priority_1';
      const cookieBileoToken = 'cookie_bileo_token_priority_2';
      const cookieAccessToken = 'cookie_access_token_priority_3';

      // Both header and cookie -> Header wins
      expect(
        extractToken({
          headers: { authorization: `Bearer ${headerToken}` },
          cookies: { bileo_token: cookieBileoToken, access_token: cookieAccessToken },
        })
      ).toBe(headerToken);

      // No header, bileo_token present -> bileo_token wins
      expect(
        extractToken({
          headers: {},
          cookies: { bileo_token: cookieBileoToken, access_token: cookieAccessToken },
        })
      ).toBe(cookieBileoToken);

      // No header, only access_token present -> access_token extracted
      expect(
        extractToken({
          headers: {},
          cookies: { access_token: cookieAccessToken },
        })
      ).toBe(cookieAccessToken);

      // No header, empty cookies -> null
      expect(extractToken({ headers: {}, cookies: {} })).toBeNull();
      expect(extractToken(null)).toBeNull();
      expect(extractToken(undefined)).toBeNull();
      expect(extractToken({})).toBeNull();
    });

    it('1.11 decodeToken: Safe inspection without signature verification', () => {
      const legitToken = generateToken({
        id: 'usr_inspect_999',
        email: 'inspect@bileo.com',
        role: 'operator',
        name: 'Seda',
        surname: 'Koc',
      });

      const decoded = decodeToken(legitToken);
      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe('usr_inspect_999');
      expect(decoded?.email).toBe('inspect@bileo.com');
      expect(decoded?.role).toBe('operator');
      expect(decoded?.name).toBe('Seda');
      expect(decoded?.surname).toBe('Koc');
      expect(decoded?.iss).toBe(getJwtIssuer());
      expect(decoded?.aud).toBe(getJwtAudience());

      expect(decodeToken('')).toBeNull();
      expect(decodeToken('garbage_data')).toBeNull();
    });

    it('1.12 Token generation requires mandatory sub/id and email fields', () => {
      let threwNoId = false;
      try {
        generateToken({ email: 'noid@bileo.com' } as any);
      } catch (err: any) {
        threwNoId = true;
        expect(err.message.includes('User ID (id or sub) is required')).toBe(true);
      }
      expect(threwNoId).toBe(true);

      let threwNoEmail = false;
      try {
        generateToken({ id: 'usr_no_email' } as any);
      } catch (err: any) {
        threwNoEmail = true;
        expect(err.message.includes('User email is required')).toBe(true);
      }
      expect(threwNoEmail).toBe(true);
    });
  });

  describe('Challenger M2.2 Suite 2: Rate Limiting Engine, Burst > 5 -> HTTP 429, Retry-After & IP Isolation', () => {
    it('2.1 Burst Traffic Exceeding 5 Requests Triggers HTTP 429 with Status & Error Envelope', () => {
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 5,
        code: 'RATE_LIMIT_BURST_TEST',
        message: 'Burst limit reached.',
        keyGenerator: (req) => req.ip,
      });

      const mockReq = { ip: '192.168.10.50' };
      const responses: Array<{ status: number; body: any; headers: Record<string, string>; nextCalled: boolean }> = [];

      for (let i = 1; i <= 8; i++) {
        const headers: Record<string, string> = {};
        let statusCode = 200;
        let responseBody: any = null;
        let nextCalled = false;

        const mockRes = {
          setHeader(name: string, value: string) {
            headers[name] = value;
          },
          status(code: number) {
            statusCode = code;
            return {
              json(body: any) {
                responseBody = body;
              },
            };
          },
        };

        limiter(mockReq, mockRes, () => {
          nextCalled = true;
        });

        responses.push({ status: statusCode, body: responseBody, headers, nextCalled });
      }

      // First 5 requests: MUST BE ALLOWED (nextCalled = true, status = 200)
      for (let i = 0; i < 5; i++) {
        expect(responses[i].nextCalled).toBe(true);
        expect(responses[i].status).toBe(200);
        expect(responses[i].headers['RateLimit-Limit']).toBe('5');
        expect(responses[i].headers['RateLimit-Remaining']).toBe(String(4 - i));
      }

      // 6th, 7th, 8th requests: MUST TRIGGER HTTP 429 (nextCalled = false, status = 429)
      for (let i = 5; i < 8; i++) {
        expect(responses[i].nextCalled).toBe(false);
        expect(responses[i].status).toBe(429);
        expect(responses[i].headers['RateLimit-Limit']).toBe('5');
        expect(responses[i].headers['RateLimit-Remaining']).toBe('0');
        expect(responses[i].headers['Retry-After']).toBeDefined();
        expect(parseInt(responses[i].headers['Retry-After'], 10) >= 1).toBe(true);

        // Verify Standardized Error Envelope
        expect(responses[i].body.success).toBe(false);
        expect(responses[i].body.code).toBe('RATE_LIMIT_BURST_TEST');
        expect(responses[i].body.error).toBe('Burst limit reached.');
        expect(typeof responses[i].body.retryAfter).toBe('number');
        expect(responses[i].body.retryAfter >= 1).toBe(true);
      }
    });

    it('2.2 Retry-After Header Mathematics & IETF Conformance', () => {
      const limiter = createRateLimiter({
        windowMs: 30 * 1000, // 30 seconds
        max: 2,
        code: 'RATE_LIMIT_RETRY_MATH',
      });

      const mockReq = { ip: '10.20.30.40' };
      const createRes = (captured: any) => ({
        setHeader: (k: string, v: string) => (captured.headers[k] = v),
        status: (s: number) => {
          captured.status = s;
          return { json: (b: any) => (captured.body = b) };
        },
      });

      const cap1: any = { headers: {} };
      limiter(mockReq, createRes(cap1), () => {});
      expect(cap1.headers['RateLimit-Remaining']).toBe('1');
      expect(cap1.headers['Retry-After']).toBeUndefined();

      const cap2: any = { headers: {} };
      limiter(mockReq, createRes(cap2), () => {});
      expect(cap2.headers['RateLimit-Remaining']).toBe('0');
      expect(cap2.headers['Retry-After']).toBeUndefined();

      // 3rd attempt: Rejected with Retry-After header
      const cap3: any = { headers: {} };
      limiter(mockReq, createRes(cap3), () => {});
      expect(cap3.status).toBe(429);
      expect(cap3.headers['Retry-After']).toBeDefined();
      const retryAfterVal = parseInt(cap3.headers['Retry-After'], 10);
      expect(retryAfterVal >= 1 && retryAfterVal <= 30).toBe(true);
    });

    it('2.3 IP Isolation: Flood on IP Alpha leaves IP Beta and IP Gamma completely unaffected', () => {
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 5,
        code: 'RATE_LIMIT_IP_ISOLATION',
        keyGenerator: (req) => req.ip,
      });

      const createRes = (captured: any) => ({
        setHeader: (k: string, v: string) => (captured.headers[k] = v),
        status: (s: number) => {
          captured.status = s;
          return { json: (b: any) => (captured.body = b) };
        },
      });

      const ipAlpha = '198.51.100.10';
      const ipBeta = '198.51.100.20';
      const ipGamma = '198.51.100.30';

      // Flood IP Alpha with 10 requests
      for (let i = 0; i < 10; i++) {
        const cap: any = { headers: {} };
        limiter({ ip: ipAlpha }, createRes(cap), () => {});
      }

      // Assert IP Alpha is blocked
      const alphaBlocked: any = { headers: {} };
      limiter({ ip: ipAlpha }, createRes(alphaBlocked), () => {});
      expect(alphaBlocked.status).toBe(429);

      // Assert IP Beta is completely fresh (remaining = 4)
      const betaReq: any = { headers: {} };
      let betaAllowed = false;
      limiter({ ip: ipBeta }, createRes(betaReq), () => {
        betaAllowed = true;
      });
      expect(betaAllowed).toBe(true);
      expect(betaReq.headers['RateLimit-Remaining']).toBe('4');

      // Assert IP Gamma can perform 5 full requests without disruption
      for (let i = 1; i <= 5; i++) {
        let gammaAllowed = false;
        const gammaReq: any = { headers: {} };
        limiter({ ip: ipGamma }, createRes(gammaReq), () => {
          gammaAllowed = true;
        });
        expect(gammaAllowed).toBe(true);
        expect(gammaReq.headers['RateLimit-Remaining']).toBe(String(5 - i));
      }
    });

    it('2.4 Login Limiter Multi-Factor Isolation: Same IP with different email accounts has isolated quotas', () => {
      const clientIp = '172.16.50.5';
      const userAlice = { ip: clientIp, body: { email: 'alice@bileo.com' } };
      const userBob = { ip: clientIp, body: { email: 'bob@bileo.com' } };

      const createRes = (captured: any) => ({
        setHeader: (k: string, v: string) => (captured.headers[k] = v),
        status: (s: number) => {
          captured.status = s;
          return { json: (b: any) => (captured.body = b) };
        },
      });

      // Exhaust Alice's login quota on this IP (5 requests)
      for (let i = 0; i < 5; i++) {
        loginRateLimiter(userAlice, createRes({ headers: {} }), () => {});
      }

      // Alice is blocked
      const aliceBlocked: any = { headers: {} };
      let alicePassed = false;
      loginRateLimiter(userAlice, createRes(aliceBlocked), () => {
        alicePassed = true;
      });
      expect(alicePassed).toBe(false);
      expect(aliceBlocked.status).toBe(429);
      expect(aliceBlocked.body.code).toBe('RATE_LIMIT_LOGIN_EXCEEDED');

      // Bob from the same IP is ALLOWED
      let bobPassed = false;
      const bobReq: any = { headers: {} };
      loginRateLimiter(userBob, createRes(bobReq), () => {
        bobPassed = true;
      });
      expect(bobPassed).toBe(true);
      expect(bobReq.headers['RateLimit-Remaining']).toBe('4');
    });

    it('2.5 Payment Limiter Multi-Factor Isolation: Same IP with different userId has isolated quotas', () => {
      const clientIp = '172.16.80.8';
      const user1 = { ip: clientIp, user: { sub: 'usr_cust_1' } };
      const user2 = { ip: clientIp, user: { sub: 'usr_cust_2' } };

      const createRes = (captured: any) => ({
        setHeader: (k: string, v: string) => (captured.headers[k] = v),
        status: (s: number) => {
          captured.status = s;
          return { json: (b: any) => (captured.body = b) };
        },
      });

      // Exhaust user1 payment quota
      for (let i = 0; i < 5; i++) {
        paymentRateLimiter(user1, createRes({ headers: {} }), () => {});
      }

      // user1 blocked
      const u1Blocked: any = { headers: {} };
      let u1Passed = false;
      paymentRateLimiter(user1, createRes(u1Blocked), () => {
        u1Passed = true;
      });
      expect(u1Passed).toBe(false);
      expect(u1Blocked.status).toBe(429);
      expect(u1Blocked.body.code).toBe('RATE_LIMIT_PAYMENT_EXCEEDED');

      // user2 allowed
      let u2Passed = false;
      const u2Req: any = { headers: {} };
      paymentRateLimiter(user2, createRes(u2Req), () => {
        u2Passed = true;
      });
      expect(u2Passed).toBe(true);
      expect(u2Req.headers['RateLimit-Remaining']).toBe('4');
    });

    it('2.6 Sliding Window Expiration & Quota Replenishment', async () => {
      const memoryLimiter = new MemoryRateLimiter();
      const testKey = 'sliding_window_expiration_key';
      const shortWindowMs = 60; // 60ms window

      // Quota: 2 requests in 60ms
      const r1 = memoryLimiter.check(testKey, 2, shortWindowMs);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(1);

      const r2 = memoryLimiter.check(testKey, 2, shortWindowMs);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(0);

      // 3rd attempt: blocked
      const r3 = memoryLimiter.check(testKey, 2, shortWindowMs);
      expect(r3.allowed).toBe(false);

      // Sleep 75ms to allow sliding window to expire
      await new Promise((resolve) => setTimeout(resolve, 75));

      // 4th attempt: MUST BE REPLENISHED AND ALLOWED
      const r4 = memoryLimiter.check(testKey, 2, shortWindowMs);
      expect(r4.allowed).toBe(true);
      expect(r4.current).toBe(1);
      expect(r4.remaining).toBe(1);
    });

    it('2.7 Store Reset and Stats Accuracy', () => {
      const memoryLimiter = new MemoryRateLimiter();
      memoryLimiter.check('client_A', 5, 10000);
      memoryLimiter.check('client_A', 5, 10000);
      memoryLimiter.check('client_B', 5, 10000);
      memoryLimiter.check('client_C', 5, 10000);

      const stats1 = memoryLimiter.getStats();
      expect(stats1.activeKeys).toBe(3);
      expect(stats1.totalRecords).toBe(4);

      // Reset single key
      memoryLimiter.reset('client_A');
      const stats2 = memoryLimiter.getStats();
      expect(stats2.activeKeys).toBe(2);
      expect(stats2.totalRecords).toBe(2);

      // Reset all keys
      memoryLimiter.reset();
      const stats3 = memoryLimiter.getStats();
      expect(stats3.activeKeys).toBe(0);
      expect(stats3.totalRecords).toBe(0);
    });

    it('2.8 High-Throughput Concurrent Burst Load Simulation Oracle', async () => {
      const memoryLimiter = new MemoryRateLimiter();
      const ipCount = 20;
      const requestsPerIp = 10;
      const maxQuota = 5;
      const windowMs = 5000;

      const tasks: Array<Promise<{ ip: string; allowed: boolean }>> = [];

      for (let i = 0; i < ipCount; i++) {
        const ip = `10.100.0.${i + 1}`;
        for (let j = 0; j < requestsPerIp; j++) {
          tasks.push(
            Promise.resolve().then(() => {
              const res = memoryLimiter.check(ip, maxQuota, windowMs);
              return { ip, allowed: res.allowed };
            })
          );
        }
      }

      const results = await Promise.all(tasks);

      // Aggregate results per IP
      const ipAggregates = new Map<string, { allowed: number; blocked: number }>();
      for (const res of results) {
        if (!ipAggregates.has(res.ip)) {
          ipAggregates.set(res.ip, { allowed: 0, blocked: 0 });
        }
        const agg = ipAggregates.get(res.ip)!;
        if (res.allowed) {
          agg.allowed++;
        } else {
          agg.blocked++;
        }
      }

      // Assert that for every IP, EXACTLY 5 passed and EXACTLY 5 were blocked
      expect(ipAggregates.size).toBe(ipCount);
      for (const [ip, agg] of ipAggregates.entries()) {
        expect(agg.allowed).toBe(5);
        expect(agg.blocked).toBe(5);
      }
    });

    it('2.9 Client IP Extraction Hierarchy & Edge Cases', () => {
      // 1. x-forwarded-for with multiple proxy hops
      const reqMultiProxy = {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
      };
      expect(getClientIp(reqMultiProxy)).toBe('203.0.113.195');

      // 2. req.ip direct
      const reqDirectIp = { ip: '198.51.100.55' };
      expect(getClientIp(reqDirectIp)).toBe('198.51.100.55');

      // 3. req.connection.remoteAddress
      const reqConn = { connection: { remoteAddress: '192.168.1.254' } };
      expect(getClientIp(reqConn)).toBe('192.168.1.254');

      // 4. req.socket.remoteAddress
      const reqSocket = { socket: { remoteAddress: '10.0.1.99' } };
      expect(getClientIp(reqSocket)).toBe('10.0.1.99');

      // 5. Fallback for null/undefined
      expect(getClientIp(null)).toBe('127.0.0.1');
      expect(getClientIp(undefined)).toBe('127.0.0.1');
      expect(getClientIp({})).toBe('127.0.0.1');
    });

    it('2.10 RateLimiters Dictionary Export Parity with PROJECT.md Interface Contract', () => {
      expect(typeof rateLimiters.login).toBe('function');
      expect(typeof rateLimiters.register).toBe('function');
      expect(typeof rateLimiters.payment).toBe('function');
      expect(typeof rateLimiters.global).toBe('function');
      expect(typeof createRateLimiter).toBe('function');
      expect(typeof MemoryRateLimiter).toBe('function');
    });
  });
}
