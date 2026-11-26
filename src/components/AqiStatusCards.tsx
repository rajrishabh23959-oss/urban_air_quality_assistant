"use client";

import { AlertTriangle, CheckCircle2, CloudFog, ShieldAlert, Wind } from "lucide-react";
import type { AqiTier, AqiTierInfo, InversionRisk, VentilationWindow } from "@/types";

interface AqiStatusCardsProps {
  usAqi: number;
  tierInfo: AqiTierInfo;
  inversionRisk: InversionRisk;
  ventilationWindow: VentilationWindow;
}

function TierIcon({ tier }: { tier: AqiTier }) {
  if (tier === "good") return <CheckCircle2 aria-hidden="true" className="h-5 w-5" />;
  if (tier === "moderate" || tier === "sensitive") {
    return <AlertTriangle aria-hidden="true" className="h-5 w-5" />;
  }
  return <ShieldAlert aria-hidden="true" className="h-5 w-5" />;
}

/**
 * Displays US AQI severity tier, winter inversion risk, and safe ventilation window cards.
 */
export function AqiStatusCards({
  usAqi,
  tierInfo,
  inversionRisk,
  ventilationWindow,
}: AqiStatusCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className={`rounded-xl border p-4 ${tierInfo.badgeClass}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wide uppercase">US AQI</span>
          <TierIcon tier={tierInfo.tier} />
        </div>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">{usAqi}</p>
        <p className="mt-1 text-sm font-bold">{tierInfo.label}</p>
        <p className="mt-1.5 text-xs leading-relaxed">{tierInfo.shortAdvice}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-slate-900">
          <CloudFog aria-hidden="true" className="h-4 w-4 text-amber-700" />
          <h3 className="text-sm font-bold">{inversionRisk.label}</h3>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-700">{inversionRisk.reason}</p>
        <p className="mt-2 text-xs font-semibold text-slate-900">
          Peak smog window: {inversionRisk.peakWindow}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Wind aria-hidden="true" className="h-4 w-4 text-emerald-700" />
          <h3 className="text-sm font-bold">Safe Ventilation Window</h3>
        </div>
        <p className="mt-2 text-lg font-bold text-slate-900">
          {ventilationWindow.startHour} – {ventilationWindow.endHour}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-700">
          {ventilationWindow.recommendation}
        </p>
      </div>
    </div>
  );
}
