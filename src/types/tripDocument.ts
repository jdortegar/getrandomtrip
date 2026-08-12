/**
 * The ONLY shape any client ever receives for a `TripDocument`. MUST NEVER
 * include `storageKey`, a raw blob URL, or a `/api/upload/[...path]` path —
 * see `toTripDocumentDTO`'s unit test, which is the "No Blob Key/URL
 * Leakage" requirement made concrete.
 */
export interface TripDocumentDTO {
  id: string;
  label: string;
  /** Destination country, ISO 3166-1 alpha-2, guaranteed present in AMERICAN_COUNTRIES. */
  country: string;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
  createdAt: string; // ISO
  /** Authenticated stream route. Never a blob key or /api/upload URL. */
  href: string; // /api/trips/{tripRequestId}/documents/{id}
  downloadHref: string; // `${href}?download=1`
}
