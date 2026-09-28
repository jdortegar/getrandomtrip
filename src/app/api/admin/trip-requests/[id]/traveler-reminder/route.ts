import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { prisma } from "@/lib/prisma";
import { sendTravelerDetailsReminder } from "@/lib/email/sendTravelerDetailsReminder";
import { summarizeCompanionDetails } from "@/lib/travelers/bookingTravelerPolicy";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;
    const { id } = await props.params;
    const trip = await prisma.tripRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        startDate: true,
        pax: true,
        paxDetails: true,
        payment: { select: { status: true } },
        user: { select: { id: true, email: true, locale: true } },
        travelers: {
          select: {
            kind: true,
            fullName: true,
            email: true,
            idDocument: true,
            dateOfBirth: true,
          },
        },
      },
    });
    if (!trip)
      return NextResponse.json(
        { error: "trip_not_found" },
        { status: 404, headers },
      );
    const now = new Date();
    const email = trip.user.email.trim();
    if (
      trip.payment?.status !== "APPROVED" ||
      !trip.startDate ||
      trip.startDate <= now ||
      trip.status === "CANCELLED" ||
      trip.status === "COMPLETED" ||
      !email
    ) {
      return NextResponse.json(
        { status: "not_eligible" },
        { status: 409, headers },
      );
    }
    // Re-read current saved fields here; the admin's page may be stale.
    const details = summarizeCompanionDetails(
      trip.travelers,
      trip.pax,
      trip.paxDetails,
    );
    if (!details.needsReminder) {
      return NextResponse.json({ status: "already_complete" }, { headers });
    }
    if (details.rosterNeedsReview) {
      return NextResponse.json(
        { status: "roster_needs_review" },
        { status: 409, headers },
      );
    }
    const day = now.toISOString().slice(0, 10);
    await sendTravelerDetailsReminder({
      tripId: trip.id,
      buyer: { email, locale: trip.user.locale },
      variant: "MANUAL",
      idempotencyKey: `manual-traveler-details/${trip.id}/${trip.user.id}/${day}`,
    });
    const nextEligibleAt = new Date(now);
    nextEligibleAt.setUTCHours(24, 0, 0, 0);
    return NextResponse.json(
      { status: "accepted", nextEligibleAt: nextEligibleAt.toISOString() },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: "send_failed" },
      { status: 503, headers },
    );
  }
}
