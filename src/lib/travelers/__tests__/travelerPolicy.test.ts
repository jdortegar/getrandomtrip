import { describe, expect, it } from "vitest";
import {
  hasMissingTravelerDetails,
  hasTravelDocuments,
  isTravelerFieldFilled,
  isTravelerRosterComplete,
  isTripEnded,
  parseTravelerDocumentCodes,
  rosterCutoffMs,
  travelerCodesEqual,
} from "../travelerPolicy";
import type { TravelerDocuments } from "@/types/traveler";

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

describe("isTravelerRosterComplete", () => {
  const filled = { kind: "ADULT", fullName: "A", email: "a@x.com", idDocument: "1", dateOfBirth: null };

  it.each(["COMPLETE", "INVITED"] as const)("counts a %s row with all details", (status) => {
    expect(isTravelerRosterComplete({ ...filled, status })).toBe(true);
  });
  it("does not count an invited row that still misses details", () => {
    expect(isTravelerRosterComplete({ ...filled, status: "INVITED", idDocument: " " })).toBe(false);
  });
  it("does not count a PENDING row (unsaved or failed save)", () => {
    expect(isTravelerRosterComplete({ ...filled, status: "PENDING" })).toBe(false);
  });
});

describe("hasTravelDocuments", () => {
  it("is true once the traveler has at least one nationality", () => {
    expect(hasTravelDocuments({ nationalities: ["AR"] })).toBe(true);
    const row: TravelerDocuments = { nationalities: ["AR", "IT"], visas: [] };
    expect(hasTravelDocuments(row)).toBe(true);
  });
  it("is false with no nationalities, even when visas are present", () => {
    const row: TravelerDocuments = { nationalities: [], visas: ["US"] };
    expect(hasTravelDocuments(row)).toBe(false);
    expect(hasTravelDocuments({})).toBe(false);
  });
  it("does not change roster completeness", () => {
    const row = { kind: "ADULT", fullName: "A", email: "a@x.com", idDocument: "1", dateOfBirth: null, status: "COMPLETE" };
    expect(isTravelerRosterComplete({ ...row, nationalities: [] } as typeof row)).toBe(true);
  });
});

describe("parseTravelerDocumentCodes", () => {
  it("leaves absent lists undefined (unchanged)", () => {
    expect(parseTravelerDocumentCodes({})).toEqual({ ok: true, nationalities: undefined, visas: undefined });
  });
  it("normalizes valid ISO nationalities and visa codes, allowing empty lists", () => {
    expect(parseTravelerDocumentCodes({ nationalities: ["AR", "IT", "AR"], visas: ["SCHENGEN", "US"] })).toEqual({
      ok: true,
      nationalities: ["AR", "IT"],
      visas: ["SCHENGEN", "US"],
    });
    expect(parseTravelerDocumentCodes({ nationalities: [], visas: [] })).toEqual({ ok: true, nationalities: [], visas: [] });
  });
  it("rejects non-ISO nationalities, including visa zones", () => {
    expect(parseTravelerDocumentCodes({ nationalities: ["AR", "SCHENGEN", "Argentina"] })).toEqual({
      ok: false,
      error: "Invalid nationalities",
      invalid: ["SCHENGEN", "Argentina"],
    });
  });
  it("rejects unknown visa codes and non-array values", () => {
    expect(parseTravelerDocumentCodes({ visas: ["US", "XX"] })).toEqual({ ok: false, error: "Invalid visas", invalid: ["XX"] });
    expect(parseTravelerDocumentCodes({ nationalities: "AR" })).toEqual({ ok: false, error: "Invalid nationalities", invalid: [] });
  });
});

describe("travelerCodesEqual", () => {
  it("compares code lists ignoring order", () => {
    expect(travelerCodesEqual(["AR", "IT"], ["IT", "AR"])).toBe(true);
    expect(travelerCodesEqual(["AR"], ["AR", "IT"])).toBe(false);
    expect(travelerCodesEqual([], [])).toBe(true);
  });
});
