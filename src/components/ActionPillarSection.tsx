"use client";

import type { ImpactMetrics } from "@/types";
import { ImpactCard } from "./ImpactCard";

export interface PillarCardItem {
  id: string;
  badge: string;
  title: string;
  description: string;
  subtitle?: string;
  impact: ImpactMetrics;
}

interface ActionPillarSectionProps {
  heading: string;
  items: PillarCardItem[];
  selectedIds: ReadonlySet<string>;
  onToggleAction: (id: string) => void;
}

/**
 * Renders one of the three action-plan pillars as a responsive grid of ImpactCards.
 */
export function ActionPillarSection({
  heading,
  items,
  selectedIds,
  onToggleAction,
}: ActionPillarSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-slate-900">{heading}</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <ImpactCard
            key={item.id}
            id={item.id}
            badge={item.badge}
            title={item.title}
            subtitle={item.subtitle}
            description={item.description}
            impact={item.impact}
            isSelected={selectedIds.has(item.id)}
            onToggle={onToggleAction}
          />
        ))}
      </div>
    </div>
  );
}
