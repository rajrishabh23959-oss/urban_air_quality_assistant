import { NextResponse } from "next/server";
import { PlanRequestSchema } from "@/types";
import { buildRateLimitHeaders, genAiRateLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { readJsonWithLimit } from "@/lib/request-guard";
import { logger } from "@/lib/logger";
import { generateActionPlan } from "@/services/gemini";

const MAX_PLAN_PAYLOAD_BYTES = 65_536;

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = genAiRateLimiter.check(clientId);
  const headers = {
    ...buildRateLimitHeaders(rateLimit),
    "Cache-Control": "no-store",
  };

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many plan generation requests. Please wait before regenerating." },
      { status: 429, headers },
    );
  }

  const jsonResult = await readJsonWithLimit(request, MAX_PLAN_PAYLOAD_BYTES);
  if (!jsonResult.ok) {
    return NextResponse.json({ error: jsonResult.error }, { status: jsonResult.status, headers });
  }

  const parsed = PlanRequestSchema.safeParse(jsonResult.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid air quality or profile payload." },
      { status: 400, headers },
    );
  }

  try {
    const plan = await generateActionPlan(
      parsed.data.airQuality,
      parsed.data.profile,
      parsed.data.forceRefresh ?? false,
    );
    return NextResponse.json(plan, { status: 200, headers });
  } catch (error) {
    logger.error("Plan generation failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Unable to generate tailored action plan right now." },
      { status: 502, headers },
    );
  }
}
