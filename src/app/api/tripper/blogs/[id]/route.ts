import { equalBlogJson } from "@/lib/blog/equal-json";
import { ZodError } from "zod";
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
import { isValidExperienceLevel } from "@/lib/constants/packages";
import { normalizeBlogLabel } from "@/lib/blog/label";
import {
  getForEditor,
  writeTranslationsFromEditor,
} from "@/lib/blog/blogRepository";
import {
  EditorWriteError,
  editorWriteErrorBody,
  parseEditorWriteRequest,
  resolveSourceLocale,
  rowsFromLoadedPost,
  translationsChanged,
} from "@/lib/blog/editor-write";

/** Normalizes an incoming value into a deduped array of non-empty trimmed strings. */
function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const v of value) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (trimmed) seen.add(trimmed);
  }
  return Array.from(seen);
}

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

    // Find blog. Review copies (isReviewCopy: true) share authorId with the
    // original and must never be reachable through the tripper's own edit
    // routes — they only exist on admin review surfaces until resolved.
    const blog = await prisma.blogPost.findFirst({
      where: {
        id: blogId,
        isReviewCopy: false,
      },
      select: {
        id: true,
        authorId: true,
        source: true,
      },
    });

    // Owner may always fetch their own post. An admin may additionally fetch
    // any RANDOMTRIP (admin-owned) post regardless of who created it — never
    // for TRIPPER posts, which stay behind the tripper's own edit routes.
    const isOwner = blog?.authorId === user.id;
    const isAdminOnRandomtrip =
      hasRoleAccess(user, "admin") && blog?.source === "RANDOMTRIP";

    if (!blog || (!isOwner && !isAdminOnRandomtrip)) {
      return NextResponse.json(
        { error: "Blog post not found or access denied" },
        { status: 404 },
      );
    }

    const editor = await getForEditor(blog.id);
    if (!editor) {
      return NextResponse.json(
        { error: "Blog post not found or access denied" },
        { status: 404 },
      );
    }

    return NextResponse.json({ blog: editor });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid blog translations" }, { status: 400 });
    }
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

    // Verify blog exists. Review copies must never be reachable through this
    // route (see GET above).
    const existingBlog = await prisma.blogPost.findFirst({
      where: {
        id: blogId,
        isReviewCopy: false,
      },
      include: { translationRows: true },
    });

    // Owner may always edit their own post. An admin may additionally edit
    // any RANDOMTRIP (admin-owned) post regardless of who created it — same
    // bypass as GET above.
    const isOwner = existingBlog?.authorId === user.id;
    const isAdminOnRandomtrip =
      hasRoleAccess(user, "admin") && existingBlog?.source === "RANDOMTRIP";

    if (!existingBlog || (!isOwner && !isAdminOnRandomtrip)) {
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
    const currentRows = rowsFromLoadedPost(existingBlog);
    const parsed = parseEditorWriteRequest(body, {
      sourceLocale: resolveSourceLocale(existingBlog.sourceLocale),
      rows: currentRows,
    });
    const {
      tags,
      format,
      // status is intentionally NOT destructured for persistence — transitions
      // only happen via the guarded submit/approve/reject/copy endpoints.
      coverUrl,
      travelType,
      excuseKey,
      level,
      label,
      tripperNote,
      isActive,
    } = body;
    const title = parsed.translations?.[parsed.sourceLocale]?.title ?? body.title;

    // Validate required fields
    if (title !== undefined && !title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const levelValue: string | null | undefined =
      level === undefined ? undefined : level && level !== "" ? level : null;
    if (levelValue != null && !isValidExperienceLevel(levelValue)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    const labelValue = normalizeBlogLabel(label);

    // XSED is fulfilled centrally by the admin team — only admins may tag a
    // post with it (mirrors the client-side gate in TitleImageStep and the
    // create-time check in POST /api/tripper/blogs).
    if (levelValue === "xsed" && !hasRoleAccess(user, "admin")) {
      return NextResponse.json(
        { error: "Only admins can set the XSED level" },
        { status: 403 },
      );
    }

    const sourceLocale = parsed.sourceLocale;
    const sourceLocaleChanged = parsed.sourceLocaleChanged;

    // Revert to DRAFT only if a reviewable content field actually changed.
    // Autosave fires on mount even when nothing changed — we must not
    // penalise no-ops, and review-mechanism fields (tripperNote, slug,
    // publishedAt) must never trigger a revert.
    const eq = equalBlogJson;

    const contentChanged =
      (parsed.translations !== undefined &&
        translationsChanged(parsed.translations, currentRows, sourceLocale)) ||
      (coverUrl !== undefined && !eq(coverUrl || null, existingBlog.coverUrl)) ||
      (tags !== undefined && !eq(tags, existingBlog.tags)) ||
      (travelType !== undefined &&
        !eq(normalizeStringArray(travelType), existingBlog.travelType)) ||
      (excuseKey !== undefined &&
        !eq(normalizeStringArray(excuseKey), existingBlog.excuseKey)) ||
      (levelValue !== undefined && !eq(levelValue, existingBlog.level)) ||
      (labelValue !== undefined && !eq(labelValue, existingBlog.label)) ||
      (format !== undefined && !eq(format.toUpperCase?.() ?? format, existingBlog.format));

    // RANDOMTRIP posts skip review entirely (see BlogPost.source), so editing
    // a live one must not silently unpublish it — only TRIPPER posts revert
    // to DRAFT on content change, forcing a re-review. Mirrors the
    // experience PATCH route's identical guard.
    const revertToDraft =
      existingBlog.status === "PUBLISHED" &&
      contentChanged &&
      existingBlog.source === "TRIPPER";

    const updateData: Record<string, unknown> = {};
    if (tags !== undefined) updateData.tags = tags;
    if (travelType !== undefined) {
      updateData.travelType = normalizeStringArray(travelType);
    }
    if (excuseKey !== undefined) {
      updateData.excuseKey = normalizeStringArray(excuseKey);
    }
    if (levelValue !== undefined) updateData.level = levelValue;
    if (labelValue !== undefined) updateData.label = labelValue;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl || null;

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
    if (sourceLocaleChanged) updateData.sourceLocale = sourceLocale;

    // Status is never accepted from the client — transitions only happen via
    // the guarded submit/approve/reject/copy endpoints. The one exception is
    // this auto-revert: editing a PUBLISHED post's content forces re-review.
    // publishedAt is intentionally KEPT (not nulled) — the public PUBLISHED
    // gate already hides it, so history is preserved for the next approve.
    if (revertToDraft) {
      updateData.status = "DRAFT";
      updateData.isActive = false;
    }

    const updatedBlog = await prisma.$transaction(async (tx) => {
      const updated = await tx.blogPost.update({
        where: { id: blogId },
        data: updateData,
        select: {
          id: true,
          authorId: true,
          sourceLocale: true,
          coverUrl: true,
          tags: true,
          travelType: true,
          excuseKey: true,
          level: true,
          label: true,
          format: true,
          status: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
        },
      });
      const written = parsed.translations
        ? await writeTranslationsFromEditor(
            tx,
            {
              id: blogId,
              isReviewCopy: false,
              publishedAt: updated.publishedAt,
              sourceLocale,
            },
            parsed.translations,
          )
        : undefined;
      return written ? { ...updated, translations: written } : updated;
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
    if (error instanceof EditorWriteError) {
      return NextResponse.json(editorWriteErrorBody(error), { status: 400 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid blog translations" }, { status: 400 });
    }
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

    // Find blog. Review copies must never be reachable through this route
    // (see GET above).
    const existingBlog = await prisma.blogPost.findFirst({
      where: {
        id: blogId,
        isReviewCopy: false,
      },
    });

    // Owner may always delete their own post. An admin may additionally
    // delete any RANDOMTRIP (admin-owned) post — same bypass as GET/PATCH.
    const isOwner = existingBlog?.authorId === user.id;
    const isAdminOnRandomtrip =
      hasRoleAccess(user, "admin") && existingBlog?.source === "RANDOMTRIP";

    if (!existingBlog || (!isOwner && !isAdminOnRandomtrip)) {
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

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid blog translations" }, { status: 400 });
    }
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
