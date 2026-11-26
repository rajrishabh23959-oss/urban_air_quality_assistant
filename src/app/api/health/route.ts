import { apiJson, checkApiRateLimit } from "@/lib/api-response";
import { healthRateLimiter } from "@/lib/rate-limit";

/**
 * Health check endpoint with lightweight sliding-window rate limiting.
 */
export async function GET(request: Request) {
  const rate = checkApiRateLimit(request, healthRateLimiter, "Too many health check requests.");
  if (!rate.allowed) {
    return rate.response;
  }

  return apiJson({ status: "ok", timestamp: new Date().toISOString() }, 200, rate.headers);
}
