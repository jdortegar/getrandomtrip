import { describe, expect, it } from "vitest";
import {
  earliestTripStartDate,
  isTripStartDateEligible,
  parseTripCalendarDate,
  validateTripDates,
} from "../tripCalendarDate";
const now = new Date("2026-09-27T23:59:59.999Z");
describe("UTC date-only departure eligibility", () => {
  it("uses UTC calendar days rather than 168 elapsed hours or local midnight", () => {
    expect(earliestTripStartDate("couple", now).toISOString()).toBe(
      "2026-10-04T00:00:00.000Z",
    );
    expect(isTripStartDateEligible("2026-10-03", "couple", now)).toBe(false);
    expect(isTripStartDateEligible("2026-10-04", "couple", now)).toBe(true);
    expect(isTripStartDateEligible("2026-10-03", "xsed", now)).toBe(true);
    expect(isTripStartDateEligible("2026-09-26", "xsed", now)).toBe(false);
  });
  it.each([
    "2026-02-30",
    "2026-13-01",
    "2026-2-01",
    "garbage",
    "2026-10-04T12:00:00Z",
    "2026-10-04T00:00:00-03:00",
  ])("rejects invalid date-only value %s", (value) => {
    expect(parseTripCalendarDate(value)).toBeNull();
  });
  it("accepts exact UTC ISO serialization without changing the calendar day", () => {
    expect(
      parseTripCalendarDate("2028-02-29T00:00:00.000Z")?.toISOString(),
    ).toBe("2028-02-29T00:00:00.000Z");
  });
  it("requires a departure for a saved trip but allows incomplete drafts", () => {
    expect(validateTripDates({ status: "DRAFT", startDate: null })).toBeNull();
    expect(
      validateTripDates({ status: "SAVED", startDate: null }),
    ).not.toBeNull();
  });
});
