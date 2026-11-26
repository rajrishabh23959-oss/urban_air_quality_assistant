"use client";

import { SMOG_HOTSPOT_PRESETS } from "@/lib/constants";
import type { Location } from "@/types";

interface HotspotPresetsProps {
  selectedLocation: Location;
  onSelect: (location: Location) => void;
}

export function HotspotPresets({ selectedLocation, onSelect }: HotspotPresetsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Winter smog hotspot presets">
      <span className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
        Hotspot presets:
      </span>
      {SMOG_HOTSPOT_PRESETS.map((preset) => {
        const isSelected =
          preset.name === selectedLocation.name && preset.country === selectedLocation.country;
        return (
          <button
            key={preset.name}
            type="button"
            onClick={() => onSelect(preset)}
            aria-pressed={isSelected}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 ${
              isSelected
                ? "border-sky-800 bg-sky-800 text-white"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            }`}
          >
            {preset.name}
          </button>
        );
      })}
    </div>
  );
}
