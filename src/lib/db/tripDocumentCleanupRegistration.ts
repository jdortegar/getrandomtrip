import { isDeepStrictEqual } from "node:util";
import type { Prisma } from "@prisma/client";
import type { TripDocumentCancellationScope } from "@/lib/types/TripDocumentCancellation";
import type { TripDocumentCleanupFacts } from "@/lib/types/TripDocumentCleanupTargets";
import { planDocumentCleanup } from "@/lib/trip-documents/cleanupTargets";

/** Caller authorizes, verifies complete locked facts, and acquires the complete
 * scoped outbox batch through cancellation before registering and deleting.
 * Use the same transaction; propagate failures. No ancestor/subset outbox locks,
 * nested transaction, storage I/O, candidate mutation or retry-schedule reset.
 */
export async function registerDocumentCleanup(
  tx: Prisma.TransactionClient,
  scope: Readonly<TripDocumentCancellationScope>,
  facts: TripDocumentCleanupFacts,
  now = Date.now,
) {
  const plan = planDocumentCleanup(scope, facts);
  const time = new Date(now());
  if (!Number.isFinite(time.getTime()))
    throw new Error("INVALID_DOCUMENT_CLEANUP_CLOCK");
  if (!plan.length) return [];
  await tx.tripDocumentCleanupJob.createMany({
    data: plan.map((job) => ({
      ...job,
      targets: {
        keys: [...job.targets.keys],
        prefixes: [...job.targets.prefixes],
      },
      createdAt: time,
      nextAttemptAt: time,
      attempts: 0,
      lastError: null,
    })),
    skipDuplicates: true,
  });
  const ids = plan.map((job) => job.id);
  const rows = await tx.tripDocumentCleanupJob.findMany({
    where: { id: { in: ids } },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const job of plan) {
    const row = byId.get(job.id);
    if (
      !row ||
      Object.entries(job).some(
        ([key, value]) =>
          !isDeepStrictEqual(row[key as keyof typeof row], value),
      )
    )
      throw new Error("DOCUMENT_CLEANUP_TARGET_MISMATCH");
  }
  return ids;
}
