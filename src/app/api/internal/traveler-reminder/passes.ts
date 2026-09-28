import { prisma } from "@/lib/prisma";
import { issueTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import { sendTravelerReminderEmail } from "@/lib/email";
import {
  ROSTER_CUTOFF_MS,
  XSED_ROSTER_CUTOFF_MS,
} from "@/lib/travelers/travelerPolicy";

// ─── Pass 1: single reminder per INVITED row before cutoff ────────────────────

export interface Pass1Result {
  reminded: number;
}

/**
 * Finds `TripTraveler` rows still `INVITED` (not yet completed) whose
 * parent trip has not reached the roster cutoff (T-72h for XSED, otherwise T-7d) and
 * that have never been reminded (`reminderSentAt: null`), sends one
 * reminder each, and stamps `reminderSentAt` for idempotency.
 *
 * Re-issues (rotates) the invite token via `issueTravelerInvite` right
 * before sending — only the SHA-256 hash of the original invite token is
 * persisted, so there is no other way to rebuild a working
 * `/invite/[token]` link for the reminder email. Rotation also refreshes
 * `inviteTokenExpiresAt`, which is a safe side effect for a reminder.
 */
export async function runPass1(now: Date): Promise<Pass1Result> {
  const notYetCutoff = new Date(now.getTime() + ROSTER_CUTOFF_MS);

  const candidates = await prisma.tripTraveler.findMany({
    where: {
      status: "INVITED",
      reminderSentAt: null,
      tripRequest: {
        status: { notIn: ["CANCELLED", "COMPLETED"] },
        payment: { is: { status: "APPROVED" } },
        OR: [
          {
            type: { equals: "xsed", mode: "insensitive" },
            startDate: { gt: new Date(now.getTime() + XSED_ROSTER_CUTOFF_MS) },
          },
          {
            type: { not: "xsed", mode: "insensitive" },
            startDate: { gt: notYetCutoff },
          },
        ],
      },
    },
    select: { id: true },
  });

  let reminded = 0;

  for (const traveler of candidates) {
    try {
      const plaintext = await issueTravelerInvite(traveler.id);
      sendTravelerReminderEmail(traveler.id, plaintext);

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
