import { describe, expect, it } from "vitest";
import { computeDisplayedSold, countCountryTrips } from "../soldCount";

describe("country-scoped XSED sold counts", () => {
  it("normalizes legacy origin names, aliases and codes without guessing unknowns", () => {
    const trips = [
      "MX",
      "mx",
      "México",
      "mexico",
      " MÉXICO ",
      "Argentina",
      "AR",
      "Brazil",
      "Brasil",
      "BR",
      "Puerto Rico",
      "PR",
      "Atlantis",
      "constructor",
    ].map((originCountry) => ({ originCountry }));
    expect(countCountryTrips(trips, "MX")).toBe(5);
    expect(countCountryTrips(trips, "AR")).toBe(2);
    expect(countCountryTrips(trips, "BR")).toBe(3);
    expect(countCountryTrips(trips, "PR")).toBe(2);
  });

  it.each([
    ["2026-09-27T20:00:00Z", 0], // Sunday afternoon, not last week
    ["2026-09-27T23:59:59Z", 0],
    ["2026-09-28T00:00:00Z", 0], // Mexico City Sunday 18:00
    ["2026-09-28T00:19:59Z", 0],
    ["2026-09-28T00:20:00Z", 1],
    ["2026-09-28T01:00:00Z", 3],
    ["2026-09-28T03:20:00Z", 10],
    ["2026-09-28T04:00:00Z", 10], // Canonical close, Baja still open
    ["2026-12-07T05:00:00Z", 10], // Mexico City 23:00, Tijuana 21:00
    ["2026-09-28T15:00:00Z", 0],
    ["2026-10-04T23:59:59Z", 0],
  ])("at %s Mexico's synthetic count is %i", (instant, expected) => {
    expect(computeDisplayedSold(0, 10, "MX", new Date(instant))).toBe(expected);
  });

  it("does not leak Argentina's completed progression into Mexico", () => {
    const now = new Date("2026-09-28T01:00:00Z");
    expect(computeDisplayedSold(0, 10, "AR", now)).toBe(10);
    expect(computeDisplayedSold(0, 10, "MX", now)).toBe(3);
  });

  it.each(["2026-08-30T22:20:00Z", "2026-09-06T21:20:00Z"])(
    "honors Chile's canonical DST clock at %s",
    (instant) => {
      expect(computeDisplayedSold(0, 10, "CL", new Date(instant))).toBe(1);
    },
  );

  it("adds real bookings, caps capacity and stops automatic increments at 22:00", () => {
    expect(
      computeDisplayedSold(2, 10, "MX", new Date("2026-09-28T00:20:00Z")),
    ).toBe(3);
    expect(
      computeDisplayedSold(20, 10, "MX", new Date("2026-09-27T12:00:00Z")),
    ).toBe(10);
    expect(
      computeDisplayedSold(0, 30, "MX", new Date("2026-09-28T05:00:00Z")),
    ).toBe(12);
  });
});
