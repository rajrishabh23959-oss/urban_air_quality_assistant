import type { ActionPlan, HouseholdProfile, ImpactMetrics } from "@/types";

export interface FlattenedActionItem {
  id: string;
  pillar: "routine" | "iaq" | "swap";
  title: string;
  impact: ImpactMetrics;
}

export interface CumulativeImpactSummary {
  selectedCount: number;
  totalCount: number;
  householdSize: number;
  personalPm25ReductionUgPerDay: number;
  householdPm25ReductionUgPerDay: number;
  exposureReductionPercent: number;
  equivalentCigarettesAvoidedPerDay: number;
  weeklyCo2eSavedKg: number;
  monthlyPm25AvoidedG: number;
  communityHouseholds: number;
  communityWeeklyCo2eSavedKg: number;
  communityMonthlyPm25AvoidedKg: number;
}

/**
 * Flattens all three action-plan pillars into a unified list for the impact simulator.
 */
export function flattenPlanActions(plan: ActionPlan): FlattenedActionItem[] {
  return [
    ...plan.routines.map((item) => ({
      id: item.id,
      pillar: "routine" as const,
      title: item.title,
      impact: item.impact,
    })),
    ...plan.iaqHacks.map((item) => ({
      id: item.id,
      pillar: "iaq" as const,
      title: item.title,
      impact: item.impact,
    })),
    ...plan.sustainableSwaps.map((item) => ({
      id: item.id,
      pillar: "swap" as const,
      title: item.title,
      impact: item.impact,
    })),
  ];
}

/**
 * Calculates cumulative personal health exposure reduction, household-wide PM2.5 relief,
 * weekly emission savings, and community-scaled impact for the user's currently checked habits.
 */
export function calculateCumulativeImpact(
  plan: ActionPlan,
  selectedIds: ReadonlySet<string>,
  currentPm25: number,
  profile: HouseholdProfile,
): CumulativeImpactSummary {
  const allItems = flattenPlanActions(plan);
  const selectedItems = allItems.filter((item) => selectedIds.has(item.id));

  let personalPm25ReductionUgPerDay = 0;
  let weeklyCo2eSavedKg = 0;
  let monthlyPm25AvoidedG = 0;

  for (const item of selectedItems) {
    personalPm25ReductionUgPerDay += Math.max(0, item.impact.pm25ReductionUgPerDay);
    weeklyCo2eSavedKg += Math.max(0, item.impact.co2eSavedKgPerWeek);
    monthlyPm25AvoidedG += Math.max(0, item.impact.pm25AvoidedGPerMonth);
  }

  const baselineDailyInhaledUg = Math.max(60, Math.max(0, currentPm25) * 12);
  const rawPercent = (personalPm25ReductionUgPerDay / baselineDailyInhaledUg) * 100;
  const exposureReductionPercent = Math.min(85, Math.round(rawPercent));

  const equivalentCigarettesAvoidedPerDay = Number(
    (personalPm25ReductionUgPerDay / 220).toFixed(1),
  );

  const householdSize = Math.max(1, profile.householdSize);
  const roundedPersonal = Math.round(personalPm25ReductionUgPerDay);
  const householdPm25ReductionUgPerDay = Math.round(personalPm25ReductionUgPerDay * householdSize);

  const households = Math.max(1, profile.communityHouseholds);
  const communityWeeklyCo2eSavedKg = Number((weeklyCo2eSavedKg * households).toFixed(1));
  const communityMonthlyPm25AvoidedKg = Number(
    ((monthlyPm25AvoidedG * households) / 1000).toFixed(2),
  );

  return {
    selectedCount: selectedItems.length,
    totalCount: allItems.length,
    householdSize,
    personalPm25ReductionUgPerDay: roundedPersonal,
    householdPm25ReductionUgPerDay,
    exposureReductionPercent,
    equivalentCigarettesAvoidedPerDay,
    weeklyCo2eSavedKg: Number(weeklyCo2eSavedKg.toFixed(1)),
    monthlyPm25AvoidedG: Math.round(monthlyPm25AvoidedG),
    communityHouseholds: households,
    communityWeeklyCo2eSavedKg,
    communityMonthlyPm25AvoidedKg,
  };
}
