"use client";

import { useState } from "react";
import { Table } from "lucide-react";
import { formatHourLabel } from "@/lib/aqi";
import type { HourlyPoint, VentilationWindow } from "@/types";
import { SmogDataTable } from "./SmogDataTable";

interface SmogChartProps {
  hourly24h: HourlyPoint[];
  ventilationWindow: VentilationWindow;
}

const CHART = { width: 640, height: 210, padLeft: 44, padRight: 24, padTop: 22, padBottom: 26 };

function computeChartPoints(hourly24h: HourlyPoint[]) {
  const maxPm25 = Math.max(50, Math.ceil(Math.max(...hourly24h.map((p) => p.pm25))));
  const plotW = CHART.width - CHART.padLeft - CHART.padRight;
  const plotH = CHART.height - CHART.padTop - CHART.padBottom;
  const points = hourly24h.map((point, idx) => ({
    x:
      hourly24h.length === 1
        ? CHART.padLeft + plotW / 2
        : CHART.padLeft + (idx / (hourly24h.length - 1)) * plotW,
    y: CHART.padTop + plotH - (point.pm25 / maxPm25) * plotH,
    point,
  }));
  const baselineY = CHART.padTop + plotH;
  const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${CHART.padLeft},${baselineY} ${polyline} ${CHART.padLeft + plotW},${baselineY}`;
  return {
    maxPm25,
    midPm25: Math.round(maxPm25 / 2),
    baselineY,
    midY: CHART.padTop + plotH / 2,
    points,
    polyline,
    area,
  };
}

function SmogChartSvg({ hourly24h, ventilationWindow }: SmogChartProps) {
  const { maxPm25, midPm25, baselineY, midY, points, polyline, area } =
    computeChartPoints(hourly24h);

  return (
    <svg
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      className="h-48 w-full overflow-visible"
      role="img"
      aria-label={`24-hour PM2.5 forecast chart. Peak PM2.5 is ${maxPm25} micrograms per cubic meter. Cleanest ventilation window is ${ventilationWindow.startHour} to ${ventilationWindow.endHour}.`}
    >
      {[
        { y: CHART.padTop, label: String(maxPm25) },
        { y: midY, label: String(midPm25) },
        { y: baselineY, label: "0" },
      ].map((t) => (
        <g key={t.label}>
          <line
            x1={CHART.padLeft}
            y1={t.y}
            x2={CHART.width - CHART.padRight}
            y2={t.y}
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray={t.label === "0" ? undefined : "3 3"}
          />
          <text x={CHART.padLeft - 6} y={t.y + 3} textAnchor="end" fontSize="10" fill="#475569">
            {t.label}
          </text>
        </g>
      ))}
      <polygon points={area} fill="#0284c7" fillOpacity="0.14" />
      <polyline
        fill="none"
        stroke="#0369a1"
        strokeWidth="2.5"
        strokeLinejoin="round"
        points={polyline}
      />
      {points.map(({ x, y, point }, idx) => {
        const hour = formatHourLabel(point.time);
        const isStart = hour === ventilationWindow.startHour;
        const isVent = isStart || hour === ventilationWindow.endHour;
        if (!isVent && idx % 4 !== 0 && idx !== points.length - 1) return null;
        return (
          <g key={point.time}>
            {isVent ? (
              <>
                <polygon
                  points={`${x},${y - 6} ${x + 6},${y} ${x},${y + 6} ${x - 6},${y}`}
                  fill="#059669"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {isStart && (
                  <text
                    x={x}
                    y={Math.max(12, y - 10)}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#065f46"
                  >
                    Best window
                  </text>
                )}
              </>
            ) : (
              <circle cx={x} cy={y} r={3} fill="#0369a1" />
            )}
            <text x={x} y={CHART.height - 6} textAnchor="middle" fontSize="10" fill="#334155">
              {hour}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Responsive 24-hour PM2.5 smog curve SVG chart with Y-axis labels, non-color-only
 * ventilation markers, and a toggleable accessible hourly data table.
 */
export function SmogChart({ hourly24h, ventilationWindow }: SmogChartProps) {
  const [showTable, setShowTable] = useState(false);
  if (hourly24h.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">24-Hour PM2.5 Smog Curve (µg/m³)</h3>
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
        <SmogChartSvg hourly24h={hourly24h} ventilationWindow={ventilationWindow} />
        <p className="mt-1 text-xs text-slate-700">
          Diamond markers (&ldquo;Best window&rdquo;) highlight the cleanest ventilation window (
          {ventilationWindow.startHour}–{ventilationWindow.endHour}, avg {ventilationWindow.avgPm25}{" "}
          µg/m³).
        </p>
      </div>
      {showTable && <SmogDataTable hourly24h={hourly24h} />}
    </div>
  );
}
