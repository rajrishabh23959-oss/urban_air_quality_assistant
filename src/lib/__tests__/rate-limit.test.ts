import { describe, expect, it } from "vitest";
import {
  buildRateLimitHeaders,
  getClientIdentifier,
  SlidingWindowRateLimiter,
} from "@/lib/rate-limit";

describe("SlidingWindowRateLimiter", () => {
  it("allows requests within the limit and blocks excess requests", () => {
    const limiter = new SlidingWindowRateLimiter(2, 60_000);

    const r1 = limiter.check("client-1", 1000);
    const r2 = limiter.check("client-1", 2000);
    const r3 = limiter.check("client-1", 3000);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);
    expect(r3.allowed).toBe(false);
    expect(r3.retryAfterSeconds).toBeGreaterThan(0);

    const headers = buildRateLimitHeaders(r3);
    expect(headers["Retry-After"]).toBeDefined();
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
  });

  it("resets allowance after the sliding window expires", () => {
    const limiter = new SlidingWindowRateLimiter(1, 10_000, 2);
    expect(limiter.check("client-1", 0).allowed).toBe(true);
    expect(limiter.check("client-2", 0).allowed).toBe(true);
    expect(limiter.check("client-3", 0).allowed).toBe(true);
    expect(limiter.check("client-1", 5_000).allowed).toBe(true);
    expect(limiter.check("client-1", 6_000).allowed).toBe(false);
    expect(limiter.check("client-1", 15_001).allowed).toBe(true);
  });

  it("extracts client identifier from forwarded, real-ip, or fallback", () => {
    expect(
      getClientIdentifier(
        new Request("http://localhost", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } }),
      ),
    ).toBe("1.2.3.4");
    expect(
      getClientIdentifier(new Request("http://localhost", { headers: { "x-real-ip": "9.8.7.6" } })),
    ).toBe("9.8.7.6");
    expect(getClientIdentifier(new Request("http://localhost"))).toBe("anonymous-local");
    expect(
      getClientIdentifier(
        new Request("http://localhost", { headers: { "x-forwarded-for": "   " } }),
      ),
    ).toBe("anonymous-local");
    expect(
      getClientIdentifier(new Request("http://localhost", { headers: { "x-real-ip": "   " } })),
    ).toBe("anonymous-local");
    expect(
      getClientIdentifier(
        new Request("http://localhost", { headers: { "x-forwarded-for": ";;;" } }),
      ),
    ).toBe("anonymous-local");
    expect(
      getClientIdentifier(
        new Request("http://localhost", { headers: { "x-forwarded-for": ",1.2.3.4" } }),
      ),
    ).toBe("anonymous-local");
  });
});
