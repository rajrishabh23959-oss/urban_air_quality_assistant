import type { VulnerableGroup } from "@/types";

export const VULNERABLE_OPTIONS: readonly { value: VulnerableGroup; label: string }[] = [
  { value: "infants", label: "Infants / Children" },
  { value: "elderly", label: "Elderly (60+)" },
  { value: "asthma", label: "Asthma / Respiratory" },
  { value: "pregnant", label: "Pregnant Members" },
  { value: "outdoor_workers", label: "Outdoor Workers" },
];

export const HOUSEHOLD_SIZE_OPTIONS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const COMMUNITY_SCALE_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 25, label: "25 households (Small apartment block)" },
  { value: 50, label: "50 households (RWA / School grade)" },
  { value: 100, label: "100 households (Neighborhood cluster)" },
  { value: 250, label: "250 households (Large society / campus)" },
];

export const COMMUTE_OPTIONS = [
  { value: "petrol_car", label: "Petrol / Diesel Car" },
  { value: "two_wheeler", label: "Two-Wheeler" },
  { value: "public_transit", label: "Public Transit (Metro / Bus)" },
  { value: "walk_cycle", label: "Walking / Cycling" },
  { value: "wfh", label: "Work / Study from Home" },
] as const;

export const COOKING_FUEL_OPTIONS = [
  { value: "lpg", label: "LPG / Piped Gas" },
  { value: "induction", label: "Electric / Induction" },
  { value: "biomass_other", label: "Biomass / Solid Fuel" },
] as const;

export const HOME_TYPE_OPTIONS = [
  { value: "apartment", label: "Apartment / Flat" },
  { value: "independent_house", label: "Independent House" },
] as const;

export const VENTILATION_OPTIONS = [
  { value: "cross_ventilation", label: "Cross-Ventilation Windows" },
  { value: "exhaust_only", label: "Kitchen/Bath Exhaust Only" },
  { value: "sealed_ac", label: "Sealed / AC Recirculation" },
] as const;
