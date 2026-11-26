import { describe, expect, it } from "vitest";
import { apiJson, checkApiRateLimit } from "@/lib/api-response";
import { SlidingWindowRateLimiter } from "@/lib/rate-limit";

describe("api-response helpers", () => {
  it("returns rate-limit headers when allowed and 429 response when exceeded", async () => {
    const limiter = new SlidingWindowRateLimiter(1, 60_000);
    const req = new Request("http://localhost:3000/api/test", {
      headers: { "x-real-ip": "127.0.0.1" },
    });

    const ok = checkApiRateLimit(req, limiter, "Rate limited");
    expect(ok.allowed).toBe(true);
    if (ok.allowed) {
      const res = apiJson({ ok: true }, 200, ok.headers, "public, max-age=60");
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
    }

    const blocked = checkApiRateLimit(req, limiter, "Rate limited");
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.response.status).toBe(429);
      expect(blocked.response.headers.get("Cache-Control")).toBe("no-store");
    }
  });
});
