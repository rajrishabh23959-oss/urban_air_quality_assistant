import { PlanRequestSchema } from "@/types";
import { apiJson, checkApiRateLimit } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { genAiRateLimiter } from "@/lib/rate-limit";
import { readJsonWithLimit } from "@/lib/request-guard";
import { generateActionPlan } from "@/services/gemini";

const MAX_PLAN_PAYLOAD_BYTES = 65_536;

/**
 * Generates a tailored 3-pillar winter smog action plan via Gemini 2.5 Flash.
 */
export async function POST(request: Request) {
  const rate = checkApiRateLimit(
    request,
    genAiRateLimiter,
    "Too many plan generation requests. Please wait before regenerating.",
  );
  if (!rate.allowed) {
    return rate.response;
  }

  const jsonResult = await readJsonWithLimit(request, MAX_PLAN_PAYLOAD_BYTES);
  if (!jsonResult.ok) {
    return apiJson({ error: jsonResult.error }, jsonResult.status, rate.headers);
  }

  const parsed = PlanRequestSchema.safeParse(jsonResult.data);
  if (!parsed.success) {
    return apiJson({ error: "Invalid air quality or profile payload." }, 400, rate.headers);
  }

  try {
    const plan = await generateActionPlan(
      parsed.data.airQuality,
      parsed.data.profile,
      parsed.data.forceRefresh ?? false,
    );
    return apiJson(plan, 200, rate.headers);
  } catch (error) {
    logger.error("Plan generation failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiJson(
      { error: "Unable to generate tailored action plan right now." },
      502,
      rate.headers,
    );
  }
}
