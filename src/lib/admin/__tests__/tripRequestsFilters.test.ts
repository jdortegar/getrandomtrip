import { describe, expect, it } from "vitest";
import {
  buildTripRequestsWhere,
  isTripPaymentStatusFilter,
  isTripRequestLevel,
  isTripRequestType,
  TRIP_REQUEST_LEVELS,
  TRIP_REQUEST_TYPES,
} from "../tripRequestsFilters";

describe("isTripRequestType", () => {
  it("accepts every known trip request type", () => {
    for (const type of TRIP_REQUEST_TYPES) {
      expect(isTripRequestType(type)).toBe(true);
    }
  });

  it("accepts the xsed type", () => {
    expect(isTripRequestType("xsed")).toBe(true);
  });

  it("rejects an unknown value", () => {
    expect(isTripRequestType("not-a-type")).toBe(false);
    expect(isTripRequestType("")).toBe(false);
  });
});

describe("isTripRequestLevel", () => {
  it("accepts every known experience level", () => {
    for (const level of TRIP_REQUEST_LEVELS) {
      expect(isTripRequestLevel(level)).toBe(true);
    }
  });

  it("accepts the xsed level", () => {
    expect(isTripRequestLevel("xsed")).toBe(true);
  });

  it("rejects an unknown value", () => {
    expect(isTripRequestLevel("legendary")).toBe(false);
    expect(isTripRequestLevel("")).toBe(false);
  });
});

describe("isTripPaymentStatusFilter", () => {
  it("accepts known Payment.status values", () => {
    expect(isTripPaymentStatusFilter("APPROVED")).toBe(true);
    expect(isTripPaymentStatusFilter("PENDING")).toBe(true);
  });

  it("accepts the NO_PAYMENT sentinel", () => {
    expect(isTripPaymentStatusFilter("NO_PAYMENT")).toBe(true);
  });

  it("rejects an unknown value", () => {
    expect(isTripPaymentStatusFilter("NOT_A_STATUS")).toBe(false);
  });
});

describe("buildTripRequestsWhere", () => {
  it("returns an empty object when no filters are given", () => {
    expect(buildTripRequestsWhere({})).toEqual({});
  });

  it("adds an exact status filter", () => {
    expect(buildTripRequestsWhere({ status: "CONFIRMED" })).toEqual({
      status: "CONFIRMED",
    });
  });

  it("adds an exact type filter", () => {
    expect(buildTripRequestsWhere({ type: "couple" })).toEqual({
      type: "couple",
    });
  });

  it("adds an exact level filter", () => {
    expect(buildTripRequestsWhere({ level: "essenza" })).toEqual({
      level: "essenza",
    });
  });

  it("filters by payment status via the relation", () => {
    expect(buildTripRequestsWhere({ paymentStatus: "APPROVED" })).toEqual({
      payment: { status: "APPROVED" },
    });
  });

  it("filters trips with no payment record for the NO_PAYMENT sentinel", () => {
    expect(buildTripRequestsWhere({ paymentStatus: "NO_PAYMENT" })).toEqual({
      payment: null,
    });
  });

  it("filters by traveler name or email for a search term", () => {
    expect(buildTripRequestsWhere({ search: "ana" })).toEqual({
      user: {
        OR: [
          { name: { contains: "ana", mode: "insensitive" } },
          { email: { contains: "ana", mode: "insensitive" } },
        ],
      },
    });
  });

  it("composes every filter dimension together", () => {
    expect(
      buildTripRequestsWhere({
        status: "CONFIRMED",
        type: "family",
        level: "bivouac",
        paymentStatus: "PENDING",
        search: "ana",
      }),
    ).toEqual({
      status: "CONFIRMED",
      type: "family",
      level: "bivouac",
      payment: { status: "PENDING" },
      user: {
        OR: [
          { name: { contains: "ana", mode: "insensitive" } },
          { email: { contains: "ana", mode: "insensitive" } },
        ],
      },
    });
  });
});
