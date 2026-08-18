import { describe, expect, it } from "vitest";
import { applyPaxMultiplier } from "./index";

describe("applyPaxMultiplier", () => {
  it("applies the +20% PAWS multiplier for pax 1 (single)", () => {
    expect(applyPaxMultiplier(500, "paws", 1)).toBe(600);
  });

  it("uses the base price unchanged for PAWS pax 2 (default pair)", () => {
    expect(applyPaxMultiplier(500, "paws", 2)).toBe(500);
  });

  it("applies the +20% PAWS multiplier for pax 3+ (triple)", () => {
    expect(applyPaxMultiplier(500, "paws", 3)).toBe(600);
  });

  it("leaves other traveler types unaffected regardless of pax", () => {
    expect(applyPaxMultiplier(500, "couple", 1)).toBe(500);
    expect(applyPaxMultiplier(500, "couple", 3)).toBe(500);
  });

  it("defaults to pax 2 (base, unmultiplied) when pax is omitted", () => {
    expect(applyPaxMultiplier(500, "paws")).toBe(500);
  });

  it("returns 0 unchanged for a 0 base price", () => {
    expect(applyPaxMultiplier(0, "paws", 1)).toBe(0);
  });
});
