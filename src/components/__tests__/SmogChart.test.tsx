import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { SmogChart } from "@/components/SmogChart";
import { MOCK_AIR_QUALITY, MOCK_HOURLY_24H } from "@/test-fixtures/air-quality";

describe("SmogChart", () => {
  it("renders Y-axis labels, Best window marker, keyboard-focusable table region, and passes axe", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SmogChart
        hourly24h={MOCK_HOURLY_24H}
        ventilationWindow={MOCK_AIR_QUALITY.ventilationWindow}
      />,
    );

    expect(screen.getByText("145")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Best window")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /View hourly data table/i }));
    const tableRegion = screen.getByRole("region", {
      name: /24-hour hourly air quality data table/i,
    });
    expect(tableRegion).toHaveAttribute("tabindex", "0");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("handles empty and single-point hourly data gracefully", async () => {
    const { container, rerender } = render(
      <SmogChart hourly24h={[]} ventilationWindow={MOCK_AIR_QUALITY.ventilationWindow} />,
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <SmogChart
        hourly24h={[MOCK_HOURLY_24H[12]!]}
        ventilationWindow={MOCK_AIR_QUALITY.ventilationWindow}
      />,
    );
    expect(screen.getByText("Best window")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
