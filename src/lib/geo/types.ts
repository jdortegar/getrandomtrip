export interface CountryResult {
  /** Display name in Spanish, e.g. "Argentina" */
  name: string;
  /** ISO 3166-1 alpha-2 code, e.g. "AR" */
  code: string;
}

export interface CityResult {
  /** First segment of place_name, e.g. "Buenos Aires" */
  name: string;
  /** Full Mapbox place_name, e.g. "Buenos Aires, Buenos Aires F.D., Argentina" */
  placeName: string;
  /** ISO 3166-1 alpha-2 code of the containing country */
  countryCode: string;
}

export interface GeoApiResponse<T> {
  results: T[];
}
