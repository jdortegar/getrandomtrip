export interface TravelDocumentsFormState {
  idNumber: string;
  idCountry: string;
  idExpiry: string;
  passportNumber: string;
  passportCountry: string;
  passportExpiry: string;
  /** ISO 3166-1 alpha-2 codes of the passports the user can travel with. */
  nationalities: string[];
  /** ISO 3166-1 alpha-2 codes plus visa zone codes (e.g. `SCHENGEN`). */
  approvedVisas: string[];
}

/** Buyer travel documents edited at checkout (ISO codes; visas may include zone codes). */
export interface BuyerTravelDocuments {
  /** ISO 3166-1 alpha-2 codes; at least one is required before payment. */
  nationalities: string[];
  /** ISO 3166-1 alpha-2 codes plus visa zone codes; empty means none. */
  visas: string[];
}

/** The buyer's documents as returned by the trip APIs to the buyer: their live profile values (linked = live). */
export interface BuyerDocumentsSnapshot {
  buyerNationalities?: string[];
  buyerVisas?: string[];
}
