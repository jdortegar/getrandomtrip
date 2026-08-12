import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRosterForTrip } from "@/lib/travelers/travelerRoster";
import { canAccessTrip } from "@/lib/travelers/travelerAccess";
import { isFulfillmentVisible } from "@/lib/trips/fulfillmentVisibility";
import { toTripDocumentDTO } from "@/lib/trips/tripDocumentDto";

// GET /api/trips/[id] - Get a specific trip
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get trip
    const trip = await prisma.tripRequest.findUnique({
      where: { id: params.id },
      include: {
        payment: true,
        experience: {
          select: {
            id: true,
            title: true,
            itinerary: true,
            inclusions: true,
            exclusions: true,
            heroImage: true,
            destinationCity: true,
            destinationCountry: true,
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Buyer-OR-companion, via the single shared predicate (v1: same
    // permission level as the buyer once access is granted — narrowing is
    // a documented follow-up, not this change's scope).
    if (!(await canAccessTrip(trip.id, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roster = await getRosterForTrip(trip.id);

    // Server-side fulfillment-visibility gate (design.md ADR-6). `isAdmin`
    // is hardcoded `false` — this endpoint stays buyer/companion-only, no
    // admin bypass. Non-visible statuses omit itinerary/inclusions/
    // exclusions/documents entirely, not just hide them client-side.
    const visible = isFulfillmentVisible(trip.status, false);

    let responseTrip: typeof trip & { documents?: ReturnType<typeof toTripDocumentDTO>[] } = trip;

    if (visible) {
      const documents = await prisma.tripDocument.findMany({
        where: { tripRequestId: trip.id },
        orderBy: { createdAt: "desc" },
      });
      responseTrip = { ...trip, documents: documents.map(toTripDocumentDTO) };
    } else if (trip.experience) {
      const {
        itinerary: _itinerary,
        inclusions: _inclusions,
        exclusions: _exclusions,
        ...restExperience
      } = trip.experience;
      responseTrip = { ...trip, experience: restExperience as typeof trip.experience };
    }

    return NextResponse.json(
      { trip: { ...responseTrip, roster } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching trip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/trips/[id] - Delete a trip
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get trip
    const trip = await prisma.tripRequest.findUnique({
      where: { id: params.id },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Verify ownership
    if (trip.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete trip
    await prisma.tripRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Trip deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting trip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
