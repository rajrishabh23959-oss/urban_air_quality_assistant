"use client";

import { Sparkles } from "lucide-react";
import { flattenPlanActions } from "@/lib/impact-calculator";
import type { ActionPlan } from "@/types";
import { ActionPillarSection } from "./ActionPillarSection";
import { CommunityAdvisoryCard } from "./CommunityAdvisoryCard";

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

function ActionPlanHeader({
  plan,
  isLoading,
  onRegenerate,
}: {
  plan: ActionPlan | null;
  isLoading: boolean;
  onRegenerate: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 id="plan-heading" className="text-xl font-bold text-slate-900">
            GenAI Tailored Action Plan
          </h2>
          {plan && (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                plan.source === "gemini"
                  ? "border-sky-300 bg-sky-100 text-sky-950"
                  : "border-slate-300 bg-slate-100 text-slate-900"
              }`}
            >
              {plan.source === "gemini" ? "Powered by Gemini 2.5 Flash" : "Offline Fallback Mode"}
            </span>
          )}
        </div>
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
  );
}

/**
 * Displays the 3-pillar GenAI tailored action plan, source badge, and community advisory.
 */
export function ActionPlanView({
  plan,
  isLoading,
  error,
  selectedIds,
  onToggleAction,
  onRegenerate,
}: ActionPlanViewProps) {
  const totalRecommendations = plan ? flattenPlanActions(plan).length : 0;

  return (
    <section aria-labelledby="plan-heading" aria-busy={isLoading} className="space-y-6">
      <p className="sr-only" role="status" aria-live="polite">
        {plan && !isLoading
          ? `Tailored action plan loaded with ${totalRecommendations} recommendations.`
          : ""}
      </p>
      <ActionPlanHeader plan={plan} isLoading={isLoading} onRegenerate={onRegenerate} />
      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          role="alert"
        >
          {error}
        </div>
      )}
      {isLoading && !plan && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      )}
      {plan && (
        <div className="space-y-8">
          <ActionPillarSection
            heading="1. Low-Emission Daily Routines"
            items={plan.routines.map((r) => ({
              id: r.id,
              badge: r.timeSlot,
              title: r.title,
              description: r.action,
              impact: r.impact,
            }))}
            selectedIds={selectedIds}
            onToggleAction={onToggleAction}
          />
          <ActionPillarSection
            heading="2. Indoor Air Quality (IAQ) Hacks"
            items={plan.iaqHacks.map((h) => ({
              id: h.id,
              badge: `${BUDGET_LABELS[h.budgetTier]} • ${h.estimatedCost}`,
              title: h.title,
              description: h.steps,
              impact: h.impact,
            }))}
            selectedIds={selectedIds}
            onToggleAction={onToggleAction}
          />
          <ActionPillarSection
            heading="3. Sustainable Alternatives"
            items={plan.sustainableSwaps.map((s) => ({
              id: s.id,
              badge: s.domain.replace("_", " ").toUpperCase(),
              title: s.title,
              subtitle: `Instead of: ${s.currentHabit}`,
              description: s.sustainableAlternative,
              impact: s.impact,
            }))}
            selectedIds={selectedIds}
            onToggleAction={onToggleAction}
          />
          {plan.communityAdvisory && <CommunityAdvisoryCard advisory={plan.communityAdvisory} />}
        </div>
      )}
    </section>
  );
}
