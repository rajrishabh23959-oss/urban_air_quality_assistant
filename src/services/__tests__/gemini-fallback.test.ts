import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateActionPlan, generateAssistantReply, planCache } from "@/services/gemini";
import { MOCK_AIR_QUALITY, MOCK_PROFILE } from "@/test-fixtures/air-quality";

const mockGenerate = vi.fn();

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAIMock() {
      return { models: { generateContent: mockGenerate } };
    }),
  };
});

describe("gemini fallback branches", () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    planCache.clear();
    mockGenerate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adapts fallback action plan to walk_cycle, biomass_other, and HEPA purifier", async () => {
    const plan = await generateActionPlan(
      {
        ...MOCK_AIR_QUALITY,
        ventilationWindow: { ...MOCK_AIR_QUALITY.ventilationWindow, isSafe: false },
      },
      {
        ...MOCK_PROFILE,
        commute: "walk_cycle",
        cookingFuel: "biomass_other",
        hasHepaPurifier: true,
        vulnerableGroups: [],
      },
    );
    expect(plan.source).toBe("fallback");
    expect(plan.routines[0]?.action).toContain("Keep windows sealed");
    expect(plan.iaqHacks[1]?.steps).toContain("HEPA purifier");
    expect(plan.sustainableSwaps[0]?.sustainableAlternative).toContain("induction or LPG");

    const twoWheelerPlan = await generateActionPlan(MOCK_AIR_QUALITY, {
      ...MOCK_PROFILE,
      commute: "two_wheeler",
    });
    expect(twoWheelerPlan.routines[1]?.action).toContain("two wheeler");
  });

  it("adapts fallback action plan to induction cooking", async () => {
    const plan = await generateActionPlan(MOCK_AIR_QUALITY, {
      ...MOCK_PROFILE,
      cookingFuel: "induction",
    });
    expect(plan.sustainableSwaps[0]?.sustainableAlternative).toContain("clean induction");
  });

  it("handles window, notice, and general questions in fallback assistant", async () => {
    const noticeRes = await generateAssistantReply({
      message: "Draft a notice for my RWA",
      airQuality: MOCK_AIR_QUALITY,
      profile: MOCK_PROFILE,
      history: [],
    });
    expect(noticeRes.reply).toContain("Clean Air Advisory");

    const generalRes = await generateAssistantReply({
      message: "How to protect kids indoors?",
      airQuality: MOCK_AIR_QUALITY,
      profile: MOCK_PROFILE,
      history: [],
    });
    expect(generalRes.reply).toContain("DIY MERV-13");

    const hepaNoVulnRes = await generateAssistantReply({
      message: "How to stay safe indoors?",
      airQuality: MOCK_AIR_QUALITY,
      profile: { ...MOCK_PROFILE, hasHepaPurifier: true, vulnerableGroups: [] },
      history: [],
    });
    expect(hepaNoVulnRes.reply).toContain("run your HEPA purifier continuously");

    const unsafeWindowRes = await generateAssistantReply({
      message: "Should I open windows?",
      airQuality: {
        ...MOCK_AIR_QUALITY,
        ventilationWindow: { ...MOCK_AIR_QUALITY.ventilationWindow, isSafe: false },
      },
      profile: { ...MOCK_PROFILE, hasHepaPurifier: true, vulnerableGroups: [] },
      history: [],
    });
    expect(unsafeWindowRes.reply).toContain("Keep windows sealed");
  });

  it("enforces 15-second timeout on hung Gemini requests", async () => {
    vi.useFakeTimers();
    process.env.GEMINI_API_KEY = "timeout-test-key";
    mockGenerate.mockReturnValue(new Promise(() => {}));

    const pending = generateActionPlan(MOCK_AIR_QUALITY, MOCK_PROFILE, true);
    const assertion = expect(pending).rejects.toThrow("Gemini request timed out");
    await vi.advanceTimersByTimeAsync(15_001);
    await assertion;
  });

  it("falls back cleanly when Gemini returns non-object JSON and caches valid plans", async () => {
    process.env.GEMINI_API_KEY = "validation-test-key";
    mockGenerate.mockResolvedValueOnce({ text: "123" });

    const assistantFallback = await generateAssistantReply({
      message: "Should I open windows?",
      airQuality: MOCK_AIR_QUALITY,
      profile: MOCK_PROFILE,
      history: [],
    });
    expect(assistantFallback.source).toBe("fallback");
    expect(assistantFallback.reply).toContain("could not be validated");

    mockGenerate.mockResolvedValueOnce({ text: "123" });
    const planFallback = await generateActionPlan(MOCK_AIR_QUALITY, MOCK_PROFILE, false);
    expect(planFallback.source).toBe("fallback");

    // Second call with forceRefresh = false hits planCache without invoking Gemini again
    const cachedPlan = await generateActionPlan(MOCK_AIR_QUALITY, MOCK_PROFILE, false);
    expect(cachedPlan).toEqual(planFallback);
    expect(mockGenerate).toHaveBeenCalledTimes(2);

    // Clear cache and test missing_key + forceRefresh=true on another key
    planCache.clear();
    process.env.GEMINI_API_KEY = "another-key";
    mockGenerate.mockResolvedValueOnce({
      text: '```json\n{"summary":"ok"}\n```',
    });
    const malformedButFenced = await generateActionPlan(MOCK_AIR_QUALITY, MOCK_PROFILE, true);
    expect(malformedButFenced.source).toBe("fallback");

    // Non-Error thrown during JSON parsing in both plan and assistant
    vi.spyOn(JSON, "parse").mockImplementationOnce(() => {
      throw "non-error-json-parse";
    });
    mockGenerate.mockResolvedValueOnce({ text: "{}" });
    expect((await generateActionPlan(MOCK_AIR_QUALITY, MOCK_PROFILE, true)).source).toBe(
      "fallback",
    );

    vi.spyOn(JSON, "parse").mockImplementationOnce(() => {
      throw "non-error-json-parse";
    });
    mockGenerate.mockResolvedValueOnce({ text: "{}" });
    expect(
      (
        await generateAssistantReply({
          message: "Should I open windows?",
          airQuality: MOCK_AIR_QUALITY,
          profile: MOCK_PROFILE,
          history: [],
        })
      ).source,
    ).toBe("fallback");
  });
});
