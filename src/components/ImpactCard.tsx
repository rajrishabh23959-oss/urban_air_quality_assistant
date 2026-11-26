"use client";

import { HeartPulse, Leaf, Lightbulb } from "lucide-react";
import type { ImpactMetrics } from "@/types";

interface ImpactCardProps {
  id: string;
  badge: string;
  title: string;
  description: string;
  subtitle?: string;
  impact: ImpactMetrics;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export function ImpactCard({
  id,
  badge,
  title,
  description,
  subtitle,
  impact,
  isSelected,
  onToggle,
}: ImpactCardProps) {
  return (
    <article
      className={`flex flex-col justify-between rounded-2xl border p-4 transition-colors ${
        isSelected
          ? "border-emerald-500 bg-emerald-50/40 shadow-sm"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
            {badge}
          </span>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(id)}
              aria-label={`Adopt habit: ${title}`}
              className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus-visible:ring-emerald-700"
            />
            <span>{isSelected ? "Adopted" : "Adopt"}</span>
          </label>
        </div>

        <div>
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
          {subtitle && <p className="mt-0.5 text-xs font-medium text-slate-600">{subtitle}</p>}
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-xs">
        <div className="flex items-start gap-2 text-emerald-900">
          <HeartPulse aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          <span>
            <strong>Health Impact:</strong> {impact.healthImpact}
          </span>
        </div>
        <div className="flex items-start gap-2 text-sky-900">
          <Leaf aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
          <span>
            <strong>Emission Impact:</strong> {impact.emissionImpact}
          </span>
        </div>
        <div className="flex items-start gap-2 text-slate-700">
          <Lightbulb aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <span>
            <strong>Why It Works:</strong> {impact.whyItWorks}
          </span>
        </div>
      </div>
    </article>
  );
}
