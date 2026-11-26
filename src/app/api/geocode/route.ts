import { NextResponse } from "next/server";
import { GeocodeQuerySchema } from "@/types";
import { aqiRateLimiter, buildRateLimitHeaders, getClientIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { searchCities, UpstreamServiceError } from "@/services/open-meteo";

export async function GET(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = aqiRateLimiter.check(clientId);
  const rateHeaders = buildRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many city search requests. Please wait a moment and try again." },
      { status: 429, headers: rateHeaders },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = GeocodeQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search query. Provide 2 to 80 characters." },
      { status: 400, headers: rateHeaders },
    );
  }

  try {
    const results = await searchCities(parsed.data.q);
    return NextResponse.json({ results }, { status: 200, headers: rateHeaders });
  } catch (error) {
    logger.error("Geocode route error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const status = error instanceof UpstreamServiceError ? 502 : 500;
    return NextResponse.json(
      { error: "Unable to fetch city matches right now. Please try again." },
      { status, headers: rateHeaders },
    );
  }
}
