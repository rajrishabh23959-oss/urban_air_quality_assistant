import {
  ActionPlanSchema,
  type ActionPlan,
  type AirQualitySnapshot,
  type AssistantRequest,
  type AssistantResponse,
  type CommunityAdvisory,
  type HouseholdProfile,
  type IaqHackItem,
  type RoutineItem,
  type SustainableSwapItem,
} from "@/types";

export type FallbackReason = "missing_key" | "validation_fallback";

const impact = (
  healthImpact: string,
  pm25ReductionUgPerDay: number,
  emissionImpact: string,
  co2eSavedKgPerWeek: number,
  pm25AvoidedGPerMonth: number,
  whyItWorks: string,
) => ({
  healthImpact,
  pm25ReductionUgPerDay,
  emissionImpact,
  co2eSavedKgPerWeek,
  pm25AvoidedGPerMonth,
  whyItWorks,
});

function buildFallbackRoutines(
  airQuality: AirQualitySnapshot,
  profile: HouseholdProfile,
): RoutineItem[] {
  const vent = airQuality.ventilationWindow;
  const commuteAction =
    profile.commute === "petrol_car" || profile.commute === "two_wheeler"
      ? `Shift one daily ${profile.commute.replace("_", " ")} trip to metro/bus or carpool with 2 neighbors; wear a snug N95/FFP2 mask at transit stops.`
      : `Keep your low-emission ${profile.commute.replace("_", " ")} routine, but schedule outdoor transit between ${vent.startHour} and ${vent.endHour} when PM2.5 dips to ~${vent.avgPm25} µg/m³.`;

  return [
    {
      id: "routine-ventilation",
      timeSlot: `${vent.startHour} – ${vent.endHour}`,
      title: "Timed Midday Cross-Ventilation",
      category: "ventilation",
      action: vent.isSafe
        ? `Open opposite windows for 15–20 minutes during ${vent.startHour}–${vent.endHour} to flush indoor CO2 while outdoor PM2.5 is lowest.`
        : `Keep windows sealed during peak smog; crack a window for at most 5 minutes at ${vent.startHour} only if indoor air feels stale, then restart filtration.`,
      impact: impact(
        "Avoids ~180 µg/day of peak PM2.5 infiltration",
        180,
        "0.4 kg CO2e/week saved via lower HVAC load",
        0.4,
        2,
        "Midday warmth lifts winter thermal inversions that trap exhaust near ground level overnight.",
      ),
    },
    {
      id: "routine-commute",
      timeSlot: "08:30 – 10:00",
      title: "Low-Emission Commute & Mask Timing",
      category: "commute",
      action: commuteAction,
      impact: impact(
        "Cuts roadside PM2.5 & NO2 inhalation by ~240 µg/day",
        240,
        "9.2 kg CO2e/week and 18 g/month tailpipe PM2.5 avoided",
        9.2,
        18,
        "Roadside corridors carry 2–3x higher black carbon than ambient averages.",
      ),
    },
    {
      id: "routine-outdoor",
      timeSlot: "17:00 – 21:00",
      title: "Shift Exercise Indoors During Evening Inversion",
      category: "outdoors",
      action:
        "Move brisk walks, kids' play, and outdoor errands indoors after 5 PM when cold air traps cooking and traffic smoke.",
      impact: impact(
        "Prevents ~310 µg/day of deep-lung PM2.5 deposition",
        310,
        "1.1 kg CO2e/week saved by avoiding evening car errands",
        1.1,
        4,
        "Exercise raises breathing rate 3–5x, pulling fine particulates deeper into alveoli.",
      ),
    },
  ];
}

function buildFallbackIaqHacks(profile: HouseholdProfile): IaqHackItem[] {
  const purifierStep = profile.hasHepaPurifier
    ? "Place your HEPA purifier 30 cm away from walls in the main sleeping/living room on Auto/Medium mode and close bedroom doors 1 hour before sleep."
    : "Build a low-cost Corsi-Rosenthal DIY box fan filter using a MERV-13 furnace filter and a 20-inch box fan sealed with painter's tape.";

  return [
    {
      id: "iaq-damp-mop",
      budgetTier: "zero_cost",
      title: "Damp Mopping & Door-Draft Towel Seal",
      steps:
        "Replace dry brooming with wet/damp mopping twice daily and place rolled dampened towels or foam strips along balcony and main door gaps.",
      estimatedCost: "Free",
      impact: impact(
        "Reduces indoor resuspended dust & PM2.5 by ~140 µg/day",
        140,
        "0.3 kg CO2e/week saved vs vacuuming",
        0.3,
        3,
        "Dry sweeping kicks settled particles back into breathing height for hours.",
      ),
    },
    {
      id: "iaq-diy-filter",
      budgetTier: "low_cost_diy",
      title: "Corsi-Rosenthal Box Fan Filter Setup",
      steps: purifierStep,
      estimatedCost: "$15–$30 DIY",
      impact: impact(
        "Lowers bedroom PM2.5 by 55–70% (~360 µg/day reduction)",
        360,
        "1.5 kg CO2e/week lower energy than oversized AC filtration",
        1.5,
        6,
        "High-airflow MERV-13 pleats trap sub-micron smog particles at ~45W.",
      ),
    },
    {
      id: "iaq-cooking-exhaust",
      budgetTier: "device_optimization",
      title: "Kitchen Hood + Lid-On Moisture Control",
      steps:
        "Run the kitchen exhaust hood 5 minutes before lighting the stove and 10 minutes after cooking; keep lids on pots to limit indoor NO2 and oil aerosols.",
      estimatedCost: "Free (existing fan)",
      impact: impact(
        "Cuts indoor cooking PM2.5/NO2 spikes by ~190 µg/day",
        190,
        "0.8 kg CO2e/week fuel saved with lidded cookware",
        0.8,
        5,
        "Frying and gas combustion spike indoor PM2.5 unless captured at the source.",
      ),
    },
  ];
}

function buildFallbackSwaps(profile: HouseholdProfile): SustainableSwapItem[] {
  const cookingSwap =
    profile.cookingFuel === "biomass_other"
      ? "Transition primary cooking from solid/biomass fuel to induction or LPG with cross-draft exhaust."
      : profile.cookingFuel === "lpg"
        ? "Use an electric kettle, pressure cooker, or single induction cooktop for boiling and simmering while running the kitchen chimney."
        : "Keep using clean induction cooking and run a lid-on simmer routine to cut indoor aerosol grease and ultrafine particles.";

  return [
    {
      id: "swap-cooking",
      domain: "cooking",
      title: "Electric Kettle & Induction Hybrid Cooking",
      currentHabit: `Primary ${profile.cookingFuel.toUpperCase()} cooking for all tasks`,
      sustainableAlternative: cookingSwap,
      impact: impact(
        "Eliminates ~160 µg/day of indoor combustion particulates",
        160,
        "4.6 kg CO2e/week and 12 g/month soot avoided",
        4.6,
        12,
        "Electric heating transfers energy directly to cookware with zero indoor flame byproducts.",
      ),
    },
    {
      id: "swap-transport",
      domain: "transport",
      title: "2-Day Neighborhood Carpool / Transit Circle",
      currentHabit: "Solo motorized trips for school/office runs",
      sustainableAlternative:
        "Coordinate a rotating 3-family school/office carpool or combine errands into one midday metro/bus loop.",
      impact: impact(
        "Cuts in-cabin traffic exhaust exposure by ~150 µg/day",
        150,
        "11.4 kg CO2e/week and 22 g/month PM2.5 avoided",
        11.4,
        22,
        "Cold winter engine starts emit 4x more particulates in the first 3 km.",
      ),
    },
    {
      id: "swap-waste",
      domain: "waste_dust",
      title: "Zero-Burn Winter Leaf & Waste Composting",
      currentHabit: "Dry leaf piles or mixed trash burned outdoors",
      sustainableAlternative:
        "Bag dry winter leaves for municipal mulching or society compost pits instead of burning, and dampen dusty driveways before sweeping.",
      impact: impact(
        "Prevents ~210 µg/day of toxic polycyclic smoke near homes",
        210,
        "6.5 kg CO2e/week and 35 g/month black carbon avoided",
        6.5,
        35,
        "Open biomass burning is one of the highest-toxicity sources of winter PM2.5.",
      ),
    },
  ];
}

function buildFallbackCommunityAdvisory(
  airQuality: AirQualitySnapshot,
  profile: HouseholdProfile,
): CommunityAdvisory | undefined {
  if (profile.mode !== "community") {
    return undefined;
  }
  const city = airQuality.location.name;
  const aqi = airQuality.current.usAqi;
  const pm25 = Math.round(airQuality.current.pm25);
  const vent = airQuality.ventilationWindow;
  return {
    headline: `${city} Neighborhood Smog Alert: US AQI ${aqi} (${airQuality.tierInfo.label})`,
    whatsappNotice: `⚠️ *${city} Clean Air Advisory (US AQI ${aqi} | PM2.5: ${pm25} µg/m³)*\n\n• *Ventilation Window:* Open windows briefly only between ${vent.startHour}–${vent.endHour}.\n• *Schools & Playgrounds:* Shift morning assembly and outdoor recess indoors today.\n• *Commute:* Use our ${profile.communityHouseholds}-home carpool thread and turn off idling engines at gates.\n• *Zero Burning:* Report any leaf or waste burning immediately to the RWA desk.`,
    schoolAndRwaActions: [
      "Pause outdoor morning assemblies and PE classes when US AQI exceeds 150.",
      "Enforce a strict no-idling zone at school drop-off gates and apartment basements.",
      "Replace dry sweeping of society courtyards with damp mopping or water-sprinkled cleaning.",
      `Set up a shared carpool sheet for ${profile.communityHouseholds} households commuting along the same corridor.`,
    ],
    collectiveImpactNote: `If ${profile.communityHouseholds} households adopt carpooling and zero-waste-burning today, the neighborhood avoids ~${(profile.communityHouseholds * 8.4).toFixed(0)} kg CO2e/week and cuts local street-level PM2.5 spikes.`,
  };
}

/**
 * Generates a deterministic, schema-validated 3-pillar winter smog action plan.
 */
export function buildDeterministicFallbackPlan(
  airQuality: AirQualitySnapshot,
  profile: HouseholdProfile,
  reason: FallbackReason,
): ActionPlan {
  const reasonPrefix =
    reason === "missing_key"
      ? "Fallback guidance active (GEMINI_API_KEY not configured)."
      : "Backup guidance active (live AI response could not be validated).";
  const advisory = buildFallbackCommunityAdvisory(airQuality, profile);

  return ActionPlanSchema.parse({
    generatedAt: new Date().toISOString(),
    source: "fallback",
    summary: `${reasonPrefix} Tailored for ${airQuality.location.name} at US AQI ${airQuality.current.usAqi} (${airQuality.tierInfo.label}) with ${profile.vulnerableGroups.length > 0 ? "vulnerable household members prioritized" : "general household protection"}.`,
    routines: buildFallbackRoutines(airQuality, profile),
    iaqHacks: buildFallbackIaqHacks(profile),
    sustainableSwaps: buildFallbackSwaps(profile),
    ...(advisory ? { communityAdvisory: advisory } : {}),
  });
}

/**
 * Generates a deterministic, grounded assistant reply for fallback/offline scenarios.
 */
export function buildDeterministicFallbackAssistant(
  req: AssistantRequest,
  reason: FallbackReason,
): AssistantResponse {
  const { airQuality, profile, message } = req;
  const city = airQuality.location.name;
  const aqi = airQuality.current.usAqi;
  const vent = airQuality.ventilationWindow;
  const lower = message.toLowerCase();

  let reply = "";
  if (lower.includes("window") || lower.includes("ventilat")) {
    reply = vent.isSafe
      ? `In ${city} right now, US AQI is ${aqi} (${airQuality.tierInfo.label}). Your safest natural ventilation window is ${vent.startHour}–${vent.endHour} when PM2.5 averages ${vent.avgPm25} µg/m³. Open opposite windows for 15–20 minutes then close them before evening inversion.`
      : `In ${city}, US AQI is ${aqi} (${airQuality.tierInfo.label}). Keep windows sealed during peak smog; the least-polluted window is ${vent.startHour}–${vent.endHour} (${vent.avgPm25} µg/m³), so limit opening to 5 minutes only if indoor CO2 feels high.`;
  } else if (lower.includes("notice") || lower.includes("rwa") || lower.includes("apartment")) {
    reply = `Here is a ready-to-share notice for ${city} (US AQI ${aqi}):\n\n"Clean Air Advisory: Today's AQI is ${aqi} (${airQuality.tierInfo.label}). Please keep windows closed outside ${vent.startHour}–${vent.endHour}, avoid idling vehicles at gates, pause dry sweeping in favor of damp mopping, and report any open waste burning immediately."`;
  } else {
    reply = `For ${city} at US AQI ${aqi} (${airQuality.tierInfo.label}, PM2.5 ${Math.round(airQuality.current.pm25)} µg/m³): ${
      profile.vulnerableGroups.length > 0
        ? `Because your profile includes ${profile.vulnerableGroups.join(", ")}, `
        : ""
    }prioritize indoor filtration (${profile.hasHepaPurifier ? "run your HEPA purifier continuously" : "use a DIY MERV-13 box fan filter"}), damp-mop floors instead of dry sweeping, and wear a fitted N95 mask outdoors.`;
  }

  const note =
    reason === "missing_key"
      ? "(Note: Running in deterministic fallback mode because GEMINI_API_KEY is not configured.)"
      : "(Note: Showing verified backup guidance because the live AI response could not be validated.)";

  return {
    reply: `${reply}\n\n${note}`,
    suggestedFollowUps: [
      `When is the safest time to ventilate in ${city} today?`,
      "How can I build a low-cost DIY air filter?",
      "Draft a short smog alert for my neighborhood group.",
    ],
    source: "fallback",
  };
}
