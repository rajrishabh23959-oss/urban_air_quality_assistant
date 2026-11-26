import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { AirQualityDashboard } from "@/components/AirQualityDashboard";
import { MOCK_AIR_QUALITY } from "@/test-fixtures/air-quality";

describe("AirQualityDashboard", () => {
  it("renders live AQI, severity label, inversion risk, ventilation window, and toggles hourly table with zero axe violations", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AirQualityDashboard
        snapshot={MOCK_AIR_QUALITY}
        isLoading={false}
        error={null}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText("198")).toBeInTheDocument();
    expect(screen.getByText("Unhealthy")).toBeInTheDocument();
    expect(screen.getByText("Severe Smog Trapping")).toBeInTheDocument();
    expect(screen.getByText("12:00 – 13:00")).toBeInTheDocument();
    expect(await screen.findByText(/24-Hour PM2\.5 Smog Curve/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /View hourly data table/i }));
    expect(screen.getByRole("table")).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders accessible error alert when AQI fails", async () => {
    const { container } = render(
      <AirQualityDashboard
        snapshot={null}
        isLoading={false}
        error="Upstream timeout"
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Upstream timeout");
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders loading skeleton and good/moderate tier icons", () => {
    const { rerender } = render(
      <AirQualityDashboard snapshot={null} isLoading={true} error={null} onRefresh={vi.fn()} />,
    );
    expect(screen.getByText(/Loading Live Air Quality/i)).toBeInTheDocument();

    rerender(
      <AirQualityDashboard
        snapshot={{
          ...MOCK_AIR_QUALITY,
          tierInfo: { ...MOCK_AIR_QUALITY.tierInfo, tier: "good", label: "Good" },
        }}
        isLoading={false}
        error={null}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText("Good")).toBeInTheDocument();

    rerender(
      <AirQualityDashboard
        snapshot={{
          ...MOCK_AIR_QUALITY,
          tierInfo: { ...MOCK_AIR_QUALITY.tierInfo, tier: "moderate", label: "Moderate" },
        }}
        isLoading={false}
        error={null}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText("Moderate")).toBeInTheDocument();

    rerender(
      <AirQualityDashboard
        snapshot={{
          ...MOCK_AIR_QUALITY,
          location: { ...MOCK_AIR_QUALITY.location, admin1: undefined },
          tierInfo: { ...MOCK_AIR_QUALITY.tierInfo, tier: "hazardous", label: "Hazardous" },
        }}
        isLoading={true}
        error={null}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText("Hazardous")).toBeInTheDocument();
  });
});
