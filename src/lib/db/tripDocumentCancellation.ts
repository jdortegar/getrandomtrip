import { Prisma, type TripDocumentCleanupJob } from "@prisma/client";
import type { TripDocumentCancellationScope } from "@/lib/types/TripDocumentCancellation";

const present = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;

/** Caller authorizes and locks owner → all live trips → drafts → documents first.
 * ownerId is the trip buyer, never uploader/tripper. Complete scope discovery and
 * acquire no other outbox locks before this batch; no ancestor locks afterward.
 * Use the same transaction for cancellation, scope tombstones and deletion/unlink;
 * propagate errors to roll it back. This is not a post-deletion worker or blob I/O.
 */
export async function cancelDocumentCandidates(
  tx: Prisma.TransactionClient,
  scope: Readonly<TripDocumentCancellationScope>,
  now = Date.now,
) {
  const { kind, ownerId } = scope;
  if (
    !present(ownerId) ||
    !["account", "trip", "draft", "document"].includes(kind)
  )
    throw new Error("INVALID_DOCUMENT_CANCELLATION_SCOPE");
  const conditions = [Prisma.sql`"ownerId" = ${ownerId}`];
  if (kind !== "account") {
    if (!present(scope.tripRequestId))
      throw new Error("INVALID_DOCUMENT_CANCELLATION_SCOPE");
    conditions.push(Prisma.sql`"tripRequestId" = ${scope.tripRequestId}`);
  }
  if (kind === "draft" || kind === "document") {
    if (!present(scope.id))
      throw new Error("INVALID_DOCUMENT_CANCELLATION_SCOPE");
    const field =
      kind === "draft" ? Prisma.sql`"draftId"` : Prisma.sql`"documentId"`;
    conditions.push(Prisma.sql`${field} = ${scope.id}`);
  }
  const rows = await tx.$queryRaw<
    Pick<TripDocumentCleanupJob, "id" | "purpose" | "disposition">[]
  >(Prisma.sql`
    SELECT "id", "purpose", "disposition" FROM "trip_document_cleanup_jobs" WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY "id" FOR UPDATE`);
  const time = new Date(now());
  if (!Number.isFinite(time.getTime()))
    throw new Error("INVALID_DOCUMENT_CANDIDATE_CLOCK");
  const ids = rows
    .filter(
      (row) =>
        row.disposition !== "delete" &&
        (row.purpose === "publication"
          ? kind !== "draft" || row.disposition === "pending"
          : row.purpose === "preview" && kind !== "document"),
    )
    .map((row) => row.id);
  if (!ids.length) return 0;
  const result = await tx.tripDocumentCleanupJob.updateMany({
    where: { id: { in: ids }, disposition: { not: "delete" } },
    data: { disposition: "delete", nextAttemptAt: time },
  });
  return result.count;
}
