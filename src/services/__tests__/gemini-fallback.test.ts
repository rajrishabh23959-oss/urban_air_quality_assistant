import { beforeEach, describe, expect, it } from "vitest";
import { generateActionPlan, generateAssistantReply, planCache } from "@/services/gemini";
import { MOCK_AIR_QUALITY, MOCK_PROFILE } from "@/test-fixtures/air-quality";

describe("gemini fallback branches", () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    planCache.clear();
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
});
