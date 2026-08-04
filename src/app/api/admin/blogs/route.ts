// ============================================================================
// GET /api/admin/blogs - Admin blog moderation list (non-copy posts + author)
// Mirrors GET /api/admin/experiences — mechanically required by
// AdminBlogPageClient's Pending/All tabs.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
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
    const filterAuthorId = searchParams.get("authorId");
    // Comma-separated to support the "pending" tab, which spans two statuses
    // (PENDING_REVIEW, PENDING_TRIPPER_REVIEW).
    const filterStatus = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT),
    );

    // Review copies (isReviewCopy: true) never appear in this list — they
    // surface only inside the admin review screen for their parent post.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { isReviewCopy: false };
    if (filterAuthorId) where.authorId = filterAuthorId;
    if (filterStatus) where.status = { in: filterStatus.split(",") };

    const [blogs, total, pendingCount] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.blogPost.findMany as any)({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          subtitle: true,
          tagline: true,
          coverUrl: true,
          status: true,
          format: true,
          tags: true,
          travelType: true,
          excuseKey: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewNote: true,
          tripperNote: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          isReviewCopy: true,
          parentId: true,
          changedFields: true,
          reviewLockedBy: true,
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.blogPost.count as any)({ where }),
      // Dataset-wide pending count for the tab badge — independent of the
      // active page/filter, matching the pre-pagination behavior where the
      // badge always summarized every non-review-copy post, not just the
      // current filter's results.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.blogPost.count as any)({
        where: { isReviewCopy: false, status: { in: PENDING_STATUSES } },
      }),
    ]);

    return NextResponse.json({ blogs, total, page, limit, pendingCount });
  } catch (error) {
    console.error("[admin/blogs] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
