"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchActionPlanApi, fetchAirQualityApi } from "@/lib/api-client";
import { DEFAULT_LOCATION } from "@/lib/constants";
import type { ActionPlan, AirQualitySnapshot, HouseholdProfile, Location } from "@/types";
import { useHabitSelection } from "./useHabitSelection";
import { usePersistedProfile } from "./usePersistedProfile";

async function runAbortableLoad<T>(
  abortRef: React.MutableRefObject<AbortController | null>,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  fallbackError: string,
  task: (signal: AbortSignal) => Promise<T>,
  onSuccess: (value: T) => void,
) {
  abortRef.current?.abort();
  const controller = new AbortController();
  abortRef.current = controller;
  await Promise.resolve();
  if (controller.signal.aborted) return;

  setLoading(true);
  setError(null);
  try {
    onSuccess(await task(controller.signal));
  } catch (err) {
    if (!(err instanceof DOMException && err.name === "AbortError")) {
      setError(err instanceof Error ? err.message : fallbackError);
    }
  } finally {
    if (abortRef.current === controller) {
      setLoading(false);
    }
  }
}

function useBreatheWiseEffects(
  location: Location,
  airQuality: AirQualitySnapshot | null,
  profile: HouseholdProfile,
  isProfileHydrated: boolean,
  loadAirQuality: (target: Location, forceRefresh?: boolean) => Promise<void>,
  loadPlan: (
    snapshot: AirQualitySnapshot,
    curProfile: HouseholdProfile,
    forceRefresh?: boolean,
  ) => Promise<void>,
  cancelAqi: () => void,
  cancelPlan: () => void,
) {
  const hasLoadedInitialPlanRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => void loadAirQuality(location), 0);
    return () => {
      clearTimeout(timer);
      cancelAqi();
    };
  }, [location, loadAirQuality, cancelAqi]);

  useEffect(() => {
    if (!airQuality || !isProfileHydrated) return;
    const delayMs = hasLoadedInitialPlanRef.current ? 350 : 0;
    const timer = setTimeout(() => {
      hasLoadedInitialPlanRef.current = true;
      void loadPlan(airQuality, profile);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      cancelPlan();
    };
  }, [airQuality, profile, isProfileHydrated, loadPlan, cancelPlan]);
}

/**
 * Orchestrates BreatheWise location, profile, live AQI, tailored plan fetching,
 * and habit simulator state with AbortController race-condition guards.
 */
export function useBreatheWiseData() {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const { profile, isProfileHydrated, handleProfileChange } = usePersistedProfile();
  const [airQuality, setAirQuality] = useState<AirQualitySnapshot | null>(null);
  const [aqiLoading, setAqiLoading] = useState(true);
  const [aqiError, setAqiError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const habits = useHabitSelection(plan);
  const aqiAbortRef = useRef<AbortController | null>(null);
  const planAbortRef = useRef<AbortController | null>(null);

  const loadAirQuality = useCallback(
    (target: Location, forceRefresh = false) =>
      runAbortableLoad(
        aqiAbortRef,
        setAqiLoading,
        setAqiError,
        "Failed to load air quality.",
        (signal) => fetchAirQualityApi(target, forceRefresh, signal),
        setAirQuality,
      ),
    [],
  );

  const loadPlan = useCallback(
    (snapshot: AirQualitySnapshot, curProfile: HouseholdProfile, forceRefresh = false) =>
      runAbortableLoad(
        planAbortRef,
        setPlanLoading,
        setPlanError,
        "Failed to generate action plan.",
        (signal) => fetchActionPlanApi(snapshot, curProfile, forceRefresh, signal),
        (nextPlan) => {
          setPlan(nextPlan);
          habits.initializeDefaults(nextPlan);
        },
      ),
    [habits],
  );

  const cancelAqi = useCallback(() => aqiAbortRef.current?.abort(), []);
  const cancelPlan = useCallback(() => planAbortRef.current?.abort(), []);
  useBreatheWiseEffects(
    location,
    airQuality,
    profile,
    isProfileHydrated,
    loadAirQuality,
    loadPlan,
    cancelAqi,
    cancelPlan,
  );

  return {
    location,
    setLocation,
    profile,
    handleProfileChange,
    airQuality,
    aqiLoading,
    aqiError,
    plan,
    planLoading,
    planError,
    ...habits,
    handleRefreshAqi: useCallback(
      () => void loadAirQuality(location, true),
      [location, loadAirQuality],
    ),
    handleRegeneratePlan: useCallback(() => {
      if (airQuality) void loadPlan(airQuality, profile, true);
    }, [airQuality, profile, loadPlan]),
  };
}
