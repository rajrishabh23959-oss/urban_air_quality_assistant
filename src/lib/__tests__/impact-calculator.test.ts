import { describe, expect, it } from "vitest";
import { calculateCumulativeImpact, flattenPlanActions } from "@/lib/impact-calculator";
import { MOCK_PLAN, MOCK_PROFILE } from "@/test-fixtures/air-quality";

describe("impact-calculator", () => {
  it("flattens all 3 pillars into a single list", () => {
    const items = flattenPlanActions(MOCK_PLAN);
    expect(items).toHaveLength(9);
  });

  it("returns zeroes when no actions are selected", () => {
    const summary = calculateCumulativeImpact(MOCK_PLAN, new Set(), 145, MOCK_PROFILE);
    expect(summary.selectedCount).toBe(0);
    expect(summary.exposureReductionPercent).toBe(0);
    expect(summary.weeklyCo2eSavedKg).toBe(0);
    expect(summary.communityWeeklyCo2eSavedKg).toBe(0);
  });

  it("computes cumulative exposure reduction, CO2e savings, and community scaling", () => {
    const selected = new Set(["r1", "r2", "i2"]);
    const summary = calculateCumulativeImpact(MOCK_PLAN, selected, 100, MOCK_PROFILE);

    // 180 + 220 + 300 = 700 ug/day; baseline = 100 * 12 = 1200 -> 58%
    expect(summary.selectedCount).toBe(3);
    expect(summary.personalPm25ReductionUgPerDay).toBe(700);
    expect(summary.householdSize).toBe(4);
    expect(summary.householdPm25ReductionUgPerDay).toBe(2800);
    expect(summary.exposureReductionPercent).toBe(58);
    expect(summary.equivalentCigarettesAvoidedPerDay).toBe(3.2);
    expect(summary.weeklyCo2eSavedKg).toBe(10.6);
    expect(summary.communityWeeklyCo2eSavedKg).toBe(530);

    const sixMemberSummary = calculateCumulativeImpact(MOCK_PLAN, selected, 100, {
      ...MOCK_PROFILE,
      householdSize: 6,
    });
    expect(sixMemberSummary.householdPm25ReductionUgPerDay).toBe(4200);
  });

  it("caps exposure reduction at 85% for extreme savings", () => {
    const allIds = new Set(flattenPlanActions(MOCK_PLAN).map((i) => i.id));
    const summary = calculateCumulativeImpact(MOCK_PLAN, allIds, 10, MOCK_PROFILE);
    expect(summary.exposureReductionPercent).toBe(85);
  });
});
