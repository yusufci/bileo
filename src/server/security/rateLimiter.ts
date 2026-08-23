interface RateLimitRecord {
  timestamps: number[];
}

export class RateLimiter {
  private static store: Map<string, RateLimitRecord> = new Map();

  /**
   * Checks if an identifier exceeds rate limit within a sliding time window
   */
  public static check(
    key: string,
    maxRequests: number = 5,
    windowMs: number = 60000
  ): { allowed: boolean; current: number; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const record = this.store.get(key) || { timestamps: [] };

    // Evict timestamps older than window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfterMs = Math.max(0, windowMs - (now - oldest));
      return {
        allowed: false,
        current: record.timestamps.length,
        remaining: 0,
        retryAfterMs,
      };
    }

    record.timestamps.push(now);
    this.store.set(key, record);

    return {
      allowed: true,
      current: record.timestamps.length,
      remaining: maxRequests - record.timestamps.length,
      retryAfterMs: 0,
    };
  }

  public static reset(key?: string) {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }
}
