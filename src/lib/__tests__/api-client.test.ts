import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchActionPlanApi,
  fetchAirQualityApi,
  fetchAssistantApi,
  searchCitiesApi,
} from "@/lib/api-client";
import { DEFAULT_LOCATION } from "@/lib/constants";
import { MOCK_AIR_QUALITY, MOCK_PLAN, MOCK_PROFILE } from "@/test-fixtures/air-quality";

describe("api-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("validates responses for geocode, air-quality, plan, and assistant", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [DEFAULT_LOCATION] }),
      }),
    );
    expect(await searchCitiesApi("Delhi")).toHaveLength(1);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_AIR_QUALITY,
      }),
    );
    const aqi = await fetchAirQualityApi(DEFAULT_LOCATION, false);
    expect(aqi.location.name).toBe("New Delhi");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_AIR_QUALITY,
      }),
    );
    const noAdminAqi = await fetchAirQualityApi(
      { name: "Local", country: "IN", latitude: 28.6, longitude: 77.2, timezone: "auto" },
      true,
    );
    expect(noAdminAqi.location.name).toBe("New Delhi");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_PLAN,
      }),
    );
    const plan = await fetchActionPlanApi(MOCK_AIR_QUALITY, MOCK_PROFILE, true);
    expect(plan.source).toBe("fallback");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: "Safe at 1 PM.", suggestedFollowUps: [], source: "fallback" }),
      }),
    );
    const chat = await fetchAssistantApi({
      message: "Is it safe?",
      airQuality: MOCK_AIR_QUALITY,
      profile: MOCK_PROFILE,
      history: [],
    });
    expect(chat.reply).toBe("Safe at 1 PM.");
  });

  it("throws descriptive errors on non-ok responses or invalid schemas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Bad query" }) }),
    );
    await expect(searchCitiesApi("a")).rejects.toThrow("Bad query");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, json: async () => ({ error: 123 }) }),
    );
    await expect(searchCitiesApi("a")).rejects.toThrow("Could not search cities");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ bad: true }) }),
    );
    await expect(searchCitiesApi("Delhi")).rejects.toThrow(/invalid city search/i);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ bad: true }) }),
    );
    await expect(fetchAirQualityApi(DEFAULT_LOCATION, false)).rejects.toThrow(
      /invalid air quality/i,
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ bad: true }) }),
    );
    await expect(fetchActionPlanApi(MOCK_AIR_QUALITY, MOCK_PROFILE, false)).rejects.toThrow(
      /invalid action plan/i,
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ bad: true }) }),
    );
    await expect(
      fetchAssistantApi({
        message: "Hi?",
        airQuality: MOCK_AIR_QUALITY,
        profile: MOCK_PROFILE,
        history: [],
      }),
    ).rejects.toThrow(/invalid assistant/i);
  });
});
