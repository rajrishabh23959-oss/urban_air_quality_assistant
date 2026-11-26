import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/plan/route";
import { genAiRateLimiter } from "@/lib/rate-limit";
import { planCache } from "@/services/gemini";
import { MOCK_AIR_QUALITY, MOCK_PLAN, MOCK_PROFILE } from "@/test-fixtures/air-quality";

const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAIMock() {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
  };
});

describe("/api/plan", () => {
  beforeEach(() => {
    genAiRateLimiter.reset();
    planCache.clear();
    mockGenerateContent.mockReset();
    delete process.env.GEMINI_API_KEY;
  });

  it("returns deterministic fallback plan when GEMINI_API_KEY is absent", async () => {
    const req = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        airQuality: MOCK_AIR_QUALITY,
        profile: { ...MOCK_PROFILE, mode: "community" },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      source: string;
      routines: unknown[];
      communityAdvisory?: { headline: string };
    };
    expect(data.source).toBe("fallback");
    expect(data.routines.length).toBeGreaterThanOrEqual(3);
    expect(data.communityAdvisory?.headline).toContain("New Delhi");
  });

  it("uses Gemini SDK and validates structured JSON when GEMINI_API_KEY is present", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        summary: MOCK_PLAN.summary,
        routines: MOCK_PLAN.routines,
        iaqHacks: MOCK_PLAN.iaqHacks,
        sustainableSwaps: MOCK_PLAN.sustainableSwaps,
      }),
    });

    const req = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ airQuality: MOCK_AIR_QUALITY, profile: MOCK_PROFILE }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { source: string };
    expect(data.source).toBe("gemini");
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("enforces rate limits with 429 status", async () => {
    for (let i = 0; i < 15; i += 1) {
      const okReq = new Request("http://localhost:3000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.5" },
        body: JSON.stringify({ airQuality: MOCK_AIR_QUALITY, profile: MOCK_PROFILE }),
      });
      const res = await POST(okReq);
      expect(res.status).toBe(200);
    }

    const blockedReq = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.5" },
      body: JSON.stringify({ airQuality: MOCK_AIR_QUALITY, profile: MOCK_PROFILE }),
    });
    const blockedRes = await POST(blockedReq);
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("Retry-After")).toBeTruthy();
  });

  it("returns 400 on malformed request body or invalid JSON and 502 on Gemini failure", async () => {
    const badJson = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad",
    });
    expect((await POST(badJson)).status).toBe(400);

    const req = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid: true }),
    });
    expect((await POST(req)).status).toBe(400);

    process.env.GEMINI_API_KEY = "test-key";
    mockGenerateContent.mockResolvedValueOnce({ text: "" });
    const errReq = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ airQuality: MOCK_AIR_QUALITY, profile: MOCK_PROFILE }),
    });
    expect((await POST(errReq)).status).toBe(502);
  });
});
