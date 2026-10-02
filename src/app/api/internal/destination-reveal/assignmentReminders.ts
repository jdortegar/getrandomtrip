import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendDestinationAssignmentReminder } from "@/lib/email/sendDestinationAssignmentReminder";
import { getAdminRecipients } from "@/lib/email/getAdminRecipients";
import { getAssignmentReminderWindow } from "@/lib/helpers/getAssignmentReminderWindow";
import { queueAssignmentReminders } from "./queueAssignmentReminders";

const LEASE_MS = 10 * 60_000;
const RETRY_MS = 60_000;
const BUDGET_MS = 15_000;
const BATCH_SIZE = 25;

export interface AssignmentReminderResult {
  queued: number;
  accepted: number;
  failed: number;
  skipped: number;
}

/** At-least-once delivery with durable dedupe: provider acceptance and DB commit are not atomic.
 * Budget checks bound work between requests, not the duration of the email SDK request.
 */
export async function runAssignmentReminders(
  clock: () => Date = () => new Date(),
): Promise<AssignmentReminderResult> {
  const budgetEndsAt = Date.now() + BUDGET_MS;
  const queued = await queueAssignmentReminders(
    clock,
    Date.now() + BUDGET_MS / 2,
  );
  const counts = { queued, accepted: 0, failed: 0, skipped: 0 };
  const now = clock();
  const jobs = await prisma.destinationAssignmentDelivery.findMany({
    where: {
      acceptedAt: null,
      nextAttemptAt: { lte: now },
      expiresAt: { gt: now },
    },
    orderBy: [{ nextAttemptAt: "asc" }, { id: "asc" }],
    take: BATCH_SIZE,
  });
  for (const job of jobs) {
    if (Date.now() >= budgetEndsAt) break;
    const claimedAt = clock();
    const leaseToken = randomUUID();
    const claim = await prisma.destinationAssignmentDelivery.updateMany({
      where: {
        id: job.id,
        acceptedAt: null,
        nextAttemptAt: { lte: claimedAt },
        expiresAt: { gt: claimedAt },
      },
      data: { leaseToken, nextAttemptAt: new Date(+claimedAt + LEASE_MS) },
    });
    if (!claim.count) continue;
    const owned = { id: job.id, leaseToken, acceptedAt: null };
    try {
      // Snapshot content is immutable, authorization is not. Resolve membership
      // afresh per send; lookup errors fail closed through the retry path below.
      const recipients = await getAdminRecipients();
      const authorized = recipients.some(
        (recipient) => recipient.email === job.recipientEmail,
      );
      const trip = await prisma.tripRequest.findFirst({
        where: {
          id: job.tripRequestId,
          status: "CONFIRMED",
          experienceId: null,
        },
        select: { startDate: true, departureTimeZone: true },
      });
      const window =
        trip && getAssignmentReminderWindow(trip, clock());
      if (
        !authorized ||
        !window ||
        +window.revealAt !== +job.revealAt ||
        window.milestoneHours !== job.milestoneHours
      ) {
        await prisma.destinationAssignmentDelivery.updateMany({
          where: owned,
          // Assignment/cancellation/rescheduling can be reversed in this window.
          // Keep its natural expiry; only defer this unaccepted recipient.
          data: {
            leaseToken: null,
            nextAttemptAt: new Date(+clock() + RETRY_MS),
          },
        });
        counts.skipped++;
        continue;
      }
      const providerMessageId = await sendDestinationAssignmentReminder(job);
      const completed = await prisma.destinationAssignmentDelivery.updateMany({
        where: owned,
        data: { acceptedAt: clock(), providerMessageId, leaseToken: null },
      });
      if (completed.count) counts.accepted++;
    } catch (error) {
      counts.failed++;
      console.error(
        `[destination-reveal] Assignment reminder failed: ${job.id}`,
        error,
      );
      // Token fence never releases another worker's newer lease; failed release expires naturally.
      await prisma.destinationAssignmentDelivery
        .updateMany({
          where: owned,
          data: {
            leaseToken: null,
            nextAttemptAt: new Date(+clock() + RETRY_MS),
          },
        })
        .catch((releaseError) =>
          console.error(
            "[destination-reveal] Reminder lease release failed",
            releaseError,
          ),
        );
    }
  }
  return counts;
}
