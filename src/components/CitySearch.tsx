"use client";

import { useId, useRef } from "react";
import { LocateFixed, Search } from "lucide-react";
import { useCitySearch } from "@/hooks/useCitySearch";
import type { Location } from "@/types";
import { CitySearchDropdown } from "./CitySearchDropdown";
import { HotspotPresets } from "./HotspotPresets";

interface CitySearchProps {
  selectedLocation: Location;
  onSelectLocation: (location: Location) => void;
  isLoading: boolean;
}

function requestBrowserLocation(
  onSelect: (loc: Location) => void,
  onError: (msg: string | null) => void,
) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onError("Geolocation is not supported in this browser.");
    return;
  }
  onError(null);
  navigator.geolocation.getCurrentPosition(
    (pos) =>
      onSelect({
        name: "My Current Location",
        country: "Local",
        latitude: Number(pos.coords.latitude.toFixed(4)),
        longitude: Number(pos.coords.longitude.toFixed(4)),
        timezone: "auto",
      }),
    () => onError("Location permission denied. Choose a city or hotspot preset below."),
    { timeout: 8000 },
  );
}

function CitySearchStatus({
  isSearching,
  showNoResults,
  searchError,
  errorId,
}: {
  isSearching: boolean;
  showNoResults: boolean;
  searchError: string | null;
  errorId: string;
}) {
  return (
    <>
      {isSearching && (
        <p className="text-xs text-slate-600" aria-live="polite">
          Searching cities...
        </p>
      )}
      {showNoResults && (
        <p className="text-xs text-slate-700" aria-live="polite">
          No matching cities found. Try another city name or choose a hotspot preset.
        </p>
      )}
      {searchError && (
        <p id={errorId} className="text-xs font-medium text-red-700" role="alert">
          {searchError}
        </p>
      )}
    </>
  );
}

/**
 * Debounced city search combobox with browser geolocation and winter smog hotspot presets.
 */
export function CitySearch({ selectedLocation, onSelectLocation, isLoading }: CitySearchProps) {
  const inputId = useId();
  const listboxId = useId();
  const errorId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const search = useCitySearch(onSelectLocation, containerRef);
  const showNoResults =
    !search.isSearching &&
    !search.searchError &&
    search.isOpen &&
    search.results.length === 0 &&
    search.query.trim().length >= 2;

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <label htmlFor={inputId} className="block text-sm font-semibold text-slate-900">
            Search your city or neighborhood
          </label>
          <div className="relative mt-1.5">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500"
            />
            <input
              id={inputId}
              type="text"
              role="combobox"
              aria-expanded={search.isOpen && search.results.length > 0}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-invalid={Boolean(search.searchError)}
              aria-describedby={search.searchError ? errorId : undefined}
              aria-activedescendant={
                search.activeIndex >= 0 ? `${listboxId}-opt-${search.activeIndex}` : undefined
              }
              value={search.query}
              onChange={(e) => search.handleQueryChange(e.target.value)}
              onKeyDown={search.handleKeyDown}
              placeholder={`Current: ${selectedLocation.name}, ${selectedLocation.country}`}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-9 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            />
          </div>
          {search.isOpen && search.results.length > 0 && (
            <CitySearchDropdown
              listboxId={listboxId}
              results={search.results}
              activeIndex={search.activeIndex}
              onSelect={search.handleSelect}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => requestBrowserLocation(search.handleSelect, search.setSearchError)}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <LocateFixed aria-hidden="true" className="h-4 w-4 text-sky-700" />
          <span>Use my location</span>
        </button>
      </div>
      <CitySearchStatus
        isSearching={search.isSearching}
        showNoResults={showNoResults}
        searchError={search.searchError}
        errorId={errorId}
      />
      <HotspotPresets selectedLocation={selectedLocation} onSelect={search.handleSelect} />
    </div>
  );
}
