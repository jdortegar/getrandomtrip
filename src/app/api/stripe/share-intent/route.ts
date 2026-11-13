import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { respondWithShareIntent } from "@/lib/payments/share-intent.server";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number, errorCode?: string) =>
  NextResponse.json({ error, ...(errorCode ? { errorCode } : {}) }, { status });

/**
 * POST /api/stripe/share-intent { travelerId }
 *
 * Returns a PaymentIntent for the signed-in companion's own share of an
 * INDIVIDUAL trip that is still collecting payments. A USD 0 share (a promo
 * that zeroes the trip) is settled here without Stripe.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Unauthorized", 401);
    let body: { travelerId?: unknown };
    try {
      body = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }
    if (typeof body.travelerId !== "string" || !body.travelerId) {
      return fail("travelerId is required", 400);
    }

    const traveler = await prisma.tripTraveler.findUnique({
      where: { id: body.travelerId },
      include: { tripRequest: true, paymentShares: { where: { kind: "SHARE" } } },
    });
    // Another user's traveler row is indistinguishable from a missing one.
    if (!traveler || traveler.userId !== session.user.id) {
      return fail("Share not found", 404);
    }
    const trip = traveler.tripRequest;
    if (trip.paymentMode !== "INDIVIDUAL" || trip.status !== "COLLECTING") {
      return fail("Trip is not collecting payments", 409, "NOT_COLLECTING");
    }
    if (!trip.paymentDeadline || trip.paymentDeadline.getTime() <= Date.now()) {
      return fail("The payment deadline has passed", 409, "DEADLINE_PASSED");
    }
    const share = traveler.paymentShares[0];
    if (!share) return fail("Share not found", 404);
    // Awaited so a failure inside the helper reaches this route's catch.
    return await respondWithShareIntent(share, {
      tripId: trip.id,
      travelerId: traveler.id,
      userId: session.user.id,
      extra: { paymentDeadline: trip.paymentDeadline.toISOString() },
    });
  } catch (error) {
    console.error("Share intent failed:", error);
    return fail("Internal server error", 500);
  }
}
