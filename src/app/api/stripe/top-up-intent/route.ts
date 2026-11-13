import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { respondWithShareIntent } from "@/lib/payments/share-intent.server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number, errorCode?: string) =>
  NextResponse.json({ error, ...(errorCode ? { errorCode } : {}) }, { status });

/**
 * POST /api/stripe/top-up-intent { shareId }
 *
 * Returns a PaymentIntent for the signed-in payer's own TOP_UP share of an
 * individually paid trip, while the top-up grace period is still open.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Unauthorized", 401);
    let body: { shareId?: unknown };
    try {
      body = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }
    if (typeof body.shareId !== "string" || !body.shareId) {
      return fail("shareId is required", 400);
    }

    const share = await prisma.paymentShare.findUnique({
      where: { id: body.shareId },
      include: { payment: { include: { tripRequest: true } } },
    });
    // Another payer's top-up is indistinguishable from a missing one.
    const remainder = share?.kind === "ORGANIZER_REMAINDER";
    if (!share || (share.kind !== "TOP_UP" && !remainder) || share.userId !== session.user.id) {
      return fail("Top-up not found", 404);
    }
    const trip = share.payment.tripRequest;
    if (!["CONFIRMED", "REVEALED"].includes(trip.status)) {
      return fail("Trip is not taking top-ups", 409, "NOT_OPEN");
    }
    // The organizer's remainder has no deadline: it is due before the reveal.
    if (!remainder && (!trip.topUpDeadline || trip.topUpDeadline.getTime() <= Date.now())) {
      return fail("The top-up deadline has passed", 409, "GRACE_PASSED");
    }

    // Awaited so a failure inside the helper reaches this route's catch.
    return await respondWithShareIntent(share, {
      tripId: trip.id,
      travelerId: share.travelerId,
      userId: session.user.id,
      extra: trip.topUpDeadline ? { topUpDeadline: trip.topUpDeadline.toISOString() } : {},
    });
  } catch (error) {
    console.error("Top-up intent failed:", error);
    return fail("Internal server error", 500);
  }
}
