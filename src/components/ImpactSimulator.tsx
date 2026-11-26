"use client";

import { useMemo } from "react";
import { Activity, CloudOff, ShieldCheck, Users } from "lucide-react";
import { calculateCumulativeImpact } from "@/lib/impact-calculator";
import type { ActionPlan, HouseholdProfile } from "@/types";
import { ImpactMetricTile } from "./ImpactMetricTile";

interface ImpactSimulatorProps {
  plan: ActionPlan | null;
  selectedIds: ReadonlySet<string>;
  currentPm25: number;
  profile: HouseholdProfile;
  onSelectAll: () => void;
  onClearAll: () => void;
}

function ImpactMetricsGrid({
  summary,
  familyDetail,
}: {
  summary: ReturnType<typeof calculateCumulativeImpact>;
  familyDetail: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ImpactMetricTile
        icon={<ShieldCheck aria-hidden="true" className="h-4 w-4" />}
        title="Exposure Reduction"
        value={`${summary.exposureReductionPercent}%`}
        detail={`~${summary.personalPm25ReductionUgPerDay} µg/day per person${familyDetail}`}
        containerClass="border-emerald-200 bg-emerald-50"
        textClass="text-emerald-950"
      />
      <ImpactMetricTile
        icon={<Activity aria-hidden="true" className="h-4 w-4" />}
        title="Lung Relief Equivalent"
        value={String(summary.equivalentCigarettesAvoidedPerDay)}
        detail="equivalent cigarettes avoided/day"
        containerClass="border-amber-200 bg-amber-50"
        textClass="text-amber-950"
      />
      <ImpactMetricTile
        icon={<CloudOff aria-hidden="true" className="h-4 w-4" />}
        title="Weekly CO2e Saved"
        value={`${summary.weeklyCo2eSavedKg} kg`}
        detail={`${summary.monthlyPm25AvoidedG} g local PM2.5/month avoided`}
        containerClass="border-sky-200 bg-sky-50"
        textClass="text-sky-950"
      />
      <ImpactMetricTile
        icon={<Users aria-hidden="true" className="h-4 w-4" />}
        title={`If ${summary.communityHouseholds} Neighbors Join`}
        value={`${summary.communityWeeklyCo2eSavedKg} kg`}
        detail={`CO2e/week & ${summary.communityMonthlyPm25AvoidedKg} kg PM2.5/mo avoided`}
        containerClass="border-indigo-200 bg-indigo-50"
        textClass="text-indigo-950"
      />
    </div>
  );
}

/**
 * Interactive habit-tracking simulator calculating personal, household, and community impact.
 */
export function ImpactSimulator({
  plan,
  selectedIds,
  currentPm25,
  profile,
  onSelectAll,
  onClearAll,
}: ImpactSimulatorProps) {
  const summary = useMemo(
    () => (plan ? calculateCumulativeImpact(plan, selectedIds, currentPm25, profile) : null),
    [plan, selectedIds, currentPm25, profile],
  );

  if (!summary) {
    return (
      <section
        aria-labelledby="simulator-heading"
        className="space-y-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 id="simulator-heading" className="text-lg font-bold text-slate-900">
          Interactive Direct-Impact Simulator
        </h2>
        <p className="text-xs text-slate-700">
          Preparing your personalized health and emission impact metrics...
        </p>
      </section>
    );
  }

  const familyDetail =
    profile.mode === "family"
      ? ` • ~${summary.householdPm25ReductionUgPerDay} µg/day across ${summary.householdSize} ${summary.householdSize === 1 ? "member" : "members"}`
      : "";

  return (
    <section
      aria-labelledby="simulator-heading"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <p className="sr-only" role="status" aria-live="polite">
        {`${summary.selectedCount} of ${summary.totalCount} habits active: ${summary.exposureReductionPercent}% exposure reduction, ${summary.weeklyCo2eSavedKg} kg CO2e saved per week.`}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="simulator-heading" className="text-lg font-bold text-slate-900">
            Interactive Direct-Impact Simulator
          </h2>
          <p className="mt-0.5 text-xs text-slate-700">
            Check off routines, IAQ hacks, and swaps below to calculate your personal and
            neighborhood impact ({summary.selectedCount}/{summary.totalCount} active).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            Clear
          </button>
        </div>
      </div>
      <ImpactMetricsGrid summary={summary} familyDetail={familyDetail} />
      <p className="text-xs text-slate-600">
        Methodology: Exposure reduction compares summed µg/day PM2.5 avoided against a 12 m³/day
        adult inhalation baseline (capped at 85% realistic indoor/outdoor saturation).
      </p>
    </section>
  );
}
