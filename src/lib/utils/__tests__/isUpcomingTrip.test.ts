import { describe, expect, it } from "vitest";
import { isUpcomingTrip, mapTripFromApi } from "../trips";

const NOW = new Date("2026-10-09T15:00:00.000Z");

function trip(overrides: Record<string, unknown>) {
  return mapTripFromApi({
    id: "trip-1",
    status: "CONFIRMED",
    type: "couple",
    level: "essenza",
    startDate: "2026-11-10T00:00:00.000Z",
    endDate: "2026-11-13T00:00:00.000Z",
    ...overrides,
  });
}

describe("isUpcomingTrip", () => {
  it("includes confirmed and revealed trips that have not ended", () => {
    expect(isUpcomingTrip(trip({}), NOW)).toBe(true);
    expect(isUpcomingTrip(trip({ status: "REVEALED" }), NOW)).toBe(true);
  });

  it("excludes trips whose end date has passed", () => {
    const past = trip({
      status: "REVEALED",
      startDate: "2026-10-03T00:00:00.000Z",
      endDate: "2026-10-05T00:00:00.000Z",
    });
    expect(isUpcomingTrip(past, NOW)).toBe(false);
  });

  it("keeps a trip in progress or ending today", () => {
    const inProgress = trip({
      startDate: "2026-10-07T00:00:00.000Z",
      endDate: "2026-10-11T00:00:00.000Z",
    });
    const endsToday = trip({
      startDate: "2026-10-06T00:00:00.000Z",
      endDate: "2026-10-09T00:00:00.000Z",
    });
    expect(isUpcomingTrip(inProgress, NOW)).toBe(true);
    expect(isUpcomingTrip(endsToday, NOW)).toBe(true);
  });

  it("falls back to the start date when the end date is missing", () => {
    expect(
      isUpcomingTrip(trip({ startDate: "2026-10-03T00:00:00.000Z", endDate: null }), NOW),
    ).toBe(false);
    expect(
      isUpcomingTrip(trip({ startDate: "2026-10-20T00:00:00.000Z", endDate: null }), NOW),
    ).toBe(true);
  });

  it("excludes other statuses even with future dates", () => {
    for (const status of ["DRAFT", "PENDING_PAYMENT", "COMPLETED", "CANCELLED"]) {
      expect(isUpcomingTrip(trip({ status }), NOW)).toBe(false);
    }
  });
});
