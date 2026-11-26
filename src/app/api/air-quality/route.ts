import { AirQualityQuerySchema } from "@/types";
import { apiJson, checkApiRateLimit } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { aqiRateLimiter } from "@/lib/rate-limit";
import { fetchAirQualitySnapshot, UpstreamServiceError } from "@/services/open-meteo";

/**
 * Live and 24-hour hourly air quality endpoint backed by Open-Meteo.
 */
export async function GET(request: Request) {
  const rate = checkApiRateLimit(
    request,
    aqiRateLimiter,
    "Rate limit exceeded for air quality lookups. Please retry shortly.",
  );
  if (!rate.allowed) {
    return rate.response;
  }

  const { searchParams } = new URL(request.url);
  const parsed = AirQualityQuerySchema.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
    name: searchParams.get("name") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    admin1: searchParams.get("admin1") ?? undefined,
    refresh: searchParams.get("refresh") ?? undefined,
  });
  if (!parsed.success) {
    return apiJson({ error: "Invalid coordinates or location parameters." }, 400, rate.headers);
  }

  const forceRefresh = parsed.data.refresh === "true";
  try {
    const snapshot = await fetchAirQualitySnapshot(
      {
        name: parsed.data.name,
        country: parsed.data.country,
        admin1: parsed.data.admin1,
        latitude: parsed.data.lat,
        longitude: parsed.data.lon,
        timezone: "auto",
      },
      forceRefresh,
    );
    const cache = forceRefresh ? "no-store" : "public, max-age=300, stale-while-revalidate=60";
    return apiJson(snapshot, 200, rate.headers, cache);
  } catch (error) {
    logger.error("Air quality route error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const status = error instanceof UpstreamServiceError ? 502 : 500;
    return apiJson(
      { error: "Unable to retrieve live air quality data. Please try again." },
      status,
      rate.headers,
    );
  }
}
