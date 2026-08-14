import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { TripItineraryTimeline } from "../TripItineraryTimeline";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import type { ItineraryDayEntry } from "@/types/tripper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: Pick<TripItineraryDict, "itinerary"> = {
  itinerary: {
    eyebrow: "Day by day",
    heading: "Your itinerary",
    lede: "Nothing to plan, just show up.",
  },
};

// Realistic TinyMCE output (RichTextInput) — real day descriptions are
// HTML, not plain strings; the regression test below relies on this.
const days: ItineraryDayEntry[] = [
  { title: "Touchdown", description: "<p>Arrival day.</p>", image: null },
  {
    title: "Into the Vines",
    description: "<p>A full day out. <strong>Don't miss it.</strong></p>",
    image: null,
  },
  { title: "One Last Pour", description: "", image: null },
];

let container: HTMLDivElement;
let root: Root;

function render(entries: ItineraryDayEntry[], startDate: string | null = "2026-08-22T00:00:00.000Z") {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TripItineraryTimeline copy={copy} days={entries} locale="en" startDate={startDate} />,
    );
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("TripItineraryTimeline — guards Resolved Decision #1", () => {
  it("renders exactly one card per day entry", () => {
    render(days);
    const listItems = container.querySelectorAll("li");
    expect(listItems).toHaveLength(3);
  });

  it("pads the day number", () => {
    render(days);
    const text = container.textContent ?? "";
    expect(text).toContain("01");
    expect(text).toContain("02");
    expect(text).toContain("03");
  });

  it("renders a description block only for days that have one", () => {
    render(days);
    const descriptions = container.querySelectorAll('[class*="dayDesc"]');
    // 2 real day descriptions — the 3rd day has none
    expect(descriptions).toHaveLength(2);
  });

  it("regression: renders day.description as HTML, not escaped text (RichTextInput/TinyMCE output)", () => {
    render(days);
    const descriptions = container.querySelectorAll('[class*="dayDesc"]');
    const secondDayDescription = descriptions[1];

    // The bug: description rendered as literal text meant the browser showed
    // "<strong>Don't miss it.</strong>" verbatim instead of bold text.
    expect(container.textContent).not.toContain("<strong>");
    expect(secondDayDescription.querySelector("strong")?.textContent).toBe(
      "Don't miss it.",
    );
  });

  it("never renders a per-stop row (no time-based stop markup)", () => {
    render(days);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
  });

  it("renders real title text from the day entry", () => {
    render(days);
    const text = container.textContent ?? "";
    expect(text).toContain("Touchdown");
    expect(text).toContain("Into the Vines");
    expect(text).toContain("One Last Pour");
  });

  it("never renders a day-level dot or rail connector (guards ADR-3's supersession)", () => {
    render(days);
    expect(container.querySelectorAll('[class*="dayDot"]')).toHaveLength(0);
    expect(container.querySelectorAll('[class*="dayRail"]')).toHaveLength(0);
  });
});
