"use client";

import type { HourlyPoint } from "@/types";

interface PollutantMetricsGridProps {
  current: HourlyPoint;
}

/**
 * Displays live PM2.5, PM10, NO2, O3, CO, and European AQI pollutant readings.
 */
export function PollutantMetricsGrid({ current }: PollutantMetricsGridProps) {
  const metrics = [
    { label: "PM2.5", value: `${current.pm25} µg/m³` },
    { label: "PM10", value: `${current.pm10} µg/m³` },
    { label: "NO2", value: `${current.no2} µg/m³` },
    { label: "O3", value: `${current.o3} µg/m³` },
    { label: "CO", value: `${current.co} µg/m³` },
    { label: "EU AQI", value: `${current.europeanAqi}` },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
        >
          <dt className="text-xs font-semibold text-slate-600">{metric.label}</dt>
          <dd className="mt-0.5 text-sm font-bold text-slate-900">{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}
