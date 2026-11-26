import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "@/lib/api-client";
import { useBreatheWiseData } from "@/hooks/useBreatheWiseData";
import { useHabitSelection } from "@/hooks/useHabitSelection";
import { MOCK_AIR_QUALITY } from "@/test-fixtures/air-quality";

describe("hooks branch coverage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("useHabitSelection handleSelectAll is a no-op when plan is null", () => {
    const { result } = renderHook(() => useHabitSelection(null));
    act(() => {
      result.current.handleSelectAll();
    });
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("useBreatheWiseData handles AbortError, non-Error rejections, and null airQuality regenerate", async () => {
    const aqiSpy = vi
      .spyOn(apiClient, "fetchAirQualityApi")
      .mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));

    const { result } = renderHook(() => useBreatheWiseData());

    // handleRegeneratePlan while airQuality is null should be a no-op
    act(() => {
      result.current.handleRegeneratePlan();
    });

    await waitFor(() => expect(aqiSpy).toHaveBeenCalledTimes(1));
    expect(result.current.aqiError).toBeNull();

    // Non-Error rejection in loadAirQuality
    aqiSpy.mockRejectedValueOnce("aqi-string-error");
    act(() => {
      result.current.handleRefreshAqi();
    });
    await waitFor(() => expect(result.current.aqiError).toBe("Failed to load air quality."));

    // Successful AQI load followed by AbortError then non-Error in loadPlan
    aqiSpy.mockResolvedValueOnce(MOCK_AIR_QUALITY);
    const planSpy = vi
      .spyOn(apiClient, "fetchActionPlanApi")
      .mockRejectedValueOnce(new DOMException("Aborted", "AbortError"))
      .mockRejectedValueOnce("plan-string-error");

    act(() => {
      result.current.handleRefreshAqi();
    });
    await waitFor(() => expect(planSpy).toHaveBeenCalledTimes(1));
    expect(result.current.planError).toBeNull();

    act(() => {
      result.current.handleRegeneratePlan();
    });
    await waitFor(() => expect(result.current.planError).toBe("Failed to generate action plan."));
  });
});
