"use client";

import { AlertTriangle, CheckCircle2, CloudFog, RefreshCw, ShieldAlert, Wind } from "lucide-react";
import type { AirQualitySnapshot, AqiTier } from "@/types";
import { SmogChartLazy } from "./SmogChartLazy";

interface AirQualityDashboardProps {
  snapshot: AirQualitySnapshot | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function TierIcon({ tier }: { tier: AqiTier }) {
  if (tier === "good") {
    return <CheckCircle2 aria-hidden="true" className="h-5 w-5" />;
  }
  if (tier === "moderate" || tier === "sensitive") {
    return <AlertTriangle aria-hidden="true" className="h-5 w-5" />;
  }
  return <ShieldAlert aria-hidden="true" className="h-5 w-5" />;
}

export function AirQualityDashboard({
  snapshot,
  isLoading,
  error,
  onRefresh,
}: AirQualityDashboardProps) {
  if (error) {
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

  if (isLoading && !snapshot) {
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

  if (!snapshot) {
    return null;
  }

  const { location, current, tierInfo, inversionRisk, ventilationWindow, hourly24h } = snapshot;

  return (
    <section
      aria-labelledby="aqi-heading"
      aria-live="polite"
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`rounded-xl border p-4 ${tierInfo.badgeClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase">US AQI</span>
            <TierIcon tier={tierInfo.tier} />
          </div>
          <p className="mt-1 text-4xl font-extrabold tracking-tight">{current.usAqi}</p>
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

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "PM2.5", value: `${current.pm25} µg/m³` },
          { label: "PM10", value: `${current.pm10} µg/m³` },
          { label: "NO2", value: `${current.no2} µg/m³` },
          { label: "O3", value: `${current.o3} µg/m³` },
          { label: "CO", value: `${current.co} µg/m³` },
          { label: "EU AQI", value: `${current.europeanAqi}` },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
          >
            <dt className="text-xs font-semibold text-slate-600">{metric.label}</dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-900">{metric.value}</dd>
          </div>
        ))}
      </dl>

      <SmogChartLazy hourly24h={hourly24h} ventilationWindow={ventilationWindow} />
    </section>
  );
}
