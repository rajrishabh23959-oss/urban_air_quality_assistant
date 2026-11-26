import {
  AirQualitySnapshotSchema,
  OpenMeteoAirQualityResponseSchema,
  OpenMeteoGeocodeResponseSchema,
  type AirQualitySnapshot,
  type HourlyPoint,
  type Location,
} from "@/types";
import { assessInversionRisk, classifyUsAqi, findSafeVentilationWindow } from "@/lib/aqi";
import { TtlLruCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

const GEOCODE_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const AIR_QUALITY_BASE_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const ALLOWED_UPSTREAM_HOSTS = new Set([
  "geocoding-api.open-meteo.com",
  "air-quality-api.open-meteo.com",
]);
const REQUEST_TIMEOUT_MS = 8000;

export const geocodeCache = new TtlLruCache<Location[]>(200, 60 * 60 * 1000);
export const airQualityCache = new TtlLruCache<AirQualitySnapshot>(200, 10 * 60 * 1000);

/** Error thrown when an upstream Open-Meteo API call fails or returns invalid data. */
export class UpstreamServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpstreamServiceError";
  }
}

async function fetchJsonWithTimeout(url: URL): Promise<unknown> {
  if (!ALLOWED_UPSTREAM_HOSTS.has(url.hostname) || url.protocol !== "https:") {
    throw new UpstreamServiceError("Blocked disallowed upstream host");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new UpstreamServiceError(`Upstream API returned status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof UpstreamServiceError) {
      throw error;
    }
    const reason = error instanceof Error ? error.message : "Unknown network error";
    throw new UpstreamServiceError(`Failed to reach Open-Meteo service: ${reason}`);
  } finally {
    clearTimeout(timer);
  }
}

function safeMetric(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return 0;
  }
  return Number(value.toFixed(1));
}

function parseHourlyPoints(
  hourly: ReturnType<typeof OpenMeteoAirQualityResponseSchema.parse>["hourly"],
): HourlyPoint[] {
  const points: HourlyPoint[] = [];
  const total = Math.min(24, hourly.time.length);
  for (let i = 0; i < total; i += 1) {
    const time = hourly.time[i];
    if (!time) {
      continue;
    }
    points.push({
      time,
      pm25: safeMetric(hourly.pm2_5[i]),
      pm10: safeMetric(hourly.pm10[i]),
      no2: safeMetric(hourly.nitrogen_dioxide[i]),
      so2: safeMetric(hourly.sulphur_dioxide[i]),
      o3: safeMetric(hourly.ozone[i]),
      co: safeMetric(hourly.carbon_monoxide[i]),
      usAqi: Math.round(safeMetric(hourly.us_aqi[i])),
      europeanAqi: Math.round(safeMetric(hourly.european_aqi[i])),
    });
  }
  return points;
}

/**
 * Searches cities via Open-Meteo Geocoding API with 1-hour server-side caching.
 */
export async function searchCities(query: string): Promise<Location[]> {
  const normalized = query.trim().toLowerCase();
  const cached = geocodeCache.get(normalized);
  if (cached) {
    return cached;
  }

  const url = new URL(GEOCODE_BASE_URL);
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", "6");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const parsed = OpenMeteoGeocodeResponseSchema.safeParse(await fetchJsonWithTimeout(url));
  if (!parsed.success) {
    logger.warn("Invalid Open-Meteo geocode payload", { issues: parsed.error.issues.length });
    throw new UpstreamServiceError("Received malformed geocoding data from upstream");
  }

  const locations: Location[] = (parsed.data.results ?? []).map((item) => ({
    name: item.name,
    country: item.country,
    admin1: item.admin1,
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone ?? "auto",
  }));
  geocodeCache.set(normalized, locations);
  return locations;
}

/**
 * Fetches live and 24-hour hourly air quality data from Open-Meteo with 10-minute caching.
 */
export async function fetchAirQualitySnapshot(
  location: Location,
  forceRefresh = false,
): Promise<AirQualitySnapshot> {
  const cacheKey = `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
  if (!forceRefresh) {
    const cached = airQualityCache.get(cacheKey);
    if (cached) {
      return { ...cached, location: { ...location, timezone: cached.location.timezone } };
    }
  }

  const url = new URL(AIR_QUALITY_BASE_URL);
  const fields =
    "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi";
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("current", fields);
  url.searchParams.set("hourly", fields);
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", "auto");

  const parsed = OpenMeteoAirQualityResponseSchema.safeParse(await fetchJsonWithTimeout(url));
  if (!parsed.success) {
    logger.warn("Invalid Open-Meteo air quality payload", { issues: parsed.error.issues.length });
    throw new UpstreamServiceError("Received malformed air quality data from upstream");
  }

  const hourly24h = parseHourlyPoints(parsed.data.hourly);
  const firstHourly = hourly24h[0];
  if (!firstHourly) {
    throw new UpstreamServiceError("Open-Meteo returned no hourly air quality points");
  }

  const rawCur = parsed.data.current;
  const current: HourlyPoint = rawCur
    ? {
        time: rawCur.time,
        pm25: safeMetric(rawCur.pm2_5),
        pm10: safeMetric(rawCur.pm10),
        no2: safeMetric(rawCur.nitrogen_dioxide),
        so2: safeMetric(rawCur.sulphur_dioxide),
        o3: safeMetric(rawCur.ozone),
        co: safeMetric(rawCur.carbon_monoxide),
        usAqi: Math.round(safeMetric(rawCur.us_aqi)),
        europeanAqi: Math.round(safeMetric(rawCur.european_aqi)),
      }
    : firstHourly;

  const snapshot = AirQualitySnapshotSchema.parse({
    location: { ...location, timezone: parsed.data.timezone ?? location.timezone },
    fetchedAt: new Date().toISOString(),
    current,
    hourly24h,
    tierInfo: classifyUsAqi(current.usAqi),
    inversionRisk: assessInversionRisk(hourly24h),
    ventilationWindow: findSafeVentilationWindow(hourly24h),
  });
  airQualityCache.set(cacheKey, snapshot);
  return snapshot;
}
