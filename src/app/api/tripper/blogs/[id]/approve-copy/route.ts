// ============================================================================
// POST /api/tripper/blogs/[id]/approve-copy
// Tripper approves the admin's review copy: overwrites the original with the
// copy's mutable fields in a single transaction, hard-deletes the copy, sets
// the original to PUBLISHED, and emails the admin.
// Auth: tripper role + ownership
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { overwriteOriginalWithCopy } from "@/lib/blog/changed-fields";
import { sendBlogCopyApproved } from "@/lib/email";
import { syncTranslationsForPost } from "@/lib/blog/blogRepository";
import { SourceTranslationIncompleteError } from "@/lib/blog/legacy-translation-mapping";

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
          message: "Blog post must be in PENDING_TRIPPER_REVIEW status to approve copy",
        },
        { status: 409 },
      );
    }

    // Find the active (non-discarded) review copy

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

    // Transactionally overwrite the original with the copy's data + delete copy

    await (prisma.$transaction as any)(async (tx: any) => {
      await overwriteOriginalWithCopy(tx, params.id, copy.id);
      // Publishing requires a complete source translation; throwing here rolls
      // the overwrite back. Full review-row cloning lands with T5.
      await syncTranslationsForPost(tx, params.id, { requireCompleteSource: true });

      await (tx.blogPost.delete as any)({ where: { id: copy.id } });
    });

    // Fire-and-forget email to admin
    sendBlogCopyApproved(params.id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SourceTranslationIncompleteError) {
      return NextResponse.json(
        {
          error: error.code,
          locale: error.locale,
          message: "The source translation must be complete to publish.",
        },
        { status: 400 },
      );
    }
    console.error("[tripper/blogs/approve-copy] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
