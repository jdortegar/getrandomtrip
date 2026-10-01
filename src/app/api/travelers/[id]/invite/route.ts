import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeTraveler } from "@/lib/travelers/travelerRoster";
import { canAccessTrip, tripRoleFor } from "@/lib/travelers/travelerAccess";
import { issueTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import { sendTravelerInviteEmail } from "@/lib/email";
import { isTripEnded } from "@/lib/travelers/travelerPolicy";

export const dynamic = "force-dynamic";

/**
 * POST /api/travelers/[id]/invite — buyer (only) sends or resends an invite email
 * for an ADULT row. Rotates the invite token in place (invalidating any
 * prior link) and flips the row to `INVITED`. Not applicable to MINOR rows
 * (no email field, no invite action). The details cutoff does not block
 * inviting: an unlinked adult can be (re)invited until the trip ends, and
 * acceptance after the cutoff only links the account (saved identity stays
 * protected). Rejects with `ended` once the trip is over and `already_joined`
 * once a companion account is linked.
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const traveler = await prisma.tripTraveler.findUnique({
      where: { id: params.id },
      include: { tripRequest: true },
    });

    if (!traveler) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!(await canAccessTrip(traveler.tripRequestId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Inviting is the buyer's call: a linked companion never invites anyone.
    if (tripRoleFor(traveler.tripRequest, session.user.id) === "companion") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (traveler.kind !== "ADULT") {
      return NextResponse.json({ error: "not_adult" }, { status: 400 });
    }

    if (isTripEnded(traveler.tripRequest)) {
      return NextResponse.json({ error: "ended" }, { status: 403 });
    }

    if (traveler.userId) {
      return NextResponse.json({ error: "already_joined" }, { status: 409 });
    }

    if (!traveler.email?.trim()) {
      return NextResponse.json({ error: "missing_email" }, { status: 400 });
    }

    const plaintext = await issueTravelerInvite(traveler.id, traveler.status);
    sendTravelerInviteEmail(traveler.id, plaintext);

    const updated = await prisma.tripTraveler.findUnique({
      where: { id: traveler.id },
    });

    return NextResponse.json({ traveler: serializeTraveler(updated!) });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "conflict" }, { status: 409 });
    }
    console.error("[travelers/[id]/invite] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
