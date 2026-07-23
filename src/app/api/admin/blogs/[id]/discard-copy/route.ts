// ============================================================================
// POST /api/admin/blogs/[id]/discard-copy
// Hard-deletes the review copy and clears reviewLockedBy on the original.
// The original remains in PENDING_REVIEW.
// Auth: admin role only
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

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

    const caller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!caller || !hasRoleAccess(caller, "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Guard: once the copy has been sent to the tripper (PENDING_TRIPPER_REVIEW),
    // it's the tripper's decision to make via approve-copy/reject-copy — admin
    // can no longer discard it. Without this, discarding after send-to-tripper
    // deletes the copy but leaves the original stuck at PENDING_TRIPPER_REVIEW
    // with no copy left for the tripper's routes to act on.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = await (prisma.blogPost.findUnique as any)({
      where: { id: params.id },
      select: { status: true },
    }) as { status: string } | null;

    if (!original) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    if (original.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "invalid_state", message: "Blog post must be in PENDING_REVIEW status to discard the copy" },
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
        { error: "no_copy", message: "No active review copy found for this blog post" },
        { status: 404 },
      );
    }

    // Transactionally: delete the copy + clear lock on original
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.$transaction as any)(async (tx: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.blogPost.delete as any)({ where: { id: copy.id } });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.blogPost.update as any)({
        where: { id: params.id },
        data: { reviewLockedBy: null },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/blogs/discard-copy] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
