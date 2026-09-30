import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { AdminTripRequest } from "@/lib/admin/types";
import { TripRequestDetails } from "../TripRequestDetails";

const trip: AdminTripRequest = {
  accommodationType: "any",
  actualDestination: null,
  addons: [],
  arrivePref: "any",
  avoidDestinations: [],
  climate: "any",
  completedAt: null,
  createdAt: "2026-09-27T12:00:00.000Z",
  customerFeedback: null,
  customerRating: null,
  departPref: "any",
  destinationRevealedAt: null,
  endDate: "2026-10-04T00:00:00.000Z",
  experience: null,
  experienceId: null,
  from: "admin",
  id: "trip-1",
  level: "xsed",
  maxTravelTime: "no-limit",
  nights: 1,
  originCity: "Buenos Aires",
  originCountry: "Argentina",
  pax: 2,
  paxDetails: null,
  payment: null,
  startDate: "2026-10-03T00:00:00.000Z",
  status: "CONFIRMED",
  transport: "plane",
  tripperId: null,
  tripPhotos: null,
  type: "xsed",
  updatedAt: "2026-09-27T12:00:00.000Z",
  user: { email: "ana@example.com", id: "user-1", locale: null, name: "Ana" },
};

describe("TripRequestDetails calendar dates", () => {
  it.each([
    ["en", "Oct 3, 2026 — Oct 4, 2026"],
    ["es", "3 oct 2026 — 4 oct 2026"],
  ])("preserves departure and return dates in %s", (locale, expected) => {
    const html = renderToStaticMarkup(
      <TripRequestDetails
        labels={en.adminTripEditModal.details}
        locale={locale}
        ownCarLabel="Own car"
        trip={trip}
      />,
    );
    expect(html).toContain(expected);
  });

  it("preserves placeholders for missing dates", () => {
    const html = renderToStaticMarkup(
      <TripRequestDetails
        labels={en.adminTripEditModal.details}
        locale="es"
        ownCarLabel="Auto propio"
        trip={{ ...trip, startDate: null, endDate: null }}
      />,
    );
    expect(html).toContain("— — —");
  });
});

describe("TripRequestDetails transport", () => {
  it.each([
    ["en", en, "Own car"],
    ["es", es, "Auto propio"],
  ] as const)("shows own-car transport for stale and canonical XSED in %s", (locale, dictionary, expected) => {
    for (const transport of ["plane", "own-car"]) {
      const html = renderToStaticMarkup(<TripRequestDetails
        labels={dictionary.adminTripEditModal.details}
        locale={locale}
        ownCarLabel={dictionary.tripTransport.ownCar}
        trip={{ ...trip, level: "family", transport }}
      />);
      expect(html).toContain(expected);
      expect(html).not.toContain(">plane<");
      expect(html).not.toContain(">own-car<");
    }
  });

  it("preserves regular journey transport", () => {
    const html = renderToStaticMarkup(<TripRequestDetails
      labels={en.adminTripEditModal.details}
      locale="en"
      ownCarLabel="Own car"
      trip={{ ...trip, type: "couple", level: "essenza", transport: "train" }}
    />);
    expect(html).toContain(">train<");
    expect(html).not.toContain("Own car");
  });
});
