import { z, type ZodType } from "zod";
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

const GeocodeApiResponseSchema = z.object({
  results: z.array(LocationSchema),
});

const ErrorPayloadSchema = z.object({
  error: z.string().min(1),
});

function extractErrorMessage(payload: unknown, fallback: string): string {
  const parsed = ErrorPayloadSchema.safeParse(payload);
  return parsed.success ? parsed.data.error : fallback;
}

async function fetchValidatedJson<T>(
  url: string,
  schema: ZodType<T>,
  errorFallback: string,
  invalidMsg: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  const raw: unknown = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(raw, errorFallback));
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(invalidMsg);
  }
  return parsed.data;
}

/**
 * Searches matching cities via /api/geocode with runtime Zod validation.
 */
export async function searchCitiesApi(query: string, signal?: AbortSignal): Promise<Location[]> {
  const data = await fetchValidatedJson(
    `/api/geocode?q=${encodeURIComponent(query)}`,
    GeocodeApiResponseSchema,
    "Could not search cities",
    "Received invalid city search data.",
    { signal },
  );
  return data.results;
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

  return fetchValidatedJson(
    `/api/air-quality?${params.toString()}`,
    AirQualitySnapshotSchema,
    "Could not load air quality data.",
    "Received invalid air quality response.",
    { signal },
  );
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
  return fetchValidatedJson(
    "/api/plan",
    ActionPlanSchema,
    "Unable to generate action plan.",
    "Received invalid action plan response.",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        airQuality,
        profile,
        ...(forceRefresh ? { forceRefresh: true } : {}),
      }),
      signal,
    },
  );
}

/**
 * Sends a grounded question to /api/assistant with runtime Zod validation.
 */
export async function fetchAssistantApi(
  payload: AssistantRequest,
  signal?: AbortSignal,
): Promise<AssistantResponse> {
  return fetchValidatedJson(
    "/api/assistant",
    AssistantResponseSchema,
    "Assistant request failed.",
    "Received invalid assistant response.",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    },
  );
}
