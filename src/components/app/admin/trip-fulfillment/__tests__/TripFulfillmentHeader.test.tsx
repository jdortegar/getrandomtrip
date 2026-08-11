import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { TripFulfillmentHeader } from "@/components/app/admin/trip-fulfillment/TripFulfillmentHeader";
import type { AdminTripRequest } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: MarketingDictionary["adminTripFulfillment"] = {
  eyebrow: "Trip Fulfillment",
  title: "{{userName}}'s Trip",
  back: "Back to Trips",
  contactTraveler: "Contact Traveler",
} as MarketingDictionary["adminTripFulfillment"];

function baseTrip(overrides: Partial<AdminTripRequest> = {}): AdminTripRequest {
  return {
    accommodationType: "any",
    actualDestination: null,
    addons: [],
    arrivePref: "any",
    avoidDestinations: [],
    climate: "any",
    completedAt: null,
    createdAt: new Date().toISOString(),
    customerFeedback: null,
    customerRating: null,
    departPref: "any",
    destinationRevealedAt: null,
    endDate: null,
    experienceId: null,
    experience: null,
    from: "traveler",
    id: "trip-1",
    level: "explorer",
    maxTravelTime: "no-limit",
    nights: 1,
    originCity: "Buenos Aires",
    originCountry: "Argentina",
    pax: 2,
    paxDetails: null,
    payment: null,
    startDate: null,
    status: "CONFIRMED",
    transport: "flight",
    tripperId: null,
    tripPhotos: null,
    type: "couple",
    updatedAt: new Date().toISOString(),
    user: { id: "user-1", name: "David Ortega", email: "david@example.com" },
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;

function render(trip: AdminTripRequest) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TripFulfillmentHeader
        copy={copy}
        locale="en"
        paymentStatusLabels={{}}
        statusLabel={(status) => status}
        trip={trip}
      />,
    );
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("TripFulfillmentHeader — type/level chip dedup", () => {
  it("renders two distinct chips when type and level differ", () => {
    render(baseTrip({ type: "couple", level: "explorer" }));

    const text = container.textContent ?? "";
    expect(text).toContain("couple");
    expect(text).toContain("explorer");
  });

  it("renders the type/level chip only once when they're the same string (XSED)", () => {
    render(baseTrip({ type: "xsed", level: "xsed" }));

    const chips = Array.from(container.querySelectorAll("span")).filter(
      (el) => el.textContent === "xsed",
    );
    expect(chips).toHaveLength(1);
  });
});
