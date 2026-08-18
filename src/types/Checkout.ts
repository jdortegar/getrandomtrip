export interface CheckoutFormFields {
  city: string;
  country: string;
  idDocument: string;
  name: string;
  phone: string;
  state: string;
  street: string;
  zipCode: string;
}

/** Trip from API (GET /api/trips list item). */
export interface CheckoutTripFromApi {
  id: string;
  type: string;
  level: string;
  /** Server-resolved base price per person (USD), pre-pax-multiplier — prefers a tripper override, falls back to the global catalog. */
  basePriceUsd: number;
  originCountry: string;
  originCity: string;
  startDate: string | null;
  endDate: string | null;
  nights: number;
  pax: number;
  paxDetails?: unknown;
  transport: string;
  climate: string;
  maxTravelTime: string;
  departPref: string;
  arrivePref: string;
  accommodationType?: string;
  avoidDestinations: string[];
  addons: Array<{ id: string; qty: number }> | null;
  status: string;
  updatedAt: string;
}
