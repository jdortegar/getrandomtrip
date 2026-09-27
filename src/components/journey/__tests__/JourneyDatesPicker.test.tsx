import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JourneyDatesPicker } from "@/components/journey/JourneyDatesPicker";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let container: HTMLDivElement;
let root: Root;
let previousLanguage: string;

function renderPicker(
  props: Partial<ComponentProps<typeof JourneyDatesPicker>> = {},
) {
  act(() => {
    root.render(
      <JourneyDatesPicker
        maxNights={2}
        nights={2}
        onNightsChange={vi.fn()}
        onStartDateChange={vi.fn()}
        startDate={undefined}
        {...props}
      />,
    );
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 27, 12));
  previousLanguage = document.documentElement.lang;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.lang = previousLanguage;
  vi.useRealTimers();
});

describe("JourneyDatesPicker month captions", () => {
  it.each([
    { locale: "es", months: ["Septiembre 2026", "Octubre 2026"] },
    { locale: "en", months: ["September 2026", "October 2026"] },
  ])(
    "capitalizes visible and accessible captions in $locale",
    ({ locale, months }) => {
      document.documentElement.lang = locale;
      act(() => {
        root.render(
          <JourneyDatesPicker
            maxNights={2}
            nights={2}
            onNightsChange={vi.fn()}
            onStartDateChange={vi.fn()}
            startDate={undefined}
          />,
        );
      });

      expect(
        Array.from(
          container.querySelectorAll(".rdp-caption_label"),
          (caption) => caption.textContent,
        ),
      ).toEqual(months);
      expect(
        Array.from(container.querySelectorAll('[role="grid"]'), (grid) =>
          grid.getAttribute("aria-label"),
        ),
      ).toEqual(months);
    },
  );
});

describe("JourneyDatesPicker responsive layout", () => {
  it("sizes all seven columns from the calendar container while retaining 44px target height", () => {
    renderPicker();
    const calendar = container.querySelector<HTMLElement>(".rdp-root")!;
    expect(calendar.parentElement?.classList.contains("@container")).toBe(true);
    expect(calendar.style.getPropertyValue("--rdp-day-width")).toBe(
      "min(44px, calc(100cqi / 7))",
    );
    expect(calendar.style.getPropertyValue("--rdp-day_button-width")).toBe(
      "var(--rdp-day-width)",
    );
    expect(calendar.style.getPropertyValue("--rdp-day-height")).toBe("44px");
    expect(calendar.style.getPropertyValue("--rdp-day_button-height")).toBe(
      "44px",
    );
    expect(calendar.querySelector(".rdp-day button")).not.toBeNull();
    for (const month of calendar.querySelectorAll('[role="grid"]')) {
      expect(month.querySelectorAll("thead th")).toHaveLength(7);
    }
  });

  it("keeps Sunday selectable, highlights the fixed range, and navigates months", () => {
    document.documentElement.lang = "es";
    const onRangeChange = vi.fn();
    renderPicker({ onRangeChange });
    act(() =>
      container.querySelector<HTMLButtonElement>(".rdp-button_next")!.click(),
    );
    const sunday = container.querySelector<HTMLButtonElement>(
      '[data-day="2026-10-11"] button',
    )!;
    expect(sunday).not.toBeNull();
    act(() => sunday.click());
    expect(onRangeChange).toHaveBeenLastCalledWith("2026-10-11", 2);
    renderPicker({ onRangeChange, startDate: "2026-10-11" });
    const monday = container.querySelector('[data-day="2026-10-12"]')!;
    const tuesday = container.querySelector('[data-day="2026-10-13"]')!;
    expect(monday.classList.contains("rounded-none")).toBe(true);
    expect(tuesday.classList.contains("rounded-l-none")).toBe(true);
    expect(
      container.querySelectorAll(".rdp-caption_label")[0].textContent,
    ).toBe("Octubre 2026");
    act(() =>
      container
        .querySelector<HTMLButtonElement>(".rdp-button_previous")!
        .click(),
    );
    expect(
      container.querySelectorAll(".rdp-caption_label")[0].textContent,
    ).toBe("Septiembre 2026");
  });
});

it("disables dates before the seven-day boundary and does not highlight a stale URL date", () => {
  renderPicker({ startDate: "2026-09-26" });
  expect(container.querySelector<HTMLButtonElement>('[data-day="2026-10-03"] button')?.disabled).toBe(true);
  expect(container.querySelector<HTMLButtonElement>('[data-day="2026-10-04"] button')?.disabled).toBe(false);
  expect(container.querySelector('[data-selected="true"]')).toBeNull();
});
