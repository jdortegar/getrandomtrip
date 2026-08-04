import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT),
    );

    const [rawReviews, total] = await Promise.all([
      prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          content: true,
          createdAt: true,
          destination: true,
          id: true,
          isApproved: true,
          isPublic: true,
          rating: true,
          title: true,
          tripRequestId: true,
          tripper: {
            select: { name: true },
          },
          user: {
            select: {
              email: true,
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.review.count(),
    ]);

    const reviews = rawReviews.map((r) => ({
      ...r,
      tripperName: r.tripper?.name ?? null,
      tripper: undefined,
    }));

    return NextResponse.json({ reviews, total, page, limit });
  } catch (error) {
    console.error("[admin/reviews] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
