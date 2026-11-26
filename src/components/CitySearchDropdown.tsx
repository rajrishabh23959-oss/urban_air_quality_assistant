"use client";

import { MapPin } from "lucide-react";
import type { Location } from "@/types";

interface CitySearchDropdownProps {
  listboxId: string;
  results: Location[];
  activeIndex: number;
  onSelect: (location: Location) => void;
}

/**
 * Accessible listbox dropdown displaying matching geocoded cities.
 */
export function CitySearchDropdown({
  listboxId,
  results,
  activeIndex,
  onSelect,
}: CitySearchDropdownProps) {
  return (
    <div
      id={listboxId}
      role="listbox"
      aria-label="Matching cities"
      className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
    >
      {results.map((loc, index) => (
        <button
          key={`${loc.name}-${loc.latitude}-${loc.longitude}`}
          id={`${listboxId}-opt-${index}`}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          onClick={() => onSelect(loc)}
          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
            index === activeIndex
              ? "bg-sky-50 font-semibold text-sky-900"
              : "text-slate-800 hover:bg-slate-50"
          }`}
        >
          <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
          <span>
            {loc.name}
            {loc.admin1 ? `, ${loc.admin1}` : ""}, {loc.country}
          </span>
        </button>
      ))}
    </div>
  );
}
