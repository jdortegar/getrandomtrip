import { describe, expect, it } from "vitest";
import { toTravelerTripResponse } from "../travelerTripResponse";

const experience = {
  id: "exp",
  title: "Mystery",
  heroImage: "public.jpg",
  destinationCity: "Secret city",
  destinationCountry: "Secret country",
  itinerary: ["Day 1"],
  inclusions: ["Hotel"],
  exclusions: ["Flight"],
  adminNotes: "private",
  supplierNotes: "private",
  revealCopy: "private",
  hotels: ["private"],
  activities: ["private"],
  futurePrivateField: "private",
};

describe("traveler response visibility", () => {
  it.each(["DRAFT", "SAVED", "PENDING_PAYMENT", "CONFIRMED", "UNKNOWN"])(
    "hides destination and fulfillment for %s",
    (status) => {
      const trip = { status, actualDestination: "Secret city", experience };
      const response = toTravelerTripResponse(trip);
      expect(response.actualDestination).toBeNull();
      expect(response.experience).toEqual({
        id: "exp",
        title: "Mystery",
        heroImage: "public.jpg",
      });
      expect(trip.actualDestination).toBe("Secret city");
      expect(trip.experience).toBe(experience);
    },
  );

  it.each(["REVEALED", "COMPLETED", "CANCELLED"])(
    "returns fulfillment but never private authoring fields for %s",
    (status) => {
      const response = toTravelerTripResponse({
        status,
        actualDestination: "Secret city",
        experience,
      });
      expect(response.actualDestination).toBe("Secret city");
      expect(Object.keys(response.experience!).sort()).toEqual([
        "destinationCity",
        "destinationCountry",
        "exclusions",
        "heroImage",
        "id",
        "inclusions",
        "itinerary",
        "title",
      ]);
    },
  );
});
