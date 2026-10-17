import { ZodError } from "zod";
// ============================================================================
// PATCH /api/admin/blogs/[id]/edit-copy
// Saves content edits to a review copy. Admin-only — no ownership check.
// Requires: isReviewCopy === true on the target blog post.
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { isValidExperienceLevel } from "@/lib/constants/packages";
import { normalizeBlogLabel } from "@/lib/blog/label";
import { writeTranslationsFromEditor } from "@/lib/blog/blogRepository";
import {
  EditorWriteError,
  editorWriteErrorBody,
  parseEditorWriteRequest,
  resolveSourceLocale,
  rowsFromLoadedPost,
} from "@/lib/blog/editor-write";
import { prisma } from "@/lib/prisma";

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


    const copy = await (prisma.blogPost.findUnique as any)({
      where: { id: params.id },
      include: { translationRows: true },
    }) as {
      id: string;
      isReviewCopy: boolean;
      status: string;
      sourceLocale?: string | null;
      publishedAt?: Date | string | null;
      translationRows?: Array<{
        locale: string;
        title: string;
        subtitle?: string | null;
        tagline?: string | null;
        content?: string | null;
        blocks?: unknown;
        faq?: unknown;
        seo?: unknown;
        isComplete?: boolean;
      }>;
    } | null;

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
    const currentRows = rowsFromLoadedPost({
      translationRows: copy.translationRows,
    });
    const parsed = parseEditorWriteRequest(body, {
      sourceLocale: resolveSourceLocale(copy.sourceLocale),
      rows: currentRows,
    });
    const {
      coverUrl,
      tags,
      travelType,
      excuseKey,
      level,
      label,
      format,
    } = body;

    const levelValue: string | null | undefined =
      level === undefined ? undefined : level && level !== "" ? level : null;
    if (levelValue != null && !isValidExperienceLevel(levelValue)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }
    const labelValue = normalizeBlogLabel(label);
    // No XSED admin-gate here: this whole route is admin-only already.

    const sourceLocale = parsed.sourceLocale;
    const sourceLocaleChanged = parsed.sourceLocaleChanged;

    const updated = await prisma.$transaction(async (tx) => {
      const written = await (tx.blogPost.update as any)({
      where: { id: params.id },
      data: {
        ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
        ...(tags !== undefined && { tags }),
        ...(travelType !== undefined && { travelType: normalizeStringArray(travelType) }),
        ...(excuseKey !== undefined && { excuseKey: normalizeStringArray(excuseKey) }),
        ...(levelValue !== undefined && { level: levelValue }),
        ...(labelValue !== undefined && { label: labelValue }),
        ...(format !== undefined && { format: format.toUpperCase?.() ?? format }),
        ...(sourceLocaleChanged && { sourceLocale }),
      },
      });
      const rows = parsed.translations
        ? await writeTranslationsFromEditor(
            tx,
            {
              id: params.id,
              isReviewCopy: true,
              publishedAt: copy.publishedAt ?? null,
              sourceLocale,
            },
            parsed.translations,
          )
        : undefined;
      return rows ? { ...written, translations: rows } : written;
    });

    return NextResponse.json({ blog: updated });
  } catch (error) {
    if (error instanceof EditorWriteError) {
      return NextResponse.json(editorWriteErrorBody(error), { status: 400 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid blog translations" }, { status: 400 });
    }
    console.error("[admin/blogs/edit-copy] PATCH", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
