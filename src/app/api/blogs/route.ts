// ============================================================================
// GET /api/blogs - Get all published blog posts (public, with pagination)
// ============================================================================

import { BlogStatus } from "@prisma/client";
import { interleavePostsByAuthor } from "@/lib/blog/interleavePostsByAuthor";
import { normalizeUploadUrl } from "@/lib/media/upload-url";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const tripperId = searchParams.get("tripperId");
    const tripperIds = searchParams.get("tripperIds"); // comma-separated
    const travelType = searchParams.get("travelType");
    const excuseKey = searchParams.get("excuseKey");
    const skip = (page - 1) * limit;

    const where: {
      authorId?: string | { in: string[] };
      excuseKey?: { has: string };
      status: BlogStatus;
      travelType?: { has: string };
      isReviewCopy: boolean;
      isActive: boolean;
    } = {
      status: BlogStatus.PUBLISHED,
      // Review copies (isReviewCopy: true) share authorId with the original
      // and must never leak into public listings.
      isReviewCopy: false,
      // Tripper-unpublished posts stay PUBLISHED (approval history) but must
      // not be publicly visible.
      isActive: true,
    };
    if (tripperId) {
      where.authorId = tripperId;
    } else if (tripperIds?.trim()) {
      const ids = tripperIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        where.authorId = { in: ids };
      }
    }

    if (travelType?.trim()) {
      where.travelType = { has: travelType.trim() };
    }

    if (excuseKey?.trim()) {
      where.excuseKey = { has: excuseKey.trim() };
    }

    // Fetch every matching post (no skip/take yet) so consecutive posts from
    // the same tripper can be interleaved with other trippers' posts before
    // paginating — otherwise a prolific tripper's recent posts crowd out
    // everyone else's on page 1.
    const allBlogs = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        tagline: true,
        coverUrl: true,
        tags: true,
        format: true,
        publishedAt: true,
        travelType: true,
        excuseKey: true,
        author: {
          select: {
            id: true,
            name: true,
            tripperSlug: true,
            avatarUrl: true,
            location: true,
          },
        },
      },
    });

    type BlogWithAuthor = (typeof allBlogs)[number];

    // Round-robin across trippers, preserving each tripper's internal
    // recency order (their most recent post still comes before their older ones).
    const interleavedBlogs = interleavePostsByAuthor(
      allBlogs,
      (blog: BlogWithAuthor) => blog.author.id,
    );

    const total = allBlogs.length;
    const blogs = interleavedBlogs.slice(skip, skip + limit);

    // Transform to match frontend type (author included via select)
    const transformedBlogs = blogs.map((blog: BlogWithAuthor) => ({
      author: {
        avatarUrl: normalizeUploadUrl(blog.author.avatarUrl) ?? "",
        id: blog.author.id,
        location: blog.author.location ?? undefined,
        name: blog.author.name,
        slug: blog.author.tripperSlug ?? "",
      },
      coverUrl: blog.coverUrl,
      excuseKey: blog.excuseKey,
      format: blog.format.toLowerCase(),
      id: blog.id,
      publishedAt: blog.publishedAt?.toISOString(),
      slug: blog.slug ?? blog.id,
      subtitle: blog.subtitle ?? "",
      tagline: blog.tagline ?? "",
      tags: blog.tags,
      title: blog.title,
      travelType: blog.travelType,
    }));

    const hasMore = skip + blogs.length < total;

    return NextResponse.json({
      blogs: transformedBlogs,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
