// ============================================================================
// POST /api/admin/blogs/[id]/approve
// Transitions a PENDING_REVIEW blog post to PUBLISHED.
// Auth: admin role only
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { overwriteOriginalWithCopy } from "@/lib/blog/changed-fields";
import {
  sourceTitleForPost,
  syncTranslationsForPost,
} from "@/lib/blog/blogRepository";
import { SourceTranslationIncompleteError } from "@/lib/blog/legacy-translation-mapping";
import { sendMail } from "@/lib/helpers/sendMail";
import BlogApproved, { subjects as approvedSubjects } from "@/emails/BlogApproved";

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


    const blog = await (prisma.blogPost.findUnique as any)({
      where: { id: params.id },
      select: { id: true, status: true, authorId: true, publishedAt: true },
    }) as { id: string; status: string; authorId: string; publishedAt: Date | null } | null;

    if (!blog) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    if (blog.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "invalid_state", message: "Blog post must be in PENDING_REVIEW status to approve" },
        { status: 409 },
      );
    }

    const body = await request.json().catch(() => ({})) as { reviewNote?: unknown };
    const reviewNote =
      typeof body.reviewNote === "string" && body.reviewNote.trim()
        ? body.reviewNote.trim()
        : null;

    // Check whether an active (non-discarded) review copy exists.

    const existingCopy = await (prisma.blogPost.findFirst as any)({
      where: { parentId: params.id, isReviewCopy: true, isDiscarded: false },
      select: { id: true },
    }) as { id: string } | null;

    let updated: { id: string; status: string; authorId: string };

    if (existingCopy) {
      // Copy-based approve: overwrite + delete copy in transaction

      updated = await (prisma.$transaction as any)(async (tx: any) => {
        // Overwrites shared fields + translation rows from the copy; an
        // incomplete source translation throws and rolls everything back.
        const result = await overwriteOriginalWithCopy(tx, params.id, existingCopy.id);

        const finalResult = await (tx.blogPost.update as any)({
          where: { id: params.id },
          data: { reviewNote },
        });

        await (tx.blogPost.delete as any)({ where: { id: existingCopy.id } });
        return finalResult ?? result;
      });
    } else {
      // Direct approve path (no copy)

      updated = await (prisma.$transaction as any)(async (tx: any) => {
        const result = await (tx.blogPost.update as any)({
          where: { id: params.id },
          data: {
            status: "PUBLISHED",
            isActive: true,
            publishedAt: blog.publishedAt ?? new Date(),
            reviewNote,
          },
        });
        await syncTranslationsForPost(tx, params.id, { requireCompleteSource: true });
        return result;
      });
    }

    // Fire-and-forget: send approval notification email + in-app notification
    // to the author. This side effect MUST NOT affect the HTTP response —
    // failures are swallowed. Author fetched once and shared by both effects
    // (each keeps its own try/catch so one failing doesn't block the other).
    const authorId = updated.authorId;
    if (authorId) {
      void (async () => {
        const [author, blogTitle] = await Promise.all([
          prisma.user.findUnique({
            where: { id: authorId },
            select: { email: true, name: true, locale: true },
          }),
          sourceTitleForPost(prisma, updated.id),
        ]);
        const locale = author?.locale === "en" ? "en" : "es";

        if (author?.email) {
          try {
            await sendMail({
              to: author.email,
              subject: approvedSubjects[locale],
              content: {
                react: (
                  <BlogApproved
                    tripper={author.name ?? ""}
                    blogTitle={blogTitle}
                    locale={locale}
                  />
                ),
              },
            });
          } catch (err) {
            console.error("[notifications] blog approve sendMail failed:", err);
          }
        }

        try {
          const notifCopy = locale === "en"
            ? { title: "Your article has been approved!", body: `"${blogTitle}" is now live.` }
            : { title: "¡Tu artículo fue aprobado!", body: `"${blogTitle}" ya está publicado.` };
          await prisma.notification.create({
            data: {
              userId: authorId,
              type: "BLOG_APPROVED",
              audience: "TRIPPER",
              isRead: false,
              title: notifCopy.title,
              body: notifCopy.body,
              metadata: { blogId: updated.id },
            },
          });
        } catch (err) {
          console.error("[notification] blog approve emit failed:", err);
        }
      })();
    }

    return NextResponse.json({ blog: updated });
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
    console.error("[admin/blogs/approve] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
