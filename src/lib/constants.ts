import type { Location } from "@/types";

export const DEFAULT_LOCATION: Location = {
  name: "New Delhi",
  country: "India",
  admin1: "Delhi",
  latitude: 28.6139,
  longitude: 77.209,
  timezone: "Asia/Kolkata",
};

/**
 * Curated winter smog hotspot cities for one-click selection.
 */
export const SMOG_HOTSPOT_PRESETS: readonly Location[] = [
  DEFAULT_LOCATION,
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
