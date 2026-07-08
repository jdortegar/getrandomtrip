import { describe, expect, it } from "vitest";
import {
  countTripsByStatus,
  resolveInitialStatusFilter,
  TRIP_STATUS_FLOW,
} from "../trip-status";

describe("TRIP_STATUS_FLOW", () => {
  it("contains CONFIRMED before REVEALED before COMPLETED", () => {
    const confirmed = TRIP_STATUS_FLOW.indexOf("CONFIRMED");
    const revealed = TRIP_STATUS_FLOW.indexOf("REVEALED");
    const completed = TRIP_STATUS_FLOW.indexOf("COMPLETED");
    expect(confirmed).toBeLessThan(revealed);
    expect(revealed).toBeLessThan(completed);
  });
});

describe("countTripsByStatus", () => {
  it("counts trips by status", () => {
    const trips = [
      { status: "CONFIRMED" as const },
      { status: "CONFIRMED" as const },
      { status: "REVEALED" as const },
    ];
    const counts = countTripsByStatus(trips);
    expect(counts.CONFIRMED).toBe(2);
    expect(counts.REVEALED).toBe(1);
    expect(counts.COMPLETED).toBe(0);
  });

  it("ignores unknown statuses", () => {
    const trips = [{ status: "CONFIRMED" as const }];
    const counts = countTripsByStatus(trips);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(1);
  });
});

describe("resolveInitialStatusFilter", () => {
  it("returns the status when the query param is a valid TripRequestStatus", () => {
    expect(resolveInitialStatusFilter("CONFIRMED")).toBe("CONFIRMED");
    expect(resolveInitialStatusFilter("COMPLETED")).toBe("COMPLETED");
    expect(resolveInitialStatusFilter("CANCELLED")).toBe("CANCELLED");
  });

  it("falls back to ALL when the param is null", () => {
    expect(resolveInitialStatusFilter(null)).toBe("ALL");
  });

  it("falls back to ALL when the param is not a recognized status", () => {
    expect(resolveInitialStatusFilter("NOT_A_STATUS")).toBe("ALL");
  });

  it("falls back to ALL when the param is an empty string", () => {
    expect(resolveInitialStatusFilter("")).toBe("ALL");
  });
});
