import {
  ActionPlanSchema,
  AirQualitySnapshotSchema,
  AssistantResponseSchema,
  LocationSchema,
  type ActionPlan,
  type AirQualitySnapshot,
  type AssistantRequest,
  type AssistantResponse,
  type HouseholdProfile,
  type Location,
} from "@/types";
import { z } from "zod";

const GeocodeApiResponseSchema = z.object({
  results: z.array(LocationSchema),
});

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const err = (payload as { error?: unknown }).error;
    if (typeof err === "string" && err.trim().length > 0) {
      return err;
    }
  }
  return fallback;
}

/**
 * Searches matching cities via /api/geocode with runtime Zod validation.
 */
export async function searchCitiesApi(query: string, signal?: AbortSignal): Promise<Location[]> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { signal });
  const raw: unknown = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(raw, "Could not search cities"));
  }
  const parsed = GeocodeApiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Received invalid city search data.");
  }
  return parsed.data.results;
}

/**
 * Fetches live and 24-hour air quality data via /api/air-quality with runtime Zod validation.
 */
export async function fetchAirQualityApi(
  target: Location,
  forceRefresh: boolean,
  signal?: AbortSignal,
): Promise<AirQualitySnapshot> {
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

  const res = await fetch(`/api/air-quality?${params.toString()}`, { signal });
  const raw: unknown = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(raw, "Could not load air quality data."));
  }
  const parsed = AirQualitySnapshotSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Received invalid air quality response.");
  }
  return parsed.data;
}

/**
 * Requests a tailored 3-pillar action plan via /api/plan with runtime Zod validation.
 */
export async function fetchActionPlanApi(
  airQuality: AirQualitySnapshot,
  profile: HouseholdProfile,
  forceRefresh: boolean,
  signal?: AbortSignal,
): Promise<ActionPlan> {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      airQuality,
      profile,
      ...(forceRefresh ? { forceRefresh: true } : {}),
    }),
    signal,
  });
  const raw: unknown = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(raw, "Unable to generate action plan."));
  }
  const parsed = ActionPlanSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Received invalid action plan response.");
  }
  return parsed.data;
}

/**
 * Sends a grounded question to /api/assistant with runtime Zod validation.
 */
export async function fetchAssistantApi(
  payload: AssistantRequest,
  signal?: AbortSignal,
): Promise<AssistantResponse> {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  const raw: unknown = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(raw, "Assistant request failed."));
  }
  const parsed = AssistantResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Received invalid assistant response.");
  }
  return parsed.data;
}
