import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  TripDocumentCleanupLockRef,
  TripDocumentLockScope,
} from "@/lib/types/TripDocumentLocks";

function mismatch(): never {
  throw new Error("DOCUMENT_LOCK_SCOPE_MISMATCH");
}

function references(items: readonly TripDocumentCleanupLockRef[] = []) {
  const parents = new Map<string, string | null>();
  for (const { id, tripRequestId } of items) {
    if (parents.has(id) && parents.get(id) !== tripRequestId) mismatch();
    parents.set(id, tripRequestId);
  }
  return [...parents.keys()]
    .sort()
    .map((id) => ({ id, tripRequestId: parents.get(id) ?? null }));
}

/** Live mutation/adoption only; deleted-parent tombstone sweeps must not use this.
 * Authorize before calling; callback must do DB work only and acquire no earlier
 * lock groups. Revisions, links and receipt identities remain caller checks.
 */
export async function withTripDocumentLocks<T>(
  db: Pick<PrismaClient, "$transaction">,
  scope: TripDocumentLockScope,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const ownerId = scope.ownerId;
  const trips = [...new Set(scope.tripIds ?? [])].sort();
  const drafts = references(scope.drafts);
  const documents = references(scope.documents);
  const jobs = references(scope.cleanupJobs);
  for (const ref of [...drafts, ...documents, ...jobs]) {
    if (ref.tripRequestId !== null && !trips.includes(ref.tripRequestId))
      mismatch();
  }
  return db.$transaction(async (tx) => {
    async function lock(
      table: Prisma.Sql,
      columns: Prisma.Sql,
      expected: readonly { id: string }[],
    ) {
      if (!expected.length) return;
      const rows = await tx.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
        SELECT ${columns} FROM ${table}
        WHERE "id" IN (${Prisma.join(expected.map((row) => row.id))}) ORDER BY "id" FOR UPDATE`);
      const found = new Map(rows.map((row) => [row.id, row]));
      if (rows.length !== expected.length) mismatch();
      for (const row of expected) {
        const actual = found.get(row.id);
        if (
          !actual ||
          Object.entries(row).some(([key, value]) => actual[key] !== value)
        )
          mismatch();
      }
    }
    await lock(Prisma.sql`"users"`, Prisma.sql`"id"`, [{ id: ownerId }]);
    await lock(
      Prisma.sql`"trip_requests"`,
      Prisma.sql`"id", "userId"`,
      trips.map((id) => ({ id, userId: ownerId })),
    );
    await lock(
      Prisma.sql`"trip_document_drafts"`,
      Prisma.sql`"id", "tripRequestId"`,
      drafts,
    );
    await lock(
      Prisma.sql`"trip_documents"`,
      Prisma.sql`"id", "tripRequestId"`,
      documents,
    );
    await lock(
      Prisma.sql`"trip_document_cleanup_jobs"`,
      Prisma.sql`"id", "ownerId", "tripRequestId"`,
      jobs.map((ref) => ({ ...ref, ownerId })),
    );
    return work(tx);
  });
}
