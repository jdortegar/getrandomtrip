// ============================================================================
// GET /api/tripper/reviews - Get tripper reviews and NPS metrics
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTripperReviews, getTripperReviewStats } from "@/lib/db/tripper-queries";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and verify they are a tripper
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!user || !hasRoleAccess(user, "tripper")) {
      return NextResponse.json(
        { error: "Forbidden - Tripper access only" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT),
    );
    const rawStatus = searchParams.get("status");
    const status =
      rawStatus === "approved" || rawStatus === "unapproved"
        ? rawStatus
        : "all";
    const search = searchParams.get("search")?.trim() || undefined;

    const [{ reviews, total }, stats] = await Promise.all([
      getTripperReviews(user.id, { page, limit, status, search }),
      getTripperReviewStats(user.id),
    ]);

    return NextResponse.json({ reviews, total, page, limit, ...stats });
  } catch (error) {
    console.error("Error fetching tripper reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
