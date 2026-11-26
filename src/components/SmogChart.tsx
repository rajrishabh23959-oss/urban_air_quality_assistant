"use client";

import { useState } from "react";
import { Table } from "lucide-react";
import type { HourlyPoint, VentilationWindow } from "@/types";

interface SmogChartProps {
  hourly24h: HourlyPoint[];
  ventilationWindow: VentilationWindow;
}

function formatHour(isoTime: string): string {
  const match = /T(\d{2}:\d{2})/.exec(isoTime);
  return match?.[1] ?? isoTime.slice(11, 16);
}

export function SmogChart({ hourly24h, ventilationWindow }: SmogChartProps) {
  const [showTable, setShowTable] = useState(false);

  if (hourly24h.length === 0) {
    return null;
  }

  const width = 640;
  const height = 200;
  const padX = 36;
  const padY = 20;
  const maxPm25 = Math.max(50, ...hourly24h.map((p) => p.pm25));

  const points = hourly24h.map((point, idx) => {
    const x =
      hourly24h.length === 1
        ? width / 2
        : padX + (idx / (hourly24h.length - 1)) * (width - padX * 2);
    const y = height - padY - (point.pm25 / maxPm25) * (height - padY * 2);
    return { x, y, point };
  });

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPoints = `${padX},${height - padY} ${polylinePoints} ${width - padX},${height - padY}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          24-Hour PM2.5 Smog Curve (µg/m³)
        </h3>
        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          aria-expanded={showTable}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
        >
          <Table aria-hidden="true" className="h-3.5 w-3.5" />
          <span>{showTable ? "Hide hourly table" : "View hourly data table"}</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-44 w-full overflow-visible"
          role="img"
          aria-label={`24-hour PM2.5 forecast chart. Peak PM2.5 is ${Math.round(
            Math.max(...hourly24h.map((p) => p.pm25)),
          )} micrograms per cubic meter. Cleanest ventilation window is ${ventilationWindow.startHour} to ${ventilationWindow.endHour}.`}
        >
          <line
            x1={padX}
            y1={height - padY}
            x2={width - padX}
            y2={height - padY}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <polygon points={areaPoints} fill="#0284c7" fillOpacity="0.14" />
          <polyline
            fill="none"
            stroke="#0369a1"
            strokeWidth="2.5"
            strokeLinejoin="round"
            points={polylinePoints}
          />
          {points.map(({ x, y, point }, idx) => {
            const hour = formatHour(point.time);
            const isVentHour =
              hour === ventilationWindow.startHour || hour === ventilationWindow.endHour;
            if (!isVentHour && idx % 4 !== 0 && idx !== points.length - 1) {
              return null;
            }
            return (
              <g key={point.time}>
                <circle
                  cx={x}
                  cy={y}
                  r={isVentHour ? 4.5 : 3}
                  fill={isVentHour ? "#059669" : "#0369a1"}
                />
                <text
                  x={x}
                  y={height - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#334155"
                >
                  {hour}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="mt-1 text-xs text-slate-700">
          Green markers indicate the cleanest ventilation window ({ventilationWindow.startHour}–
          {ventilationWindow.endHour}, avg {ventilationWindow.avgPm25} µg/m³).
        </p>
      </div>

      {showTable && (
        <div className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white">
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
                  <td className="px-3 py-1.5 font-mono">{formatHour(row.time)}</td>
                  <td className="px-3 py-1.5">{row.pm25}</td>
                  <td className="px-3 py-1.5">{row.pm10}</td>
                  <td className="px-3 py-1.5">{row.usAqi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
