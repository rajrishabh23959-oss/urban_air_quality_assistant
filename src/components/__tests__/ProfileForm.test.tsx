import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { ProfileForm } from "@/components/ProfileForm";
import { MOCK_PROFILE } from "@/test-fixtures/air-quality";

describe("ProfileForm", () => {
  it("switches modes, updates selects/checkboxes, and has zero axe violations", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { container, rerender } = render(
      <ProfileForm profile={MOCK_PROFILE} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: /Community Mode/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mode: "community" }));

    await user.selectOptions(screen.getByLabelText(/Household Size/i), "6");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ householdSize: 6 }));

    await user.click(screen.getByLabelText(/Elderly \(60\+\)/i));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ vulnerableGroups: ["infants", "asthma", "elderly"] }),
    );

    await user.click(screen.getByLabelText(/Infants \/ Children/i));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ vulnerableGroups: ["asthma"] }),
    );

    await user.selectOptions(screen.getByLabelText(/Daily Commute/i), "public_transit");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ commute: "public_transit" }));

    await user.selectOptions(screen.getByLabelText(/Cooking Fuel/i), "induction");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ cookingFuel: "induction" }));

    await user.selectOptions(screen.getByLabelText(/Home Type/i), "independent_house");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ homeType: "independent_house" }),
    );

    await user.selectOptions(screen.getByLabelText(/Home Ventilation/i), "sealed_ac");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ ventilation: "sealed_ac" }));

    await user.click(screen.getByLabelText(/We currently have a HEPA air purifier/i));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ hasHepaPurifier: true }));

    rerender(<ProfileForm profile={{ ...MOCK_PROFILE, mode: "community" }} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText(/Community Scale/i), "100");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ communityHouseholds: 100 }));

    // Invalid select values are safely ignored by Zod guards
    onChange.mockClear();
    fireEvent.change(screen.getByLabelText(/Daily Commute/i), { target: { value: "invalid" } });
    fireEvent.change(screen.getByLabelText(/Cooking Fuel/i), { target: { value: "invalid" } });
    fireEvent.change(screen.getByLabelText(/Home Type/i), { target: { value: "invalid" } });
    fireEvent.change(screen.getByLabelText(/Home Ventilation/i), { target: { value: "invalid" } });
    expect(onChange).not.toHaveBeenCalled();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
