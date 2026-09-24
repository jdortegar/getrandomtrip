import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { withTripDocumentLocks } from "@/lib/db/tripDocumentLocks";
import { verifyMemoryDocumentPreview } from "@/lib/db/memoryDocumentPreview";
import { readDocumentPreview } from "@/lib/storage/readDocumentPreview";
import { writeGeneratedDocument } from "@/lib/storage/writeGeneratedDocument";
import { publishDocumentDraft } from "@/lib/db/publishDocumentDraft";
interface Input {
  ownerId: string;
  tripRequestId: string;
  draftId: string;
  adminId: string;
  revision: number;
  previewId: string;
  requestId: string;
  replaceDocumentId?: string;
  previewBytes?: Uint8Array;
}
/** Caller authorizes live admin. requestId is stable across transport retries.
 * Pending ambiguous uploads cannot be overwritten: after the one-hour lease
 * expires (or cancellation), caller may explicitly retry with a NEW requestId.
 * Old candidates remain exact-key cleanup targets, including late writes.
 */
export async function attachDocumentDraft(
  db: Pick<PrismaClient, "$transaction">,
  input: Input,
) {
  if (input.previewBytes && input.previewBytes.byteLength > 4 * 1024 * 1024)
    throw new Error("DOCUMENT_PDF_TOO_LARGE");
  const previewBytes = input.previewBytes
    ? Buffer.from(input.previewBytes)
    : undefined;
  const value = { ...input };
  const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  if (
    !uuid.test(value.requestId) ||
    !uuid.test(value.previewId) ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1 ||
    !value.adminId
  )
    throw new Error("INVALID_DOCUMENT_ATTACH");
  const scope = {
    ownerId: value.ownerId,
    tripIds: [value.tripRequestId],
    drafts: [{ id: value.draftId, tripRequestId: value.tripRequestId }],
  };
  const plan = await withTripDocumentLocks(db, scope, async (tx) => {
    const draft = await tx.tripDocumentDraft.findUnique({
      where: { id: value.draftId },
    });
    if (!draft || draft.tripRequestId !== value.tripRequestId)
      throw new Error("DOCUMENT_PUBLICATION_LINK_MISSING");
    const existing = await tx.tripDocumentCleanupJob.findUnique({
      where: { id: value.requestId },
    });
    if (existing) {
      if (
        existing.ownerId !== value.ownerId ||
        existing.tripRequestId !== value.tripRequestId ||
        existing.draftId !== value.draftId ||
        existing.purpose !== "publication" ||
        existing.revision !== value.revision ||
        existing.previewId !== value.previewId ||
        !existing.documentId ||
        (value.replaceDocumentId !== undefined &&
          value.replaceDocumentId !== existing.documentId)
      )
        throw new Error("DOCUMENT_ATTACH_REQUEST_MISMATCH");
      if (existing.disposition !== "retained")
        throw new Error(
          existing.disposition === "delete" ||
            (existing.expiresAt && existing.expiresAt.getTime() <= Date.now())
            ? "DOCUMENT_ATTACH_REQUEST_EXPIRED"
            : "DOCUMENT_ATTACH_RETRY_UNAVAILABLE",
        );
      const [document] = await tx.$queryRaw<
        { id: string; tripRequestId: string }[]
      >(
        Prisma.sql`SELECT "id", "tripRequestId" FROM "trip_documents" WHERE "id"=${existing.documentId} FOR UPDATE`,
      );
      if (
        !document ||
        document.tripRequestId !== value.tripRequestId ||
        draft.documentId !== existing.documentId
      )
        throw new Error("DOCUMENT_PUBLICATION_LINK_MISSING");
      return { retained: existing.documentId };
    }
    if (
      draft.revision !== value.revision ||
      draft.previewRevision !== value.revision ||
      draft.previewId !== value.previewId
    )
      throw new Error("DOCUMENT_PUBLICATION_CONFLICT");
    if (draft.documentId && value.replaceDocumentId !== draft.documentId)
      throw new Error("DOCUMENT_REPLACEMENT_REQUIRED");
    if (
      value.replaceDocumentId !== undefined &&
      value.replaceDocumentId !== draft.documentId
    )
      throw new Error("DOCUMENT_REPLACEMENT_MISMATCH");
    if (draft.previewKey === null && !previewBytes)
      throw new Error("DOCUMENT_PUBLICATION_CONFLICT");
    const verifiedBytes = previewBytes
      ? verifyMemoryDocumentPreview(
          draft,
          value,
          value.revision,
          value.previewId,
          previewBytes,
        )
      : undefined;
    return {
      verifiedBytes,
      documentId: draft.documentId ?? randomUUID(),
      state: draft.documentId ? ("existing" as const) : ("reserved" as const),
    };
  });
  if (plan.retained)
    return { documentId: plan.retained, status: "retained" as const };
  const bytes =
    plan.verifiedBytes ??
    (await readDocumentPreview(
      db,
      {
        ownerId: value.ownerId,
        tripRequestId: value.tripRequestId,
        draftId: value.draftId,
      },
      value.revision,
      value.previewId,
    ));
  const stored = await writeGeneratedDocument(
    db,
    {
      ownerId: value.ownerId,
      tripRequestId: value.tripRequestId,
      draftId: value.draftId,
      revision: value.revision,
      previewId: value.previewId,
      purpose: "publication",
      document: { id: plan.documentId!, state: plan.state! },
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
    bytes,
    { randomId: () => value.requestId },
  );
  return publishDocumentDraft(db, {
    receipt: stored.receipt,
    size: stored.size,
    hash: stored.hash,
    adminId: value.adminId,
    ...(value.replaceDocumentId === undefined
      ? {}
      : { replaceDocumentId: value.replaceDocumentId }),
  });
}
