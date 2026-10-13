import { describe, expect, it } from "vitest";
import { omitBuyerOnlyFields } from "../companionTripView";

describe("omitBuyerOnlyFields", () => {
  it("drops payment, price, raw travelers and the buyer's travel documents", () => {
    const trip = {
      id: "trip-1",
      status: "CONFIRMED",
      payment: { status: "APPROVED" },
      basePriceUsd: 900,
      travelers: [{ id: "trav-1" }],
      buyerNationalities: ["AR", "IT"],
      buyerVisas: ["US", "SCHENGEN"],
    };

    expect(omitBuyerOnlyFields(trip)).toEqual({ id: "trip-1", status: "CONFIRMED" });
  });
});
