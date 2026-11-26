import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";
import GlobalError from "@/app/global-error";
import Loading from "@/app/loading";
import NotFound from "@/app/not-found";
import HomePage from "@/app/page";

describe("App Router pages and error boundaries", () => {
  it("renders loading skeleton with zero axe violations", async () => {
    const { container } = render(<Loading />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders not-found page with link home and zero axe violations", async () => {
    const { container } = render(<NotFound />);
    expect(screen.getByRole("heading", { name: /Page not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Return to BreatheWise/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders error boundary safely without leaking error.message and triggers reset", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const { container } = render(
      <ErrorPage error={new Error("INTERNAL_SECRET_DETAIL")} reset={reset} />,
    );

    expect(screen.getByRole("alert")).not.toHaveTextContent("INTERNAL_SECRET_DETAIL");
    await user.click(screen.getByRole("button", { name: /Try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders global error boundary and triggers reset", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<GlobalError error={new Error("BOOM")} reset={reset} />);
    await user.click(screen.getByRole("button", { name: /Reload application/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("renders HomePage shell cleanly", () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")));
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1, name: /BreatheWise/i })).toBeInTheDocument();
  });
});
