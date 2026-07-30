import { describe, expect, it } from "vitest";
import { getAvoidCities } from "../avoid-cities";

describe("getAvoidCities", () => {
  it("returns a non-empty result when departureCountry is given in English (bug: silent empty result)", () => {
    const result = getAvoidCities("Brazil", "São Paulo", "explora", 12);
    expect(result.length).toBeGreaterThan(0);
  });

  it("applies the neighboring-countries scope (not just national) for the explora level", () => {
    const result = getAvoidCities("Brazil", "São Paulo", "explora", 50);
    const countryCodes = new Set(result.map((c) => c.countryCode));
    expect(countryCodes.size).toBeGreaterThan(1);
  });

  it("treats 'explora' and 'modo-explora' level ids as the same scope", () => {
    const a = getAvoidCities("Argentina", "Buenos Aires", "explora", 50);
    const b = getAvoidCities("Argentina", "Buenos Aires", "modo-explora", 50);
    const codesA = [...new Set(a.map((c) => c.countryCode))].sort();
    const codesB = [...new Set(b.map((c) => c.countryCode))].sort();
    expect(codesA).toEqual(codesB);
    expect(codesA.length).toBeGreaterThan(1);
  });

  it("treats 'exploraPlus' and 'explora-plus' level ids as the same scope", () => {
    const a = getAvoidCities("Argentina", "Buenos Aires", "exploraPlus", 50);
    const b = getAvoidCities("Argentina", "Buenos Aires", "explora-plus", 50);
    const codesA = [...new Set(a.map((c) => c.countryCode))].sort();
    const codesB = [...new Set(b.map((c) => c.countryCode))].sort();
    expect(codesA).toEqual(codesB);
    expect(codesA.length).toBeGreaterThan(1);
  });

  it("treats 'atelier' and 'atelier-getaway' level ids as the same scope", () => {
    const a = getAvoidCities("Argentina", "Buenos Aires", "atelier", 50);
    const b = getAvoidCities("Argentina", "Buenos Aires", "atelier-getaway", 50);
    const codesA = [...new Set(a.map((c) => c.countryCode))].sort();
    const codesB = [...new Set(b.map((c) => c.countryCode))].sort();
    expect(codesA).toEqual(codesB);
  });
});
