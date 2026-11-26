import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { AssistantChat } from "@/components/AssistantChat";
import { MOCK_AIR_QUALITY, MOCK_PROFILE } from "@/test-fixtures/air-quality";

describe("AssistantChat", () => {
  it("submits user question and renders reply safely with zero axe violations", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          reply: "Keep windows closed until 12:00 PM.",
          suggestedFollowUps: [],
          source: "fallback",
        }),
      }),
    );

    const { container } = render(
      <AssistantChat airQuality={MOCK_AIR_QUALITY} profile={MOCK_PROFILE} />,
    );

    const input = screen.getByLabelText(/Ask an air quality question/i);
    await user.type(input, "Can I open windows now?");
    await user.click(screen.getByRole("button", { name: /^Ask$/i }));

    expect(await screen.findByText(/Keep windows closed until 12:00 PM/i)).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("handles quick prompt click and API error alert", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Rate limit hit" }),
      }),
    );

    render(<AssistantChat airQuality={MOCK_AIR_QUALITY} profile={MOCK_PROFILE} />);
    await user.click(screen.getByRole("button", { name: /Low-cost ways to protect/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Rate limit hit");
  });
});
