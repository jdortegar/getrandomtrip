import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TripRevealCountdown } from "@/components/app/dashboard/traveler/TripRevealCountdown";
import es from "@/dictionaries/es.json";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.useRealTimers();
});

function render(now: string) {
  vi.setSystemTime(new Date(now));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <TripRevealCountdown
        copy={es.tripReveal}
        departureTimeZone="America/Sao_Paulo"
        startDate="2026-12-10T00:00:00.000Z"
      />,
    ),
  );
}

it("counts down to the reveal on a high-contrast teal panel", () => {
  // Reveal: 2026-12-08 09:00 São Paulo = 12:00 UTC → 14 days, 12 hours left.
  render("2026-11-24T00:00:00.000Z");

  const timer = container.querySelector('[role="timer"]');
  expect(timer?.textContent).toContain("14");
  expect(timer?.textContent).toContain(es.tripReveal.daysLabel);
  expect(container.querySelector(".bg-primary")).not.toBeNull();
  // The departure date lives in the header, not here.
  expect(container.textContent).not.toContain("diciembre");

  act(() => vi.advanceTimersByTime(1000));
  expect(container.querySelector('[role="timer"]')?.textContent).toContain(
    "59",
  );
});

it("shows the being-prepared note once the reveal moment has passed", () => {
  render("2026-12-09T00:00:00.000Z");

  expect(container.querySelector('[role="timer"]')).toBeNull();
  expect(container.textContent).toContain(es.tripReveal.pendingAssignment);
});
