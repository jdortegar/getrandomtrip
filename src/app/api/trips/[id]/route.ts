import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withDocumentCascadeCleanup } from "@/lib/db/withDocumentCascadeCleanup";
import { prisma } from "@/lib/prisma";
import { getRosterForTrip } from "@/lib/travelers/travelerRoster";
import { canAccessTrip } from "@/lib/travelers/travelerAccess";
import {
  toTravelerTripResponse,
  TRAVELER_EXPERIENCE_SELECT,
} from "@/lib/trips/travelerTripResponse";
import { isFulfillmentVisible } from "@/lib/trips/fulfillmentVisibility";
import { toTripDocumentDTO } from "@/lib/trips/tripDocumentDto";
import { resolveBasePricePerPerson } from "@/lib/pricing/resolve-base-price";
import { loadTripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides.server";

export const dynamic = "force-dynamic";

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
        experience: { select: TRAVELER_EXPERIENCE_SELECT },
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

    const responseTrip = toTravelerTripResponse(trip);
    const documents = visible
      ? (await prisma.tripDocument.findMany({
          where: { tripRequestId: trip.id },
          orderBy: { createdAt: "desc" },
        })).map(toTripDocumentDTO)
      : undefined;

    // Resolved server-side so the displayed price always matches what
    // checkout will charge (tripper override, or global catalog fallback).
    // Per-person, pre-pax-multiplier — mirrors the previous client-side
    // `getBasePriceFromCatalog` call this replaces at checkout/page.tsx.
    const overrides = await loadTripperPriceOverrides(trip.tripperId);
    const basePriceUsd = resolveBasePricePerPerson({
      levelId: trip.level,
      overrides,
      travelerType: trip.type,
    }).price;

    return NextResponse.json(
      { trip: { ...responseTrip, basePriceUsd, roster, ...(visible && { documents }) } },
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
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404, headers });
    }

    const params = await props.params;
    // Get trip
    const trip = await prisma.tripRequest.findUnique({
      where: { id: params.id },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404, headers });
    }

    // Verify ownership
    if (trip.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
    }

    await withDocumentCascadeCleanup(
      prisma,
      { kind: "trip", ownerId: trip.userId, tripRequestId: trip.id },
      (tx) => tx.tripRequest.delete({ where: { id: trip.id } }),
    );

    return NextResponse.json(
      { message: "Trip deleted successfully" },
      { status: 200, headers },
    );
  } catch (error) {
    const conflict = error instanceof Error && error.message === "DOCUMENT_LOCK_SCOPE_MISMATCH";
    return NextResponse.json(
      { error: conflict ? "trip_conflict" : "delete_unavailable" },
      { status: conflict ? 409 : 503, headers },
    );
  }
}
