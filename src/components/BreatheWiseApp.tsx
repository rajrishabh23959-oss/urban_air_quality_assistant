"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Wind } from "lucide-react";
import { SMOG_HOTSPOT_PRESETS } from "@/lib/aqi";
import { flattenPlanActions } from "@/lib/impact-calculator";
import {
  DEFAULT_PROFILE,
  HouseholdProfileSchema,
  type ActionPlan,
  type AirQualitySnapshot,
  type HouseholdProfile,
  type Location,
} from "@/types";
import { ActionPlanView } from "./ActionPlanView";
import { AirQualityDashboard } from "./AirQualityDashboard";
import { AssistantChat } from "./AssistantChat";
import { CitySearch } from "./CitySearch";
import { ImpactSimulator } from "./ImpactSimulator";
import { ProfileForm } from "./ProfileForm";

const PROFILE_STORAGE_KEY = "breathewise_profile_v1";

export function BreatheWiseApp() {
  const [location, setLocation] = useState<Location>(SMOG_HOTSPOT_PRESETS[0]!);
  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [airQuality, setAirQuality] = useState<AirQualitySnapshot | null>(null);
  const [aqiLoading, setAqiLoading] = useState<boolean>(true);
  const [aqiError, setAqiError] = useState<string | null>(null);

  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [planLoading, setPlanLoading] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const aqiAbortRef = useRef<AbortController | null>(null);
  const planAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (saved) {
          const parsed = HouseholdProfileSchema.safeParse(JSON.parse(saved));
          if (parsed.success) {
            setProfile(parsed.data);
          }
        }
      } catch {
        // Ignore malformed localStorage state
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleProfileChange = useCallback((next: HouseholdProfile) => {
    setProfile(next);
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const loadAirQuality = useCallback(async (target: Location) => {
    aqiAbortRef.current?.abort();
    const controller = new AbortController();
    aqiAbortRef.current = controller;

    await Promise.resolve();
    if (controller.signal.aborted) {
      return;
    }

    setAqiLoading(true);
    setAqiError(null);

    try {
      const params = new URLSearchParams({
        lat: String(target.latitude),
        lon: String(target.longitude),
        name: target.name,
        country: target.country,
      });
      if (target.admin1) {
        params.set("admin1", target.admin1);
      }

      const res = await fetch(`/api/air-quality?${params.toString()}`, {
        signal: controller.signal,
      });
      const data = (await res.json()) as AirQualitySnapshot & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not load air quality data.");
      }
      setAirQuality(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setAqiError(err instanceof Error ? err.message : "Failed to load air quality.");
    } finally {
      setAqiLoading(false);
    }
  }, []);

  const loadPlan = useCallback(
    async (snapshot: AirQualitySnapshot, currentProfile: HouseholdProfile) => {
      planAbortRef.current?.abort();
      const controller = new AbortController();
      planAbortRef.current = controller;

      await Promise.resolve();
      if (controller.signal.aborted) {
        return;
      }

      setPlanLoading(true);
      setPlanError(null);

      try {
        const res = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ airQuality: snapshot, profile: currentProfile }),
          signal: controller.signal,
        });
        const data = (await res.json()) as ActionPlan & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Unable to generate action plan.");
        }
        setPlan(data);
        const defaultChecked = new Set(flattenPlanActions(data).slice(0, 3).map((i) => i.id));
        setSelectedIds(defaultChecked);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setPlanError(err instanceof Error ? err.message : "Failed to generate action plan.");
      } finally {
        setPlanLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAirQuality(location);
    }, 0);
    return () => {
      clearTimeout(timer);
      aqiAbortRef.current?.abort();
    };
  }, [location, loadAirQuality]);

  useEffect(() => {
    if (!airQuality) {
      return;
    }
    const timer = setTimeout(() => {
      void loadPlan(airQuality, profile);
    }, 0);
    return () => {
      clearTimeout(timer);
      planAbortRef.current?.abort();
    };
  }, [airQuality, profile, loadPlan]);

  function handleToggleAction(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (!plan) {
      return;
    }
    setSelectedIds(new Set(flattenPlanActions(plan).map((item) => item.id)));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-900 text-white">
              <Wind aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                BreatheWise
              </h1>
              <p className="text-xs text-slate-600">
                GenAI Winter Smog &amp; Urban Air Quality Assistant
              </p>
            </div>
          </div>

          <nav aria-label="Section shortcuts" className="flex flex-wrap gap-3 text-xs font-semibold">
            <a
              href="#aqi-heading"
              className="rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            >
              Live AQI
            </a>
            <a
              href="#simulator-heading"
              className="rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            >
              Impact Simulator
            </a>
            <a
              href="#plan-heading"
              className="rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            >
              Action Plan
            </a>
            <a
              href="#assistant-heading"
              className="rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            >
              AI Assistant
            </a>
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      >
        <section
          aria-label="City and location selector"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <CitySearch
            selectedLocation={location}
            onSelectLocation={setLocation}
            isLoading={aqiLoading}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AirQualityDashboard
              snapshot={airQuality}
              isLoading={aqiLoading}
              error={aqiError}
              onRefresh={() => void loadAirQuality(location)}
            />
          </div>
          <div>
            <ProfileForm profile={profile} onChange={handleProfileChange} />
          </div>
        </div>

        <ImpactSimulator
          plan={plan}
          selectedIds={selectedIds}
          currentPm25={airQuality?.current.pm25 ?? 50}
          profile={profile}
          onSelectAll={handleSelectAll}
          onClearAll={() => setSelectedIds(new Set())}
        />

        <ActionPlanView
          plan={plan}
          isLoading={planLoading}
          error={planError}
          selectedIds={selectedIds}
          onToggleAction={handleToggleAction}
          onRegenerate={() => {
            if (airQuality) {
              void loadPlan(airQuality, profile);
            }
          }}
        />

        <AssistantChat airQuality={airQuality} profile={profile} />
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          BreatheWise • Live air quality data powered by Open-Meteo • Tailored guidance powered by Gemini 2.5 Flash
        </div>
      </footer>
    </div>
  );
}
