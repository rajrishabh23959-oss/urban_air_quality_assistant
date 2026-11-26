import { NextResponse } from "next/server";
import { PlanRequestSchema } from "@/types";
import {
  buildRateLimitHeaders,
  genAiRateLimiter,
  getClientIdentifier,
} from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { generateActionPlan } from "@/services/gemini";

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = genAiRateLimiter.check(clientId);
  const rateHeaders = buildRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many plan generation requests. Please wait before regenerating." },
      { status: 429, headers: rateHeaders },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON request body." },
      { status: 400, headers: rateHeaders },
    );
  }

  const parsed = PlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid air quality or profile payload." },
      { status: 400, headers: rateHeaders },
    );
  }

  try {
    const plan = await generateActionPlan(parsed.data.airQuality, parsed.data.profile);
    return NextResponse.json(plan, { status: 200, headers: rateHeaders });
  } catch (error) {
    logger.error("Plan generation failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Unable to generate tailored action plan right now." },
      { status: 502, headers: rateHeaders },
    );
  }
}
