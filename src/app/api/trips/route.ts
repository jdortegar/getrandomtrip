import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { TripRequestStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attachPaymentsToTrips } from "@/lib/utils/trip-relations";
import { tripAccessWhere, tripRoleFor } from "@/lib/travelers/travelerAccess";
import { revertExpiredPendingPaymentsForUser } from "@/lib/db/tripRequest";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// GET /api/trips - Get all trips for the authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/trips called");
    const session = await getServerSession(authOptions);
    console.log("Session:", session);

    if (!session?.user?.email) {
      console.log("No session or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email
    console.log("Finding user by email:", session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    console.log("User found:", user);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Persist any stale PENDING_PAYMENT → SAVED revert BEFORE the paginated
    // read, so the query is the single source of truth (a stale row would
    // otherwise contradict a `?status=` filter and make `total` stale).
    // Scoped to owned rows only — a companion's read must not write to
    // another buyer's trip.
    await revertExpiredPendingPaymentsForUser(user.id);

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT),
    );
    // Comma-separated to support the "upcoming" filter, which spans two
    // statuses (CONFIRMED, REVEALED).
    const statusParam = searchParams.get("status");
    const where = statusParam
      ? {
          ...tripAccessWhere(user.id),
          status: { in: statusParam.split(",") as TripRequestStatus[] },
        }
      : tripAccessWhere(user.id);

    // Get all trips owned by OR companion-linked to this user.
    console.log("Fetching trips for userId:", user.id);
    const [trips, total] = await Promise.all([
      prisma.tripRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tripRequest.count({ where }),
    ]);
    const paymentEntries = await Promise.all(
      trips.map(async (trip) => {
        const payment = await prisma.payment.findUnique({
          where: { tripRequestId: trip.id },
        });

        return payment ? { payment, tripId: trip.id } : null;
      }),
    );
    const paymentsByTripRequestId: Record<string, Record<string, unknown>> = {};
    for (const entry of paymentEntries) {
      if (!entry) continue;
      paymentsByTripRequestId[entry.tripId] = entry.payment as Record<
        string,
        unknown
      >;
    }
    const hydratedTrips = attachPaymentsToTrips(trips, paymentsByTripRequestId).map(
      (trip) => ({ ...trip, role: tripRoleFor(trip, user.id) }),
    );
    console.log("Trips found:", trips.length);

    return NextResponse.json(
      { trips: hydratedTrips, total, page, limit },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching trips:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
