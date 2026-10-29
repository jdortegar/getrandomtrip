import { describe, expect, it } from "vitest";
import { mapTripFromApi } from "../trips";

const base = { id: "trip-1", type: "group", level: "essenza", status: "CONFIRMED" };

describe("mapTripFromApi myTopUp", () => {
  it("keeps a well-formed top-up", () => {
    const myTopUp = { shareId: "topup-1", amount: 17.5, currency: "USD", deadline: "2026-11-01T12:00:00.000Z" };
    expect(mapTripFromApi({ ...base, myTopUp }).myTopUp).toEqual(myTopUp);
  });

  it("ignores a malformed top-up", () => {
    expect(mapTripFromApi({ ...base, myTopUp: { shareId: "x", amount: "17.5" } }).myTopUp).toBeUndefined();
    expect(mapTripFromApi(base).myTopUp).toBeUndefined();
  });
});
