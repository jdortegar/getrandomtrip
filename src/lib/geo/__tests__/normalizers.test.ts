import { describe, it, expect } from "vitest";
import { normalizeCountryFeature, normalizeCityFeature } from "../normalizers";

// Fixture data representative of real Mapbox v5 responses

const countryFeatureAR = {
  text: "Argentina",
  place_name: "Argentina",
  properties: {
    short_code: "ar",
  },
};

const countryFeatureNoCode = {
  text: "Unknown",
  place_name: "Unknown",
  properties: {},
};

const cityFeatureBuenosAires = {
  text: "Buenos Aires",
  place_name: "Buenos Aires, Buenos Aires F.D., Argentina",
  context: [
    { id: "region.12345", short_code: "AR-C" },
    { id: "country.67890", short_code: "ar" },
  ],
};

const cityFeatureWithCommaInName = {
  text: "San José",
  place_name: "San José, Provincia de San José, Costa Rica",
  context: [],
};

describe("normalizeCountryFeature", () => {
  it("returns CountryResult with uppercased code from short_code", () => {
    const result = normalizeCountryFeature(countryFeatureAR);
    expect(result).toEqual({ name: "Argentina", code: "AR" });
  });

  it("returns null when short_code is absent", () => {
    const result = normalizeCountryFeature(countryFeatureNoCode);
    expect(result).toBeNull();
  });

  it("uppercases a multi-char short_code", () => {
    const feature = {
      text: "Mexico",
      place_name: "Mexico",
      properties: { short_code: "mx" },
    };
    const result = normalizeCountryFeature(feature);
    expect(result?.code).toBe("MX");
  });
});

describe("normalizeCityFeature", () => {
  it("extracts first segment of place_name as city name", () => {
    const result = normalizeCityFeature(cityFeatureBuenosAires, "AR");
    expect(result.name).toBe("Buenos Aires");
  });

  it("preserves the full place_name in placeName field", () => {
    const result = normalizeCityFeature(cityFeatureBuenosAires, "AR");
    expect(result.placeName).toBe("Buenos Aires, Buenos Aires F.D., Argentina");
  });

  it("stores uppercased countryCode", () => {
    const result = normalizeCityFeature(cityFeatureBuenosAires, "ar");
    expect(result.countryCode).toBe("AR");
  });

  it("correctly splits city name at first comma", () => {
    const result = normalizeCityFeature(cityFeatureWithCommaInName, "CR");
    expect(result.name).toBe("San José");
  });

  it("trims whitespace from the extracted city name", () => {
    const feature = {
      text: "Lima",
      place_name: "  Lima  , Provincia de Lima, Peru",
      context: [],
    };
    const result = normalizeCityFeature(feature, "PE");
    expect(result.name).toBe("Lima");
  });
});
