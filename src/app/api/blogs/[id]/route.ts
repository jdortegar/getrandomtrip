// ============================================================================
// GET /api/blogs/[id] - Get a single published blog post by ID or slug (public)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { findPublishedBySlug } from "@/lib/blog/blogRepository";
import { normalizeUploadUrl } from "@/lib/media/upload-url";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const idOrSlug = params.id;
    const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "es";

    // Retired / other-locale slugs and legacy ids resolve to the locale's
    // canonical slug; follow that once and return the canonical post.
    let lookup = await findPublishedBySlug(locale, idOrSlug);
    if (lookup.kind === "redirect")
      lookup = await findPublishedBySlug(locale, lookup.slug);
    if (lookup.kind !== "found") {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }
    const blog = lookup.post;

    const transformedBlog = {
      id: blog.id,
      slug: blog.slug,
      title: blog.title,
      subtitle: blog.subtitle ?? "",
      tagline: blog.tagline ?? "",
      coverUrl: blog.coverUrl,
      content: blog.content ?? "",
      blocks: blog.blocks,
      faq: blog.faq as
        | { items?: { question: string; answer: string }[] }
        | { question: string; answer: string }[]
        | null,
      tags: blog.tags,
      format: blog.format.toLowerCase(),
      seo: blog.seo,
      publishedAt: blog.publishedAt?.toISOString(),
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      author: {
        bio: blog.author.bio ?? "",
        id: blog.author.id,
        location: blog.author.location ?? "",
        motto: blog.author.motto ?? null,
        name: blog.author.name,
        slug: blog.author.tripperSlug ?? "",
        specialization: blog.author.specialization ?? null,
        avatarUrl: normalizeUploadUrl(blog.author.avatarUrl) ?? "",
      },
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
