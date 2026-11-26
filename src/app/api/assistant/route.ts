import { NextResponse } from "next/server";
import { AssistantRequestSchema } from "@/types";
import { detectPromptInjection, sanitizeUserPrompt } from "@/lib/prompt-guard";
import {
  buildRateLimitHeaders,
  genAiRateLimiter,
  getClientIdentifier,
} from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { generateAssistantReply } from "@/services/gemini";

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = genAiRateLimiter.check(clientId);
  const rateHeaders = buildRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many assistant messages. Please pause briefly before sending another." },
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

  const parsed = AssistantRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid assistant request. Keep messages between 2 and 500 characters." },
      { status: 400, headers: rateHeaders },
    );
  }

  const cleanedMessage = sanitizeUserPrompt(parsed.data.message, 500);
  if (detectPromptInjection(cleanedMessage)) {
    logger.warn("Blocked suspicious prompt injection attempt", { clientId });
    return NextResponse.json(
      {
        error:
          "Please ask a question related to urban air quality, indoor air safety, or low-emission routines.",
      },
      { status: 400, headers: rateHeaders },
    );
  }

  try {
    const response = await generateAssistantReply({
      ...parsed.data,
      message: cleanedMessage,
    });
    return NextResponse.json(response, { status: 200, headers: rateHeaders });
  } catch (error) {
    logger.error("Assistant route failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Unable to process your question right now. Please try again." },
      { status: 502, headers: rateHeaders },
    );
  }
}
