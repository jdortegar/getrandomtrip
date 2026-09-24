import type { PrismaClient } from "@prisma/client";
import type { TripDocumentCandidateReceipt } from "@/lib/types/TripDocumentCandidate";
import { withTripDocumentLocks } from "./tripDocumentLocks";
import {
  reconcileDocumentCandidate,
  retainDocumentCandidate,
} from "./tripDocumentCandidateLifecycle";

/** Caller authorizes admin and supplies metadata from the registered PUT.
 * A retained retry reports historical adoption, NOT the current preview pointer.
 * Never performs blob I/O, deletes keys, or refreshes saved authoring content.
 */
export async function adoptDocumentPreview(
  db: Pick<PrismaClient, "$transaction">,
  candidate: TripDocumentCandidateReceipt,
  metadata: { size: number; hash: string },
) {
  const receipt = { ...candidate };
  const { size, hash } = metadata;
  if (
    receipt.purpose !== "preview" ||
    receipt.documentId !== null ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 4 * 1024 * 1024 ||
    !/^[a-f0-9]{64}$/.test(hash)
  )
    throw new Error("INVALID_DOCUMENT_PREVIEW");
  const scope = {
    ownerId: receipt.ownerId,
    tripIds: [receipt.tripRequestId],
    drafts: [{ id: receipt.draftId, tripRequestId: receipt.tripRequestId }],
  };
  try {
    return await withTripDocumentLocks(db, scope, async (tx) =>
      retainDocumentCandidate(tx, receipt, async () => {
        const draft = await tx.tripDocumentDraft.findUnique({
          where: { id: receipt.draftId },
        });
        if (
          !draft ||
          draft.tripRequestId !== receipt.tripRequestId ||
          draft.revision !== receipt.revision
        )
          throw new Error("DOCUMENT_PREVIEW_REVISION_CONFLICT");
        await tx.tripDocumentDraft.update({
          where: { id: draft.id },
          data: {
            previewId: receipt.previewId,
            previewKey: receipt.key,
            previewRevision: receipt.revision,
            previewSize: size,
            previewHash: hash,
          },
        });
      }),
    );
  } catch (cause) {
    // The transaction may have committed before its response was lost. Retained
    // receipts survive supersession; a current pointer alone cannot prove outcome.
    try {
      const disposition = await withTripDocumentLocks(db, scope, (tx) =>
        reconcileDocumentCandidate(tx, receipt),
      );
      if (disposition === "retained") return "retained" as const;
    } catch {
      /* Unavailable reconciliation leaves durable cleanup state intact. */
    }
    throw cause;
  }
}
