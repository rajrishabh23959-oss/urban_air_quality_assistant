import { NextResponse } from "next/server";
import {
  buildRateLimitHeaders,
  getClientIdentifier,
  type SlidingWindowRateLimiter,
} from "@/lib/rate-limit";

export type RateLimitCheck =
  { allowed: true; headers: Record<string, string> } | { allowed: false; response: NextResponse };

/**
 * Evaluates a sliding-window rate limit for an incoming API request and returns
 * either standard rate-limit headers or a pre-built 429 NextResponse.
 */
export function checkApiRateLimit(
  request: Request,
  limiter: SlidingWindowRateLimiter,
  errorMessage: string,
): RateLimitCheck {
  const clientId = getClientIdentifier(request);
  const result = limiter.check(clientId);
  const headers = buildRateLimitHeaders(result);

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: errorMessage },
        { status: 429, headers: { ...headers, "Cache-Control": "no-store" } },
      ),
    };
  }

  return { allowed: true, headers };
}

/**
 * Builds a JSON NextResponse with rate-limit headers and explicit Cache-Control policy.
 */
export function apiJson(
  data: unknown,
  status: number,
  rateHeaders: Record<string, string>,
  cacheControl = "no-store",
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { ...rateHeaders, "Cache-Control": cacheControl },
  });
}
