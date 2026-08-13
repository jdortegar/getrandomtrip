import { describe, expect, it } from "vitest";
import {
  parseTripRequestSortBy,
  parseTripRequestSortOrder,
  sortTripDatesByProximity,
  TRIP_REQUEST_SORT_DEFAULT,
  tripRequestListOrderBy,
} from "../tripRequestsSort";

describe("parseTripRequestSortBy", () => {
  it("accepts every known sort field", () => {
    expect(parseTripRequestSortBy("tripDate")).toBe("tripDate");
    expect(parseTripRequestSortBy("traveler")).toBe("traveler");
    expect(parseTripRequestSortBy("origin")).toBe("origin");
    expect(parseTripRequestSortBy("type")).toBe("type");
    expect(parseTripRequestSortBy("status")).toBe("status");
    expect(parseTripRequestSortBy("payment")).toBe("payment");
  });

  it("falls back to the default field for an unknown value", () => {
    expect(parseTripRequestSortBy("not-a-field")).toBe(
      TRIP_REQUEST_SORT_DEFAULT.sortBy,
    );
    expect(parseTripRequestSortBy(undefined)).toBe(
      TRIP_REQUEST_SORT_DEFAULT.sortBy,
    );
  });
});

describe("parseTripRequestSortOrder", () => {
  it("accepts asc and desc", () => {
    expect(parseTripRequestSortOrder("asc")).toBe("asc");
    expect(parseTripRequestSortOrder("desc")).toBe("desc");
  });

  it("falls back to the default order for an unknown value", () => {
    expect(parseTripRequestSortOrder("sideways")).toBe(
      TRIP_REQUEST_SORT_DEFAULT.sortOrder,
    );
    expect(parseTripRequestSortOrder(undefined)).toBe(
      TRIP_REQUEST_SORT_DEFAULT.sortOrder,
    );
  });
});

describe("tripRequestListOrderBy", () => {
  it("orders by startDate for tripDate", () => {
    expect(tripRequestListOrderBy("tripDate", "asc")).toEqual([
      { startDate: "asc" },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });

  it("orders by the traveler's user.name for traveler", () => {
    expect(tripRequestListOrderBy("traveler", "desc")).toEqual([
      { user: { name: "desc" } },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });

  it("orders by originCity for origin", () => {
    expect(tripRequestListOrderBy("origin", "asc")).toEqual([
      { originCity: "asc" },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });

  it("orders by type for type", () => {
    expect(tripRequestListOrderBy("type", "asc")).toEqual([
      { type: "asc" },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });

  it("orders by status for status", () => {
    expect(tripRequestListOrderBy("status", "desc")).toEqual([
      { status: "desc" },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });

  it("orders by the payment relation's status for payment", () => {
    expect(tripRequestListOrderBy("payment", "asc")).toEqual([
      { payment: { status: "asc" } },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });
});

describe("sortTripDatesByProximity", () => {
  // "now" is 2026-08-12, matching the worked example: the soonest upcoming
  // trip (2026-08-15) must come first, ahead of a further-out future trip,
  // ahead of any past trip.
  const now = new Date("2026-08-12T00:00:00.000Z");

  const soonUpcoming = { id: "soon", startDate: "2026-08-15T00:00:00.000Z" };
  const furtherUpcoming = { id: "further", startDate: "2026-09-01T00:00:00.000Z" };
  const recentPast = { id: "recent-past", startDate: "2026-08-10T00:00:00.000Z" };
  const oldPast = { id: "old-past", startDate: "2026-01-01T00:00:00.000Z" };
  const noDate = { id: "no-date", startDate: null };

  it("puts the soonest upcoming trip first, ascending", () => {
    const items = [oldPast, furtherUpcoming, recentPast, soonUpcoming];
    const sorted = sortTripDatesByProximity(items, "asc", now);
    expect(sorted.map((i) => i.id)).toEqual([
      "soon",
      "further",
      "recent-past",
      "old-past",
    ]);
  });

  it("treats a startDate exactly equal to now as upcoming", () => {
    const exactlyNow = { id: "exactly-now", startDate: now.toISOString() };
    const sorted = sortTripDatesByProximity(
      [recentPast, exactlyNow],
      "asc",
      now,
    );
    expect(sorted.map((i) => i.id)).toEqual(["exactly-now", "recent-past"]);
  });

  it("always sorts null startDate last, regardless of direction", () => {
    const ascSorted = sortTripDatesByProximity(
      [noDate, soonUpcoming, oldPast],
      "asc",
      now,
    );
    expect(ascSorted.at(-1)?.id).toBe("no-date");

    const descSorted = sortTripDatesByProximity(
      [noDate, soonUpcoming, oldPast],
      "desc",
      now,
    );
    expect(descSorted.at(-1)?.id).toBe("no-date");
  });

  it("reverses the whole upcoming-first sequence for desc, nulls still last", () => {
    const items = [oldPast, furtherUpcoming, recentPast, soonUpcoming, noDate];
    const sorted = sortTripDatesByProximity(items, "desc", now);
    expect(sorted.map((i) => i.id)).toEqual([
      "old-past",
      "recent-past",
      "further",
      "soon",
      "no-date",
    ]);
  });
});
