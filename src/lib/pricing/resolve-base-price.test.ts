import { describe, expect, it } from "vitest";
import { resolveBasePricePerPerson } from "./resolve-base-price";

describe("resolveBasePricePerPerson", () => {
  it("uses the tripper override when present for the (type, level) pair", () => {
    const result = resolveBasePricePerPerson({
      levelId: "bivouac",
      overrides: { couple: { bivouac: 400 } },
      travelerType: "couple",
    });
    expect(result).toEqual({ offered: true, price: 400, source: "override" });
  });

  it("falls back to the global catalog when no override exists for the pair", () => {
    const result = resolveBasePricePerPerson({
      levelId: "essenza",
      overrides: { couple: { bivouac: 400 } },
      travelerType: "family",
    });
    expect(result).toEqual({ offered: true, price: 350, source: "catalog" });
  });

  it("charges an explicit 0 override, not the catalog value", () => {
    const result = resolveBasePricePerPerson({
      levelId: "explora",
      overrides: { couple: { explora: 0 } },
      travelerType: "couple",
    });
    expect(result).toEqual({ offered: true, price: 0, source: "override" });
  });

  it("returns not-offered for a pair the catalog does not sell, ignoring overrides", () => {
    const result = resolveBasePricePerPerson({
      levelId: "essenza",
      overrides: null,
      travelerType: "honeymoon",
    });
    expect(result).toEqual({ offered: false, price: 0, source: "not-offered" });
  });

  it("uses only the global catalog when overrides is null (RandomTrip-owned booking)", () => {
    const result = resolveBasePricePerPerson({
      levelId: "bivouac",
      overrides: null,
      travelerType: "solo",
    });
    expect(result).toEqual({ offered: true, price: 1550, source: "catalog" });
  });

  it("xsed is a flat rate that ignores overrides entirely", () => {
    const result = resolveBasePricePerPerson({
      levelId: null,
      overrides: { xsed: { essenza: 999 } } as never,
      travelerType: "xsed",
    });
    expect(result).toEqual({ offered: true, price: 250, source: "catalog" });
  });

  it("returns not-offered for an unknown traveler type", () => {
    const result = resolveBasePricePerPerson({
      levelId: "essenza",
      overrides: null,
      travelerType: "bogus",
    });
    expect(result).toEqual({ offered: false, price: 0, source: "not-offered" });
  });

  it("returns not-offered for an unknown level", () => {
    const result = resolveBasePricePerPerson({
      levelId: "bogus-level",
      overrides: null,
      travelerType: "couple",
    });
    expect(result).toEqual({ offered: false, price: 0, source: "not-offered" });
  });
});
