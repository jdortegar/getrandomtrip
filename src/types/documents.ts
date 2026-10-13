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
