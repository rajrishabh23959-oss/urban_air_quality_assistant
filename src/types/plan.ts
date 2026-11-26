import { z } from "zod";
import { AirQualitySnapshotSchema } from "./air-quality";
import { HouseholdProfileSchema } from "./profile";

/** Quantified health and emission impact metrics attached to every recommendation. */
export const ImpactMetricsSchema = z
  .object({
    healthImpact: z.string().min(5).max(260),
    pm25ReductionUgPerDay: z.number().min(0).max(2000),
    emissionImpact: z.string().min(5).max(260),
    co2eSavedKgPerWeek: z.number().min(0).max(500),
    pm25AvoidedGPerMonth: z.number().min(0).max(5000),
    whyItWorks: z.string().min(10).max(400),
  })
  .strict();

export type ImpactMetrics = z.infer<typeof ImpactMetricsSchema>;

export const RoutineItemSchema = z
  .object({
    id: z.string().min(1).max(60),
    timeSlot: z.string().min(2).max(60),
    title: z.string().min(3).max(120),
    action: z.string().min(10).max(400),
    category: z.enum(["ventilation", "commute", "outdoors", "school_errands"]),
    impact: ImpactMetricsSchema,
  })
  .strict();

export type RoutineItem = z.infer<typeof RoutineItemSchema>;

export const IaqHackItemSchema = z
  .object({
    id: z.string().min(1).max(60),
    budgetTier: z.enum(["zero_cost", "low_cost_diy", "device_optimization"]),
    title: z.string().min(3).max(120),
    steps: z.string().min(10).max(450),
    estimatedCost: z.string().min(1).max(60),
    impact: ImpactMetricsSchema,
  })
  .strict();

export type IaqHackItem = z.infer<typeof IaqHackItemSchema>;

export const SustainableSwapItemSchema = z
  .object({
    id: z.string().min(1).max(60),
    domain: z.enum(["transport", "cooking", "heating", "waste_dust"]),
    title: z.string().min(3).max(120),
    currentHabit: z.string().min(3).max(180),
    sustainableAlternative: z.string().min(5).max(320),
    impact: ImpactMetricsSchema,
  })
  .strict();

export type SustainableSwapItem = z.infer<typeof SustainableSwapItemSchema>;

export const CommunityAdvisorySchema = z
  .object({
    headline: z.string().min(5).max(180),
    whatsappNotice: z.string().min(20).max(1000),
    schoolAndRwaActions: z.array(z.string().min(5).max(240)).min(2).max(6),
    collectiveImpactNote: z.string().min(10).max(400),
  })
  .strict();

export type CommunityAdvisory = z.infer<typeof CommunityAdvisorySchema>;

export const ActionPlanSchema = z
  .object({
    generatedAt: z.string(),
    source: z.enum(["gemini", "fallback"]),
    summary: z.string().min(10).max(500),
    routines: z.array(RoutineItemSchema).min(3).max(6),
    iaqHacks: z.array(IaqHackItemSchema).min(3).max(6),
    sustainableSwaps: z.array(SustainableSwapItemSchema).min(3).max(6),
    communityAdvisory: CommunityAdvisorySchema.optional(),
  })
  .strict();

export type ActionPlan = z.infer<typeof ActionPlanSchema>;

export const PlanRequestSchema = z
  .object({
    airQuality: AirQualitySnapshotSchema,
    profile: HouseholdProfileSchema,
    forceRefresh: z.boolean().optional(),
  })
  .strict();

export type PlanRequest = z.infer<typeof PlanRequestSchema>;

export const ChatHistoryTurnSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(1000),
  })
  .strict();

export const AssistantRequestSchema = z
  .object({
    message: z.string().trim().min(2, "Please enter a question (at least 2 characters)").max(500),
    airQuality: AirQualitySnapshotSchema,
    profile: HouseholdProfileSchema,
    history: z.array(ChatHistoryTurnSchema).max(8).default([]),
  })
  .strict();

export type AssistantRequest = z.infer<typeof AssistantRequestSchema>;

export const AssistantResponseSchema = z
  .object({
    reply: z.string().min(5).max(3000),
    suggestedFollowUps: z.array(z.string().min(3).max(140)).max(3),
    source: z.enum(["gemini", "fallback"]),
  })
  .strict();

export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;
