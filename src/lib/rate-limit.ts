export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * In-memory sliding-window rate limiter keyed by client identifier.
 */
export class SlidingWindowRateLimiter {
  private readonly timestamps = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;

  constructor(maxRequests: number, windowMs: number, maxKeys = 5000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
  }

  /**
   * Evaluates whether a request from `key` is permitted at `now`.
   */
  check(key: string, now = Date.now()): RateLimitResult {
    const windowStart = now - this.windowMs;
    const existing = this.timestamps.get(key) ?? [];
    const recent = existing.filter((ts) => ts > windowStart);

    if (recent.length >= this.maxRequests) {
      const oldestInWindow = recent[0] ?? now;
      const resetAt = oldestInWindow + this.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
      this.timestamps.set(key, recent);
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetAt,
        retryAfterSeconds,
      };
    }

    recent.push(now);
    if (!this.timestamps.has(key) && this.timestamps.size >= this.maxKeys) {
      const firstKey = this.timestamps.keys().next().value;
      if (firstKey !== undefined) {
        this.timestamps.delete(firstKey);
      }
    }
    this.timestamps.set(key, recent);

    const oldestInWindow = recent[0] ?? now;
    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - recent.length),
      resetAt: oldestInWindow + this.windowMs,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Resets all tracked rate-limit windows (useful in tests).
   */
  reset(): void {
    this.timestamps.clear();
  }
}

/**
 * Formats standard X-RateLimit-* and Retry-After headers.
 */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }
  return headers;
}

/**
 * Extracts a bounded client identifier from incoming request headers.
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp.slice(0, 64);
    }
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp.slice(0, 64);
  }
  return "anonymous-local";
}

export const aqiRateLimiter = new SlidingWindowRateLimiter(30, 60 * 1000);
export const genAiRateLimiter = new SlidingWindowRateLimiter(15, 60 * 1000);
export const healthRateLimiter = new SlidingWindowRateLimiter(60, 60 * 1000);
