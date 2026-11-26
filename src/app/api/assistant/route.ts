import { AssistantRequestSchema } from "@/types";
import { apiJson, checkApiRateLimit } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { detectPromptInjection, sanitizeUserPrompt } from "@/lib/prompt-guard";
import { genAiRateLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { readJsonWithLimit } from "@/lib/request-guard";
import { generateAssistantReply } from "@/services/gemini";

const MAX_ASSISTANT_PAYLOAD_BYTES = 65_536;

/**
 * Grounded conversational assistant endpoint with prompt-injection defense and rate limiting.
 */
export async function POST(request: Request) {
  const rate = checkApiRateLimit(
    request,
    genAiRateLimiter,
    "Too many assistant messages. Please pause briefly before sending another.",
  );
  if (!rate.allowed) {
    return rate.response;
  }

  const jsonResult = await readJsonWithLimit(request, MAX_ASSISTANT_PAYLOAD_BYTES);
  if (!jsonResult.ok) {
    return apiJson({ error: jsonResult.error }, jsonResult.status, rate.headers);
  }

  const parsed = AssistantRequestSchema.safeParse(jsonResult.data);
  if (!parsed.success) {
    return apiJson(
      { error: "Invalid assistant request. Keep messages between 2 and 500 characters." },
      400,
      rate.headers,
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
    logger.warn("Blocked suspicious prompt injection attempt", {
      clientId: getClientIdentifier(request),
    });
    return apiJson(
      {
        error:
          "Please ask a question related to urban air quality, indoor air safety, or low-emission routines.",
      },
      400,
      rate.headers,
    );
  }

  try {
    const reply = await generateAssistantReply({
      ...parsed.data,
      message: cleanedMessage,
      history: cleanedHistory,
    });
    return apiJson(reply, 200, rate.headers);
  } catch (error) {
    logger.error("Assistant route failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiJson(
      { error: "Unable to process your question right now. Please try again." },
      502,
      rate.headers,
    );
  }
}
