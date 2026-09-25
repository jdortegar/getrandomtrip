import { describe, expect, it } from "vitest";
import {
  getCheckoutPaxDetails,
  getFixedCheckoutParty,
} from "../checkout-party";

describe("checkout party", () => {
  it("ignores stale details that disagree with the selected headcount", () => {
    expect(
      getCheckoutPaxDetails({
        type: "xsed",
        level: "group",
        pax: 2,
        paxDetails: { adults: 3, minors: 2, rooms: 2 },
      }),
    ).toEqual({ adults: 2, minors: 0, rooms: 1 });
  });

  it("preserves matching adults, minors, rooms and pets", () => {
    expect(
      getCheckoutPaxDetails({
        type: "xsed",
        level: "family",
        pax: 5,
        paxDetails: { adults: 3, minors: 2, rooms: 2 },
      }),
    ).toEqual({ adults: 3, minors: 2, rooms: 2, pets: 0 });
  });

  it("locks XSED Solo using level, without imposing journey Couple's count on XSED", () => {
    expect(getFixedCheckoutParty("xsed", "solo")).toEqual({
      adults: 1,
      minors: 0,
      rooms: 1,
    });
    expect(
      getCheckoutPaxDetails({ type: "xsed", level: "solo", pax: 5 }),
    ).toEqual({ adults: 1, minors: 0, rooms: 1 });
    expect(getFixedCheckoutParty("xsed", "couple")).toBeNull();
    expect(getFixedCheckoutParty("couple", "essenza")?.adults).toBe(2);
  });
});
