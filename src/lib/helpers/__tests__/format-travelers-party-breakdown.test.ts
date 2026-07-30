import { describe, expect, it } from "vitest";
import {
  formatPaxSubstepSummary,
  formatTravelersPartyBreakdown,
} from "@/lib/helpers/format-travelers-party-breakdown";

const checkoutCopy = {
  travelersAdultsOne: "{count} adult",
  travelersAdultsMany: "{count} adults",
  travelersMinorsOne: "{count} minor",
  travelersMinorsMany: "{count} minors",
  travelersRoomsOne: "{count} room",
  travelersRoomsMany: "{count} rooms",
  travelersBreakdownSeparator: " - ",
} as never;

describe("formatTravelersPartyBreakdown (unchanged — regression pin)", () => {
  it("joins adults, minors and rooms exactly as before", () => {
    expect(
      formatTravelersPartyBreakdown(checkoutCopy, {
        adults: 2,
        minors: 1,
        rooms: 1,
      }),
    ).toBe("2 adults - 1 minor - 1 room");
  });

  it("is unaffected by an optional pets field on the details object", () => {
    expect(
      formatTravelersPartyBreakdown(checkoutCopy, {
        adults: 2,
        minors: 1,
        rooms: 1,
        pets: 3,
      }),
    ).toBe("2 adults - 1 minor - 1 room");
  });
});

const paxCopy = {
  adultsOne: "{count} adult",
  adultsMany: "{count} adults",
  minorsOne: "{count} minor",
  minorsMany: "{count} minors",
  petsOne: "{count} pet",
  petsMany: "{count} pets",
  breakdownSeparator: " · ",
};

describe("formatPaxSubstepSummary", () => {
  it("builds an adults / minors / pets summary line, no rooms", () => {
    expect(formatPaxSubstepSummary(paxCopy, { adults: 3, minors: 0, pets: 0 })).toBe(
      "3 adults · 0 minors · 0 pets",
    );
  });

  it("uses the singular template at 1", () => {
    expect(formatPaxSubstepSummary(paxCopy, { adults: 1, minors: 1, pets: 1 })).toBe(
      "1 adult · 1 minor · 1 pet",
    );
  });
});
