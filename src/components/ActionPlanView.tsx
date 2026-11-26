"use client";

import { Sparkles } from "lucide-react";
import type { ActionPlan } from "@/types";
import { CommunityAdvisoryCard } from "./CommunityAdvisoryCard";
import { ImpactCard } from "./ImpactCard";

interface ActionPlanViewProps {
  plan: ActionPlan | null;
  isLoading: boolean;
  error: string | null;
  selectedIds: ReadonlySet<string>;
  onToggleAction: (id: string) => void;
  onRegenerate: () => void;
}

const BUDGET_LABELS = {
  zero_cost: "Zero-Cost Hack",
  low_cost_diy: "Low-Cost DIY",
  device_optimization: "Device Optimization",
} as const;

export function ActionPlanView({
  plan,
  isLoading,
  error,
  selectedIds,
  onToggleAction,
  onRegenerate,
}: ActionPlanViewProps) {
  return (
    <section aria-labelledby="plan-heading" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="plan-heading" className="text-xl font-bold text-slate-900">
            GenAI Tailored Action Plan
          </h2>
          {plan && <p className="mt-1 text-sm text-slate-700">{plan.summary}</p>}
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          <span>{isLoading ? "Generating Plan..." : "Refresh AI Plan"}</span>
        </button>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          role="alert"
        >
          {error}
        </div>
      )}

      {isLoading && !plan && (
        <div className="grid gap-4 md:grid-cols-3" aria-busy="true">
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      )}

      {plan && (
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">1. Low-Emission Daily Routines</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {plan.routines.map((item) => (
                <ImpactCard
                  key={item.id}
                  id={item.id}
                  badge={item.timeSlot}
                  title={item.title}
                  description={item.action}
                  impact={item.impact}
                  isSelected={selectedIds.has(item.id)}
                  onToggle={onToggleAction}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              2. Indoor Air Quality (IAQ) Hacks
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {plan.iaqHacks.map((item) => (
                <ImpactCard
                  key={item.id}
                  id={item.id}
                  badge={`${BUDGET_LABELS[item.budgetTier]} • ${item.estimatedCost}`}
                  title={item.title}
                  description={item.steps}
                  impact={item.impact}
                  isSelected={selectedIds.has(item.id)}
                  onToggle={onToggleAction}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">3. Sustainable Alternatives</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {plan.sustainableSwaps.map((item) => (
                <ImpactCard
                  key={item.id}
                  id={item.id}
                  badge={item.domain.replace("_", " ").toUpperCase()}
                  title={item.title}
                  subtitle={`Instead of: ${item.currentHabit}`}
                  description={item.sustainableAlternative}
                  impact={item.impact}
                  isSelected={selectedIds.has(item.id)}
                  onToggle={onToggleAction}
                />
              ))}
            </div>
          </div>

          {plan.communityAdvisory && <CommunityAdvisoryCard advisory={plan.communityAdvisory} />}
        </div>
      )}
    </section>
  );
}
