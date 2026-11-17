import { describe, expect, it } from "vitest";
import { toTravelerTripResponse } from "../travelerTripResponse";

const experience = {
  id: "exp",
  title: "Mystery",
  heroImage: "public.jpg",
  destinationCity: "Secret city",
  destinationCountry: "Secret country",
  teaser: "A secret short description",
  description: "A secret long description",
  itinerary: ["Day 1"],
  inclusions: ["Hotel"],
  exclusions: ["Flight"],
  adminNotes: "private",
  supplierNotes: "private",
  revealCopy: "private",
  hotels: [{ hotelName: " Estancia Secreta ", referredLink: "https://affiliate.example/private", hotelLink: "https://maps.example/private" }],
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
        "description",
        "destinationCity",
        "destinationCountry",
        "exclusions",
        "heroImage",
        "hotelName",
        "id",
        "inclusions",
        "itinerary",
        "photos",
        "teaser",
        "title",
      ]);
    },
  );
});

describe("traveler response — hotel name only", () => {
  it("exposes the first stay's trimmed name after the reveal, never the hotel record", () => {
    const response = toTravelerTripResponse({ status: "REVEALED", actualDestination: "Secret city", experience });
    expect(response.experience?.hotelName).toBe("Estancia Secreta");
    expect(response.experience?.description).toBe("A secret long description");
    const json = JSON.stringify(response);
    expect(json).not.toContain("affiliate.example");
    expect(json).not.toContain("maps.example");
    expect(json).not.toContain("referredLink");
  });

  it("falls back to null when no stay has a name", () => {
    const response = toTravelerTripResponse({
      status: "REVEALED",
      actualDestination: null,
      experience: { ...experience, hotels: [{ hotelName: "  " }, "private"] },
    });
    expect(response.experience?.hotelName).toBeNull();
  });

  it("sends neither the description nor the hotel name before the reveal", () => {
    const response = toTravelerTripResponse({ status: "CONFIRMED", actualDestination: "Secret city", experience });
    expect(response.experience).not.toHaveProperty("description");
    expect(response.experience).not.toHaveProperty("hotelName");
    expect(JSON.stringify(response)).not.toContain("Estancia");
  });
});

describe("traveler response — photos", () => {
  it("collects gallery, section and activity photo URLs only, de-duplicated, after the reveal", () => {
    const response = toTravelerTripResponse({
      status: "REVEALED",
      actualDestination: null,
      experience: {
        ...experience,
        gallery: ["/g1.jpg", " "],
        sections: [{ title: "Stay", contact: "+54 private", photos: [{ url: "/s1.jpg", credit: "" }, { url: "/g1.jpg" }] }],
        activities: [{ name: "Ride", risks: "private risk note", image: "/a1.jpg" }, { name: "No photo", image: null }],
      },
    });
    expect(response.experience?.photos).toEqual(["/g1.jpg", "/s1.jpg", "/a1.jpg"]);
    const json = JSON.stringify(response);
    expect(json).not.toContain("private risk note");
    expect(json).not.toContain("+54 private");
  });

  it("sends no photos before the reveal", () => {
    const response = toTravelerTripResponse({ status: "CONFIRMED", actualDestination: null, experience: { ...experience, gallery: ["/g1.jpg"] } });
    expect(response.experience).not.toHaveProperty("photos");
  });
});
