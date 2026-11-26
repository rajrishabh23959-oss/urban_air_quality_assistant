import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { AssistantChat } from "@/components/AssistantChat";
import { MOCK_AIR_QUALITY, MOCK_PROFILE } from "@/test-fixtures/air-quality";

describe("AssistantChat", () => {
  it("submits user question, renders suggested follow-ups, and passes axe", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: "Keep windows closed until 12:00 PM.",
          suggestedFollowUps: ["Should we run a HEPA filter tonight?"],
          source: "fallback",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: "Yes, run your purifier on medium overnight.",
          suggestedFollowUps: [],
          source: "fallback",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(
      <AssistantChat airQuality={MOCK_AIR_QUALITY} profile={MOCK_PROFILE} />,
    );

    const input = screen.getByLabelText(/Ask an air quality question/i);
    await user.type(input, "Can I open windows now?");
    await user.click(screen.getByRole("button", { name: /^Ask$/i }));

    expect(await screen.findByText(/Keep windows closed until 12:00 PM/i)).toBeInTheDocument();
    const followUpBtn = screen.getByRole("button", {
      name: /Should we run a HEPA filter tonight\?/i,
    });
    await user.click(followUpBtn);
    expect(await screen.findByText(/run your purifier on medium/i)).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("handles quick prompt click and links API error alert to input", async () => {
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
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Rate limit hit");
    const input = screen.getByLabelText(/Ask an air quality question/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);

    // Silently ignores AbortError
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new DOMException("Aborted", "AbortError")),
    );
    await user.type(input, "Hello?");
    await user.click(screen.getByRole("button", { name: /^Ask$/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Non-Error rejection fallback message
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce("network-string-failure"));
    await user.type(input, "Retry?");
    await user.click(screen.getByRole("button", { name: /^Ask$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Unable to reach BreatheWise/i);
  });
});
