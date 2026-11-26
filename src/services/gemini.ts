import { createHash } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import {
  ActionPlanSchema,
  AssistantResponseSchema,
  type ActionPlan,
  type AirQualitySnapshot,
  type AssistantRequest,
  type AssistantResponse,
  type HouseholdProfile,
} from "@/types";
import { TtlLruCache } from "@/lib/cache";
import { getGeminiApiKey } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  buildDeterministicFallbackAssistant,
  buildDeterministicFallbackPlan,
} from "./gemini-fallback";
import {
  ASSISTANT_SYSTEM_INSTRUCTION,
  buildAssistantPromptPayload,
  buildPlanPromptPayload,
  PLAN_SYSTEM_INSTRUCTION,
} from "./gemini-prompts";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_TIMEOUT_MS = 15_000;
export const planCache = new TtlLruCache<ActionPlan>(150, 15 * 60 * 1000);

let cachedApiKey: string | undefined;
let cachedClient: GoogleGenAI | null = null;

function getGeminiClient(apiKey: string): GoogleGenAI {
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedApiKey = apiKey;
  }
  return cachedClient;
}

async function callGeminiJson(
  apiKey: string,
  systemInstruction: string,
  contents: string,
  emptyError: string,
): Promise<string> {
  const ai = getGeminiClient(apiKey);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: { systemInstruction, responseMimeType: "application/json", temperature: 0.4 },
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Gemini request timed out")), GEMINI_TIMEOUT_MS);
      }),
    ]);
    if (!response.text) {
      throw new Error(emptyError);
    }
    return response.text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

function buildPlanCacheKey(airQuality: AirQualitySnapshot, profile: HouseholdProfile): string {
  const aqiBucket = Math.round(airQuality.current.usAqi / 15) * 15;
  const payload = JSON.stringify({
    lat: airQuality.location.latitude.toFixed(2),
    lon: airQuality.location.longitude.toFixed(2),
    aqiBucket,
    inversion: airQuality.inversionRisk.level,
    ventStart: airQuality.ventilationWindow.startHour,
    profile,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Generates a structured 3-pillar winter smog action plan using Gemini 2.5 Flash,
 * or returns a deterministic fallback plan when GEMINI_API_KEY is not set.
 */
export async function generateActionPlan(
  airQuality: AirQualitySnapshot,
  profile: HouseholdProfile,
  forceRefresh = false,
): Promise<ActionPlan> {
  const cacheKey = buildPlanCacheKey(airQuality, profile);
  if (!forceRefresh) {
    const cached = planCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const fallback = buildDeterministicFallbackPlan(airQuality, profile, "missing_key");
    planCache.set(cacheKey, fallback);
    return fallback;
  }

  const rawText = await callGeminiJson(
    apiKey,
    PLAN_SYSTEM_INSTRUCTION,
    buildPlanPromptPayload(airQuality, profile),
    "Gemini returned an empty response for action plan",
  );

  try {
    const parsedJson: unknown = JSON.parse(rawText);
    const validated = ActionPlanSchema.parse({
      ...(typeof parsedJson === "object" && parsedJson !== null ? parsedJson : {}),
      generatedAt: new Date().toISOString(),
      source: "gemini",
    });
    planCache.set(cacheKey, validated);
    logger.info("Generated Gemini action plan", {
      city: airQuality.location.name,
      mode: profile.mode,
    });
    return validated;
  } catch (error) {
    logger.warn("Gemini action plan validation failed; using deterministic fallback", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    const fallback = buildDeterministicFallbackPlan(airQuality, profile, "validation_fallback");
    planCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Generates a context-aware conversational reply grounded in local AQI and user profile.
 */
export async function generateAssistantReply(req: AssistantRequest): Promise<AssistantResponse> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return buildDeterministicFallbackAssistant(req, "missing_key");
  }

  const rawText = await callGeminiJson(
    apiKey,
    ASSISTANT_SYSTEM_INSTRUCTION,
    buildAssistantPromptPayload(req),
    "Gemini returned an empty response for assistant",
  );

  try {
    const parsedJson: unknown = JSON.parse(rawText);
    return AssistantResponseSchema.parse({
      ...(typeof parsedJson === "object" && parsedJson !== null ? parsedJson : {}),
      source: "gemini",
    });
  } catch (error) {
    logger.warn("Gemini assistant response validation failed; using deterministic fallback", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return buildDeterministicFallbackAssistant(req, "validation_fallback");
  }
}
