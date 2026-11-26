# BreatheWise — Urban Air Quality & Winter Smog Assistant

BreatheWise is a GenAI-powered web application that helps families and communities navigate severe winter smog and urban air pollution. It combines live air quality and 24-hour pollutant forecasts from Open-Meteo with server-side **Gemini 2.5 Flash** (`@google/genai`) intelligence to generate tailored low-emission daily routines, indoor air quality (IAQ) hacks, sustainable alternatives, and community smog advisories—complete with quantified health and emission impact explanations.

## Architecture Overview

- **`src/types/`**: Shared domain types and strict Zod schemas (`air-quality.ts`, `profile.ts`, `plan.ts`).
- **`src/lib/`**: Pure domain logic and infrastructure utilities:
  - `aqi.ts`: US AQI severity classification, winter thermal inversion risk assessment, and 24-hour safe ventilation window calculation.
  - `impact-calculator.ts`: Cumulative personal PM2.5 exposure reduction, `householdSize`-scaled family-wide PM2.5 relief, equivalent cigarettes avoided, weekly CO2e savings, and community-scaled impact.
  - `cache.ts`: Bounded in-memory LRU/TTL cache (`TtlLruCache`).
  - `rate-limit.ts`: Sliding-window rate limiter (`SlidingWindowRateLimiter`) with standard `X-RateLimit-*` and `Retry-After` headers.
  - `request-guard.ts`: Streaming byte-limit JSON reader (`readJsonWithLimit`, 64 KB cap, `413 Payload Too Large`) and `Content-Type: application/json` enforcement (`415 Unsupported Media Type`).
  - `prompt-guard.ts`: Control-character sanitization and prompt-injection detection across both current messages and chat history.
  - `logger.ts` & `env.ts`: Structured JSON logger and server-side-only environment access.
- **`src/services/`**:
  - `open-meteo.ts`: Allowlisted (`ALLOWED_UPSTREAM_HOSTS` + `https:`) Open-Meteo Geocoding (1h TTL) and Air Quality (10m TTL, bypassable via `refresh=true`) integrations with 8s `AbortController` timeouts and Zod validation.
  - `gemini.ts`: Server-side `@google/genai` (`gemini-2.5-flash`) integration with 15s timeouts, separated `systemInstruction`, structured JSON output validated by Zod, 15-minute plan caching (bypassable via `forceRefresh: true`), and resilient deterministic fallback when `GEMINI_API_KEY` is absent or upstream JSON fails validation.
- **`src/app/api/`**: Rate-limited, Zod-validated Route Handlers (`/api/health`, `/api/geocode`, `/api/air-quality`, `/api/plan`, `/api/assistant`) with explicit `Cache-Control` headers (`no-store` on GenAI/health/error/refresh responses; `public, max-age=300, stale-while-revalidate=60` on AQI/geocode).
- **`src/components/`**: Accessible React components (`AppHeader`, `AppFooter`, `CitySearch`, `AirQualityDashboard`, `SmogChartLazy`, `ProfileForm`, `ImpactSimulator`, `ActionPlanView`, `CommunityAdvisoryCard`, `ImpactCard`, `AssistantChat`).

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and add your Gemini API key:
   ```bash
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
   *(If `GEMINI_API_KEY` is omitted, the app runs with a deterministic fallback engine for CI/testing.)*
3. Run the development server:
   ```bash
   npm run dev
   ```

## Security Design

- **Zero Client Secret Exposure**: `GEMINI_API_KEY` is read exclusively on the server (`src/lib/env.ts`).
- **Streaming Body Caps & Content-Type Enforcement**: `readJsonWithLimit` streams request bodies with `ReadableStream.getReader()`, immediately cancelling and returning `413` if bytes exceed 64 KB, and returns `415` for non-JSON `Content-Type`.
- **Strict Input & Output Validation**: Every query parameter, JSON body, external API response, and Gemini output is validated with strict Zod schemas.
- **Prompt Injection Defense**: User chat messages and every turn in `history` are sanitized, bounded, checked for override patterns, and strictly separated from `systemInstruction`.
- **Rate Limiting & SSRF/Timeout Protection**: Sliding-window rate limiting on all `/api/*` routes, allowlisted `ALLOWED_UPSTREAM_HOSTS`, and `AbortController` / `Promise.race` timeouts.
- **HTTP Security Headers**: Configured in `next.config.ts` (`Content-Security-Policy` without `'unsafe-eval'` in production, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

## Accessibility (WCAG 2.1 AA)

- Skip-to-main-content link targeting focusable `<main id="main-content" tabIndex={-1}>`, semantic landmarks, and strict `h1 → h2 → h3` hierarchy.
- Full keyboard navigation across combobox city search (with click/focus-outside dismissal), mode toggles, checkboxes, and chat.
- Color-blind safe AQI indicators pairing color badges with icons and explicit severity labels, plus Y-axis ticks and diamond `"Best window"` markers on the 24-hour SVG chart.
- Scoped `aria-live="polite"` status regions for AQI updates, impact simulator updates, clipboard copy confirmation, and assistant replies.
- Verified with `eslint-plugin-jsx-a11y` (strict) and `vitest-axe` (`axe-core`).

## Verification Commands

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:coverage
npm audit --audit-level=high
npm run build
```
