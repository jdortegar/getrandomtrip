import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { TripStatusBar } from "@/components/app/dashboard/traveler/TripStatusBar";
import en from "@/dictionaries/en.json";
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

it("shows the status badge and its one-line description", () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <TripStatusBar
        description={es.tripDetail.statusDescriptions.CONFIRMED}
        label={es.tripDetail.status.CONFIRMED}
        status="CONFIRMED"
      />,
    ),
  );

  expect(container.textContent).toContain(es.tripDetail.status.CONFIRMED);
  expect(container.textContent).toContain(
    es.tripDetail.statusDescriptions.CONFIRMED,
  );
});

it("has a description for every trip status in both locales", () => {
  for (const dict of [es, en]) {
    expect(Object.keys(dict.tripDetail.statusDescriptions).sort()).toEqual(
      Object.keys(dict.tripDetail.status).sort(),
    );
  }
});
