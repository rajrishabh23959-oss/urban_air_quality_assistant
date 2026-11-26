import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  airQualityCache,
  fetchAirQualitySnapshot,
  geocodeCache,
  searchCities,
  UpstreamServiceError,
} from "@/services/open-meteo";

describe("open-meteo service edge cases", () => {
  beforeEach(() => {
    geocodeCache.clear();
    airQualityCache.clear();
    vi.restoreAllMocks();
  });

  it("throws UpstreamServiceError on malformed geocode JSON or network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: "not-an-array" }),
      }),
    );
    await expect(searchCities("Delhi")).rejects.toThrow(UpstreamServiceError);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("Network down")));
    await expect(searchCities("Mumbai")).rejects.toThrow(UpstreamServiceError);
  });

  it("handles missing current, null metrics, and empty hourly arrays", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hourly: {
            time: ["2026-11-26T12:00"],
            pm2_5: [null],
            pm10: [-5],
            nitrogen_dioxide: [20],
            sulphur_dioxide: [null],
            ozone: [15],
            carbon_monoxide: [300],
            us_aqi: [40],
            european_aqi: [30],
          },
        }),
      }),
    );

    const snapshot = await fetchAirQualitySnapshot({
      name: "TestCity",
      country: "Testland",
      latitude: 10,
      longitude: 20,
      timezone: "auto",
    });
    expect(snapshot.current.pm25).toBe(0);
    expect(snapshot.current.pm10).toBe(0);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hourly: {
            time: [],
            pm2_5: [],
            pm10: [],
            nitrogen_dioxide: [],
            sulphur_dioxide: [],
            ozone: [],
            carbon_monoxide: [],
            us_aqi: [],
            european_aqi: [],
          },
        }),
      }),
    );
    await expect(
      fetchAirQualitySnapshot({
        name: "EmptyCity",
        country: "Testland",
        latitude: 11,
        longitude: 21,
        timezone: "auto",
      }),
    ).rejects.toThrow(UpstreamServiceError);
  });
});
