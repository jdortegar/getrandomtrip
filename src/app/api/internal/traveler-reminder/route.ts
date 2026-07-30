import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import { sendTravelerReminderEmail } from "@/lib/email";
import { ROSTER_CUTOFF_MS } from "@/lib/travelers/travelerRoster";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ─── Pass 1: single reminder per INVITED row before cutoff ────────────────────

interface Pass1Result {
  reminded: number;
}

/**
 * Finds `TripTraveler` rows still `INVITED` (not yet completed) whose
 * parent trip has not reached the roster cutoff (`startDate - 7 days`) and
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
      tripRequest: { startDate: { gt: notYetCutoff } },
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

interface Pass2Result {
  locked: number;
}

/**
 * Stamps `TripRequest.travelersLockedAt` once `startDate - 7 days` has
 * passed for a paid trip. Guarded `updateMany` on `travelersLockedAt: null`
 * makes this idempotent — matches `destinationAssignmentNotifiedAt`'s
 * pattern in `destination-reveal`. This stamp is what `isRosterLocked`
 * (`src/lib/travelers/travelerRoster.ts`) checks first.
 */
export async function runPass2(now: Date): Promise<Pass2Result> {
  const cutoffThreshold = new Date(now.getTime() + ROSTER_CUTOFF_MS);

  const result = await prisma.tripRequest.updateMany({
    where: {
      startDate: { lte: cutoffThreshold },
      travelersLockedAt: null,
      payment: { is: { status: "APPROVED" } },
    },
    data: { travelersLockedAt: now },
  });

  return { locked: result.count };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const errors: string[] = [];

    let pass1Result: Pass1Result = { reminded: 0 };
    let pass2Result: Pass2Result = { locked: 0 };

    try {
      pass1Result = await runPass1(now);
    } catch (err) {
      const msg = `Pass 1 failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[traveler-reminder] ${msg}`);
      errors.push(msg);
    }

    try {
      pass2Result = await runPass2(now);
    } catch (err) {
      const msg = `Pass 2 failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[traveler-reminder] ${msg}`);
      errors.push(msg);
    }

    console.log(
      `[traveler-reminder] pass1=${JSON.stringify(pass1Result)} pass2=${JSON.stringify(pass2Result)} errors=${errors.length}`,
    );

    return NextResponse.json({
      pass1: pass1Result,
      pass2: pass2Result,
      errors,
    });
  } catch (err) {
    console.error("[traveler-reminder] Unhandled error:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 },
    );
  }
}
