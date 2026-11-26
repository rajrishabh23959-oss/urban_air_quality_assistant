# BreatheWise — Urban Air Quality & Winter Smog Assistant

BreatheWise is a GenAI-powered web application that helps families and communities navigate severe winter smog and urban air pollution. It combines live air quality and 24-hour pollutant forecasts from Open-Meteo with server-side **Gemini 2.5 Flash** (`@google/genai`) intelligence to generate tailored low-emission daily routines, indoor air quality (IAQ) hacks, sustainable alternatives, and community smog advisories—complete with quantified health and emission impact explanations.

## Architecture Overview

- **`src/types/`**: Shared domain types and strict Zod schemas (`air-quality.ts`, `profile.ts`, `plan.ts`).
- **`src/lib/`**: Pure domain logic and infrastructure utilities:
  - `aqi.ts`: US AQI severity classification, winter thermal inversion risk assessment, and 24-hour safe ventilation window calculation.
  - `impact-calculator.ts`: Cumulative personal PM2.5 exposure reduction, equivalent cigarettes avoided, weekly CO2e savings, and community-scaled impact.
  - `cache.ts`: Bounded in-memory LRU/TTL cache (`TtlLruCache`).
  - `rate-limit.ts`: Sliding-window rate limiter (`SlidingWindowRateLimiter`) with standard `X-RateLimit-*` and `Retry-After` headers.
  - `prompt-guard.ts`: Control-character sanitization and prompt-injection detection.
  - `logger.ts` & `env.ts`: Structured JSON logger and server-side-only environment access.
- **`src/services/`**:
  - `open-meteo.ts`: Allowlisted Open-Meteo Geocoding (1h TTL) and Air Quality (10m TTL) integrations with `AbortController` timeouts and Zod validation.
  - `gemini.ts`: Server-side `@google/genai` (`gemini-2.5-flash`) integration with separated `systemInstruction`, structured JSON output validated by Zod, 15-minute plan caching, and a deterministic fallback engine when `GEMINI_API_KEY` is absent in CI/test environments.
- **`src/app/api/`**: Rate-limited, Zod-validated Route Handlers (`/api/health`, `/api/geocode`, `/api/air-quality`, `/api/plan`, `/api/assistant`).
- **`src/components/`**: Accessible React components (`CitySearch`, `AirQualityDashboard`, `SmogChartLazy`, `ProfileForm`, `ImpactSimulator`, `ActionPlanView`, `ImpactCard`, `AssistantChat`).

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
- **Strict Input & Output Validation**: Every query parameter, JSON body, external API response, and Gemini output is validated with strict Zod schemas.
- **Prompt Injection Defense**: User chat messages are sanitized, length-bounded (max 500 chars), checked for override patterns, and strictly separated from `systemInstruction`.
- **Rate Limiting & SSRF/Timeout Protection**: Sliding-window rate limiting on all `/api/*` routes, allowlisted external URLs built via `URL`/`URLSearchParams`, and 8-second `AbortController` timeouts.
- **HTTP Security Headers**: Configured in `next.config.ts` (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

## Accessibility (WCAG 2.1 AA)

- Skip-to-main-content link, semantic landmarks (`header`, `nav`, `main`, `section`, `footer`), and strict `h1 → h2 → h3` hierarchy.
- Full keyboard navigation across combobox city search, mode toggles, checkboxes, and chat.
- Color-blind safe AQI indicators pairing color badges with icons and explicit severity labels.
- `aria-live="polite"` regions for AQI updates, impact simulator recalculations, and AI replies, plus an accessible hourly data table toggle alongside the 24-hour SVG chart.
- Verified with `eslint-plugin-jsx-a11y` (strict) and `vitest-axe` (`axe-core`).

## Verification Commands

```bash
npm run typecheck
npm run lint
npm run test:coverage
npm audit --audit-level=high
npm run build
```
