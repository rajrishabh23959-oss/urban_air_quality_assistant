"use client";

import { useCallback, useState } from "react";
import { flattenPlanActions } from "@/lib/impact-calculator";
import type { ActionPlan } from "@/types";

/**
 * Manages adopted habit IDs for the interactive direct-impact simulator.
 */
export function useHabitSelection(plan: ActionPlan | null) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const initializeDefaults = useCallback((nextPlan: ActionPlan) => {
    setSelectedIds(
      new Set(
        flattenPlanActions(nextPlan)
          .slice(0, 3)
          .map((item) => item.id),
      ),
    );
  }, []);

  const handleToggleAction = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!plan) {
      return;
    }
    setSelectedIds(new Set(flattenPlanActions(plan).map((item) => item.id)));
  }, [plan]);

  const handleClearAll = useCallback(() => setSelectedIds(new Set()), []);

  return {
    selectedIds,
    initializeDefaults,
    handleToggleAction,
    handleSelectAll,
    handleClearAll,
  };
}
