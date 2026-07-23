// ============================================================================
// PATCH /api/admin/blogs/[id]/edit-copy
// Saves content edits to a review copy. Admin-only — no ownership check.
// Requires: isReviewCopy === true on the target blog post.
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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
    const copy = await (prisma.blogPost.findUnique as any)({
      where: { id: params.id },
      select: { id: true, isReviewCopy: true, status: true },
    }) as { id: string; isReviewCopy: boolean; status: string } | null;

    if (!copy) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    if (!copy.isReviewCopy) {
      return NextResponse.json(
        { error: "forbidden", message: "Only review copies can be edited via this endpoint" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      tagline,
      coverUrl,
      content,
      blocks,
      faq,
      tags,
      travelType,
      excuseKey,
      format,
      seo,
    } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.blogPost.update as any)({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle: subtitle || null }),
        ...(tagline !== undefined && { tagline: tagline || null }),
        ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
        ...(content !== undefined && { content: content ?? null }),
        ...(blocks !== undefined && { blocks }),
        ...(faq !== undefined && { faq: faq ?? null }),
        ...(tags !== undefined && { tags }),
        ...(travelType !== undefined && {
          travelType:
            typeof travelType === "string" && travelType.trim() ? travelType.trim() : null,
        }),
        ...(excuseKey !== undefined && {
          excuseKey: typeof excuseKey === "string" && excuseKey.trim() ? excuseKey.trim() : null,
        }),
        ...(format !== undefined && { format: format.toUpperCase?.() ?? format }),
        ...(seo !== undefined && { seo: seo || null }),
        // slug is intentionally never written here — copies have no public slug.
      },
    });

    return NextResponse.json({ blog: updated });
  } catch (error) {
    console.error("[admin/blogs/edit-copy] PATCH", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
