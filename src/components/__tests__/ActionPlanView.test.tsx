import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { ActionPlanView } from "@/components/ActionPlanView";
import { MOCK_PLAN } from "@/test-fixtures/air-quality";

describe("ActionPlanView", () => {
  it("renders all 3 pillars, toggles habits, and copies community advisory with zero axe violations", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onRegenerate = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const planWithCommunity = {
      ...MOCK_PLAN,
      communityAdvisory: {
        headline: "New Delhi Smog Alert: US AQI 198",
        whatsappNotice: "Keep windows closed outside 12:00-13:00.",
        schoolAndRwaActions: ["Pause outdoor assemblies", "Enforce no-idling gates"],
        collectiveImpactNote: "50 households save 420 kg CO2e/week.",
      },
    };

    const { container, unmount } = render(
      <ActionPlanView
        plan={planWithCommunity}
        isLoading={false}
        error={null}
        selectedIds={new Set(["r1"])}
        onToggleAction={onToggle}
        onRegenerate={onRegenerate}
      />,
    );

    expect(screen.getByText("Offline Fallback Mode")).toBeInTheDocument();
    expect(
      screen.getByText(/Tailored action plan loaded with 9 recommendations/i),
    ).toBeInTheDocument();
    expect(screen.getByText("1. Low-Emission Daily Routines")).toBeInTheDocument();
    expect(screen.getByText("2. Indoor Air Quality (IAQ) Hacks")).toBeInTheDocument();
    expect(screen.getByText("3. Sustainable Alternatives")).toBeInTheDocument();
    expect(screen.getByText("New Delhi Smog Alert: US AQI 198")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /Adopt habit: Damp Mopping/i }));
    expect(onToggle).toHaveBeenCalledWith("i1");

    await user.click(screen.getByRole("button", { name: /Copy WhatsApp/i }));
    expect(writeText).toHaveBeenCalledWith("Keep windows closed outside 12:00-13:00.");
    expect(screen.getByText("Community notice copied to clipboard")).toBeInTheDocument();

    // Simulate clipboard failure showing accessible alert
    writeText.mockRejectedValueOnce(new Error("Clipboard denied"));
    await user.click(screen.getByRole("button", { name: /Copied notice/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Unable to copy notice/i);

    // Simulate missing navigator.clipboard
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    await user.click(screen.getByRole("button", { name: /Copy WhatsApp/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Clipboard access is unavailable/i);

    await user.click(screen.getByRole("button", { name: /Refresh AI Plan/i }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);

    const results = await axe(container);
    expect(results).toHaveNoViolations();

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    await user.click(screen.getByRole("button", { name: /Copy WhatsApp/i }));
    unmount();
  });

  it("renders loading and error states cleanly", async () => {
    const { container, rerender } = render(
      <ActionPlanView
        plan={null}
        isLoading={true}
        error={null}
        selectedIds={new Set()}
        onToggleAction={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    );
    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();

    rerender(
      <ActionPlanView
        plan={{ ...MOCK_PLAN, source: "gemini" }}
        isLoading={false}
        error={null}
        selectedIds={new Set()}
        onToggleAction={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    );
    expect(screen.getByText("Powered by Gemini 2.5 Flash")).toBeInTheDocument();

    rerender(
      <ActionPlanView
        plan={null}
        isLoading={false}
        error="Plan generation failed"
        selectedIds={new Set()}
        onToggleAction={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Plan generation failed");
    expect(await axe(container)).toHaveNoViolations();
  });
});
