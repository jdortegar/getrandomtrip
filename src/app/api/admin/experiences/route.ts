import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { canonicalizeExperienceTypeFilter } from "@/lib/experiences/experienceTypeFilter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const PENDING_STATUSES = ["PENDING_REVIEW", "PENDING_TRIPPER_REVIEW"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({
      select: { id: true, roles: true },
      where: { id: session.user.id },
    });
    if (!caller || !hasRoleAccess(caller, "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filterTripperId = searchParams.get("tripperId");
    const filterLevel = searchParams.get("level");
    const filterType = searchParams.get("type");
    // Comma-separated to support the "pending" tab, which spans two
    // statuses (PENDING_REVIEW, PENDING_TRIPPER_REVIEW).
    const filterStatus = searchParams.get("status");
    const searchParam = searchParams.get("search");
    const ownerActive = searchParams.get("ownerActive") === "true";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT),
    );

    // Build additive AND where clause from optional query params.
    // owner: { isActive: true } is opt-in via ?ownerActive=true — this
    // route also backs the admin catalog browsing view, which must keep
    // showing inactive owners' experiences (no admin-side isActive
    // display/filter is in scope for that use case).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (ownerActive) where.owner = { isActive: true };
    if (filterTripperId) where.ownerId = filterTripperId;
    if (filterLevel) where.level = filterLevel;
    if (filterType) {
      where.type = { has: canonicalizeExperienceTypeFilter(filterType) };
    }
    if (filterStatus) where.status = { in: filterStatus.split(",") };
    if (searchParam) where.title = { contains: searchParam, mode: "insensitive" };

    const [experiences, total, pendingCount] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.experience.findMany as any)({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          createdAt: true,
          id: true,
          isActive: true,
          isFeatured: true,
          owner: {
            select: {
              email: true,
              id: true,
              name: true,
            },
          },
          status: true,
          source: true,
          title: true,
          type: true,
          level: true,
          destinationCountry: true,
          destinationCity: true,
          teaser: true,
          description: true,
          heroImage: true,
          minPax: true,
          maxPax: true,
          minNights: true,
          maxNights: true,
          pricingByType: true,
          reviewNote: true,
          tripperNote: true,
          updatedAt: true,
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.experience.count as any)({ where }),
      // Dataset-wide pending count for the tab badge — independent of the
      // active page/filter, matching the pre-pagination behavior where the
      // badge always summarized every experience, not just the current
      // filter's results.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.experience.count as any)({
        where: { status: { in: PENDING_STATUSES } },
      }),
    ]);

    return NextResponse.json({ experiences, total, page, limit, pendingCount });
  } catch (error) {
    console.error("[admin/experiences] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
