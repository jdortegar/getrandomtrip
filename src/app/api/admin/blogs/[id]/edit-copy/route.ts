import { ZodError } from "zod";
import { normalizeBlogTranslations } from "@/lib/blog/content-locale";
import { Prisma } from "@prisma/client";
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
import { syncTranslationsFromLegacy } from "@/lib/blog/blogRepository";
import {
  isLegacyLocaleComplete,
  resolveSourceLocale,
} from "@/lib/blog/legacy-translation-mapping";
import { contentLocaleSchema } from "@/lib/blog/locales";
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
      select: {
        id: true,
        isReviewCopy: true,
        status: true,
        sourceLocale: true,
        title: true,
        content: true,
        blocks: true,
        translations: true,
      },
    }) as {
      id: string;
      isReviewCopy: boolean;
      status: string;
      sourceLocale?: string | null;
      title?: string;
      content?: string | null;
      blocks?: unknown;
      translations?: unknown;
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
    const translations = normalizeBlogTranslations(body.translations);
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
      level,
      label,
      format,
      seo,
    } = body;

    const levelValue: string | null | undefined =
      level === undefined ? undefined : level && level !== "" ? level : null;
    if (levelValue != null && !isValidExperienceLevel(levelValue)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }
    const labelValue = normalizeBlogLabel(label);
    // No XSED admin-gate here: this whole route is admin-only already.

    // sourceLocale may only change to a locale whose translation is complete
    // once this request is applied (same rule as the tripper PATCH).
    const sourceLocaleInput = contentLocaleSchema.optional().safeParse(body.sourceLocale);
    if (!sourceLocaleInput.success) {
      return NextResponse.json(
        { error: "invalid_source_locale", message: "Unsupported source locale." },
        { status: 400 },
      );
    }
    const sourceLocale = sourceLocaleInput.data;
    const sourceLocaleChanged =
      sourceLocale !== undefined &&
      sourceLocale !== resolveSourceLocale(copy.sourceLocale);
    if (
      sourceLocaleChanged &&
      !isLegacyLocaleComplete(
        {
          title: title ?? copy.title ?? "",
          content: content !== undefined ? (content ?? null) : copy.content,
          blocks: blocks !== undefined ? blocks : copy.blocks,
          translations: translations !== undefined ? translations : copy.translations,
        },
        sourceLocale,
      )
    ) {
      return NextResponse.json(
        {
          error: "source_locale_incomplete",
          locale: sourceLocale,
          message: "The source locale must have a complete translation.",
        },
        { status: 400 },
      );
    }

    // Dual-write: the copy's legacy columns + its translation rows (slug null)
    // in one transaction so they never diverge.
    const updated = await prisma.$transaction(async (tx) => {
      const written = await (tx.blogPost.update as any)({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle: subtitle || null }),
        ...(tagline !== undefined && { tagline: tagline || null }),
        ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
        ...(content !== undefined && { content: content ?? null }),
        ...(blocks !== undefined && { blocks }),
        ...(translations !== undefined && { translations: translations === null ? Prisma.DbNull : translations as Prisma.InputJsonValue }),
        ...(faq !== undefined && { faq: faq ?? null }),
        ...(tags !== undefined && { tags }),
        ...(travelType !== undefined && { travelType: normalizeStringArray(travelType) }),
        ...(excuseKey !== undefined && { excuseKey: normalizeStringArray(excuseKey) }),
        ...(levelValue !== undefined && { level: levelValue }),
        ...(labelValue !== undefined && { label: labelValue }),
        ...(format !== undefined && { format: format.toUpperCase?.() ?? format }),
        ...(seo !== undefined && { seo: seo || null }),
        ...(sourceLocaleChanged && { sourceLocale }),
        // slug is intentionally never written here — copies have no public slug.
      },
      });
      await syncTranslationsFromLegacy(tx, written);
      return written;
    });

    return NextResponse.json({ blog: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid blog translations" }, { status: 400 });
    }
    console.error("[admin/blogs/edit-copy] PATCH", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
