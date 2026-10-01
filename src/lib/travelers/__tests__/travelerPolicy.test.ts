import { describe, expect, it } from "vitest";
import {
  hasMissingTravelerDetails,
  isTravelerFieldFilled,
  isTripEnded,
  rosterCutoffMs,
} from "../travelerPolicy";

describe("traveler field policy", () => {
  it("uses exactly 72 elapsed hours for XSED, retaining 7d for other trips", () => {
    expect(rosterCutoffMs("xsed")).toBe(72 * 3_600_000);
    expect(rosterCutoffMs("XSED")).toBe(72 * 3_600_000);
    expect(rosterCutoffMs("family")).toBe(168 * 3_600_000);
  });
  it.each([null, undefined, "", "   ", new Date("invalid")])(
    "treats %s as missing, never protected",
    (value) => {
      expect(isTravelerFieldFilled(value)).toBe(false);
    },
  );
  it("checks persisted fields rather than status", () => {
    const row = {
      kind: "ADULT",
      fullName: "Alex",
      email: "alex@example.com",
      idDocument: " ",
      dateOfBirth: null,
    };
    expect(hasMissingTravelerDetails(row)).toBe(true);
    expect(hasMissingTravelerDetails({ ...row, idDocument: "123" })).toBe(
      false,
    );
    expect(
      hasMissingTravelerDetails({
        ...row,
        kind: "MINOR",
        idDocument: "123",
        email: null,
      }),
    ).toBe(true);
  });
});

describe("isTripEnded", () => {
  const noon = (iso: string) => new Date(`${iso}T12:00:00.000Z`).getTime();
  const trip = { startDate: new Date("2026-10-03T00:00:00.000Z"), endDate: new Date("2026-10-04T00:00:00.000Z") };

  it("is false through the whole end date (inclusive, UTC day)", () => {
    expect(isTripEnded(trip, noon("2026-10-04"))).toBe(false);
    expect(isTripEnded(trip, Date.parse("2026-10-04T23:59:59.999Z"))).toBe(false);
  });
  it("is true from the day after the end date", () => {
    expect(isTripEnded(trip, Date.parse("2026-10-05T00:00:00.000Z"))).toBe(true);
  });
  it("falls back to startDate when endDate is missing", () => {
    const oneDay = { startDate: trip.startDate, endDate: null };
    expect(isTripEnded(oneDay, noon("2026-10-03"))).toBe(false);
    expect(isTripEnded(oneDay, noon("2026-10-04"))).toBe(true);
  });
  it("is false when the trip has no dates", () => {
    expect(isTripEnded({ startDate: null, endDate: null })).toBe(false);
  });
});
