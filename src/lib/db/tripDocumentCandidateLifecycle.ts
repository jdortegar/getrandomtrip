import { isDeepStrictEqual } from "node:util";
import { Prisma, type TripDocumentCleanupJob } from "@prisma/client";
import type { TripDocumentCandidateReceipt } from "@/lib/types/TripDocumentCandidate";

const identityFields = [
  "id",
  "ownerId",
  "tripRequestId",
  "draftId",
  "documentId",
  "previewId",
  "revision",
  "purpose",
] as const;

async function lockReceipt(
  tx: Prisma.TransactionClient,
  expected: Readonly<TripDocumentCandidateReceipt>,
) {
  const snapshot = { ...expected };
  const [row] = await tx.$queryRaw<TripDocumentCleanupJob[]>(Prisma.sql`
    SELECT * FROM "trip_document_cleanup_jobs" WHERE "id" = ${snapshot.id} FOR UPDATE`);
  if (
    !row ||
    identityFields.some((field) => row[field] !== snapshot[field]) ||
    row.expiresAt?.getTime() !== Date.parse(snapshot.expiresAt) ||
    !isDeepStrictEqual(row.targets, { keys: [snapshot.key], prefixes: [] })
  ) {
    throw new Error("DOCUMENT_CANDIDATE_MISMATCH");
  }
  return row;
}

function timestamp(now: () => number) {
  const time = new Date(now());
  if (!Number.isFinite(time.getTime()))
    throw new Error("INVALID_DOCUMENT_CANDIDATE_CLOCK");
  return time;
}

/** Caller owns the transaction and ordered live-owner/draft/document locks.
 * Authorize and verify surviving links BEFORE calling, including retained retries.
 * Receipt disposition is NOT publication success; no current-key inference.
 */
export async function reconcileDocumentCandidate(
  tx: Prisma.TransactionClient,
  expected: Readonly<TripDocumentCandidateReceipt>,
) {
  return (await lockReceipt(tx, expected)).disposition;
}

/** Same preconditions as reconciliation. adopt runs ONLY for pending candidates:
 * perform revision/preview checks and pointer writes there, with no blob I/O or
 * earlier lock acquisition. Let errors abort the caller's transaction.
 */
export async function retainDocumentCandidate(
  tx: Prisma.TransactionClient,
  expected: Readonly<TripDocumentCandidateReceipt>,
  adopt: (tx: Prisma.TransactionClient) => Promise<void>,
  now = Date.now,
) {
  const row = await lockReceipt(tx, expected);
  if (row.disposition === "retained") return "retained" as const;
  const time = timestamp(now);
  if (row.disposition !== "pending" || !row.expiresAt || row.expiresAt <= time)
    throw new Error("DOCUMENT_CANDIDATE_UNAVAILABLE");
  const updated = await tx.tripDocumentCleanupJob.updateMany({
    where: { id: row.id, disposition: "pending", expiresAt: { gt: time } },
    data: { disposition: "retained" },
  });
  if (updated.count !== 1) throw new Error("DOCUMENT_CANDIDATE_UNAVAILABLE");
  await adopt(tx);
  return "adopted" as const;
}

/** Outbox-only conditional UPDATE locks the row; never acquire ancestor locks.
 * Expiry revokes adoption, not outstanding PUTs. Tombstone sweeps remain later work.
 */
export async function expireDocumentCandidate(
  tx: Prisma.TransactionClient,
  id: string,
  now = Date.now,
) {
  const time = timestamp(now);
  const updated = await tx.tripDocumentCleanupJob.updateMany({
    where: { id, disposition: "pending", expiresAt: { lte: time } },
    data: { disposition: "delete", nextAttemptAt: time },
  });
  return updated.count === 1;
}
