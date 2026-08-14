import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TripDetailsHero } from "@/components/app/dashboard/traveler/TripDetailsHero";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import type { TripDetailsData } from "@/types/tripDetails";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: TripItineraryDict["hero"] = {
  eyebrowRevealed: "Your destination, revealed",
  eyebrowCompleted: "Trip completed",
  eyebrowCancelled: "Trip cancelled",
  eyebrowConfirmed: "Your destination awaits",
  destinationFallback: "Your surprise destination",
  subtitle: "{{nights}} nights of surprise travel await.",
  travelers: "{{n}} travelers",
  departsInDays: "Departs in {{n}} days",
  departsToday: "Departs today",
};

function trip(overrides: Partial<TripDetailsData> = {}): TripDetailsData {
  return {
    id: "trip-1",
    status: "CONFIRMED",
    startDate: "2026-08-17T00:00:00.000Z",
    endDate: "2026-08-20T00:00:00.000Z",
    nights: 3,
    pax: 2,
    type: "couple",
    originCity: "Buenos Aires",
    originCountry: "Argentina",
    actualDestination: null,
    destinationRevealedAt: null,
    experience: null,
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;

function render(tripData: TripDetailsData) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<TripDetailsHero copy={copy} locale="en" trip={tripData} />);
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("TripDetailsHero — CONFIRMED (pre-reveal) status", () => {
  it("never shows the real destination, even when an experience is already assigned", () => {
    render(
      trip({
        status: "CONFIRMED",
        experience: {
          id: "exp-1",
          title: "Secret Getaway",
          heroImage: "https://example.com/photo.jpg",
          destinationCity: "Rio de Janeiro",
          destinationCountry: "Brazil",
          itinerary: null,
          inclusions: null,
          exclusions: null,
        },
      }),
    );

    expect(container.textContent).toContain(copy.destinationFallback);
    expect(container.textContent).not.toContain("Rio de Janeiro");
    expect(container.textContent).not.toContain("Secret Getaway");

    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).not.toContain("example.com");
  });

  it("falls back to the generic hero photo when no experience is assigned", () => {
    render(trip({ status: "CONFIRMED", experience: null }));

    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toContain(
      encodeURIComponent("/images/hero-image-1.jpeg"),
    );
  });

  it("shows the confirmed eyebrow and no departure pill", () => {
    render(trip({ status: "CONFIRMED" }));

    expect(container.textContent).toContain(copy.eyebrowConfirmed);
    expect(container.textContent).not.toContain("Departs");
  });
});

describe("TripDetailsHero — REVEALED status (unchanged behavior)", () => {
  it("shows the real destination and a departure pill", () => {
    render(
      trip({
        status: "REVEALED",
        actualDestination: "Rio de Janeiro, Brazil",
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60_000).toISOString(),
      }),
    );

    expect(container.textContent).toContain("Rio de Janeiro, Brazil");
    expect(container.textContent).toContain(copy.eyebrowRevealed);
    expect(container.textContent).toContain("Departs in 3 days");
  });

  it("regression: departure tomorrow at UTC midnight, less than 24h away this afternoon — reads 'Departs in 1 day', not 'Departs today'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T15:00:00.000Z"));
    try {
      render(
        trip({
          status: "REVEALED",
          actualDestination: "San Antonio de Areco, Argentina",
          startDate: "2026-08-15T00:00:00.000Z",
        }),
      );

      expect(container.textContent).toContain("Departs in 1 days");
      expect(container.textContent).not.toContain("Departs today");
    } finally {
      vi.useRealTimers();
    }
  });
});
