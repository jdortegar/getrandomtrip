import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma, TripRequestStatus } from "@prisma/client";
import {
  isTripRequestLevel,
  isTripRequestType,
} from "@/lib/admin/tripRequestsFilters";
import { resolveInitialStatusFilter } from "@/lib/admin/trip-status";
import { toTravelerTripResponse } from "@/lib/trips/travelerTripResponse";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attachPaymentsToTrips } from "@/lib/utils/trip-relations";
import { tripAccessWhere, tripRoleFor } from "@/lib/travelers/travelerAccess";
import { omitBuyerOnlyFields } from "@/lib/trips/companionTripView";
import { revertExpiredPendingPaymentsForUser } from "@/lib/db/tripRequest";
import { resolveBasePricePerPerson } from "@/lib/pricing/resolve-base-price";
import { loadTripperPriceOverridesBatch } from "@/lib/pricing/tripper-price-overrides.server";

export const dynamic = "force-dynamic";

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
    const statuses = statusParam
      ?.split(",")
      .filter((status) => resolveInitialStatusFilter(status) !== "ALL") as
      | TripRequestStatus[]
      | undefined;
    const level = searchParams.get("level");
    const type = searchParams.get("type");
    const search = searchParams.get("search")?.trim();
    const predicates: Prisma.TripRequestWhereInput[] = [];
    // XSED bookings can encode party type in `level`; display classification
    // treats every type=xsed trip as XSED, alongside legacy level=xsed rows.
    if (level === "xsed") {
      predicates.push({ OR: [{ level: "xsed" }, { type: "xsed" }] });
    } else if (level && isTripRequestLevel(level)) {
      predicates.push({ NOT: { type: "xsed" } });
    }
    // Nest both classification and text OR under AND, preserving access OR.
    // Destinations stay excluded, including from search counts before reveal.
    if (search) {
      predicates.push({
        OR: [
          { originCity: { contains: search, mode: "insensitive" } },
          { originCountry: { contains: search, mode: "insensitive" } },
          { id: { contains: search, mode: "insensitive" } },
        ],
      });
    }
    const where: Prisma.TripRequestWhereInput = {
      ...tripAccessWhere(user.id),
      ...(statuses?.length ? { status: { in: statuses } } : {}),
      ...(level && level !== "xsed" && isTripRequestLevel(level)
        ? { level }
        : {}),
      ...(type && isTripRequestType(type) ? { type } : {}),
      ...(predicates.length ? { AND: predicates } : {}),
    };

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
    // Server-resolved per-person base price (pre-pax-multiplier) so the
    // checkout page's displayed price always matches what will be charged —
    // prefers a tripper override for `trip.tripperId`, falls back to the
    // global catalog. Batched to avoid one query per trip.
    const overridesByTripperId = await loadTripperPriceOverridesBatch(
      trips.map((trip) => trip.tripperId),
    );
    const hydratedTrips = attachPaymentsToTrips(
      trips,
      paymentsByTripRequestId,
    ).map((trip) => {
      const role = tripRoleFor(trip, user.id);
      const item = {
        ...toTravelerTripResponse(trip),
        basePriceUsd: resolveBasePricePerPerson({
          levelId: trip.level,
          overrides: trip.tripperId
            ? (overridesByTripperId[trip.tripperId] ?? null)
            : null,
          travelerType: trip.type,
        }).price,
        role,
      };
      // Companions never see what the buyer paid or the resolved price.
      return role === "companion" ? omitBuyerOnlyFields(item) : item;
    });
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
