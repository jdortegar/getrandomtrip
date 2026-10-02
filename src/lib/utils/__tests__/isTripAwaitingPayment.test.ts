import { describe, expect, it } from "vitest";
import { isTripAwaitingPayment, mapTripFromApi } from "../trips";

const baseRaw = {
  id: "trip-1",
  status: "CONFIRMED",
  type: "xsed",
  level: "essenza",
  startDate: "2026-10-03T00:00:00.000Z",
  endDate: "2026-10-04T00:00:00.000Z",
};

describe("mapTripFromApi viewerRole", () => {
  it("keeps the companion role the API sends", () => {
    expect(mapTripFromApi({ ...baseRaw, role: "companion" }).viewerRole).toBe(
      "companion",
    );
  });

  it("keeps the buyer role and ignores unknown values", () => {
    expect(mapTripFromApi({ ...baseRaw, role: "buyer" }).viewerRole).toBe("buyer");
    expect(mapTripFromApi({ ...baseRaw, role: "admin" }).viewerRole).toBeUndefined();
    expect(mapTripFromApi(baseRaw).viewerRole).toBeUndefined();
  });
});

describe("isTripAwaitingPayment", () => {
  it("never flags a companion trip, whose payment is stripped server-side", () => {
    // Companions are only linked once the buyer's payment is APPROVED, and the
    // API omits `payment` for them, so a missing payment must not read as unpaid.
    const trip = mapTripFromApi({ ...baseRaw, role: "companion" });
    expect(trip.payment).toBeUndefined();
    expect(isTripAwaitingPayment(trip)).toBe(false);
  });

  it("flags a buyer trip with no approved payment", () => {
    expect(isTripAwaitingPayment(mapTripFromApi({ ...baseRaw, role: "buyer" }))).toBe(true);
    expect(
      isTripAwaitingPayment(
        mapTripFromApi({ ...baseRaw, role: "buyer", payment: { status: "PENDING", amount: 10 } }),
      ),
    ).toBe(true);
  });

  it("does not flag approved, completed or cancelled buyer trips", () => {
    for (const status of ["APPROVED", "COMPLETED"]) {
      expect(
        isTripAwaitingPayment(
          mapTripFromApi({ ...baseRaw, role: "buyer", payment: { status, amount: 10 } }),
        ),
      ).toBe(false);
    }
    expect(
      isTripAwaitingPayment(mapTripFromApi({ ...baseRaw, role: "buyer", status: "CANCELLED" })),
    ).toBe(false);
  });
});
