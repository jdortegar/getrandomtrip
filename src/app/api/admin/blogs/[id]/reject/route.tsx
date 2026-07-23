// ============================================================================
// POST /api/admin/blogs/[id]/reject
// Transitions a PENDING_REVIEW blog post back to DRAFT, saves reviewNote.
// Auth: admin role only
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/helpers/sendMail";
import BlogRejected, { subjects as rejectedSubjects } from "@/emails/BlogRejected";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blog = await (prisma.blogPost.findUnique as any)({
      where: { id: params.id },
      select: { id: true, status: true },
    }) as { id: string; status: string } | null;

    if (!blog) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    if (blog.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "invalid_state", message: "Blog post must be in PENDING_REVIEW status to reject" },
        { status: 409 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as { reviewNote?: unknown };
    const reviewNote =
      typeof body.reviewNote === "string" ? body.reviewNote.trim() : "";

    if (!reviewNote) {
      return NextResponse.json(
        { error: "note_required", message: "reviewNote is required and must be non-empty" },
        { status: 422 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.blogPost.update as any)({
      where: { id: params.id },
      data: { status: "DRAFT", isActive: false, reviewNote },
    }) as { id: string; status: string; authorId: string; title: string };

    // Fire-and-forget: send rejection notification email + in-app notification
    // to the author. This side effect MUST NOT affect the HTTP response —
    // failures are swallowed. Author fetched once and shared by both effects
    // (each keeps its own try/catch so one failing doesn't block the other).
    const authorId = updated.authorId;
    if (authorId) {
      void (async () => {
        const author = await prisma.user.findUnique({
          where: { id: authorId },
          select: { email: true, name: true, locale: true },
        });
        const locale = author?.locale === "en" ? "en" : "es";

        if (author?.email) {
          try {
            await sendMail({
              to: author.email,
              subject: rejectedSubjects[locale],
              content: {
                react: (
                  <BlogRejected
                    tripper={author.name ?? ""}
                    blogTitle={updated.title ?? ""}
                    reviewNote={reviewNote}
                    locale={locale}
                  />
                ),
              },
            });
          } catch (err) {
            console.error("[notifications] blog reject sendMail failed:", err);
          }
        }

        try {
          const notifCopy = locale === "en"
            ? { title: "Your article needs revisions.", body: reviewNote ? `Reviewer note: ${reviewNote}` : undefined }
            : { title: "Tu artículo necesita revisiones.", body: reviewNote ? `Nota del revisor: ${reviewNote}` : undefined };
          await prisma.notification.create({
            data: {
              userId: authorId,
              type: "BLOG_REJECTED",
              audience: "TRIPPER",
              isRead: false,
              title: notifCopy.title,
              body: notifCopy.body ?? null,
              metadata: { blogId: updated.id },
            },
          });
        } catch (err) {
          console.error("[notification] blog reject emit failed:", err);
        }
      })();
    }

    return NextResponse.json({ blog: updated });
  } catch (error) {
    console.error("[admin/blogs/reject] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
