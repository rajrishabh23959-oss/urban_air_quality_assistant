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

    await user.click(screen.getByRole("button", { name: /Select all/i }));
    expect(onSelectAll).toHaveBeenCalledTimes(1);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
