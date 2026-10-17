// ============================================================================
// POST /api/tripper/blogs/[id]/submit
// Transitions a DRAFT blog post to PENDING_REVIEW — or, for a RANDOMTRIP
// (admin-created) post, straight to PUBLISHED, mirroring the experience
// submit route's auto-publish-skips-review behavior.
// Auth: tripper role + ownership
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { getBlogCompleteness } from "@/lib/helpers/blog-form";
import { sendBlogSubmitted } from "@/lib/email";
import { resolveSourceLocale } from "@/lib/blog/legacy-translation-mapping";

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


    const blog = await (prisma.blogPost.findFirst as any)({
      where: { id: params.id, isReviewCopy: false },
      include: {
        translationRows: {
          select: { locale: true, isComplete: true, title: true, content: true },
        },
      },
    }) as {
      id: string;
      authorId: string;
      status: string;
      coverUrl: string | null;
      sourceLocale?: string | null;
      source: "TRIPPER" | "RANDOMTRIP";
      translationRows?: Array<{
        locale: string;
        isComplete: boolean;
        title: string;
        content: string | null;
      }>;
    } | null;

    // Owner may always submit their own post. An admin may additionally
    // submit any RANDOMTRIP (admin-owned) post regardless of who created it.
    const isOwner = blog?.authorId === user.id;
    const isAdminOnRandomtrip =
      hasRoleAccess(user, "admin") && blog?.source === "RANDOMTRIP";

    if (!blog || (!isOwner && !isAdminOnRandomtrip)) {
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

    const sourceLocale = resolveSourceLocale(blog.sourceLocale);
    const storedRows = blog.translationRows ?? [];
    const sourceRow = storedRows.find((row) => row.locale === sourceLocale);
    const { complete, missing } = getBlogCompleteness({
      title: sourceRow?.title ?? "",
      coverUrl: blog.coverUrl ?? "",
      content: sourceRow?.content ?? "",
    });

    if (!complete) {
      return NextResponse.json(
        { error: "incomplete", missing },
        { status: 422 },
      );
    }

    // Submitting (or auto-publishing) requires a complete source translation.
    const sourceComplete = !!storedRows.find((row) => row.locale === sourceLocale)?.isComplete;
    if (!sourceComplete) {
      return NextResponse.json(
        {
          error: "source_translation_incomplete",
          locale: sourceLocale,
          message: "The source translation must be complete to submit.",
        },
        { status: 400 },
      );
    }

    // RANDOMTRIP (admin-created) posts skip PENDING_REVIEW entirely — there's
    // no human review step, so this IS the publish action.
    const isRandomtrip = blog.source === "RANDOMTRIP";
    const targetStatus = isRandomtrip ? "PUBLISHED" : "PENDING_REVIEW";

    // Transition status and clean up any discarded tombstone copy from a
    // prior tripper rejection cycle.

    const updated = await (prisma.$transaction as any)(async (tx: any) => {

      const tombstone = await (tx.blogPost.findFirst as any)({
        where: {
          parentId: params.id,
          isReviewCopy: true,
          isDiscarded: true,
        },
        select: { id: true },
      }) as { id: string } | null;

      if (tombstone) {

        await (tx.blogPost.delete as any)({ where: { id: tombstone.id } });
      }


      const result = await (tx.blogPost.update as any)({
        where: { id: params.id },
        data: {
          status: targetStatus,
          reviewNote: null,
          ...(isRandomtrip && { isActive: true, publishedAt: new Date() }),
        },
        select: { id: true, status: true },
      });
      return result;
    }) as { id: string; status: string };

    if (targetStatus === "PENDING_REVIEW") {
      sendBlogSubmitted(updated.id, user.id);
    }

    return NextResponse.json({ blog: updated });
  } catch (error) {
    console.error("[tripper/blogs/submit] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
