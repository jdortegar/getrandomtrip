import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRosterLocked, serializeTraveler } from "@/lib/travelers/travelerRoster";
import { canAccessTrip } from "@/lib/travelers/travelerAccess";
import { issueTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import { sendTravelerInviteEmail } from "@/lib/email";

/**
 * POST /api/travelers/[id]/invite — buyer sends or resends an invite email
 * for an ADULT row. Rotates the invite token in place (invalidating any
 * prior link) and flips the row to `INVITED`. Not applicable to MINOR rows
 * (no email field, no invite action) and rejected once the roster is locked.
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

    // Buyer-OR-companion, matching the read path (GET /api/trips/[id]):
    // v1 grants companions the same permission level as the buyer once
    // access is granted — narrowing is a documented follow-up.
    if (!(await canAccessTrip(traveler.tripRequestId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isRosterLocked(traveler.tripRequest)) {
      return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    if (traveler.kind !== "ADULT") {
      return NextResponse.json({ error: "not_adult" }, { status: 400 });
    }

    if (!traveler.email) {
      return NextResponse.json({ error: "missing_email" }, { status: 400 });
    }

    const plaintext = await issueTravelerInvite(traveler.id);
    sendTravelerInviteEmail(traveler.id, plaintext);

    const updated = await prisma.tripTraveler.findUnique({
      where: { id: traveler.id },
    });

    return NextResponse.json({ traveler: serializeTraveler(updated!) });
  } catch (error) {
    console.error("[travelers/[id]/invite] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
