"use client";

import { useMemo } from "react";
import { Activity, CloudOff, ShieldCheck, Users } from "lucide-react";
import { calculateCumulativeImpact } from "@/lib/impact-calculator";
import type { ActionPlan, HouseholdProfile } from "@/types";

interface ImpactSimulatorProps {
  plan: ActionPlan | null;
  selectedIds: ReadonlySet<string>;
  currentPm25: number;
  profile: HouseholdProfile;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export function ImpactSimulator({
  plan,
  selectedIds,
  currentPm25,
  profile,
  onSelectAll,
  onClearAll,
}: ImpactSimulatorProps) {
  const summary = useMemo(() => {
    if (!plan) {
      return null;
    }
    return calculateCumulativeImpact(plan, selectedIds, currentPm25, profile);
  }, [plan, selectedIds, currentPm25, profile]);

  if (!summary) {
    return null;
  }

  return (
    <section
      aria-labelledby="simulator-heading"
      aria-live="polite"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="simulator-heading" className="text-lg font-bold text-slate-900">
            Interactive Direct-Impact Simulator
          </h2>
          <p className="mt-0.5 text-xs text-slate-700">
            Check off routines, IAQ hacks, and swaps below to calculate your personal and neighborhood impact ({summary.selectedCount}/{summary.totalCount} active).
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-900">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            <span className="text-xs font-bold uppercase">Exposure Reduction</span>
          </div>
          <p className="mt-1 text-3xl font-extrabold text-emerald-950">
            {summary.exposureReductionPercent}%
          </p>
          <p className="mt-1 text-xs text-emerald-900">
            ~{summary.personalPm25ReductionUgPerDay} µg/day PM2.5 avoided
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-950">
            <Activity aria-hidden="true" className="h-4 w-4" />
            <span className="text-xs font-bold uppercase">Lung Relief Equivalent</span>
          </div>
          <p className="mt-1 text-3xl font-extrabold text-amber-950">
            {summary.equivalentCigarettesAvoidedPerDay}
          </p>
          <p className="mt-1 text-xs text-amber-950">
            equivalent cigarettes avoided/day
          </p>
        </div>

        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2 text-sky-950">
            <CloudOff aria-hidden="true" className="h-4 w-4" />
            <span className="text-xs font-bold uppercase">Weekly CO2e Saved</span>
          </div>
          <p className="mt-1 text-3xl font-extrabold text-sky-950">
            {summary.weeklyCo2eSavedKg} kg
          </p>
          <p className="mt-1 text-xs text-sky-950">
            {summary.monthlyPm25AvoidedG} g local PM2.5/month avoided
          </p>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center gap-2 text-indigo-950">
            <Users aria-hidden="true" className="h-4 w-4" />
            <span className="text-xs font-bold uppercase">
              If {summary.communityHouseholds} Neighbors Join
            </span>
          </div>
          <p className="mt-1 text-3xl font-extrabold text-indigo-950">
            {summary.communityWeeklyCo2eSavedKg} kg
          </p>
          <p className="mt-1 text-xs text-indigo-950">
            CO2e/week &amp; {summary.communityMonthlyPm25AvoidedKg} kg PM2.5/mo avoided
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-600">
        Methodology: Exposure reduction compares summed µg/day PM2.5 avoided against a 12 m³/day adult inhalation baseline (capped at 85% realistic indoor/outdoor saturation).
      </p>
    </section>
  );
}
