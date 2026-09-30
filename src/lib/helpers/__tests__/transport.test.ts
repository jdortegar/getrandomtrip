import { describe, expect, it } from "vitest";
import { calculatePaymentTotals } from "@/lib/helpers/payment-totals";
import { paymentTotalsInputFromTripRequest } from "@/lib/helpers/trip-request-pricing";
import {
  resolveTripTransport,
  resolveTripTransportLabel,
} from "@/lib/helpers/transport";

describe("booking transport policy", () => {
  it.each([undefined, null, "", "plane", "bus", "own-car"])(
    "resolves XSED %s transport to the traveler's own car",
    (transport) => {
      expect(resolveTripTransport("xsed", transport)).toBe("own-car");
    },
  );

  it.each([
    ["couple", undefined, "plane"],
    ["family", "", "plane"],
    ["group", "train", "train"],
    ["solo", "bus", "bus"],
    ["paws", "ship", "ship"],
  ])("preserves %s journey transport %s", (type, transport, expected) => {
    expect(resolveTripTransport(type, transport)).toBe(expected);
  });

  it.each(["Own car", "Auto propio"])(
    "uses localized %s for stale and canonical XSED rows",
    (label) => {
      for (const transport of ["plane", "own-car"]) {
        expect(resolveTripTransportLabel("xsed", transport, label, "Plane"))
          .toBe(label);
      }
      expect(resolveTripTransportLabel("couple", "plane", label, "Plane"))
        .toBe("Plane");
      expect(resolveTripTransportLabel("group", undefined, label, undefined))
        .toBeUndefined();
    },
  );

  it("does not change XSED payment totals when transport is canonicalized", () => {
    const trip = {
      type: "xsed", level: "family", pax: 2, city: "Buenos Aires",
      country: "Argentina", transport: "plane",
    };
    const before = paymentTotalsInputFromTripRequest(trip, null)!;
    const after = paymentTotalsInputFromTripRequest({
      ...trip, transport: resolveTripTransport(trip.type, trip.transport),
    }, null)!;
    expect(calculatePaymentTotals(after)).toEqual(calculatePaymentTotals(before));
    expect(calculatePaymentTotals(after).totalTrip).toBe(500);
  });
});
