import type { PrismaClient } from "@prisma/client";
import { withTripDocumentLocks } from "./tripDocumentLocks";
import { cancelDocumentCandidates } from "./tripDocumentCancellation";
interface Scope {
  ownerId: string;
  tripRequestId: string;
  draftId: string;
}
/** Caller authorizes admin. Delete private authoring only; the published row,
 * retained publication receipts and email timestamps are deliberately untouched.
 * Tombstones have no cascading FK and remain after the draft disappears.
 */
export async function deleteTripDocumentDraft(
  db: Pick<PrismaClient, "$transaction">,
  scope: Scope,
  revision: number,
) {
  if (!Number.isSafeInteger(revision) || revision < 1)
    throw new Error("INVALID_DOCUMENT_REVISION");
  return withTripDocumentLocks(
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
        throw new Error("DOCUMENT_DRAFT_REVISION_CONFLICT");
      await cancelDocumentCandidates(tx, {
        kind: "draft",
        ownerId: scope.ownerId,
        tripRequestId: scope.tripRequestId,
        id: scope.draftId,
      });
      await tx.tripDocumentDraft.delete({ where: { id: scope.draftId } });
      return { deleted: true as const };
    },
  );
}
