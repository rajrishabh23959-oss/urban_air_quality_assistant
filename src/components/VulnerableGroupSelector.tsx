"use client";

import { VULNERABLE_OPTIONS } from "@/lib/profile-options";
import type { VulnerableGroup } from "@/types";

interface VulnerableGroupSelectorProps {
  selected: VulnerableGroup[];
  onToggle: (group: VulnerableGroup) => void;
}

/**
 * Accessible fieldset of checkboxes for vulnerable household/community member groups.
 */
export function VulnerableGroupSelector({ selected, onToggle }: VulnerableGroupSelectorProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
        Vulnerable Members
      </legend>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {VULNERABLE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => onToggle(opt.value)}
              className="h-4 w-4 rounded border-slate-300 text-sky-700 focus-visible:ring-sky-700"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
