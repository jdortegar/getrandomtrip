import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendTripCompleted } from "@/lib/email";

/** Whole days after `endDate` before a trip is auto-completed. */
export const AUTO_COMPLETE_DELAY_DAYS = 2;

export interface AutoCompleteResult {
  completed: number;
  skipped: number;
}

/**
 * Moves `REVEALED` trips to `COMPLETED` once their `endDate` (a calendar day
 * stored at UTC midnight) is at least `AUTO_COMPLETE_DELAY_DAYS` behind today,
 * mirroring the admin PATCH: stamps `completedAt`, ensures a `reviewToken` and
 * sends the review-request email.
 *
 * Only `REVEALED` qualifies: a trip still `CONFIRMED` after its dates was never
 * revealed, which needs ops attention rather than a review request. The update
 * is guarded on `status: "REVEALED"` so a concurrent admin completion (or a
 * cancellation) wins and no duplicate email is sent; that makes the pass
 * idempotent and safe to run hourly.
 */
export async function runAutoCompletePass(
  now: Date,
): Promise<AutoCompleteResult> {
  const cutoff = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - AUTO_COMPLETE_DELAY_DAYS,
    ),
  );

  const candidates = await prisma.tripRequest.findMany({
    where: { status: "REVEALED", endDate: { lte: cutoff } },
    select: { id: true, userId: true, reviewToken: true },
  });

  let completed = 0;
  let skipped = 0;

  for (const trip of candidates) {
    try {
      const reviewToken = trip.reviewToken ?? randomUUID();
      const { count } = await prisma.tripRequest.updateMany({
        where: { id: trip.id, status: "REVEALED" },
        data: { status: "COMPLETED", completedAt: now, reviewToken },
      });

      if (count === 0) {
        skipped++;
        continue;
      }

      sendTripCompleted(trip.id, trip.userId, reviewToken);
      completed++;
    } catch (err) {
      skipped++;
      console.error(`[trip-auto-complete] error for trip ${trip.id}:`, err);
    }
  }

  return { completed, skipped };
}
