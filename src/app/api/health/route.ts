import { NextResponse } from "next/server";
import { buildRateLimitHeaders, getClientIdentifier, healthRateLimiter } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = healthRateLimiter.check(clientId);
  const headers = {
    ...buildRateLimitHeaders(rateLimit),
    "Cache-Control": "no-store",
  };

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many health check requests." },
      { status: 429, headers },
    );
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers },
  );
}
