import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { TripDetailsHeader } from "@/components/app/dashboard/traveler/TripDetailsHeader";
import es from "@/dictionaries/es.json";
import type { TripDetailsData } from "@/types/tripDetails";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

const baseTrip: TripDetailsData = {
  id: "trip-1",
  status: "CONFIRMED",
  startDate: "2026-03-12T00:00:00.000Z",
  endDate: "2026-03-19T00:00:00.000Z",
  nights: 7,
  pax: 2,
  type: "couple",
  originCity: "Buenos Aires",
  originCountry: "Argentina",
  actualDestination: null,
  destinationRevealedAt: null,
  experience: {
    id: "exp-1",
    title: "Lisboa secreta",
    heroImage: "/images/lisboa.jpg",
    destinationCity: "Lisboa",
    destinationCountry: "Portugal",
    itinerary: null,
    inclusions: null,
  },
} as TripDetailsData;

function render(trip: TripDetailsData, revealHref?: string, statusBar?: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <TripDetailsHeader
        backHref="/dashboard/traveler"
        copy={es.tripDetail}
        heroCopy={es.tripItinerary.hero}
        locale="es"
        revealHref={revealHref}
        statusBar={statusBar}
        trip={trip}
      />,
    ),
  );
}

it("keeps the destination and photo hidden before the reveal", () => {
  render(baseTrip);

  expect(container.querySelector("h1")?.textContent).toBe(es.tripItinerary.hero.destinationFallback);
  expect(container.textContent).not.toContain("Lisboa");
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toContain("7 noches");
  expect(container.textContent).toContain("2 viajeros");
  expect(container.textContent).toContain("Buenos Aires, Argentina");
});

it("shows the destination, thumbnail and reveal link once revealed", () => {
  render({ ...baseTrip, status: "REVEALED" }, "/dashboard/trips/trip-1/destination");

  expect(container.querySelector("h1")?.textContent).toBe("Lisboa, Portugal");
  expect(container.querySelector("img")).not.toBeNull();
  // ButtonV2 link: one for desktop, one full-width for mobile.
  const revealLinks = container.querySelectorAll('a[href="/dashboard/trips/trip-1/destination"]');
  expect(revealLinks).toHaveLength(2);
  revealLinks.forEach((link) => expect(link.textContent).toContain(es.tripDetail.viewRevelationAction));
});

it("renders the status bar slot under the title", () => {
  render(baseTrip, undefined, <p data-testid="status">status line</p>);

  expect(container.querySelector('[data-testid="status"]')?.textContent).toBe("status line");
  expect(container.querySelector('a[href$="/destination"]')).toBeNull();
});
