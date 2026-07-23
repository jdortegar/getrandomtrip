// ============================================================================
// POST /api/tripper/blogs/[id]/reject-copy
// Tripper rejects the admin's review copy: sets the copy isDiscarded:true
// (kept as reference, hard-delete deferred to the next submit), transitions
// the original back to DRAFT, and emails the admin.
// Auth: tripper role + ownership
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { sendBlogCopyRejected } from "@/lib/email";

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
    const original = await (prisma.blogPost.findFirst as any)({
      where: { id: params.id, authorId: user.id, isReviewCopy: false },
      select: { id: true, authorId: true, status: true },
    }) as { id: string; authorId: string; status: string } | null;

    if (!original) {
      return NextResponse.json(
        { error: "Blog post not found or access denied" },
        { status: 404 },
      );
    }

    if (original.status !== "PENDING_TRIPPER_REVIEW") {
      return NextResponse.json(
        {
          error: "invalid_state",
          message: "Blog post must be in PENDING_TRIPPER_REVIEW status to reject copy",
        },
        { status: 409 },
      );
    }

    // Find the active (non-discarded) review copy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const copy = await (prisma.blogPost.findFirst as any)({
      where: { parentId: params.id, isReviewCopy: true, isDiscarded: false },
      select: { id: true },
    }) as { id: string } | null;

    if (!copy) {
      return NextResponse.json(
        { error: "no_copy", message: "No review copy found for this blog post" },
        { status: 404 },
      );
    }

    // Transactionally: tombstone the copy (isDiscarded:true) + set original to DRAFT
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.$transaction as any)(async (tx: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.blogPost.update as any)({
        where: { id: copy.id },
        data: { isDiscarded: true },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.blogPost.update as any)({
        where: { id: params.id },
        data: { status: "DRAFT" },
      });
    });

    // Fire-and-forget email to admin
    sendBlogCopyRejected(params.id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tripper/blogs/reject-copy] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
