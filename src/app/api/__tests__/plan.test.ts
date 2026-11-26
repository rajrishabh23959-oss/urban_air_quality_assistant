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

  it("uses Gemini SDK, supports forceRefresh cache bypass, and falls back gracefully on invalid JSON", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        summary: MOCK_PLAN.summary,
        routines: MOCK_PLAN.routines,
        iaqHacks: MOCK_PLAN.iaqHacks,
        sustainableSwaps: MOCK_PLAN.sustainableSwaps,
      }),
    });

    const req1 = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ airQuality: MOCK_AIR_QUALITY, profile: MOCK_PROFILE }),
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    expect(((await res1.json()) as { source: string }).source).toBe("gemini");
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    // Cached second call
    const req2 = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ airQuality: MOCK_AIR_QUALITY, profile: MOCK_PROFILE }),
    });
    await POST(req2);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    // forceRefresh bypasses cache (also test community mode & markdown-fenced Gemini output)
    mockGenerateContent.mockResolvedValueOnce({
      text: `\`\`\`json\n${JSON.stringify({
        summary: MOCK_PLAN.summary,
        routines: MOCK_PLAN.routines,
        iaqHacks: MOCK_PLAN.iaqHacks,
        sustainableSwaps: MOCK_PLAN.sustainableSwaps,
        communityAdvisory: {
          headline: "Community Alert",
          whatsappNotice: "Keep windows closed during peak evening smog.",
          schoolAndRwaActions: ["Shift assembly indoors", "No idling at gates"],
          collectiveImpactNote: "50 homes save 420 kg CO2e/week.",
        },
      })}\n\`\`\``,
    });
    const req3 = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        airQuality: MOCK_AIR_QUALITY,
        profile: { ...MOCK_PROFILE, mode: "community" },
        forceRefresh: true,
      }),
    });
    await POST(req3);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);

    // Non-conforming JSON falls back gracefully instead of 502
    mockGenerateContent.mockResolvedValueOnce({ text: "{not-valid-json" });
    const req4 = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        airQuality: MOCK_AIR_QUALITY,
        profile: MOCK_PROFILE,
        forceRefresh: true,
      }),
    });
    const res4 = await POST(req4);
    expect(res4.status).toBe(200);
    expect(((await res4.json()) as { source: string }).source).toBe("fallback");
  });

  it("returns 415 on non-JSON Content-Type and 413 on oversized or streaming payload without Content-Length", async () => {
    const nonJson = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ airQuality: MOCK_AIR_QUALITY, profile: MOCK_PROFILE }),
    });
    const nonJsonRes = await POST(nonJson);
    expect(nonJsonRes.status).toBe(415);
    expect(nonJsonRes.headers.get("Cache-Control")).toBe("no-store");

    const req = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(70_000) }),
    });
    expect((await POST(req)).status).toBe(413);

    // Streaming request without Content-Length header
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('{"padding":"'));
        controller.enqueue(encoder.encode("y".repeat(70_000)));
        controller.enqueue(encoder.encode('"}'));
        controller.close();
      },
    });
    const streamReq = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: stream,
      // @ts-expect-error Node fetch supports duplex on Request with ReadableStream
      duplex: "half",
    });
    expect((await POST(streamReq)).status).toBe(413);
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

    mockGenerateContent.mockRejectedValueOnce("non-error-failure");
    expect(
      (
        await POST(
          new Request("http://localhost:3000/api/plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              airQuality: MOCK_AIR_QUALITY,
              profile: MOCK_PROFILE,
              forceRefresh: true,
            }),
          }),
        )
      ).status,
    ).toBe(502);
  });
});
