"use client";

import { RefreshCw } from "lucide-react";
import type { AirQualitySnapshot } from "@/types";
import { AqiStatusCards } from "./AqiStatusCards";
import { PollutantMetricsGrid } from "./PollutantMetricsGrid";
import { SmogChartLazy } from "./SmogChartLazy";

interface AirQualityDashboardProps {
  snapshot: AirQualitySnapshot | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function AirQualityErrorState({ error, onRefresh }: { error: string; onRefresh: () => void }) {
  return (
    <section
      aria-labelledby="aqi-heading"
      className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm"
      role="alert"
    >
      <h2 id="aqi-heading" className="text-lg font-bold text-slate-900">
        Live Air Quality Unavailable
      </h2>
      <p className="mt-2 text-sm text-red-800">{error}</p>
      <button
        type="button"
        onClick={onRefresh}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        <span>Retry</span>
      </button>
    </section>
  );
}

function AirQualityLoadingState() {
  return (
    <section
      aria-labelledby="aqi-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-busy="true"
    >
      <h2 id="aqi-heading" className="text-lg font-bold text-slate-900">
        Loading Live Air Quality...
      </h2>
      <div className="mt-4 h-44 animate-pulse rounded-xl bg-slate-100" />
    </section>
  );
}

/**
 * Live air quality dashboard displaying US AQI, inversion risk, ventilation window,
 * pollutant readings, and the lazy-loaded 24-hour PM2.5 chart.
 */
export function AirQualityDashboard({
  snapshot,
  isLoading,
  error,
  onRefresh,
}: AirQualityDashboardProps) {
  if (error) return <AirQualityErrorState error={error} onRefresh={onRefresh} />;
  if (isLoading && !snapshot) return <AirQualityLoadingState />;
  if (!snapshot) return null;

  const { location, current, tierInfo, inversionRisk, ventilationWindow, hourly24h } = snapshot;

  return (
    <section
      aria-labelledby="aqi-heading"
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <p className="sr-only" role="status" aria-live="polite">
        {`${location.name}: US AQI ${current.usAqi}, ${tierInfo.label}.`}
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Live Winter Smog Intelligence
          </p>
          <h2 id="aqi-heading" className="mt-0.5 text-2xl font-bold text-slate-900">
            {location.name}
            {location.admin1 ? `, ${location.admin1}` : ""} ({location.country})
          </h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 disabled:opacity-60"
        >
          <RefreshCw
            aria-hidden="true"
            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>Refresh AQI</span>
        </button>
      </div>
      <AqiStatusCards
        usAqi={current.usAqi}
        tierInfo={tierInfo}
        inversionRisk={inversionRisk}
        ventilationWindow={ventilationWindow}
      />
      <PollutantMetricsGrid current={current} />
      <SmogChartLazy hourly24h={hourly24h} ventilationWindow={ventilationWindow} />
    </section>
  );
}
