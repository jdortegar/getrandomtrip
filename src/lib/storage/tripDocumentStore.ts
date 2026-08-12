import { randomUUID } from "crypto";
import { getStore } from "@netlify/blobs";

const TRIP_DOCUMENTS_STORE = "trip-documents";

/**
 * A ~12-line duplicate of the `getBlobStore` helper already copy-pasted in
 * both upload routes. Duplication is deliberate (design.md ADR-2):
 * `src/app/api/upload/[...path]/route.ts` is NOT modified by this feature,
 * and extracting a shared helper would mean editing it.
 */
export function getTripDocumentStore() {
  return getStore(TRIP_DOCUMENTS_STORE, {
    consistency: "strong",
    ...(process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
      ? {
          siteID: process.env.NETLIFY_SITE_ID,
          token: process.env.NETLIFY_AUTH_TOKEN,
        }
      : {}),
  });
}

/**
 * Opaque key shape `{tripRequestId}/{randomUUID}` — no user id, no original
 * filename, no extension (mimeType lives on the `TripDocument` row instead).
 * This key MUST NEVER be serialized to a client (Resolved Decision #1).
 */
export function buildTripDocumentKey(tripRequestId: string): string {
  return `${tripRequestId}/${randomUUID()}`;
}
