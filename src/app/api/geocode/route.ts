import { GeocodeQuerySchema } from "@/types";
import { apiJson, checkApiRateLimit } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { aqiRateLimiter } from "@/lib/rate-limit";
import { searchCities, UpstreamServiceError } from "@/services/open-meteo";

/**
 * City geocoding lookup endpoint backed by Open-Meteo with 1-hour caching.
 */
export async function GET(request: Request) {
  const rate = checkApiRateLimit(
    request,
    aqiRateLimiter,
    "Too many city search requests. Please wait a moment and try again.",
  );
  if (!rate.allowed) {
    return rate.response;
  }

  const { searchParams } = new URL(request.url);
  const parsed = GeocodeQuerySchema.safeParse({ q: searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return apiJson(
      { error: "Invalid search query. Provide 2 to 80 characters." },
      400,
      rate.headers,
    );
  }

  try {
    const results = await searchCities(parsed.data.q);
    return apiJson(
      { results },
      200,
      rate.headers,
      "public, max-age=300, stale-while-revalidate=60",
    );
  } catch (error) {
    logger.error("Geocode route error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const status = error instanceof UpstreamServiceError ? 502 : 500;
    return apiJson(
      { error: "Unable to fetch city matches right now. Please try again." },
      status,
      rate.headers,
    );
  }
}
