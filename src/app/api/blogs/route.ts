// ============================================================================
// GET /api/blogs - Get all published blog posts (public, with pagination)
// ============================================================================

import { listPublished } from "@/lib/blog/blogRepository";
import { interleavePostsByAuthor } from "@/lib/blog/interleavePostsByAuthor";
import { normalizeUploadUrl } from "@/lib/media/upload-url";
import { NextRequest, NextResponse } from "next/server";
import { isValidExperienceLevel } from "@/lib/constants/packages";
import type { PublicBlogListFilters } from "@/types/blog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") === "en" ? "en" : "es";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const tripperId = searchParams.get("tripperId");
    const tripperIds = searchParams.get("tripperIds"); // comma-separated
    const level = searchParams.get("level");
    const travelType = searchParams.get("travelType");
    const excuseKey = searchParams.get("excuseKey");
    const skip = (page - 1) * limit;

    // Visibility (PUBLISHED, active, not a review copy) and the locale's
    // complete-translation gate are enforced by the repository.
    const filters: PublicBlogListFilters = {};
    if (tripperId) {
      filters.authorId = tripperId;
    } else if (tripperIds?.trim()) {
      const ids = tripperIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        filters.authorId = ids;
      }
    }

    // "level" is backed by BlogPost.level — independent of travelType (both
    // filters can be applied together; see TitleImageStep).
    if (level?.trim() && isValidExperienceLevel(level.trim())) {
      filters.level = level.trim();
    }
    if (travelType?.trim()) {
      filters.travelType = travelType.trim();
    }

    if (excuseKey?.trim()) {
      filters.excuseKey = excuseKey.trim();
    }

    // Fetch every matching post (no skip/take yet) so consecutive posts from
    // the same tripper can be interleaved with other trippers' posts before
    // paginating — otherwise a prolific tripper's recent posts crowd out
    // everyone else's on page 1.
    const localizedBlogs = await listPublished(locale, filters);

    // Round-robin across trippers, preserving each tripper's internal
    // recency order (their most recent post still comes before their older ones).
    const interleavedBlogs = interleavePostsByAuthor(
      localizedBlogs,
      (blog) => blog.author.id,
    );

    const total = localizedBlogs.length;
    const blogs = interleavedBlogs.slice(skip, skip + limit);

    // Transform to match frontend type (author included via select)
    const transformedBlogs = blogs.map((blog) => ({
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
      slug: blog.slug,
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
