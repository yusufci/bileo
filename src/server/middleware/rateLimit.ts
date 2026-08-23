// Multi-Tier Rate Limiting Subsystem & Perimeter Defense for Bileo Platform
// Implements in-memory sliding window rate limiting, standardized 429 JSON responses,
// IETF RateLimit headers (Limit, Remaining, Reset, Retry-After), and endpoint-specific tiers.

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  code: string;
  message?: string;
  keyGenerator?: (req: any) => string;
  skip?: (req: any) => boolean;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  resetTime: number; // epoch timestamp in ms when window resets
  retryAfterSeconds: number;
}

export interface RateLimitRecord {
  timestamps: number[];
}

/**
 * Pure-TypeScript High-Performance Memory Rate Limiter
 * Implements sliding-window counter algorithm with microsecond timestamp tracking.
 */
export class MemoryRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();

  /**
   * Checks if an identifier exceeds rate limit within a sliding time window.
   * If allowed, records the timestamp automatically.
   * @param key Unique client identifier (e.g. IP, IP+email, IP+userID)
   * @param maxRequests Maximum allowed requests in window
   * @param windowMs Time window in milliseconds
   */
  public check(key: string, maxRequests: number, windowMs: number): RateLimitCheckResult {
    const now = Date.now();
    let record = this.store.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Evict timestamps older than the sliding window
    const windowStart = now - windowMs;
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const currentCount = record.timestamps.length;

    if (currentCount >= maxRequests) {
      const oldestTimestamp = record.timestamps[0] || now;
      const resetTime = oldestTimestamp + windowMs;
      const retryAfterMs = Math.max(0, resetTime - now);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

      return {
        allowed: false,
        limit: maxRequests,
        current: currentCount,
        remaining: 0,
        resetTime,
        retryAfterSeconds: retryAfterSeconds > 0 ? retryAfterSeconds : 1,
      };
    }

    // Record this request
    record.timestamps.push(now);
    const newCount = record.timestamps.length;
    const remaining = Math.max(0, maxRequests - newCount);
    const oldestTimestamp = record.timestamps[0];
    const resetTime = oldestTimestamp + windowMs;
    const retryAfterMs = Math.max(0, resetTime - now);
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: true,
      limit: maxRequests,
      current: newCount,
      remaining,
      resetTime,
      retryAfterSeconds,
    };
  }

  /**
   * Resets rate limit counters for a specific key or all keys
   */
  public reset(key?: string): void {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }

  /**
   * Returns current memory usage and active tracked keys count
   */
  public getStats(): { activeKeys: number; totalRecords: number } {
    let totalRecords = 0;
    for (const record of this.store.values()) {
      totalRecords += record.timestamps.length;
    }
    return {
      activeKeys: this.store.size,
      totalRecords,
    };
  }
}

// Global default in-memory rate limiter singleton
export const memoryRateLimiterStore = new MemoryRateLimiter();

/**
 * Extracts client IP address safely from Express request headers or connection
 */
export function getClientIp(req: any): string {
  if (!req || typeof req !== 'object') return '127.0.0.1';

  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  if (typeof req.ip === 'string' && req.ip.length > 0) {
    return req.ip;
  }

  if (typeof req.connection?.remoteAddress === 'string') {
    return req.connection.remoteAddress;
  }

  if (typeof req.socket?.remoteAddress === 'string') {
    return req.socket.remoteAddress;
  }

  return '127.0.0.1';
}

/**
 * Sets IETF standard RateLimit headers on the HTTP response object
 */
function setRateLimitHeaders(res: any, result: RateLimitCheckResult): void {
  if (!res) return;

  const setHeaderFn = res.setHeader || res.set || res.header;
  if (typeof setHeaderFn === 'function') {
    setHeaderFn.call(res, 'RateLimit-Limit', String(result.limit));
    setHeaderFn.call(res, 'RateLimit-Remaining', String(result.remaining));
    setHeaderFn.call(res, 'RateLimit-Reset', String(result.retryAfterSeconds));
    if (!result.allowed) {
      setHeaderFn.call(res, 'Retry-After', String(result.retryAfterSeconds));
    }
  }
}

/**
 * Creates an Express-compatible rate limiting middleware with customized tier rules.
 * Automatically handles standard IETF headers and standardized 429 response envelopes.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    code,
    message = 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyiniz.',
    keyGenerator = (req: any) => getClientIp(req),
    skip,
  } = options;

  return (req: any, res: any, next: (err?: any) => void) => {
    if (skip && skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const result = memoryRateLimiterStore.check(`${code}:${key}`, max, windowMs);

    setRateLimitHeaders(res, result);

    if (!result.allowed) {
      const responsePayload = {
        success: false,
        error: message,
        code,
        retryAfter: result.retryAfterSeconds,
      };

      if (res && typeof res.status === 'function') {
        return res.status(429).json(responsePayload);
      }
      return;
    }

    if (typeof next === 'function') {
      next();
    }
  };
}

// 1. Auth / Login Rate Limiter: 5 attempts per 15 minutes per IP + email
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  code: 'RATE_LIMIT_LOGIN_EXCEEDED',
  message: 'Giriş deneme sınırına ulaştınız. Lütfen 15 dakika sonra tekrar deneyiniz.',
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    return `${ip}:${email}`;
  },
});

// 2. Registration Rate Limiter: 5 account creations per 1 hour per IP
export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  code: 'RATE_LIMIT_REGISTER_EXCEEDED',
  message: 'Kayıt deneme sınırına ulaştınız. Lütfen 1 saat sonra tekrar deneyiniz.',
  keyGenerator: (req) => getClientIp(req),
});

// 3. Payment & Booking Rate Limiter: 5 transactions per 1 minute per IP + user
export const paymentRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  code: 'RATE_LIMIT_PAYMENT_EXCEEDED',
  message: 'Ödeme işlem sınırına ulaştınız. Lütfen 1 dakika sonra tekrar deneyiniz.',
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const userId = req.user?.sub || req.user?.id || req.body?.contactEmail || 'guest';
    return `${ip}:${userId}`;
  },
});

// 4. Global API Perimeter Rate Limiter: 300 requests per 15 minutes per IP
export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  code: 'RATE_LIMIT_GENERAL_EXCEEDED',
  message: 'İstek sınırına ulaştınız. Lütfen daha sonra tekrar deneyiniz.',
  keyGenerator: (req) => getClientIp(req),
});

// Unified rateLimiters dictionary matching PROJECT.md interface contract
export const rateLimiters = {
  login: loginRateLimiter,
  register: registerRateLimiter,
  payment: paymentRateLimiter,
  global: globalRateLimiter,
};
