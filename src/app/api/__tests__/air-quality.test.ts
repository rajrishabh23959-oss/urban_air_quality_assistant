import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/air-quality/route";
import { aqiRateLimiter } from "@/lib/rate-limit";
import { airQualityCache } from "@/services/open-meteo";

const MOCK_OPEN_METEO_PAYLOAD = {
  timezone: "Asia/Kolkata",
  current: {
    time: "2026-11-26T12:00",
    pm2_5: 132.4,
    pm10: 210.2,
    nitrogen_dioxide: 45.1,
    sulphur_dioxide: 12.0,
    ozone: 28.5,
    carbon_monoxide: 710.0,
    us_aqi: 191,
    european_aqi: 118,
  },
  hourly: {
    time: Array.from({ length: 24 }, (_, idx) => `2026-11-26T${String(idx).padStart(2, "0")}:00`),
    pm2_5: Array.from({ length: 24 }, (_, idx) => (idx === 13 ? 35 : 140)),
    pm10: Array.from({ length: 24 }, () => 190),
    nitrogen_dioxide: Array.from({ length: 24 }, () => 40),
    sulphur_dioxide: Array.from({ length: 24 }, () => 12),
    ozone: Array.from({ length: 24 }, () => 30),
    carbon_monoxide: Array.from({ length: 24 }, () => 650),
    us_aqi: Array.from({ length: 24 }, (_, idx) => (idx === 13 ? 95 : 190)),
    european_aqi: Array.from({ length: 24 }, () => 110),
  },
};

describe("/api/air-quality", () => {
  beforeEach(() => {
    aqiRateLimiter.reset();
    airQualityCache.clear();
    vi.restoreAllMocks();
  });

  it("returns 200 with snapshot and caches subsequent requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_OPEN_METEO_PAYLOAD,
    });
    vi.stubGlobal("fetch", fetchMock);

    const req1 = new Request(
      "http://localhost:3000/api/air-quality?lat=28.6139&lon=77.209&name=New+Delhi&country=India&admin1=Delhi",
    );
    const res1 = await GET(req1);
    expect(res1.status).toBe(200);
    const body1 = (await res1.json()) as { current: { usAqi: number }; tierInfo: { tier: string } };
    expect(body1.current.usAqi).toBe(191);
    expect(body1.tierInfo.tier).toBe("unhealthy");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const req2 = new Request(
      "http://localhost:3000/api/air-quality?lat=28.6139&lon=77.209&name=New+Delhi&country=India",
    );
    const res2 = await GET(req2);
    expect(res2.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns 400 on invalid coordinates", async () => {
    const req = new Request("http://localhost:3000/api/air-quality?lat=150&lon=77");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 502 when upstream Open-Meteo fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    const req = new Request("http://localhost:3000/api/air-quality?lat=28.61&lon=77.2");
    const res = await GET(req);
    expect(res.status).toBe(502);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => MOCK_OPEN_METEO_PAYLOAD,
      }),
    );

    for (let i = 0; i < 30; i += 1) {
      await GET(
        new Request("http://localhost:3000/api/air-quality?lat=28.61&lon=77.2", {
          headers: { "x-real-ip": "192.168.1.50" },
        }),
      );
    }
    const blocked = await GET(
      new Request("http://localhost:3000/api/air-quality?lat=28.61&lon=77.2", {
        headers: { "x-real-ip": "192.168.1.50" },
      }),
    );
    expect(blocked.status).toBe(429);
  });
});
