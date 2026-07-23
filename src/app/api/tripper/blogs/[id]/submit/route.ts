// ============================================================================
// POST /api/tripper/blogs/[id]/submit
// Transitions a DRAFT blog post to PENDING_REVIEW.
// Auth: tripper role + ownership
// No source/pricing branch — unlike experience, blogs have a single target.
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { getBlogCompleteness } from "@/lib/helpers/blog-form";
import { sendBlogSubmitted } from "@/lib/email";

export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blog = await (prisma.blogPost.findFirst as any)({
      where: { id: params.id, authorId: user.id, isReviewCopy: false },
    }) as {
      id: string;
      authorId: string;
      status: string;
      title: string;
      coverUrl: string | null;
      content: string | null;
    } | null;

    if (!blog) {
      return NextResponse.json(
        { error: "Blog post not found or access denied" },
        { status: 404 },
      );
    }

    if (blog.status !== "DRAFT") {
      return NextResponse.json(
        { error: "invalid_state", message: "Blog post must be in DRAFT status to submit for review" },
        { status: 409 },
      );
    }

    const { complete, missing } = getBlogCompleteness({
      title: blog.title ?? "",
      coverUrl: blog.coverUrl ?? "",
      content: blog.content ?? "",
    });

    if (!complete) {
      return NextResponse.json(
        { error: "incomplete", missing },
        { status: 422 },
      );
    }

    // Transition status and clean up any discarded tombstone copy from a
    // prior tripper rejection cycle.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.$transaction as any)(async (tx: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tombstone = await (tx.blogPost.findFirst as any)({
        where: {
          parentId: params.id,
          isReviewCopy: true,
          isDiscarded: true,
        },
        select: { id: true },
      }) as { id: string } | null;

      if (tombstone) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx.blogPost.delete as any)({ where: { id: tombstone.id } });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (tx.blogPost.update as any)({
        where: { id: params.id },
        data: { status: "PENDING_REVIEW", reviewNote: null },
        select: { id: true, status: true },
      });
    }) as { id: string; status: string };

    sendBlogSubmitted(updated.id, user.id);

    return NextResponse.json({ blog: updated });
  } catch (error) {
    console.error("[tripper/blogs/submit] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
