import { Prisma, type PrismaClient } from "@prisma/client";
import type { TripDocumentCancellationScope } from "@/lib/types/TripDocumentCancellation";
import type { TripDocumentCleanupFacts } from "@/lib/types/TripDocumentCleanupTargets";
import { withTripDocumentLocks } from "./tripDocumentLocks";
import { cancelDocumentCandidates } from "./tripDocumentCancellation";
import { registerDocumentCleanup } from "./tripDocumentCleanupRegistration";

type CascadeScope = Extract<
  TripDocumentCancellationScope,
  { kind: "account" | "trip" }
>;

/** Caller authorizes deletion. Owner is the buyer, never uploader or tripper.
 * Discover children after the owner lock, then lock complete groups in order.
 * Callback performs the parent cascade in this same transaction: no storage I/O,
 * nested transaction, or new earlier lock groups. Errors must propagate.
 */
export async function withDocumentCascadeCleanup<T>(
  db: Pick<PrismaClient, "$transaction">,
  scope: CascadeScope,
  cascade: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return withTripDocumentLocks(db, { ownerId: scope.ownerId }, async (tx) => {
    const tripFilter =
      scope.kind === "trip"
        ? Prisma.sql` AND "id"=${scope.tripRequestId}`
        : Prisma.empty;
    const trips = await tx.$queryRaw<TripDocumentCleanupFacts["trips"]>(
      Prisma.sql`SELECT "id", "userId" FROM "trip_requests" WHERE "userId"=${scope.ownerId}${tripFilter} ORDER BY "id" FOR UPDATE`,
    );
    if (
      scope.kind === "trip" &&
      (trips.length !== 1 || trips[0].id !== scope.tripRequestId)
    )
      throw new Error("DOCUMENT_LOCK_SCOPE_MISMATCH");
    let drafts: TripDocumentCleanupFacts["drafts"] = [];
    let documents: TripDocumentCleanupFacts["documents"] = [];
    if (trips.length) {
      const ids = Prisma.join(trips.map((trip) => trip.id));
      drafts = await tx.$queryRaw<TripDocumentCleanupFacts["drafts"]>(
        Prisma.sql`SELECT "id", "tripRequestId" FROM "trip_document_drafts" WHERE "tripRequestId" IN (${ids}) ORDER BY "id" FOR UPDATE`,
      );
      documents = await tx.$queryRaw<TripDocumentCleanupFacts["documents"]>(
        Prisma.sql`SELECT "id", "tripRequestId", "storageKey" FROM "trip_documents" WHERE "tripRequestId" IN (${ids}) ORDER BY "id" FOR UPDATE`,
      );
    }
    // Account scope includes durable receipts whose parents were already removed.
    await cancelDocumentCandidates(tx, scope);
    await registerDocumentCleanup(
      tx,
      scope,
      { trips, drafts, documents },
      Date.now,
      { exactKeysOnly: true },
    );
    return cascade(tx);
  });
}
