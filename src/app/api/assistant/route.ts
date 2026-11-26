import { NextResponse } from "next/server";
import { AssistantRequestSchema } from "@/types";
import { detectPromptInjection, sanitizeUserPrompt } from "@/lib/prompt-guard";
import { buildRateLimitHeaders, genAiRateLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { readJsonWithLimit } from "@/lib/request-guard";
import { logger } from "@/lib/logger";
import { generateAssistantReply } from "@/services/gemini";

const MAX_ASSISTANT_PAYLOAD_BYTES = 65_536;

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

  const jsonResult = await readJsonWithLimit(request, MAX_ASSISTANT_PAYLOAD_BYTES);
  if (!jsonResult.ok) {
    return NextResponse.json(
      { error: jsonResult.error },
      { status: jsonResult.status, headers: rateHeaders },
    );
  }

  const parsed = AssistantRequestSchema.safeParse(jsonResult.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid assistant request. Keep messages between 2 and 500 characters." },
      { status: 400, headers: rateHeaders },
    );
  }

  const cleanedMessage = sanitizeUserPrompt(parsed.data.message, 500);
  const cleanedHistory = parsed.data.history.map((turn) => ({
    ...turn,
    content: sanitizeUserPrompt(turn.content, 1000),
  }));

  const hasInjection =
    detectPromptInjection(cleanedMessage) ||
    cleanedHistory.some((turn) => detectPromptInjection(turn.content));

  if (hasInjection) {
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
      history: cleanedHistory,
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
