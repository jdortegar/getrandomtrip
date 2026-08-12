import { describe, expect, it } from "vitest";
import esDict from "@/dictionaries/es.json";
import enDict from "@/dictionaries/en.json";
import {
  DESTINATION_COUNTRY_CODES,
  isDestinationCountryCode,
} from "../destinationCountries";

describe("isDestinationCountryCode", () => {
  it("accepts codes present in the AMERICAN_COUNTRIES catalog", () => {
    expect(isDestinationCountryCode("AR")).toBe(true);
    expect(isDestinationCountryCode("BR")).toBe(true);
    expect(isDestinationCountryCode("CO")).toBe(true);
    expect(isDestinationCountryCode("TT")).toBe(true);
  });

  it("rejects a code outside the catalog", () => {
    expect(isDestinationCountryCode("ZZ")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isDestinationCountryCode("")).toBe(false);
  });

  it("is case-sensitive, matching getCountryByCode", () => {
    expect(isDestinationCountryCode("ar")).toBe(false);
  });

  it("rejects null", () => {
    expect(isDestinationCountryCode(null)).toBe(false);
  });

  it("rejects a number", () => {
    expect(isDestinationCountryCode(123)).toBe(false);
  });
});

describe("DESTINATION_COUNTRY_CODES drift guard — label coverage", () => {
  it("has exactly 24 codes derived from AMERICAN_COUNTRIES", () => {
    expect(DESTINATION_COUNTRY_CODES.length).toBe(24);
  });

  it("every code has a non-empty label in both es.json and en.json common.countries, with no orphan keys", () => {
    const esCountries = (esDict.common as { countries?: Record<string, string> })
      .countries ?? {};
    const enCountries = (enDict.common as { countries?: Record<string, string> })
      .countries ?? {};

    for (const code of DESTINATION_COUNTRY_CODES) {
      expect(esCountries[code], `es.json missing label for ${code}`).toBeTruthy();
      expect(enCountries[code], `en.json missing label for ${code}`).toBeTruthy();
    }

    const codeSet = new Set(DESTINATION_COUNTRY_CODES);
    for (const key of Object.keys(esCountries)) {
      expect(codeSet.has(key), `es.json has orphan country key ${key}`).toBe(true);
    }
    for (const key of Object.keys(enCountries)) {
      expect(codeSet.has(key), `en.json has orphan country key ${key}`).toBe(true);
    }
  });
});
