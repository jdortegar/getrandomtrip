/** Excuse (trip reason) selection persisted on a TripRequest. */
export interface TripExcuseFields {
  /** Selected excuse key from the traveler type's catalog; null/absent on legacy trips. */
  excuseKey?: string | null;
  /** Selected refine-detail option keys of the excuse. */
  refineDetails?: string[];
}
