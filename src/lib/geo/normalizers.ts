import type { CountryResult, CityResult } from "./types";

export interface MapboxCountryFeature {
  text: string;
  place_name: string;
  properties: {
    short_code?: string;
  };
}

export interface MapboxCityFeature {
  text: string;
  place_name: string;
  context?: Array<{ id: string; short_code?: string }>;
}

/**
 * Normalizes a Mapbox country feature into a CountryResult.
 * Returns null if the feature lacks a short_code (ISO alpha-2).
 */
export function normalizeCountryFeature(
  feature: MapboxCountryFeature,
): CountryResult | null {
  const code = feature.properties.short_code?.toUpperCase();
  if (!code) return null;
  return {
    name: feature.text,
    code,
  };
}

/**
 * Normalizes a Mapbox place feature into a CityResult.
 * The city name is the first comma-separated segment of place_name.
 */
export function normalizeCityFeature(
  feature: MapboxCityFeature,
  countryCode: string,
): CityResult {
  const name = feature.place_name.split(",")[0]?.trim() ?? feature.text;
  return {
    name,
    placeName: feature.place_name,
    countryCode: countryCode.toUpperCase(),
  };
}
