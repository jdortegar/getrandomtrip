import { Prisma, type PrismaClient } from "@prisma/client";
import type { TripDocumentCandidateReceipt } from "@/lib/types/TripDocumentCandidate";
import { validateDocumentMetadata } from "@/lib/trip-documents/documentMetadata";
import { withTripDocumentLocks } from "./tripDocumentLocks";
import {
  reconcileDocumentCandidate,
  retainDocumentCandidate,
} from "./tripDocumentCandidateLifecycle";
interface Input {
  receipt: TripDocumentCandidateReceipt;
  size: number;
  hash: string;
  adminId: string;
}
/** Initial attachment only. Caller authenticates live admin and copies verified
 * preview bytes to the publication candidate before calling. Replacement is a
 * separate explicit operation. No email timestamps or old blobs are touched.
 */
export async function publishDocumentDraft(
  db: Pick<PrismaClient, "$transaction">,
  input: Input,
) {
  const receipt = { ...input.receipt };
  const { size, hash, adminId } = input;
  if (
    receipt.purpose !== "publication" ||
    !receipt.documentId ||
    !adminId ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 4 * 1024 * 1024 ||
    !/^[a-f0-9]{64}$/.test(hash)
  )
    throw new Error("INVALID_DOCUMENT_PUBLICATION");
  const documentId = receipt.documentId;
  const scope = {
    ownerId: receipt.ownerId,
    tripIds: [receipt.tripRequestId],
    drafts: [{ id: receipt.draftId, tripRequestId: receipt.tripRequestId }],
  };
  async function run(reconcileOnly: boolean) {
    return withTripDocumentLocks(db, scope, async (tx) => {
      const draft = await tx.tripDocumentDraft.findUnique({
        where: { id: receipt.draftId },
      });
      if (!draft || draft.tripRequestId !== receipt.tripRequestId)
        throw new Error("DOCUMENT_PUBLICATION_LINK_MISSING");
      const [document] = await tx.$queryRaw<
        { id: string; tripRequestId: string }[]
      >(
        Prisma.sql`SELECT "id", "tripRequestId" FROM "trip_documents" WHERE "id"=${documentId} FOR UPDATE`,
      );
      if (document && document.tripRequestId !== receipt.tripRequestId)
        throw new Error("DOCUMENT_PUBLICATION_LINK_MISSING");
      const disposition = await reconcileDocumentCandidate(tx, receipt);
      if (disposition === "retained") {
        if (!document || draft.documentId !== documentId)
          throw new Error("DOCUMENT_PUBLICATION_LINK_MISSING");
        return { documentId, status: "retained" as const };
      }
      if (reconcileOnly) throw new Error("DOCUMENT_PUBLICATION_UNCONFIRMED");
      const status = await retainDocumentCandidate(tx, receipt, async () => {
        if (draft.documentId || document)
          throw new Error("DOCUMENT_REPLACEMENT_REQUIRED");
        if (
          draft.revision !== receipt.revision ||
          draft.previewRevision !== receipt.revision ||
          draft.previewId !== receipt.previewId ||
          draft.previewSize !== size ||
          draft.previewHash !== hash
        )
          throw new Error("DOCUMENT_PUBLICATION_CONFLICT");
        const metadata = validateDocumentMetadata(
          { label: draft.label, country: draft.country, locale: draft.locale },
          "generation",
        );
        if (!metadata.ok) throw new Error("INVALID_DOCUMENT_PUBLICATION");
        await tx.tripDocument.create({
          data: {
            id: documentId,
            tripRequestId: receipt.tripRequestId,
            label: metadata.value.label,
            country: metadata.value.country,
            storageKey: receipt.key,
            mimeType: "application/pdf",
            originalFilename: "document.pdf",
            sizeBytes: size,
            uploadedById: adminId,
          },
        });
        await tx.tripDocumentDraft.update({
          where: { id: draft.id },
          data: {
            documentId,
            publishedRevision: receipt.revision,
            publishedPreviewId: receipt.previewId,
          },
        });
      });
      return { documentId, status };
    });
  }
  try {
    return await run(false);
  } catch (cause) {
    try {
      return await run(true);
    } catch {
      throw cause;
    }
  }
}
