"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { SMOG_HOTSPOT_PRESETS } from "@/lib/aqi";
import type { Location } from "@/types";

interface CitySearchProps {
  selectedLocation: Location;
  onSelectLocation: (location: Location) => void;
  isLoading: boolean;
}

export function CitySearch({ selectedLocation, onSelectLocation, isLoading }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const inputId = useId();
  const listboxId = useId();
  const errorId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideInteraction(event: MouseEvent | FocusEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("focusin", handleOutsideInteraction);
    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("focusin", handleOutsideInteraction);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Could not search cities");
        }
        const data = (await res.json()) as { results?: Location[] };
        setResults(data.results ?? []);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setSearchError("City search is temporarily unavailable.");
        setIsOpen(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function handleSelect(loc: Location) {
    onSelectLocation(loc);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleUseGeolocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setSearchError("Geolocation is not supported in this browser.");
      return;
    }
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSelect({
          name: "My Current Location",
          country: "Local",
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          timezone: "auto",
        });
      },
      () => {
        setSearchError("Location permission denied. Choose a city or hotspot preset below.");
      },
      { timeout: 8000 },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const chosen = results[activeIndex];
      if (chosen) {
        handleSelect(chosen);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

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
              aria-expanded={isOpen && results.length > 0}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-invalid={Boolean(searchError)}
              aria-describedby={searchError ? errorId : undefined}
              aria-activedescendant={
                activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
              }
              value={query}
              onChange={(e) => {
                const next = e.target.value;
                setQuery(next);
                if (next.trim().length < 2) {
                  setResults([]);
                  setIsOpen(false);
                  setSearchError(null);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Current: ${selectedLocation.name}, ${selectedLocation.country}`}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-9 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            />
          </div>

          {isOpen && results.length > 0 && (
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
                  onClick={() => handleSelect(loc)}
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
          )}
        </div>

        <button
          type="button"
          onClick={handleUseGeolocation}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <LocateFixed aria-hidden="true" className="h-4 w-4 text-sky-700" />
          <span>Use my location</span>
        </button>
      </div>

      {isSearching && (
        <p className="text-xs text-slate-600" aria-live="polite">
          Searching cities...
        </p>
      )}

      {searchError && (
        <p id={errorId} className="text-xs font-medium text-red-700" role="alert">
          {searchError}
        </p>
      )}

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
              onClick={() => handleSelect(preset)}
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
    </div>
  );
}
