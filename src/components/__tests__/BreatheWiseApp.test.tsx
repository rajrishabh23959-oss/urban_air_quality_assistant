import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { BreatheWiseApp } from "@/components/BreatheWiseApp";
import { MOCK_AIR_QUALITY, MOCK_PLAN } from "@/test-fixtures/air-quality";

describe("BreatheWiseApp integration", () => {
  it("loads live AQI and AI plan, updates simulator on habit toggle, and passes axe", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/api/air-quality")) {
          return { ok: true, json: async () => MOCK_AIR_QUALITY };
        }
        if (url.startsWith("/api/plan")) {
          return { ok: true, json: async () => MOCK_PLAN };
        }
        return { ok: true, json: async () => ({ results: [] }) };
      }),
    );

    const { container } = render(<BreatheWiseApp />);

    await waitFor(
      () => {
        expect(screen.getByText("198")).toBeInTheDocument();
        expect(screen.getByText("1. Low-Emission Daily Routines")).toBeInTheDocument();
      },
      { timeout: 4000 },
    );

    await user.click(screen.getByRole("button", { name: /Select all/i }));
    expect(screen.getByText(/9\/9 active/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Clear$/i }));
    expect(screen.getByText(/0\/9 active/i)).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /Adopt habit: Midday Ventilation/i }));
    expect(screen.getByText(/1\/9 active/i)).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /Adopt habit: Midday Ventilation/i }));
    expect(screen.getByText(/0\/9 active/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Refresh AQI/i }));
    await user.click(screen.getByRole("button", { name: /Refresh AI Plan/i }));

    await waitFor(() => {
      expect(screen.getByText("198")).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("restores saved profile from localStorage and shows error alerts when APIs fail", async () => {
    window.localStorage.setItem(
      "breathewise_profile_v1",
      JSON.stringify({
        ...{
          mode: "community",
          householdSize: 3,
          communityHouseholds: 100,
          vulnerableGroups: ["elderly"],
          commute: "wfh",
          homeType: "apartment",
          hasHepaPurifier: true,
          cookingFuel: "induction",
          ventilation: "sealed_ac",
        },
      }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Service unavailable" }),
      }),
    );

    render(<BreatheWiseApp />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
    window.localStorage.clear();
  });

  it("handles malformed localStorage, profile changes, and plan API errors", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("breathewise_profile_v1", "{bad-json");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/api/air-quality")) {
          return { ok: true, json: async () => MOCK_AIR_QUALITY };
        }
        if (url.startsWith("/api/plan")) {
          return { ok: false, json: async () => ({ error: "Plan rate limited" }) };
        }
        return { ok: true, json: async () => ({ results: [] }) };
      }),
    );

    render(<BreatheWiseApp />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Plan rate limited");

    await user.click(screen.getByRole("button", { name: /Community Mode/i }));
    await user.click(screen.getByRole("button", { name: "Lucknow" }));
    await waitFor(
      () => {
        expect(screen.getByText(/Plan rate limited/i)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    // Also test Refresh AI Plan button when plan failed
    await user.click(screen.getByRole("button", { name: /Refresh AI Plan/i }));
    window.localStorage.clear();
  });

  it("ignores AbortError on rapid location/plan cancellations", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")));
    render(<BreatheWiseApp />);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("handles non-Error rejection in AQI fetch gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("network-down"));
    render(<BreatheWiseApp />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/Failed to load air quality/i);
  });

  it("ignores AbortError and handles localStorage write failure", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")));

    const user = userEvent.setup();
    render(<BreatheWiseApp />);
    await user.click(screen.getByRole("button", { name: /Community Mode/i }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    setItemSpy.mockRestore();
  });

  it("ignores AbortError and handles localStorage write failure", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")));

    const user = userEvent.setup();
    render(<BreatheWiseApp />);
    await user.click(screen.getByRole("button", { name: /Community Mode/i }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    setItemSpy.mockRestore();
  });
});
