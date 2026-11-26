import { z } from "zod";

/** Household vs. Community planning mode. */
export const ProfileModeSchema = z.enum(["family", "community"]);
export type ProfileMode = z.infer<typeof ProfileModeSchema>;

export const VulnerableGroupSchema = z.enum([
  "infants",
  "elderly",
  "asthma",
  "pregnant",
  "outdoor_workers",
]);
export type VulnerableGroup = z.infer<typeof VulnerableGroupSchema>;

export const CommuteTypeSchema = z.enum([
  "petrol_car",
  "two_wheeler",
  "public_transit",
  "walk_cycle",
  "wfh",
]);
export type CommuteType = z.infer<typeof CommuteTypeSchema>;

export const HomeTypeSchema = z.enum(["apartment", "independent_house"]);
export type HomeType = z.infer<typeof HomeTypeSchema>;

export const CookingFuelSchema = z.enum(["lpg", "induction", "biomass_other"]);
export type CookingFuel = z.infer<typeof CookingFuelSchema>;

export const VentilationTypeSchema = z.enum(["cross_ventilation", "exhaust_only", "sealed_ac"]);
export type VentilationType = z.infer<typeof VentilationTypeSchema>;

export const HouseholdProfileSchema = z
  .object({
    mode: ProfileModeSchema,
    householdSize: z.number().int().min(1).max(20).default(4),
    communityHouseholds: z.number().int().min(5).max(500).default(50),
    vulnerableGroups: z.array(VulnerableGroupSchema).max(5),
    commute: CommuteTypeSchema,
    homeType: HomeTypeSchema,
    hasHepaPurifier: z.boolean(),
    cookingFuel: CookingFuelSchema,
    ventilation: VentilationTypeSchema,
  })
  .strict();

export type HouseholdProfile = z.infer<typeof HouseholdProfileSchema>;

export const DEFAULT_PROFILE: HouseholdProfile = {
  mode: "family",
  householdSize: 4,
  communityHouseholds: 50,
  vulnerableGroups: ["infants", "elderly"],
  commute: "petrol_car",
  homeType: "apartment",
  hasHepaPurifier: false,
  cookingFuel: "lpg",
  ventilation: "cross_ventilation",
};
