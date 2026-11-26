import type { AqiTierInfo, HourlyPoint, InversionRisk, Location, VentilationWindow } from "@/types";

/**
 * Curated winter smog hotspot cities for one-click selection.
 */
export const SMOG_HOTSPOT_PRESETS: readonly Location[] = [
  {
    name: "New Delhi",
    country: "India",
    admin1: "Delhi",
    latitude: 28.6139,
    longitude: 77.209,
    timezone: "Asia/Kolkata",
  },
  {
    name: "Lucknow",
    country: "India",
    admin1: "Uttar Pradesh",
    latitude: 26.8467,
    longitude: 80.9462,
    timezone: "Asia/Kolkata",
  },
  {
    name: "Kolkata",
    country: "India",
    admin1: "West Bengal",
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: "Asia/Kolkata",
  },
  {
    name: "Lahore",
    country: "Pakistan",
    admin1: "Punjab",
    latitude: 31.5204,
    longitude: 74.3587,
    timezone: "Asia/Karachi",
  },
  {
    name: "Beijing",
    country: "China",
    admin1: "Beijing",
    latitude: 39.9042,
    longitude: 116.4074,
    timezone: "Asia/Shanghai",
  },
  {
    name: "London",
    country: "United Kingdom",
    admin1: "England",
    latitude: 51.5072,
    longitude: -0.1276,
    timezone: "Europe/London",
  },
];

/**
 * Maps a numeric US AQI value to its accessible severity tier, label, and styling tokens.
 */
export function classifyUsAqi(usAqi: number): AqiTierInfo {
  const safeAqi = Math.max(0, Math.round(usAqi));

  if (safeAqi <= 50) {
    return {
      tier: "good",
      label: "Good",
      shortAdvice:
        "Air quality is satisfactory. Normal outdoor activities and ventilation are safe.",
      badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
      textClass: "text-emerald-800",
      borderClass: "border-emerald-300",
    };
  }

  if (safeAqi <= 100) {
    return {
      tier: "moderate",
      label: "Moderate",
      shortAdvice:
        "Acceptable air quality; unusually sensitive individuals should limit prolonged exertion.",
      badgeClass: "bg-amber-100 text-amber-950 border-amber-300",
      textClass: "text-amber-900",
      borderClass: "border-amber-300",
    };
  }

  if (safeAqi <= 150) {
    return {
      tier: "sensitive",
      label: "Unhealthy for Sensitive Groups",
      shortAdvice: "Children, elderly, and people with asthma should reduce outdoor exertion.",
      badgeClass: "bg-orange-100 text-orange-950 border-orange-300",
      textClass: "text-orange-900",
      borderClass: "border-orange-300",
    };
  }

  if (safeAqi <= 200) {
    return {
      tier: "unhealthy",
      label: "Unhealthy",
      shortAdvice:
        "Everyone may experience health effects. Wear an N95 outdoors and keep windows sealed.",
      badgeClass: "bg-red-100 text-red-950 border-red-300",
      textClass: "text-red-900",
      borderClass: "border-red-300",
    };
  }

  if (safeAqi <= 300) {
    return {
      tier: "very_unhealthy",
      label: "Very Unhealthy",
      shortAdvice:
        "Health alert: avoid outdoor exercise, run indoor filtration, and use damp dust control.",
      badgeClass: "bg-purple-100 text-purple-950 border-purple-300",
      textClass: "text-purple-900",
      borderClass: "border-purple-300",
    };
  }

  return {
    tier: "hazardous",
    label: "Hazardous",
    shortAdvice:
      "Emergency smog conditions: stay indoors, seal drafts, and run continuous air filtration.",
    badgeClass: "bg-rose-950 text-white border-rose-900",
    textClass: "text-rose-950",
    borderClass: "border-rose-900",
  };
}

function extractHourLabel(isoTime: string): string {
  const match = /T(\d{2}:\d{2})/.exec(isoTime);
  return match?.[1] ?? isoTime.slice(0, 16);
}

/**
 * Evaluates winter thermal inversion & smog trapping risk from the 24-hour PM2.5 curve.
 * Cold overnight/early-morning boundary layers trap PM2.5 near ground level, spiking evening/morning ratios.
 */
export function assessInversionRisk(hourly24h: readonly HourlyPoint[]): InversionRisk {
  if (hourly24h.length === 0) {
    return {
      level: "low",
      label: "Low Inversion Risk",
      reason: "Insufficient hourly data to evaluate boundary-layer trapping.",
      peakWindow: "N/A",
    };
  }

  let peakPoint = hourly24h[0]!;
  let minPoint = hourly24h[0]!;
  for (const point of hourly24h) {
    if (point.pm25 > peakPoint.pm25) {
      peakPoint = point;
    }
    if (point.pm25 < minPoint.pm25) {
      minPoint = point;
    }
  }

  const peakHour = extractHourLabel(peakPoint.time);
  const spread = peakPoint.pm25 - minPoint.pm25;
  const ratio = minPoint.pm25 > 0 ? peakPoint.pm25 / minPoint.pm25 : peakPoint.pm25 > 20 ? 3 : 1;

  if (peakPoint.pm25 >= 120 || (peakPoint.pm25 >= 75 && ratio >= 1.8)) {
    return {
      level: "severe",
      label: "Severe Smog Trapping",
      reason: `PM2.5 spikes to ${Math.round(peakPoint.pm25)} µg/m³ (${Math.round(spread)} µg/m³ swing), indicating strong cold-air inversion trapping pollutants near street level.`,
      peakWindow: `Around ${peakHour}`,
    };
  }

  if (peakPoint.pm25 >= 55 || (peakPoint.pm25 >= 35 && ratio >= 1.5)) {
    return {
      level: "high",
      label: "High Inversion Risk",
      reason: `Stagnant air pushes PM2.5 up to ${Math.round(peakPoint.pm25)} µg/m³ around ${peakHour}. Avoid morning/late-evening outdoor exertion.`,
      peakWindow: `Around ${peakHour}`,
    };
  }

  if (peakPoint.pm25 >= 30 || spread >= 15) {
    return {
      level: "moderate",
      label: "Moderate Smog Buildup",
      reason: `Noticeable diurnal buildup peaking at ${Math.round(peakPoint.pm25)} µg/m³. Prefer midday ventilation.`,
      peakWindow: `Around ${peakHour}`,
    };
  }

  return {
    level: "low",
    label: "Low Inversion Risk",
    reason: `Pollutant dispersion is steady with peak PM2.5 at ${Math.round(peakPoint.pm25)} µg/m³.`,
    peakWindow: `Around ${peakHour}`,
  };
}

/**
 * Finds the cleanest 2-hour contiguous window in the next 24 hours for brief home ventilation.
 */
export function findSafeVentilationWindow(hourly24h: readonly HourlyPoint[]): VentilationWindow {
  if (hourly24h.length === 0) {
    return {
      startHour: "13:00",
      endHour: "15:00",
      avgPm25: 0,
      avgAqi: 0,
      isSafe: false,
      recommendation: "Hourly forecast unavailable. Keep windows closed during visible haze.",
    };
  }

  if (hourly24h.length === 1) {
    const only = hourly24h[0]!;
    const hour = extractHourLabel(only.time);
    const isSafe = only.usAqi <= 100 && only.pm25 <= 35;
    return {
      startHour: hour,
      endHour: hour,
      avgPm25: Math.round(only.pm25),
      avgAqi: Math.round(only.usAqi),
      isSafe,
      recommendation: isSafe
        ? `Brief ventilation is safe around ${hour} (PM2.5 ~${Math.round(only.pm25)} µg/m³).`
        : `Air remains polluted (~${Math.round(only.pm25)} µg/m³). Rely on indoor filtration instead of opening windows.`,
    };
  }

  let bestIndex = 0;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let i = 0; i < hourly24h.length - 1; i += 1) {
    const first = hourly24h[i]!;
    const second = hourly24h[i + 1]!;
    const avgPm25 = (first.pm25 + second.pm25) / 2;
    if (avgPm25 < bestScore) {
      bestScore = avgPm25;
      bestIndex = i;
    }
  }

  const startPoint = hourly24h[bestIndex]!;
  const endPoint = hourly24h[bestIndex + 1]!;
  const avgPm25 = Math.round((startPoint.pm25 + endPoint.pm25) / 2);
  const avgAqi = Math.round((startPoint.usAqi + endPoint.usAqi) / 2);
  const startHour = extractHourLabel(startPoint.time);
  const endHour = extractHourLabel(endPoint.time);
  const isSafe = avgAqi <= 120 && avgPm25 <= 45;

  const recommendation = isSafe
    ? `Best natural ventilation window is ${startHour}–${endHour} (avg PM2.5 ${avgPm25} µg/m³, US AQI ${avgAqi}). Cross-ventilate for 15–20 minutes.`
    : `Cleanest window is ${startHour}–${endHour}, but PM2.5 stays elevated (${avgPm25} µg/m³, US AQI ${avgAqi}). Keep windows sealed and use HEPA/DIY filtration; ventilate only 5 min if CO2 feels stuffy.`;

  return {
    startHour,
    endHour,
    avgPm25,
    avgAqi,
    isSafe,
    recommendation,
  };
}
