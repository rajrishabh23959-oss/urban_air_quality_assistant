import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { CitySearch } from "@/components/CitySearch";
import { SMOG_HOTSPOT_PRESETS } from "@/lib/aqi";

describe("CitySearch", () => {
  it("supports hotspot presets, debounced search, keyboard selection, and geolocation with zero axe violations", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              name: "Lahore",
              country: "Pakistan",
              admin1: "Punjab",
              latitude: 31.5204,
              longitude: 74.3587,
              timezone: "Asia/Karachi",
            },
          ],
        }),
      }),
    );

    const { container } = render(
      <CitySearch
        selectedLocation={SMOG_HOTSPOT_PRESETS[0]!}
        onSelectLocation={onSelect}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Lucknow" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "Lucknow" }));

    const input = screen.getByRole("combobox");
    await user.type(input, "Lahore");

    await waitFor(
      () => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      },
      { timeout: 1500 },
    );

    await user.keyboard("{ArrowDown}{ArrowUp}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "Lahore" }));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("handles geolocation success and permission error", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (
          success: (pos: { coords: { latitude: number; longitude: number } }) => void,
        ) => {
          success({ coords: { latitude: 28.5, longitude: 77.1 } });
        },
      },
      configurable: true,
    });

    render(
      <CitySearch
        selectedLocation={SMOG_HOTSPOT_PRESETS[0]!}
        onSelectLocation={onSelect}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Use my location/i }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My Current Location", latitude: 28.5 }),
    );
  });

  it("handles ArrowUp, Escape, search failure, and geolocation denial", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (_s: unknown, err: () => void) => err(),
      },
      configurable: true,
    });

    render(
      <CitySearch
        selectedLocation={SMOG_HOTSPOT_PRESETS[0]!}
        onSelectLocation={onSelect}
        isLoading={false}
      />,
    );

    const input = screen.getByRole("combobox");
    await user.type(input, "Beijing");
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/temporarily unavailable/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);

    await user.keyboard("{Escape}");
    await user.clear(input);

    // Clicking outside closes open listbox
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [SMOG_HOTSPOT_PRESETS[1]] }),
      }),
    );
    await user.type(input, "Luck");
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument(), {
      timeout: 1500,
    });
    await user.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Use my location/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/permission denied/i);

    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      configurable: true,
    });
    await user.click(screen.getByRole("button", { name: /Use my location/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/not supported/i);
  });
});
