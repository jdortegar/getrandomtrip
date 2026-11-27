import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { TripTimeline } from "@/components/app/dashboard/traveler/TripTimeline";
import es from "@/dictionaries/es.json";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

it("renders every milestone in order and flags the current one", () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <TripTimeline
        copy={es.tripDetail}
        locale="es"
        steps={[
          { key: "created", state: "done", date: "2026-01-10T15:00:00.000Z" },
          { key: "paid", state: "done", date: null },
          { key: "revealed", state: "current", date: null },
          {
            key: "departure",
            state: "upcoming",
            date: "2026-03-12T00:00:00.000Z",
            dateOnly: true,
          },
        ]}
      />,
    ),
  );

  const items = Array.from(container.querySelectorAll("li"));
  expect(items).toHaveLength(4);
  expect(items[0].textContent).toContain(es.tripDetail.tripCreatedLabel);
  expect(items[3].textContent).toContain(es.tripDetail.timelineDepartureLabel);
  expect(items[3].textContent).toContain(es.tripDetail.timelineUpcomingLabel);
  // Calendar dates render in UTC: never shifted to the 11th.
  expect(items[3].textContent).toMatch(/12 de mar/i);

  const current = container.querySelector('[aria-current="step"]');
  expect(current).toBe(items[2]);
  expect(current?.textContent).toContain(es.tripDetail.timelineCurrentLabel);
});
