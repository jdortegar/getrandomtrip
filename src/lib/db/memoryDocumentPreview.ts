import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { withTripDocumentLocks } from "./tripDocumentLocks";
interface Scope {
  ownerId: string;
  tripRequestId: string;
  draftId: string;
}
interface PreviewRow {
  id: string;
  tripRequestId: string;
  revision: number;
  previewId: string | null;
  previewKey: string | null;
  previewRevision: number | null;
  previewSize: number | null;
  previewHash: string | null;
}
/** RFC9562 UUIDv7: immutable issue time and 74 cryptographically random bits. */
export function createMemoryPreviewId(now = Date.now()): string {
  if (!Number.isSafeInteger(now) || now < 0 || now > 0xffffffffffff)
    throw new Error("INVALID_DOCUMENT_PREVIEW_TIME");
  const bytes = randomBytes(16);
  bytes.writeUIntBE(now, 0, 6);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function copyPdf(pdf: Uint8Array): Buffer {
  if (pdf.byteLength > 4 * 1024 * 1024 || pdf.byteLength < 4)
    throw new Error("INVALID_DOCUMENT_PDF");
  const bytes = Buffer.from(pdf);
  if (bytes.subarray(0, 4).toString() !== "%PDF")
    throw new Error("INVALID_DOCUMENT_PDF");
  return bytes;
}
/** Caller authenticates admin and supplies server-rendered bytes, never client bytes.
 * Persist only an authoritative digest, not a preview blob or cleanup candidate.
 */
export async function bindMemoryDocumentPreview(
  db: Pick<PrismaClient, "$transaction">,
  scope: Scope,
  revision: number,
  pdf: Uint8Array,
  now = Date.now(),
) {
  const bytes = copyPdf(pdf);
  if (!Number.isSafeInteger(revision) || revision < 1)
    throw new Error("INVALID_DOCUMENT_REVISION");
  const previewId = createMemoryPreviewId(now);
  const hash = createHash("sha256").update(bytes).digest("hex");
  await withTripDocumentLocks(
    db,
    {
      ownerId: scope.ownerId,
      tripIds: [scope.tripRequestId],
      drafts: [{ id: scope.draftId, tripRequestId: scope.tripRequestId }],
    },
    async (tx) => {
      const draft = await tx.tripDocumentDraft.findUnique({
        where: { id: scope.draftId },
      });
      if (
        !draft ||
        draft.tripRequestId !== scope.tripRequestId ||
        draft.revision !== revision
      )
        throw new Error("DOCUMENT_PREVIEW_REVISION_CONFLICT");
      await tx.tripDocumentDraft.update({
        where: { id: scope.draftId },
        data: {
          previewId,
          previewKey: null,
          previewRevision: revision,
          previewSize: bytes.length,
          previewHash: hash,
        },
      });
    },
  );
  return { previewId, revision, buffer: bytes };
}
/** Caller holds live owner/trip/draft locks. Matching digest is authoritative, not
 * a client assertion. Retained publication retries are reconciled before this check.
 */
export function verifyMemoryDocumentPreview(
  draft: PreviewRow | null,
  scope: Scope,
  revision: number,
  previewId: string,
  pdf: Uint8Array,
  now = Date.now(),
): Buffer {
  const bytes = copyPdf(pdf);
  if (
    !draft ||
    draft.id !== scope.draftId ||
    draft.tripRequestId !== scope.tripRequestId ||
    draft.revision !== revision ||
    draft.previewRevision !== revision ||
    draft.previewId !== previewId ||
    draft.previewKey !== null ||
    draft.previewSize !== bytes.length ||
    !/^[a-f0-9]{64}$/.test(draft.previewHash ?? "")
  )
    throw new Error("DOCUMENT_PUBLICATION_CONFLICT");
  const actual = createHash("sha256").update(bytes).digest();
  if (!timingSafeEqual(actual, Buffer.from(draft.previewHash!, "hex")))
    throw new Error("DOCUMENT_PUBLICATION_CONFLICT");
  assertMemoryPreviewLifetime(previewId, now);
  return bytes;
}
/** Recheck at final publication: a slow PUT must not extend the reviewed lifetime. */
export function assertMemoryPreviewLifetime(
  previewId: string,
  now = Date.now(),
): void {
  const validId =
    /^[a-f0-9]{8}-[a-f0-9]{4}-7[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      previewId,
    );
  const issuedAt = Number.parseInt(
    previewId.replaceAll("-", "").slice(0, 12),
    16,
  );
  if (
    !validId ||
    !Number.isSafeInteger(now) ||
    issuedAt > now ||
    now - issuedAt >= 3600000
  )
    throw new Error("DOCUMENT_MEMORY_PREVIEW_EXPIRED");
}
