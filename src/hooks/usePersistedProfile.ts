"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PROFILE, HouseholdProfileSchema, type HouseholdProfile } from "@/types";

const PROFILE_STORAGE_KEY = "breathewise_profile_v1";

/**
 * Manages household/community profile state with Zod-validated localStorage persistence.
 */
export function usePersistedProfile() {
  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [isProfileHydrated, setIsProfileHydrated] = useState(false);

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

  return { profile, isProfileHydrated, handleProfileChange };
}
