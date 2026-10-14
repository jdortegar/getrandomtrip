import { describe, expect, it } from "vitest";
import {
  summarizeBookingTravelDocuments,
  summarizeTravelDocuments,
} from "../travelDocumentsSummary";
import type { AdminBookingTravelerWithDocuments } from "@/types/traveler";

const identity = {
  idDocument: "DOC",
  phone: null,
  email: "x@example.test",
  dateOfBirth: null,
};
const buyer: AdminBookingTravelerWithDocuments = {
  ...identity,
  id: "buyer",
  kind: "BOOKING_HOLDER",
  name: "Buyer",
  nationalities: ["AR", "IT"],
  visas: ["US", "SCHENGEN"],
};
const adult: AdminBookingTravelerWithDocuments = {
  ...identity,
  id: "adult",
  kind: "ADULT",
  name: "Adult",
  nationalities: [],
  visas: [],
};
const minor: AdminBookingTravelerWithDocuments = {
  ...identity,
  id: "minor",
  kind: "MINOR",
  name: "Minor",
  email: null,
  dateOfBirth: "2015-01-02",
  nationalities: ["AR"],
  visas: [],
};

describe("summarizeTravelDocuments", () => {
  it("lists the buyer first, then companions in their order, minors included", () => {
    const summary = summarizeTravelDocuments({
      buyer,
      travelers: [adult, minor],
    });
    expect(summary.rows.map((row) => row.id)).toEqual([
      "buyer",
      "adult",
      "minor",
    ]);
    expect(summary.rows[0]).toEqual({
      id: "buyer",
      kind: "BOOKING_HOLDER",
      name: "Buyer",
      nationalities: ["AR", "IT"],
      visas: ["US", "SCHENGEN"],
      missing: false,
    });
    expect(summary.rows[1].missing).toBe(true);
    expect(summary.rows[2].missing).toBe(false);
    expect(summary).toMatchObject({ missingCount: 1, totalCount: 3 });
  });

  it("counts a buyer without nationalities as missing even with visas", () => {
    const summary = summarizeTravelDocuments({
      buyer: { ...buyer, nationalities: [] },
      travelers: [],
    });
    expect(summary.rows[0].missing).toBe(true);
    expect(summary).toMatchObject({ missingCount: 1, totalCount: 1 });
  });

  it("treats null or absent lists as empty", () => {
    const summary = summarizeTravelDocuments({
      buyer: { ...buyer, nationalities: null, visas: undefined },
      travelers: [],
    });
    expect(summary.rows[0]).toMatchObject({
      nationalities: [],
      visas: [],
      missing: true,
    });
  });

  it("counts companion slots with no record yet as missing", () => {
    const summary = summarizeTravelDocuments({
      buyer,
      travelers: [minor],
      expectedTotal: 4,
    });
    expect(summary.rows).toHaveLength(2);
    expect(summary).toMatchObject({ missingCount: 2, totalCount: 4 });
  });

  it("never lets expectedTotal shrink the recorded travelers", () => {
    const summary = summarizeTravelDocuments({
      buyer,
      travelers: [adult, minor],
      expectedTotal: 1,
    });
    expect(summary).toMatchObject({ missingCount: 1, totalCount: 3 });
  });

  it("handles a trip without a buyer row", () => {
    const summary = summarizeTravelDocuments({ buyer: null, travelers: [] });
    expect(summary).toEqual({ rows: [], missingCount: 0, totalCount: 0 });
  });
});

describe("summarizeBookingTravelDocuments", () => {
  it("splits the booking holder out and expects pax travelers", () => {
    const summary = summarizeBookingTravelDocuments([minor, buyer], 3, {});
    expect(summary.rows.map((row) => row.id)).toEqual(["buyer", "minor"]);
    expect(summary).toMatchObject({ missingCount: 1, totalCount: 3 });
  });

  it("uses the adult/minor breakdown when it exceeds pax", () => {
    const summary = summarizeBookingTravelDocuments([buyer], 1, {
      adults: 2,
      minors: 1,
    });
    expect(summary).toMatchObject({ missingCount: 2, totalCount: 3 });
  });
});
