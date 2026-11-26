const INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|system)\s+instructions/i,
  /reveal\s+(your\s+)?(system\s+prompt|instructions|api\s+key)/i,
  /you\s+are\s+now\s+(dan|jailbreak|unrestricted)/i,
  /<\s*script\b/i,
  /javascript:/i,
];

/**
 * Strips ASCII control characters and collapses excessive whitespace.
 */
export function sanitizeUserPrompt(input: string, maxLength = 500): string {
  const withoutControls = input.replace(/[\u0000-\u001F\u007F]/g, " ");
  return withoutControls.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

/**
 * Returns true if the message contains common prompt-injection or script-injection patterns.
 */
export function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}
