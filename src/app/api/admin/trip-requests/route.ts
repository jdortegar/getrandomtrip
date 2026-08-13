import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { attachAdminTripRequestRelations } from "@/lib/admin/trip-requests";
import {
  countTripsByStatus,
  TRIP_STATUS_FLOW,
  type TripRequestStatus,
} from "@/lib/admin/trip-status";
import {
  buildTripRequestsWhere,
  isTripPaymentStatusFilter,
  isTripRequestLevel,
  isTripRequestType,
} from "@/lib/admin/tripRequestsFilters";
import {
  parseTripRequestSortBy,
  parseTripRequestSortOrder,
  sortTripDatesByProximity,
  tripRequestListOrderBy,
} from "@/lib/admin/tripRequestsSort";
import type {
  AdminTripExperience,
  AdminTripPayment,
  AdminTripUser,
} from "@/lib/admin/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ALL_STATUSES = [...TRIP_STATUS_FLOW, "CANCELLED"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!user || !hasRoleAccess(user, "admin")) {
      return NextResponse.json(
        { error: "Forbidden - Admin access only" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT),
    );
    const statusParam = searchParams.get("status");
    const status: TripRequestStatus | undefined =
      statusParam && (ALL_STATUSES as string[]).includes(statusParam)
        ? (statusParam as TripRequestStatus)
        : undefined;
    const typeParam = searchParams.get("type");
    const type = typeParam && isTripRequestType(typeParam) ? typeParam : undefined;
    const levelParam = searchParams.get("level");
    const level = levelParam && isTripRequestLevel(levelParam) ? levelParam : undefined;
    const paymentStatusParam = searchParams.get("paymentStatus");
    const paymentStatus =
      paymentStatusParam && isTripPaymentStatusFilter(paymentStatusParam)
        ? paymentStatusParam
        : undefined;
    const search = searchParams.get("search")?.trim() || undefined;
    const where = buildTripRequestsWhere({
      level,
      paymentStatus,
      search,
      status,
      type,
    });
    const sortBy = parseTripRequestSortBy(searchParams.get("sortBy"));
    const sortOrder = parseTripRequestSortOrder(searchParams.get("sortOrder"));

    // `tripDate` is anchored to "now" (soonest-upcoming-first, not a plain
    // chronological column sort) — Prisma's `orderBy` can't express that
    // declaratively, so this path fetches every matching row, sorts in
    // memory, then paginates in memory. Every other sort field keeps the
    // simple DB-level orderBy + skip/take path.
    const listQuery =
      sortBy === "tripDate"
        ? prisma.tripRequest.findMany({ where }).then((allMatching) => {
            const sorted = sortTripDatesByProximity(allMatching, sortOrder, new Date());
            return {
              total: sorted.length,
              tripRequests: sorted.slice(
                (page - 1) * limit,
                (page - 1) * limit + limit,
              ),
            };
          })
        : Promise.all([
            prisma.tripRequest.findMany({
              where,
              orderBy: tripRequestListOrderBy(sortBy, sortOrder),
              skip: (page - 1) * limit,
              take: limit,
            }),
            prisma.tripRequest.count({ where }),
          ]).then(([tripRequests, total]) => ({ total, tripRequests }));

    const [{ total, tripRequests }, allStatuses] = await Promise.all([
      listQuery,
      // Dataset-wide status counts for the KPI strip — independent of the
      // active page/filter, matching the pre-pagination behavior where the
      // KPI strip always summarized every trip request, not just the
      // current filter's results.
      prisma.tripRequest.findMany({ select: { status: true } }),
    ]);
    const statusCounts = countTripsByStatus(allStatuses);

    const experienceIds = Array.from(
      new Set(
        tripRequests.flatMap((tripRequest) =>
          tripRequest.experienceId ? [tripRequest.experienceId] : [],
        ),
      ),
    );
    const userIds = Array.from(
      new Set(tripRequests.map((tripRequest) => tripRequest.userId)),
    );

    const [experienceEntries, paymentEntries, userEntries] = await Promise.all([
      Promise.all(
        experienceIds.map(async (experienceId) => {
          const exp = await prisma.experience.findUnique({
            select: {
              excuseKey: true,
              id: true,
              level: true,
              title: true,
              type: true,
            },
            where: { id: experienceId },
          });

          return exp ? { experienceId, exp } : null;
        }),
      ),
      Promise.all(
        tripRequests.map(async (tripRequest) => {
          const payment = await prisma.payment.findUnique({
            select: {
              amount: true,
              currency: true,
              status: true,
            },
            where: { tripRequestId: tripRequest.id },
          });

          return payment ? { payment, tripRequestId: tripRequest.id } : null;
        }),
      ),
      Promise.all(
        userIds.map(async (userId) => {
          const adminUser = await prisma.user.findUnique({
            select: {
              email: true,
              id: true,
              locale: true,
              name: true,
            },
            where: { id: userId },
          });

          return adminUser ? { adminUser, userId } : null;
        }),
      ),
    ]);

    const experiencesById: Record<string, AdminTripExperience> = {};
    for (const entry of experienceEntries) {
      if (!entry) continue;
      experiencesById[entry.experienceId] = entry.exp;
    }

    const paymentsByTripRequestId: Record<string, AdminTripPayment> = {};
    for (const entry of paymentEntries) {
      if (!entry) continue;
      paymentsByTripRequestId[entry.tripRequestId] = entry.payment;
    }

    const usersById: Record<string, AdminTripUser> = {};
    for (const entry of userEntries) {
      if (!entry) continue;
      usersById[entry.userId] = entry.adminUser;
    }
    const hydratedTripRequests = attachAdminTripRequestRelations(
      tripRequests,
      usersById,
      experiencesById,
      paymentsByTripRequestId,
    );

    return NextResponse.json({
      tripRequests: hydratedTripRequests,
      total,
      page,
      limit,
      statusCounts,
    });
  } catch (error) {
    console.error("Error fetching admin trip requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
