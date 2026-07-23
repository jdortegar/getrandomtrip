// ============================================================================
// GET /api/tripper/blogs/[id] - Get a single blog post by ID for tripper
// PATCH /api/tripper/blogs/[id] - Update a blog post by ID for tripper
// DELETE /api/tripper/blogs/[id] - Delete a blog post by ID for tripper
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and verify they are a tripper
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

    const blogId = params.id;

    // Find blog and verify ownership. Review copies (isReviewCopy: true)
    // share authorId with the original and must never be reachable through
    // the tripper's own edit routes — they only exist on admin review
    // surfaces until resolved.
    const blog = await prisma.blogPost.findFirst({
      where: {
        id: blogId,
        authorId: user.id,
        isReviewCopy: false,
      },
      select: {
        id: true,
        authorId: true,
        title: true,
        subtitle: true,
        tagline: true,
        coverUrl: true,
        content: true,
        blocks: true,
        faq: true,
        tags: true,
        travelType: true,
        excuseKey: true,
        format: true,
        status: true,
        isActive: true,
        seo: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            tripperSlug: true,
            avatarUrl: true,
            bio: true,
            location: true,
            motto: true,
            specialization: true,
          },
        },
      },
    });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog post not found or access denied" },
        { status: 404 },
      );
    }

    // Transform to match frontend type
    const transformedBlog = {
      ...blog,
      status: blog.status.toLowerCase(),
      format: blog.format.toLowerCase(),
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      publishedAt: blog.publishedAt?.toISOString(),
    };

    return NextResponse.json({ blog: transformedBlog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and verify they are a tripper
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

    const blogId = params.id;

    // Verify blog exists and belongs to user. Review copies must never be
    // reachable through this route (see GET above).
    const existingBlog = await prisma.blogPost.findFirst({
      where: {
        id: blogId,
        authorId: user.id,
        isReviewCopy: false,
      },
    });

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog post not found or access denied" },
        { status: 404 },
      );
    }

    // Guard: cannot edit a blog post while a decision is pending — either the
    // admin is reviewing the tripper's submission (PENDING_REVIEW) or the
    // admin's proposed copy is awaiting the tripper's decision
    // (PENDING_TRIPPER_REVIEW). The client-side isReadOnly lock in
    // NewBlogPostShell is UI-only; this is the real boundary.
    if (
      (existingBlog.status as string) === "PENDING_REVIEW" ||
      (existingBlog.status as string) === "PENDING_TRIPPER_REVIEW"
    ) {
      return NextResponse.json(
        {
          error: "locked_for_review",
          message: "Blog post cannot be edited while a review decision is pending.",
        },
        { status: 409 },
      );
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      tagline,
      content,
      blocks,
      faq,
      tags,
      format,
      // status is intentionally NOT destructured for persistence — transitions
      // only happen via the guarded submit/approve/reject/copy endpoints.
      coverUrl,
      seo,
      travelType,
      excuseKey,
      tripperNote,
      isActive,
    } = body;

    // Validate required fields
    if (title !== undefined && !title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Revert to DRAFT only if a reviewable content field actually changed.
    // Autosave fires on mount even when nothing changed — we must not
    // penalise no-ops, and review-mechanism fields (tripperNote, slug,
    // publishedAt) must never trigger a revert.
    const eq = (a: unknown, b: unknown) =>
      JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

    const contentChanged =
      (title !== undefined && !eq(title, existingBlog.title)) ||
      (subtitle !== undefined && !eq(subtitle || null, existingBlog.subtitle)) ||
      (tagline !== undefined && !eq(tagline || null, existingBlog.tagline)) ||
      (coverUrl !== undefined && !eq(coverUrl || null, existingBlog.coverUrl)) ||
      (content !== undefined && !eq(content ?? null, existingBlog.content)) ||
      (blocks !== undefined && !eq(blocks, existingBlog.blocks)) ||
      (tags !== undefined && !eq(tags, existingBlog.tags)) ||
      (travelType !== undefined &&
        !eq(
          typeof travelType === "string" && travelType.trim() ? travelType.trim() : null,
          existingBlog.travelType,
        )) ||
      (excuseKey !== undefined &&
        !eq(
          typeof excuseKey === "string" && excuseKey.trim() ? excuseKey.trim() : null,
          existingBlog.excuseKey,
        )) ||
      (format !== undefined && !eq(format.toUpperCase?.() ?? format, existingBlog.format)) ||
      (seo !== undefined && !eq(seo || null, existingBlog.seo)) ||
      (faq !== undefined && !eq(faq ?? null, existingBlog.faq));

    const revertToDraft = existingBlog.status === "PUBLISHED" && contentChanged;

    // Convert string enums to uppercase for Prisma
    const { slugify } = await import("@/lib/helpers/slugify");
    const updateData: any = {};
    if (title !== undefined) {
      updateData.title = title;
      const baseSlug = slugify(title) || "post";
      let slug = baseSlug;
      let suffix = 0;
      while (true) {
        const existing = await prisma.blogPost.findFirst({
          where: { slug, id: { not: blogId } },
        });
        if (!existing) break;
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }
      updateData.slug = slug;
    }
    if (subtitle !== undefined) updateData.subtitle = subtitle || null;
    if (tagline !== undefined) updateData.tagline = tagline || null;
    if (content !== undefined) updateData.content = content ?? null;
    if (blocks !== undefined) updateData.blocks = blocks;
    if (faq !== undefined) updateData.faq = faq ?? null;
    if (tags !== undefined) updateData.tags = tags;
    if (travelType !== undefined) {
      updateData.travelType =
        typeof travelType === "string" && travelType.trim().length > 0
          ? travelType.trim()
          : null;
    }
    if (excuseKey !== undefined) {
      updateData.excuseKey =
        typeof excuseKey === "string" && excuseKey.trim().length > 0
          ? excuseKey.trim()
          : null;
    }
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl || null;
    if (seo !== undefined) updateData.seo = seo || null;

    if (format !== undefined) {
      const formatMap: Record<string, "ARTICLE" | "PHOTO" | "VIDEO" | "MIXED"> =
        {
          article: "ARTICLE",
          photo: "PHOTO",
          video: "VIDEO",
          mixed: "MIXED",
        };
      updateData.format = formatMap[format.toLowerCase()] || "ARTICLE";
    }

    if (tripperNote !== undefined) updateData.tripperNote = tripperNote || null;

    // Visibility toggle, decoupled from status — mirrors Experience.isActive.
    // Publishing/unpublishing an already-approved post never touches status
    // or triggers re-review.
    if (isActive !== undefined) updateData.isActive = isActive;

    // Status is never accepted from the client — transitions only happen via
    // the guarded submit/approve/reject/copy endpoints. The one exception is
    // this auto-revert: editing a PUBLISHED post's content forces re-review.
    // publishedAt is intentionally KEPT (not nulled) — the public PUBLISHED
    // gate already hides it, so history is preserved for the next approve.
    if (revertToDraft) {
      updateData.status = "DRAFT";
      updateData.isActive = false;
    }

    // Update blog in database
    const updatedBlog = await prisma.blogPost.update({
      where: { id: blogId },
      data: updateData,
      select: {
        id: true,
        authorId: true,
        title: true,
        subtitle: true,
        tagline: true,
        coverUrl: true,
        content: true,
        blocks: true,
        faq: true,
        tags: true,
        travelType: true,
        excuseKey: true,
        format: true,
        status: true,
        isActive: true,
        seo: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
      },
    });

    // Transform to match frontend type
    const transformedBlog = {
      ...updatedBlog,
      status: updatedBlog.status.toLowerCase(),
      format: updatedBlog.format.toLowerCase(),
      createdAt: updatedBlog.createdAt.toISOString(),
      updatedAt: updatedBlog.updatedAt.toISOString(),
      publishedAt: updatedBlog.publishedAt?.toISOString(),
    };

    return NextResponse.json({ blog: transformedBlog });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and verify they are a tripper
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

    const blogId = params.id;

    // Find blog and verify ownership. Review copies must never be reachable
    // through this route (see GET above).
    const existingBlog = await prisma.blogPost.findFirst({
      where: {
        id: blogId,
        authorId: user.id,
        isReviewCopy: false,
      },
    });

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog post not found or access denied" },
        { status: 404 },
      );
    }

    // Guard: cannot delete while a review copy may exist for this post —
    // deleting the original would orphan it (parentId is a bare string, no
    // FK/cascade) with no cleanup path.
    if (
      (existingBlog.status as string) === "PENDING_REVIEW" ||
      (existingBlog.status as string) === "PENDING_TRIPPER_REVIEW"
    ) {
      return NextResponse.json(
        {
          error: "locked_for_review",
          message: "Blog post cannot be deleted while a review decision is pending.",
        },
        { status: 409 },
      );
    }

    // Delete blog from database
    await prisma.blogPost.delete({
      where: { id: blogId },
    });

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
