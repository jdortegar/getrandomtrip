// @vitest-environment node
import type { Prisma } from "@prisma/client";
import { expect, it, vi } from "vitest";
import { loadTripDocumentSource } from "../loadTripDocumentSource";
import { createPrefilledDocumentSnapshot } from "@/lib/trip-documents/providerSnapshots";
const trip = {
  user: { name: "Buyer", locale: "en" },
  travelers: [{ fullName: "Companion" }],
  originCity: "Rosario",
  actualDestination: "Areco",
  startDate: new Date("2026-10-01"),
  endDate: new Date("2026-10-03"),
  pax: 2,
};
function database(experience: unknown) {
  const findUnique = vi.fn().mockResolvedValue({ ...trip, experience });
  return {
    findUnique,
    tx: { tripRequest: { findUnique } } as unknown as Prisma.TransactionClient,
  };
}
it.each([
  { level: "xsed", type: ["family"] },
  { level: null, type: ["XSED"] },
  { level: "essenza", type: ["family"] },
])(
  "classifies canonical level and legacy marker: %j",
  async (classification) => {
    const fake = database({
      ...classification,
      title: "Experience",
      destinationCountry: "AR",
      destinationCity: "Areco",
      hotels: [],
      activities: [],
      sections: [],
      itinerary: [],
    });
    const source = await loadTripDocumentSource(fake.tx, "trip");
    expect(source.provider.kind).toBe(
      classification.level === "essenza" ? "experience" : "xsed",
    );
    expect(source.trip.user).toEqual(trip.user);
    expect(fake.findUnique.mock.calls[0][0].where).toEqual({ id: "trip" });
    expect(
      fake.findUnique.mock.calls[0][0].select.experience.select,
    ).toMatchObject({ level: true, type: true, sections: true });
  },
);
it("uses assigned experience provider facts and buyer roster without payment claims", async () => {
  const fake = database({
    level: "xsed",
    type: ["solo"],
    title: "Day",
    destinationCountry: "AR",
    destinationCity: "Areco",
    hotels: [{ hotelName: "Hotel", hotelLocation: "Address" }],
    activities: [],
    sections: [],
    itinerary: [{ title: "Walk", description: "<p>By the river</p>" }],
  });
  const source = await loadTripDocumentSource(fake.tx, "trip");
  const hotel = createPrefilledDocumentSnapshot(
    "hotel-voucher",
    source.trip,
    source.provider,
    0,
  );
  expect(hotel).toMatchObject({
    locale: "en",
    data: { holder: "Buyer", property: { name: "Hotel" } },
  });
  expect(JSON.stringify(hotel)).toContain("Companion");
  expect(JSON.stringify(hotel)).not.toContain("paymentWording");
  expect(
    createPrefilledDocumentSnapshot(
      "xsed-roadmap",
      source.trip,
      source.provider,
    ),
  ).toMatchObject({
    data: { stops: [{ title: "Walk", directions: "By the river" }] },
  });
});
it("supports unassigned trips without fabricated provider facts", async () => {
  const fake = database(null);
  const source = await loadTripDocumentSource(fake.tx, "trip");
  expect(source.provider).toEqual({ kind: "experience" });
  expect(source.trip.experience).toBe(null);
});
it("fails closed if the trip disappeared", async () => {
  const fake = database(null);
  fake.findUnique.mockResolvedValue(null);
  await expect(loadTripDocumentSource(fake.tx, "gone")).rejects.toThrow(
    "DOCUMENT_SOURCE_TRIP_NOT_FOUND",
  );
});
