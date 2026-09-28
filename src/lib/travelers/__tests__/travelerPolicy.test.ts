import { describe, expect, it } from "vitest";
import {
  hasMissingTravelerDetails,
  isTravelerFieldFilled,
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
