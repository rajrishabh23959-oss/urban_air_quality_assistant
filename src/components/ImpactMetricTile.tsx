"use client";

import type { ReactNode } from "react";

interface ImpactMetricTileProps {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  containerClass: string;
  textClass: string;
}

/**
 * High-contrast summary metric tile for the interactive direct-impact simulator.
 */
export function ImpactMetricTile({
  icon,
  title,
  value,
  detail,
  containerClass,
  textClass,
}: ImpactMetricTileProps) {
  return (
    <div className={`rounded-xl border p-4 ${containerClass}`}>
      <div className={`flex items-center gap-2 ${textClass}`}>
        {icon}
        <span className="text-xs font-bold uppercase">{title}</span>
      </div>
      <p className={`mt-1 text-3xl font-extrabold ${textClass}`}>{value}</p>
      <p className={`mt-1 text-xs ${textClass}`}>{detail}</p>
    </div>
  );
}
