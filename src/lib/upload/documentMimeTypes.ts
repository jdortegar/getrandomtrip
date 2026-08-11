/**
 * TripDocument MIME allowlist — PDF + JPEG + PNG only. Deliberately narrower
 * than `POST /api/upload`'s general allowlist: `image/svg+xml` is excluded
 * because the document stream route serves files `inline` for the View
 * action, and inline SVG executes script in our origin (design.md ADR-4).
 */
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export function isAllowedDocumentMime(mimeType: string): boolean {
  return ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType);
}
