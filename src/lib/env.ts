/**
 * Server-side environment configuration helpers.
 * Secrets are never exposed to client bundles.
 */
export function getGeminiApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key && key.length > 0 ? key : undefined;
}

/**
 * Returns true when a server-side GEMINI_API_KEY is configured.
 */
export function isGeminiConfigured(): boolean {
  return getGeminiApiKey() !== undefined;
}
