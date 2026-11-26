"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { AssistantChat } from "./AssistantChat";
import { CitySearch } from "./CitySearch";
import { ImpactSimulator } from "./ImpactSimulator";
import { ProfileForm } from "./ProfileForm";

const PROFILE_STORAGE_KEY = "breathewise_profile_v1";

export function BreatheWiseApp() {
  const [location, setLocation] = useState<Location>(SMOG_HOTSPOT_PRESETS[0]!);
  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [isProfileHydrated, setIsProfileHydrated] = useState(false);

  const [airQuality, setAirQuality] = useState<AirQualitySnapshot | null>(null);
  const [aqiLoading, setAqiLoading] = useState<boolean>(true);
  const [aqiError, setAqiError] = useState<string | null>(null);

  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [planLoading, setPlanLoading] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const aqiAbortRef = useRef<AbortController | null>(null);
  const planAbortRef = useRef<AbortController | null>(null);
  const hasLoadedInitialPlanRef = useRef(false);

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
      } finally {
        setIsProfileHydrated(true);
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

  const loadAirQuality = useCallback(async (target: Location, forceRefresh = false) => {
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
      if (forceRefresh) {
        params.set("refresh", "true");
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
    async (
      snapshot: AirQualitySnapshot,
      currentProfile: HouseholdProfile,
      forceRefresh = false,
    ) => {
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
          body: JSON.stringify({
            airQuality: snapshot,
            profile: currentProfile,
            ...(forceRefresh ? { forceRefresh: true } : {}),
          }),
          signal: controller.signal,
        });
        const data = (await res.json()) as ActionPlan & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Unable to generate action plan.");
        }
        setPlan(data);
        const defaultChecked = new Set(
          flattenPlanActions(data)
            .slice(0, 3)
            .map((i) => i.id),
        );
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
    if (!airQuality || !isProfileHydrated) {
      return;
    }
    const delayMs = hasLoadedInitialPlanRef.current ? 350 : 0;
    const timer = setTimeout(() => {
      hasLoadedInitialPlanRef.current = true;
      void loadPlan(airQuality, profile);
    }, delayMs);

    return () => {
      clearTimeout(timer);
      planAbortRef.current?.abort();
    };
  }, [airQuality, profile, isProfileHydrated, loadPlan]);

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

  const handleClearAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 focus:outline-none sm:px-6 lg:px-8"
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
              onRefresh={() => void loadAirQuality(location, true)}
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
          onClearAll={handleClearAll}
        />

        <ActionPlanView
          plan={plan}
          isLoading={planLoading}
          error={planError}
          selectedIds={selectedIds}
          onToggleAction={handleToggleAction}
          onRegenerate={() => {
            if (airQuality) {
              void loadPlan(airQuality, profile, true);
            }
          }}
        />

        <AssistantChat airQuality={airQuality} profile={profile} />
      </main>

      <AppFooter />
    </div>
  );
}
