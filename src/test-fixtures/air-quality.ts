import type { ActionPlan, AirQualitySnapshot, HourlyPoint, HouseholdProfile } from "@/types";

export const MOCK_HOURLY_24H: HourlyPoint[] = Array.from({ length: 24 }, (_, idx) => {
  const hour = String(idx).padStart(2, "0");
  // Simulate winter inversion: high overnight/morning, dip midday (13:00-14:00), spike evening
  const pm25 = idx >= 12 && idx <= 14 ? 32 : idx >= 20 || idx <= 7 ? 145 : 85;
  return {
    time: `2026-11-26T${hour}:00`,
    pm25,
    pm10: pm25 * 1.4,
    no2: 42,
    so2: 14,
    o3: 28,
    co: 650,
    usAqi: Math.round(pm25 * 1.4),
    europeanAqi: Math.round(pm25 * 0.9),
  };
});

export const MOCK_AIR_QUALITY: AirQualitySnapshot = {
  location: {
    name: "New Delhi",
    country: "India",
    admin1: "Delhi",
    latitude: 28.6139,
    longitude: 77.209,
    timezone: "Asia/Kolkata",
  },
  fetchedAt: "2026-11-26T12:00:00.000Z",
  current: {
    time: "2026-11-26T12:00",
    pm25: 145,
    pm10: 210,
    no2: 48,
    so2: 16,
    o3: 32,
    co: 720,
    usAqi: 198,
    europeanAqi: 120,
  },
  hourly24h: MOCK_HOURLY_24H,
  tierInfo: {
    tier: "unhealthy",
    label: "Unhealthy",
    shortAdvice: "Everyone may experience health effects. Wear an N95 outdoors and keep windows sealed.",
    badgeClass: "bg-red-100 text-red-950 border-red-300",
    textClass: "text-red-900",
    borderClass: "border-red-300",
  },
  inversionRisk: {
    level: "severe",
    label: "Severe Smog Trapping",
    reason: "PM2.5 spikes to 145 µg/m³ overnight.",
    peakWindow: "Around 00:00",
  },
  ventilationWindow: {
    startHour: "12:00",
    endHour: "13:00",
    avgPm25: 32,
    avgAqi: 45,
    isSafe: true,
    recommendation: "Best natural ventilation window is 12:00–13:00.",
  },
};

export const MOCK_PROFILE: HouseholdProfile = {
  mode: "family",
  householdSize: 4,
  communityHouseholds: 50,
  vulnerableGroups: ["infants", "asthma"],
  commute: "petrol_car",
  homeType: "apartment",
  hasHepaPurifier: false,
  cookingFuel: "lpg",
  ventilation: "cross_ventilation",
};

export const MOCK_PLAN: ActionPlan = {
  generatedAt: "2026-11-26T12:00:00.000Z",
  source: "fallback",
  summary: "Tailored winter smog plan for New Delhi.",
  routines: [
    {
      id: "r1",
      timeSlot: "12:00 - 13:00",
      title: "Midday Ventilation",
      action: "Open opposite windows for 15 minutes during the midday dip.",
      category: "ventilation",
      impact: {
        healthImpact: "Avoids ~180 µg/day PM2.5",
        pm25ReductionUgPerDay: 180,
        emissionImpact: "0.4 kg CO2e/week",
        co2eSavedKgPerWeek: 0.4,
        pm25AvoidedGPerMonth: 2,
        whyItWorks: "Midday warmth lifts the inversion layer.",
      },
    },
    {
      id: "r2",
      timeSlot: "08:30 - 09:30",
      title: "Metro Commute",
      action: "Take metro instead of solo petrol car.",
      category: "commute",
      impact: {
        healthImpact: "Avoids ~220 µg/day PM2.5",
        pm25ReductionUgPerDay: 220,
        emissionImpact: "9.0 kg CO2e/week",
        co2eSavedKgPerWeek: 9.0,
        pm25AvoidedGPerMonth: 18,
        whyItWorks: "Cuts cold-start tailpipe emissions.",
      },
    },
    {
      id: "r3",
      timeSlot: "18:00 - 20:00",
      title: "Indoor Evening Play",
      action: "Keep children indoors after dusk.",
      category: "outdoors",
      impact: {
        healthImpact: "Avoids ~250 µg/day PM2.5",
        pm25ReductionUgPerDay: 250,
        emissionImpact: "1.0 kg CO2e/week",
        co2eSavedKgPerWeek: 1.0,
        pm25AvoidedGPerMonth: 4,
        whyItWorks: "Evening inversion traps street smoke.",
      },
    },
  ],
  iaqHacks: [
    {
      id: "i1",
      budgetTier: "zero_cost",
      title: "Damp Mopping",
      steps: "Wet mop instead of dry sweeping.",
      estimatedCost: "Free",
      impact: {
        healthImpact: "Avoids ~140 µg/day PM2.5",
        pm25ReductionUgPerDay: 140,
        emissionImpact: "0.3 kg CO2e/week",
        co2eSavedKgPerWeek: 0.3,
        pm25AvoidedGPerMonth: 3,
        whyItWorks: "Prevents dust resuspension.",
      },
    },
    {
      id: "i2",
      budgetTier: "low_cost_diy",
      title: "DIY Box Fan Filter",
      steps: "Tape MERV-13 filter to a 20-inch box fan.",
      estimatedCost: "$20",
      impact: {
        healthImpact: "Avoids ~300 µg/day PM2.5",
        pm25ReductionUgPerDay: 300,
        emissionImpact: "1.2 kg CO2e/week",
        co2eSavedKgPerWeek: 1.2,
        pm25AvoidedGPerMonth: 6,
        whyItWorks: "Captures fine sub-micron particles.",
      },
    },
    {
      id: "i3",
      budgetTier: "device_optimization",
      title: "Kitchen Exhaust Timing",
      steps: "Run exhaust fan while cooking.",
      estimatedCost: "Free",
      impact: {
        healthImpact: "Avoids ~160 µg/day PM2.5",
        pm25ReductionUgPerDay: 160,
        emissionImpact: "0.8 kg CO2e/week",
        co2eSavedKgPerWeek: 0.8,
        pm25AvoidedGPerMonth: 5,
        whyItWorks: "Captures cooking aerosols at source.",
      },
    },
  ],
  sustainableSwaps: [
    {
      id: "s1",
      domain: "cooking",
      title: "Electric Kettle Hybrid",
      currentHabit: "Gas boiling",
      sustainableAlternative: "Boil water in electric kettle.",
      impact: {
        healthImpact: "Avoids ~120 µg/day NO2/PM2.5",
        pm25ReductionUgPerDay: 120,
        emissionImpact: "4.0 kg CO2e/week",
        co2eSavedKgPerWeek: 4.0,
        pm25AvoidedGPerMonth: 10,
        whyItWorks: "Removes indoor flame combustion.",
      },
    },
    {
      id: "s2",
      domain: "transport",
      title: "Neighborhood Carpool",
      currentHabit: "Solo driving",
      sustainableAlternative: "Share rides with 2 neighbors.",
      impact: {
        healthImpact: "Avoids ~130 µg/day PM2.5",
        pm25ReductionUgPerDay: 130,
        emissionImpact: "10.5 kg CO2e/week",
        co2eSavedKgPerWeek: 10.5,
        pm25AvoidedGPerMonth: 20,
        whyItWorks: "Eliminates duplicate cold starts.",
      },
    },
    {
      id: "s3",
      domain: "waste_dust",
      title: "Leaf Composting",
      currentHabit: "Burning dry leaves",
      sustainableAlternative: "Compost dry winter leaves.",
      impact: {
        healthImpact: "Avoids ~200 µg/day smoke",
        pm25ReductionUgPerDay: 200,
        emissionImpact: "6.0 kg CO2e/week",
        co2eSavedKgPerWeek: 6.0,
        pm25AvoidedGPerMonth: 30,
        whyItWorks: "Prevents open biomass smoke.",
      },
    },
  ],
};
