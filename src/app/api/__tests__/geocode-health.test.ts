import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getHealth } from "@/app/api/health/route";
import { GET as getGeocode } from "@/app/api/geocode/route";
import { aqiRateLimiter } from "@/lib/rate-limit";
import { geocodeCache } from "@/services/open-meteo";

describe("/api/health and /api/geocode", () => {
  beforeEach(() => {
    aqiRateLimiter.reset();
    geocodeCache.clear();
    vi.restoreAllMocks();
  });

  it("returns 200 ok from /api/health", async () => {
    const res = await getHealth();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; geminiConfigured: boolean };
    expect(body.status).toBe("ok");
    expect(typeof body.geminiConfigured).toBe("boolean");
  });

  it("searches cities via /api/geocode and caches results", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            name: "Lucknow",
            country: "India",
            admin1: "Uttar Pradesh",
            latitude: 26.8467,
            longitude: 80.9462,
            timezone: "Asia/Kolkata",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const req1 = new Request("http://localhost:3000/api/geocode?q=Lucknow");
    const res1 = await getGeocode(req1);
    expect(res1.status).toBe(200);
    const data1 = (await res1.json()) as { results: { name: string }[] };
    expect(data1.results[0]?.name).toBe("Lucknow");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const req2 = new Request("http://localhost:3000/api/geocode?q=Lucknow");
    const res2 = await getGeocode(req2);
    expect(res2.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for short or missing geocode queries and 502 on upstream error", async () => {
    expect((await getGeocode(new Request("http://localhost:3000/api/geocode"))).status).toBe(400);
    const badReq = new Request("http://localhost:3000/api/geocode?q=a");
    expect((await getGeocode(badReq)).status).toBe(400);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const errReq = new Request("http://localhost:3000/api/geocode?q=Lahore");
    expect((await getGeocode(errReq)).status).toBe(502);

    for (let i = 0; i < 30; i += 1) {
      await getGeocode(
        new Request("http://localhost:3000/api/geocode?q=a", {
          headers: { "x-real-ip": "10.10.10.10" },
        }),
      );
    }
    const limited = await getGeocode(
      new Request("http://localhost:3000/api/geocode?q=Delhi", {
        headers: { "x-real-ip": "10.10.10.10" },
      }),
    );
    expect(limited.status).toBe(429);
  });
});
