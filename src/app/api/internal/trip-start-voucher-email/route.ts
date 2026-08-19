import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTripStartVouchers } from "@/lib/email";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ─── Pass 1: trip-start voucher email ──────────────────────────────────────────

interface Pass1Result {
  sent: number;
  skipped: number;
}

/**
 * Finds `TripRequest`s whose `startDate` has passed and that have never had
 * a voucher email sent (`voucherEmailSentAt: null`), then sends every
 * `TripDocument` for that trip as an attachment and stamps
 * `voucherEmailSentAt` for idempotency — mirrors `travelersLockedAt`'s
 * guarded-update pattern in `traveler-reminder`, not the status-transition
 * pattern in `destination-reveal`: this job must NEVER change
 * `TripRequest.status`.
 *
 * Status gate is `REVEALED` or `COMPLETED` only. Deliberately NOT reusing
 * `FULFILLMENT_VISIBLE_STATUSES` (`src/lib/trips/fulfillmentVisibility.ts`),
 * which also includes `CANCELLED` for in-app document visibility / a
 * refund-dispute paper trail — that's a *viewing* concern. This job is a
 * proactive "your trip starts today" email: a cancelled trip isn't
 * happening, whether it was cancelled before or after reveal, so it must
 * never fire here. `startDate: { lte: now }` has no lower bound, same as
 * `travelersLockedAt`'s Pass 2 in `traveler-reminder` — the
 * `voucherEmailSentAt: null` guard is what keeps this idempotent and safe
 * to run hourly.
 */
export async function runPass1(now: Date): Promise<Pass1Result> {
  const candidates = await prisma.tripRequest.findMany({
    where: {
      startDate: { lte: now },
      voucherEmailSentAt: null,
      status: { in: ["REVEALED", "COMPLETED"] },
    },
    select: { id: true, userId: true },
  });

  let sent = 0;
  let skipped = 0;

  for (const trip of candidates) {
    try {
      const result = await sendTripStartVouchers(trip.id, trip.userId);

      if (!result.sent) {
        // Zero documents (or a broken user record) — don't stamp, so this
        // trip is picked up again on the next hourly run.
        skipped++;
        continue;
      }

      await prisma.tripRequest.update({
        where: { id: trip.id },
        data: { voucherEmailSentAt: now },
      });

      sent++;
    } catch (err) {
      console.error(
        `[trip-start-voucher-email] Pass 1 error for trip ${trip.id}:`,
        err,
      );
    }
  }

  return { sent, skipped };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const errors: string[] = [];

    let pass1Result: Pass1Result = { sent: 0, skipped: 0 };

    try {
      pass1Result = await runPass1(now);
    } catch (err) {
      const msg = `Pass 1 failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[trip-start-voucher-email] ${msg}`);
      errors.push(msg);
    }

    console.log(
      `[trip-start-voucher-email] pass1=${JSON.stringify(pass1Result)} errors=${errors.length}`,
    );

    return NextResponse.json({
      pass1: pass1Result,
      errors,
    });
  } catch (err) {
    console.error("[trip-start-voucher-email] Unhandled error:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 },
    );
  }
}
