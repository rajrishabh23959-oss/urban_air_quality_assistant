import { describe, expect, it } from "vitest";
import { assessInversionRisk, classifyUsAqi, findSafeVentilationWindow } from "@/lib/aqi";
import { MOCK_HOURLY_24H } from "@/test-fixtures/air-quality";

describe("aqi domain helpers", () => {
  it("classifies all US AQI tiers accurately", () => {
    expect(classifyUsAqi(25).tier).toBe("good");
    expect(classifyUsAqi(75).tier).toBe("moderate");
    expect(classifyUsAqi(125).tier).toBe("sensitive");
    expect(classifyUsAqi(175).tier).toBe("unhealthy");
    expect(classifyUsAqi(250).tier).toBe("very_unhealthy");
    expect(classifyUsAqi(350).tier).toBe("hazardous");
  });

  it("handles negative or zero AQI gracefully", () => {
    expect(classifyUsAqi(-10).tier).toBe("good");
    expect(classifyUsAqi(0).label).toBe("Good");
  });

  it("detects severe winter inversion risk when overnight PM2.5 spikes", () => {
    const risk = assessInversionRisk(MOCK_HOURLY_24H);
    expect(risk.level).toBe("severe");
    expect(risk.peakWindow).toContain("Around");
  });

  it("returns low inversion risk for empty or clean hourly arrays", () => {
    expect(assessInversionRisk([]).level).toBe("low");
    const clean = MOCK_HOURLY_24H.map((pt) => ({ ...pt, pm25: 12, usAqi: 30 }));
    expect(assessInversionRisk(clean).level).toBe("low");
  });

  it("finds the cleanest 2-hour ventilation window", () => {
    const win = findSafeVentilationWindow(MOCK_HOURLY_24H);
    expect(win.startHour).toBe("12:00");
    expect(win.endHour).toBe("13:00");
    expect(win.avgPm25).toBe(32);
    expect(win.isSafe).toBe(true);
  });

  it("marks ventilation unsafe when even the cleanest window is heavily polluted", () => {
    const polluted = MOCK_HOURLY_24H.map((pt) => ({ ...pt, pm25: 150, usAqi: 210 }));
    const win = findSafeVentilationWindow(polluted);
    expect(win.isSafe).toBe(false);
    expect(win.recommendation).toContain("Keep windows sealed");
  });

  it("detects moderate and high inversion risk and handles single-point ventilation", () => {
    const moderate = MOCK_HOURLY_24H.map((pt, idx) => ({
      ...pt,
      pm25: idx === 12 ? 18 : 32,
      usAqi: 90,
    }));
    expect(assessInversionRisk(moderate).level).toBe("moderate");

    const high = MOCK_HOURLY_24H.map((pt, idx) => ({
      ...pt,
      pm25: idx === 12 ? 30 : 65,
      usAqi: 140,
    }));
    expect(assessInversionRisk(high).level).toBe("high");

    expect(findSafeVentilationWindow([]).isSafe).toBe(false);
    expect(findSafeVentilationWindow([MOCK_HOURLY_24H[12]!]).isSafe).toBe(true);

    const zeroMin = MOCK_HOURLY_24H.map((pt, idx) => ({
      ...pt,
      pm25: idx === 0 ? 0 : 25,
    }));
    expect(assessInversionRisk(zeroMin).level).toBe("moderate");

    const allZero = MOCK_HOURLY_24H.map((pt) => ({ ...pt, pm25: 0 }));
    expect(assessInversionRisk(allZero).level).toBe("low");
  });
});
