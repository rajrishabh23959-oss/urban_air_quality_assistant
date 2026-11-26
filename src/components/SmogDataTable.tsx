"use client";

import { formatHourLabel } from "@/lib/aqi";
import type { HourlyPoint } from "@/types";

interface SmogDataTableProps {
  hourly24h: HourlyPoint[];
}

/**
 * Keyboard-focusable, screen-reader-accessible hourly air quality data table.
 */
export function SmogDataTable({ hourly24h }: SmogDataTableProps) {
  return (
    <div
      role="region"
      aria-label="24-hour hourly air quality data table"
      tabIndex={0}
      className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
    >
      <table className="w-full text-left text-xs text-slate-800">
        <caption className="sr-only">24-hour hourly PM2.5 and US AQI forecast</caption>
        <thead className="sticky top-0 bg-slate-100 text-slate-900">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold">
              Time
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              PM2.5 (µg/m³)
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              PM10 (µg/m³)
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              US AQI
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {hourly24h.map((row) => (
            <tr key={row.time}>
              <td className="px-3 py-1.5 font-mono">{formatHourLabel(row.time)}</td>
              <td className="px-3 py-1.5">{row.pm25}</td>
              <td className="px-3 py-1.5">{row.pm10}</td>
              <td className="px-3 py-1.5">{row.usAqi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
