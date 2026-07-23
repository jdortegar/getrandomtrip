// ============================================================================
// POST /api/admin/blogs/[id]/send-to-tripper
// Computes changedFields, stores them on the copy, transitions the original
// to PENDING_TRIPPER_REVIEW, clears reviewLockedBy, and emails the tripper.
// Auth: admin role only
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { computeChangedFields } from "@/lib/blog/changed-fields";
import { sendBlogPendingTripperReview } from "@/lib/email";

export async function POST(
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

    const body = await request.json().catch(() => ({})) as { reviewNote?: unknown };
    const reviewNote =
      typeof body.reviewNote === "string" && body.reviewNote.trim()
        ? body.reviewNote.trim()
        : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = await (prisma.blogPost.findUnique as any)({
      where: { id: params.id },
    }) as Record<string, unknown> | null;

    if (!original) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    // Find the active (non-discarded) review copy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const copy = await (prisma.blogPost.findFirst as any)({
      where: { parentId: params.id, isReviewCopy: true, isDiscarded: false },
    }) as Record<string, unknown> | null;

    if (!copy) {
      return NextResponse.json(
        { error: "no_copy", message: "No review copy found for this blog post" },
        { status: 404 },
      );
    }

    const changedFields = computeChangedFields(copy, original);

    if (changedFields.length === 0) {
      return NextResponse.json(
        {
          error: "no_changes",
          message: "No fields were changed in the review copy. Make edits before sending to tripper.",
        },
        { status: 422 },
      );
    }

    // Transactionally: store changedFields on copy, transition original, clear lock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.$transaction as any)(async (tx: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.blogPost.update as any)({
        where: { id: copy.id as string },
        data: { changedFields, reviewNote },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.blogPost.update as any)({
        where: { id: params.id },
        data: { status: "PENDING_TRIPPER_REVIEW", reviewLockedBy: null },
      });
    });

    // Fire-and-forget: email + system notification to tripper
    sendBlogPendingTripperReview(params.id, original.authorId as string, changedFields);

    void (async () => {
      try {
        const author = await prisma.user.findUnique({
          where: { id: original.authorId as string },
          select: { locale: true },
        });
        const locale = author?.locale === "en" ? "en" : "es";
        const title = original.title as string;
        const notifCopy = locale === "en"
          ? { title: "Admin proposed changes to your article", body: `The Randomtrip team has proposed changes to "${title}".` }
          : { title: "El admin propuso cambios en tu artículo", body: `El equipo de Randomtrip propuso cambios para "${title}".` };
        await prisma.notification.create({
          data: {
            userId: original.authorId as string,
            type: "BLOG_PENDING_TRIPPER_REVIEW",
            audience: "TRIPPER",
            isRead: false,
            title: notifCopy.title,
            body: notifCopy.body,
            metadata: { blogId: params.id },
          },
        });
      } catch (err) {
        console.error("[send-to-tripper] blog notification create:", err);
      }
    })();

    return NextResponse.json({ changedFields });
  } catch (error) {
    console.error("[admin/blogs/send-to-tripper] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
