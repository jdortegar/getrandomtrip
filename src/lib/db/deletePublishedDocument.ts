import { Prisma, type PrismaClient } from "@prisma/client";
import { withTripDocumentLocks } from "./tripDocumentLocks";
import { registerDocumentCleanup } from "./tripDocumentCleanupRegistration";
interface Scope {
  ownerId: string;
  tripRequestId: string;
  documentId: string;
}
/** Caller authorizes admin; owner comes from the trip, never uploader identity.
 * Preserve authoring JSON, but invalidate preview/publication links. All immutable
 * generations remain durable exact-key deletion intents after row removal.
 */
export async function deletePublishedDocument(
  db: Pick<PrismaClient, "$transaction">,
  scope: Scope,
) {
  return withTripDocumentLocks(
    db,
    { ownerId: scope.ownerId, tripIds: [scope.tripRequestId] },
    async (tx) => {
      const drafts = await tx.$queryRaw<
        { id: string; tripRequestId: string }[]
      >(
        Prisma.sql`SELECT "id", "tripRequestId" FROM "trip_document_drafts" WHERE "documentId"=${scope.documentId} ORDER BY "id" FOR UPDATE`,
      );
      const [document] = await tx.$queryRaw<
        { id: string; tripRequestId: string; storageKey: string }[]
      >(
        Prisma.sql`SELECT "id", "tripRequestId", "storageKey" FROM "trip_documents" WHERE "id"=${scope.documentId} FOR UPDATE`,
      );
      if (
        !document ||
        document.tripRequestId !== scope.tripRequestId ||
        drafts.some((row) => row.tripRequestId !== scope.tripRequestId)
      )
        throw new Error("DOCUMENT_LOCK_SCOPE_MISMATCH");
      const linked = drafts.length
        ? Prisma.sql` OR ("purpose"='preview' AND "draftId" IN (${Prisma.join(drafts.map((row) => row.id))}))`
        : Prisma.empty;
      const jobs = await tx.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT "id" FROM "trip_document_cleanup_jobs" WHERE "ownerId"=${scope.ownerId} AND "tripRequestId"=${scope.tripRequestId} AND ("documentId"=${scope.documentId}${linked}) ORDER BY "id" FOR UPDATE`,
      );
      if (jobs.length)
        await tx.tripDocumentCleanupJob.updateMany({
          where: { id: { in: jobs.map((row) => row.id) } },
          data: { disposition: "delete", nextAttemptAt: new Date() },
        });
      await registerDocumentCleanup(
        tx,
        {
          kind: "document",
          ownerId: scope.ownerId,
          tripRequestId: scope.tripRequestId,
          id: scope.documentId,
        },
        {
          trips: [{ id: scope.tripRequestId, userId: scope.ownerId }],
          drafts,
          documents: [document],
        },
        Date.now,
        { exactKeysOnly: true },
      );
      await tx.tripDocumentDraft.updateMany({
        where: {
          documentId: scope.documentId,
          tripRequestId: scope.tripRequestId,
        },
        data: {
          documentId: null,
          publishedRevision: null,
          publishedPreviewId: null,
          previewId: null,
          previewKey: null,
          previewRevision: null,
          previewSize: null,
          previewHash: null,
        },
      });
      await tx.tripDocument.delete({ where: { id: scope.documentId } });
      return { deleted: true as const };
    },
  );
}
