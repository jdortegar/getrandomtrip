// ============================================================================
// DELETE /api/admin/blogs/[id] - Admin hard-delete of any blog post
// Unlike /api/tripper/blogs/[id] (owner or admin-on-RANDOMTRIP only), this
// route lets an admin delete any non-copy post regardless of source/author —
// the "manage all blog posts" moderation capability (see blog-review-flow spec).
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });
    if (!caller || !hasRoleAccess(caller, "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const blog = await prisma.blogPost.findFirst({
      where: { id: params.id, isReviewCopy: false },
      select: { id: true, status: true },
    });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    // Guard: cannot delete while a review copy may exist for this post —
    // deleting the original would orphan it (parentId is a bare string, no
    // FK/cascade) with no cleanup path. Mirrors DELETE /api/tripper/blogs/[id].
    if (
      (blog.status as string) === "PENDING_REVIEW" ||
      (blog.status as string) === "PENDING_TRIPPER_REVIEW"
    ) {
      return NextResponse.json(
        {
          error: "locked_for_review",
          message: "Blog post cannot be deleted while a review decision is pending.",
        },
        { status: 409 },
      );
    }

    await prisma.blogPost.delete({ where: { id: params.id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[admin/blogs/[id]] DELETE", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
