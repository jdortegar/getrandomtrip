import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTripDocumentStore } from "@/lib/storage/tripDocumentStore";
import { sweepExactDocumentKey } from "@/lib/trip-documents/cleanup";
import { expireDocumentCandidate } from "./tripDocumentCandidateLifecycle";

const LEASE_MS = 300_000;
const REPEAT_MS = 3_600_000;
const MAX_BACKOFF_MS = 86_400_000;
interface DueJob {
  id: string;
  disposition: string;
  attempts: number;
}

/** Exact-key ledger only. Outbox locks never acquire live parent locks.
 * nextAttemptAt doubles as a bounded claim lease: crashes become retryable,
 * completion CAS cannot overwrite a newer lease, duplicate deletes are safe.
 * Successful/absent keys recur forever to catch late provider PUT retries.
 */
export async function runDocumentCleanupBatch(
  db: Pick<PrismaClient, "$transaction" | "tripDocumentCleanupJob"> = prisma,
  now = Date.now,
) {
  const started = now();
  if (!Number.isFinite(new Date(started).getTime()))
    throw new Error("INVALID_DOCUMENT_CLEANUP_CLOCK");
  const lease = new Date(started + LEASE_MS);
  const jobs = await db.$transaction(async (tx) => {
    const due = await tx.$queryRaw<DueJob[]>(Prisma.sql`
      SELECT "id", "disposition", "attempts" FROM "trip_document_cleanup_jobs"
      WHERE "nextAttemptAt"<=${new Date(started)}
        AND "purpose" IN ('preview', 'publication', 'legacy-key')
        AND ("disposition"='delete' OR ("disposition"='pending' AND "expiresAt"<=${new Date(started)}))
      ORDER BY "nextAttemptAt", "id" LIMIT 20 FOR UPDATE SKIP LOCKED`);
    const claimed: DueJob[] = [];
    for (const job of due) {
      if (
        job.disposition === "pending" &&
        !(await expireDocumentCandidate(tx, job.id, () => started))
      )
        continue;
      await tx.tripDocumentCleanupJob.updateMany({
        where: { id: job.id },
        data: { nextAttemptAt: lease },
      });
      claimed.push(job);
    }
    return claimed;
  });
  const result = { claimed: jobs.length, swept: 0, failed: 0 };
  for (const job of jobs) {
    let failed = false;
    try {
      const outcome = await sweepExactDocumentKey(job.id, {
        findJob: (id) =>
          db.tripDocumentCleanupJob.findUnique({ where: { id } }),
        deleteKey: (key) => getTripDocumentStore().delete(key),
      });
      if (outcome === "swept") result.swept++;
    } catch {
      failed = true;
      result.failed++;
    }
    const attempts = failed ? Math.min(30, Math.max(0, job.attempts) + 1) : 0;
    const delay = failed
      ? Math.min(MAX_BACKOFF_MS, LEASE_MS * 2 ** (attempts - 1))
      : REPEAT_MS;
    await db.tripDocumentCleanupJob.updateMany({
      where: { id: job.id, nextAttemptAt: lease, disposition: "delete" },
      data: {
        nextAttemptAt: new Date(now() + delay),
        attempts,
        lastError: failed ? "exact_key_cleanup_failed" : null,
      },
    });
  }
  return result;
}
