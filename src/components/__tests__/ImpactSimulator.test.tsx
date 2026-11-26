import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { ImpactSimulator } from "@/components/ImpactSimulator";
import { MOCK_PLAN, MOCK_PROFILE } from "@/test-fixtures/air-quality";

describe("ImpactSimulator", () => {
  it("displays live cumulative impact metrics and has zero axe violations", async () => {
    const user = userEvent.setup();
    const onSelectAll = vi.fn();
    const onClearAll = vi.fn();

    const { container } = render(
      <ImpactSimulator
        plan={MOCK_PLAN}
        selectedIds={new Set(["r1", "r2"])}
        currentPm25={100}
        profile={MOCK_PROFILE}
        onSelectAll={onSelectAll}
        onClearAll={onClearAll}
      />,
    );

    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText("9.4 kg")).toBeInTheDocument();
    expect(screen.getByText(/400 µg\/day per person/i)).toBeInTheDocument();
    expect(screen.getByText(/1600 µg\/day across 4 members/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Select all/i }));
    expect(onSelectAll).toHaveBeenCalledTimes(1);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders #simulator-heading placeholder when plan is null and passes axe", async () => {
    const { container } = render(
      <ImpactSimulator
        plan={null}
        selectedIds={new Set()}
        currentPm25={100}
        profile={MOCK_PROFILE}
        onSelectAll={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /Interactive Direct-Impact Simulator/i }),
    ).toHaveAttribute("id", "simulator-heading");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("handles 1-member family and community mode display", () => {
    const { rerender } = render(
      <ImpactSimulator
        plan={MOCK_PLAN}
        selectedIds={new Set(["r1"])}
        currentPm25={100}
        profile={{ ...MOCK_PROFILE, householdSize: 1 }}
        onSelectAll={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    expect(screen.getByText(/across 1 member$/i)).toBeInTheDocument();

    rerender(
      <ImpactSimulator
        plan={MOCK_PLAN}
        selectedIds={new Set(["r1"])}
        currentPm25={100}
        profile={{ ...MOCK_PROFILE, mode: "community" }}
        onSelectAll={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    expect(screen.queryByText(/across 1 member/i)).not.toBeInTheDocument();
  });
});
