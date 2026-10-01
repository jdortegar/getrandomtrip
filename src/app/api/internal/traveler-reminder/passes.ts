import { prisma } from "@/lib/prisma";
import { issueTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import { deliverTravelerReminderEmail } from "@/lib/email";
import {
  isTripEnded,
  ROSTER_CUTOFF_MS,
  XSED_ROSTER_CUTOFF_MS,
} from "@/lib/travelers/travelerPolicy";

// ─── Pass 1: one reminder per invited-but-not-linked companion ────────────────

export interface Pass1Result {
  reminded: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_AFTER_INVITE_MS = 3 * DAY_MS;
const REMINDER_BEFORE_DEPARTURE_MS = DAY_MS;

/** `min(invitedAt + 3 days, startDate - 24h)`; trips without dates use only the first. */
function reminderDueAt(invitedAt: Date, startDate: Date | null): number {
  const afterInvite = invitedAt.getTime() + REMINDER_AFTER_INVITE_MS;
  return startDate
    ? Math.min(afterInvite, startDate.getTime() - REMINDER_BEFORE_DEPARTURE_MS)
    : afterInvite;
}

/**
 * Sends ONE reminder to every ADULT companion who was invited by email but has
 * not linked an account (`invitedAt` set, `userId` null, never reminded, email
 * present) on a paid, non-cancelled, non-completed trip that has not ended.
 * A row is due at the earlier of invite + 3 days and 24h before departure.
 * Neither the details cutoff nor the row status gates it: the reminder only
 * nudges the companion to open the trip, and acceptance after the cutoff just
 * links the account.
 *
 * Re-issues (rotates) the invite token via `issueTravelerInvite` right
 * before sending — only the SHA-256 hash of the original invite token is
 * persisted, so there is no other way to rebuild a working
 * `/invite/[token]` link for the reminder email. Rotation also refreshes
 * `invitedAt` and `inviteTokenExpiresAt` and clears `reminderSentAt`, so the
 * stamp is written AFTER the provider accepted the email; a failed send leaves
 * the row unstamped and it is retried on the next run.
 */
export async function runPass1(now: Date): Promise<Pass1Result> {
  const candidates = await prisma.tripTraveler.findMany({
    where: {
      kind: "ADULT",
      invitedAt: { not: null },
      userId: null,
      reminderSentAt: null,
      email: { not: null },
      tripRequest: {
        status: { notIn: ["CANCELLED", "COMPLETED"] },
        payment: { is: { status: "APPROVED" } },
      },
    },
    select: {
      id: true,
      email: true,
      invitedAt: true,
      tripRequest: { select: { startDate: true, endDate: true } },
    },
  });

  let reminded = 0;

  for (const traveler of candidates) {
    if (!traveler.invitedAt || !traveler.email?.trim()) continue;
    if (isTripEnded(traveler.tripRequest, now.getTime())) continue;
    if (now.getTime() < reminderDueAt(traveler.invitedAt, traveler.tripRequest.startDate)) {
      continue;
    }

    try {
      const plaintext = await issueTravelerInvite(traveler.id);
      await deliverTravelerReminderEmail(traveler.id, plaintext);

      await prisma.tripTraveler.update({
        where: { id: traveler.id },
        data: { reminderSentAt: now },
      });

      reminded++;
    } catch (err) {
      console.error(
        `[traveler-reminder] Pass 1 error for traveler ${traveler.id}:`,
        err,
      );
    }
  }

  return { reminded };
}

// ─── Pass 2: cutoff-lock pass ──────────────────────────────────────────────────

export interface Pass2Result {
  locked: number;
}

/**
 * Stamps `TripRequest.travelersLockedAt` once the type-specific cutoff has
 * passed for a paid trip. Guarded `updateMany` on `travelersLockedAt: null`
 * makes this idempotent — matches `destinationAssignmentNotifiedAt`'s
 * pattern in `destination-reveal`. Empty identity fields remain fillable.
 */
export async function runPass2(now: Date): Promise<Pass2Result> {
  const cutoffThreshold = new Date(now.getTime() + ROSTER_CUTOFF_MS);

  const result = await prisma.tripRequest.updateMany({
    where: {
      status: { notIn: ["CANCELLED", "COMPLETED"] },
      OR: [
        {
          type: { equals: "xsed", mode: "insensitive" },
          startDate: {
            gt: now,
            lte: new Date(now.getTime() + XSED_ROSTER_CUTOFF_MS),
          },
        },
        {
          type: { not: "xsed", mode: "insensitive" },
          startDate: { gt: now, lte: cutoffThreshold },
        },
      ],
      travelersLockedAt: null,
      payment: { is: { status: "APPROVED" } },
    },
    data: { travelersLockedAt: now },
  });

  return { locked: result.count };
}
