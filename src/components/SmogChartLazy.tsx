"use client";

import dynamic from "next/dynamic";
import type { HourlyPoint, VentilationWindow } from "@/types";

interface SmogChartLazyProps {
  hourly24h: HourlyPoint[];
  ventilationWindow: VentilationWindow;
}

export const SmogChartLazy = dynamic(() => import("./SmogChart").then((mod) => mod.SmogChart), {
  loading: () => (
    <div
      role="status"
      className="h-52 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100"
    >
      <span className="sr-only">Loading 24-hour smog chart</span>
    </div>
  ),
}) as React.ComponentType<SmogChartLazyProps>;
