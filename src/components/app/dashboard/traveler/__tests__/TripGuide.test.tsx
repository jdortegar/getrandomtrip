import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TripGuide } from "@/components/app/dashboard/traveler/TripGuide";
import en from "@/dictionaries/en.json";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const copy = en.tripItinerary.guide;
let container: HTMLDivElement;
let root: Root;

function render(onSupport = vi.fn()) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(<TripGuide copy={copy} onSupport={onSupport} photo="/images/hero-image-1.jpeg" place="JUNÍN, ARGENTINA" />),
  );
  return onSupport;
}

const tabs = () => Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
const panelTitle = () => container.querySelector('[role="tabpanel"] h4')?.textContent;
const button = (label: string) =>
  Array.from(container.querySelectorAll("button")).find((b) => b.textContent?.includes(label));

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

describe("TripGuide", () => {
  it("renders every prototype block with the photo caption and section anchors", () => {
    render();
    const text = container.textContent ?? "";
    expect(text).toContain(copy.eyebrow);
    expect(text).toContain("JUNÍN, ARGENTINA / " + copy.photoTagline);
    expect(text).toContain(copy.essentials.packing.question);
    expect(text).toContain(copy.companion.action);
    const anchors = Array.from(container.querySelectorAll("nav a")).map((a) => a.getAttribute("href"));
    expect(anchors).toEqual(["#guide-route", "#guide-essentials", "#guide-companion"]);
    for (const href of anchors) expect(container.querySelector(href!)).not.toBeNull();
    expect(container.querySelector(`a[href="#documents"]`)?.textContent).toBe(copy.essentials.bookings.action);
  });

  it("switches route moments by click and with arrow / Home / End keys", () => {
    render();
    expect(panelTitle()).toBe(copy.route.moments[0].title);

    act(() => tabs()[1].click());
    expect(panelTitle()).toBe(copy.route.moments[1].title);
    expect(tabs()[1].getAttribute("aria-selected")).toBe("true");
    expect(tabs()[0].tabIndex).toBe(-1);

    act(() => tabs()[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    expect(panelTitle()).toBe(copy.route.moments[2].title);
    expect(document.activeElement).toBe(tabs()[2]);

    act(() => tabs()[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    expect(panelTitle()).toBe(copy.route.moments[0].title);

    act(() => tabs()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true })));
    expect(panelTitle()).toBe(copy.route.moments[2].title);
  });

  it("opens support from the accordion and from the closing band", () => {
    const onSupport = render();
    act(() => button(copy.essentials.help.action)!.click());
    act(() => button(copy.companion.action)!.click());
    expect(onSupport).toHaveBeenCalledTimes(2);
  });
});
