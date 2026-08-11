import type { TripDocumentDTO } from "@/types/tripDocument";

interface TripDocumentRow {
  id: string;
  tripRequestId: string;
  label: string;
  country: string;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
  createdAt: Date;
}

/**
 * The single mapper from a `TripDocument` Prisma row to the client-safe DTO.
 * Deliberately omits `storageKey` and `uploadedById` — the storage key must
 * never be serialized into any API response (Resolved Decision #1).
 */
export function toTripDocumentDTO(row: TripDocumentRow): TripDocumentDTO {
  const href = `/api/trips/${row.tripRequestId}/documents/${row.id}`;
  return {
    id: row.id,
    label: row.label,
    country: row.country,
    mimeType: row.mimeType,
    originalFilename: row.originalFilename,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
    href,
    downloadHref: `${href}?download=1`,
  };
}
