import { describe, expect, it } from "vitest";
import { isAwaitingReveal } from "../trips";

describe("isAwaitingReveal", () => {
  it("is true for booked trips whose destination is not revealed yet", () => {
    expect(isAwaitingReveal("CONFIRMED")).toBe(true);
    expect(isAwaitingReveal("COLLECTING")).toBe(true);
  });

  it("is false before booking and after the reveal", () => {
    for (const status of ["DRAFT", "SAVED", "PENDING_PAYMENT", "REVEALED", "COMPLETED", "CANCELLED"]) {
      expect(isAwaitingReveal(status)).toBe(false);
    }
  });
});
