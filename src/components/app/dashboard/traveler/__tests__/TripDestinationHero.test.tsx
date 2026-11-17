import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { TripDestinationHero } from "@/components/app/dashboard/traveler/TripDestinationHero";
import en from "@/dictionaries/en.json";
import type { TripDetailsData } from "@/types/tripDetails";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const copy = en.tripItinerary.hero;

function trip(overrides: Partial<TripDetailsData> = {}, teaser: string | null = "A pause on the road."): TripDetailsData {
  return {
    id: "trip-1",
    status: "REVEALED",
    startDate: "2026-11-20T00:00:00.000Z",
    endDate: "2026-11-22T00:00:00.000Z",
    nights: 2,
    pax: 2,
    type: "couple",
    originCity: "Buenos Aires",
    originCountry: "Argentina",
    actualDestination: "Junín, Argentina",
    destinationRevealedAt: null,
    experience: {
      id: "exp-1",
      title: "Two days to share the road",
      heroImage: null,
      destinationCity: "Junín",
      destinationCountry: "Argentina",
      teaser,
      itinerary: null,
      inclusions: null,
      exclusions: null,
    },
    ...overrides,
  } as TripDetailsData;
}

let container: HTMLDivElement;
let root: Root;

function render(data: TripDetailsData) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<TripDestinationHero copy={copy} trip={data} />));
  return container.textContent ?? "";
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

describe("TripDestinationHero", () => {
  it("sets the place as title, country in the eyebrow and the teaser as description", () => {
    const text = render(trip());
    expect(container.querySelector("h1")?.textContent).toBe("Junín.");
    expect(text).toContain("Your next story / Argentina");
    expect(text).toContain("A pause on the road.");
    expect(text).toContain(copy.firstLook);
    expect(text).toContain(copy.explore);
  });

  it("falls back to the nights line when the experience has no teaser", () => {
    const text = render(trip({}, "  "));
    expect(text).toContain("2 nights of surprise travel await.");
  });

  it("drops the country when none is known", () => {
    const text = render(
      trip({ actualDestination: null, experience: { ...trip().experience!, destinationCountry: null } }),
    );
    expect(text).toContain("Your next story");
    expect(text).not.toContain("Your next story /");
  });

  it("uses the status eyebrow for a cancelled trip", () => {
    const text = render(trip({ status: "CANCELLED" }));
    expect(text).toContain(copy.eyebrowCancelled);
    expect(text).not.toContain("Your next story");
  });
});
