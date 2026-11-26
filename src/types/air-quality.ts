import { z } from "zod";

export const AqiTierSchema = z.enum([
  "good",
  "moderate",
  "sensitive",
  "unhealthy",
  "very_unhealthy",
  "hazardous",
]);

export type AqiTier = z.infer<typeof AqiTierSchema>;

export const LocationSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    country: z.string().trim().min(1).max(100),
    admin1: z.string().trim().max(100).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.string().trim().min(1).max(80).default("auto"),
  })
  .strict();

export type Location = z.infer<typeof LocationSchema>;

export const HourlyPointSchema = z
  .object({
    time: z.string().min(1).max(40),
    pm25: z.number().min(0).max(2000),
    pm10: z.number().min(0).max(3000),
    no2: z.number().min(0).max(2000),
    so2: z.number().min(0).max(2000),
    o3: z.number().min(0).max(2000),
    co: z.number().min(0).max(50000),
    usAqi: z.number().min(0).max(1000),
    europeanAqi: z.number().min(0).max(1000),
  })
  .strict();

export type HourlyPoint = z.infer<typeof HourlyPointSchema>;

export const AqiTierInfoSchema = z
  .object({
    tier: AqiTierSchema,
    label: z.string(),
    shortAdvice: z.string(),
    badgeClass: z.string(),
    textClass: z.string(),
    borderClass: z.string(),
  })
  .strict();

export type AqiTierInfo = z.infer<typeof AqiTierInfoSchema>;

export const InversionRiskSchema = z
  .object({
    level: z.enum(["low", "moderate", "high", "severe"]),
    label: z.string(),
    reason: z.string(),
    peakWindow: z.string(),
  })
  .strict();

export type InversionRisk = z.infer<typeof InversionRiskSchema>;

export const VentilationWindowSchema = z
  .object({
    startHour: z.string(),
    endHour: z.string(),
    avgPm25: z.number().min(0),
    avgAqi: z.number().min(0),
    isSafe: z.boolean(),
    recommendation: z.string(),
  })
  .strict();

export type VentilationWindow = z.infer<typeof VentilationWindowSchema>;

export const AirQualitySnapshotSchema = z
  .object({
    location: LocationSchema,
    fetchedAt: z.string(),
    current: HourlyPointSchema,
    hourly24h: z.array(HourlyPointSchema).min(1).max(48),
    tierInfo: AqiTierInfoSchema,
    inversionRisk: InversionRiskSchema,
    ventilationWindow: VentilationWindowSchema,
  })
  .strict();

export type AirQualitySnapshot = z.infer<typeof AirQualitySnapshotSchema>;

export const GeocodeQuerySchema = z
  .object({
    q: z.string().trim().min(2, "Search query must be at least 2 characters").max(80),
  })
  .strict();

export const AirQualityQuerySchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
    name: z.string().trim().min(1).max(120).default("Selected Location"),
    country: z.string().trim().min(1).max(100).default("Unknown"),
    admin1: z.string().trim().max(100).optional(),
    refresh: z.enum(["true", "false"]).optional(),
  })
  .strict();

export const OpenMeteoGeocodeResponseSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        country: z.string().default("Unknown"),
        admin1: z.string().optional(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.string().optional(),
      }),
    )
    .optional(),
});

export const OpenMeteoAirQualityResponseSchema = z.object({
  timezone: z.string().optional(),
  current: z
    .object({
      time: z.string(),
      pm2_5: z.number().nullable().optional(),
      pm10: z.number().nullable().optional(),
      nitrogen_dioxide: z.number().nullable().optional(),
      sulphur_dioxide: z.number().nullable().optional(),
      ozone: z.number().nullable().optional(),
      carbon_monoxide: z.number().nullable().optional(),
      us_aqi: z.number().nullable().optional(),
      european_aqi: z.number().nullable().optional(),
    })
    .optional(),
  hourly: z.object({
    time: z.array(z.string()),
    pm2_5: z.array(z.number().nullable()),
    pm10: z.array(z.number().nullable()),
    nitrogen_dioxide: z.array(z.number().nullable()),
    sulphur_dioxide: z.array(z.number().nullable()),
    ozone: z.array(z.number().nullable()),
    carbon_monoxide: z.array(z.number().nullable()),
    us_aqi: z.array(z.number().nullable()),
    european_aqi: z.array(z.number().nullable()),
  }),
});
