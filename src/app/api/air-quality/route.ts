import { NextResponse } from "next/server";
import { AirQualityQuerySchema } from "@/types";
import {
  aqiRateLimiter,
  buildRateLimitHeaders,
  getClientIdentifier,
} from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { fetchAirQualitySnapshot, UpstreamServiceError } from "@/services/open-meteo";

export async function GET(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = aqiRateLimiter.check(clientId);
  const rateHeaders = buildRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded for air quality lookups. Please retry shortly." },
      { status: 429, headers: rateHeaders },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = AirQualityQuerySchema.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
    name: searchParams.get("name") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    admin1: searchParams.get("admin1") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid coordinates or location parameters." },
      { status: 400, headers: rateHeaders },
    );
  }

  try {
    const snapshot = await fetchAirQualitySnapshot({
      name: parsed.data.name,
      country: parsed.data.country,
      admin1: parsed.data.admin1,
      latitude: parsed.data.lat,
      longitude: parsed.data.lon,
      timezone: "auto",
    });

    return NextResponse.json(snapshot, { status: 200, headers: rateHeaders });
  } catch (error) {
    logger.error("Air quality route error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const status = error instanceof UpstreamServiceError ? 502 : 500;
    return NextResponse.json(
      { error: "Unable to retrieve live air quality data. Please try again." },
      { status, headers: rateHeaders },
    );
  }
}
