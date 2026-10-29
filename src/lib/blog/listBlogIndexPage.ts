import { listPublished } from "@/lib/blog/blogRepository";
import { interleavePostsByAuthor } from "@/lib/blog/interleavePostsByAuthor";
import type { Locale } from "@/lib/i18n/config";
import { normalizeUploadUrl } from "@/lib/media/upload-url";
import type { BlogIndexResponse } from "@/lib/types/BlogIndexPost";
import type { PublicBlogListFilters } from "@/types/blog";

/**
 * One page of the public blog index, shared by `/api/blogs` and the
 * server-rendered `/blog` page so crawlers receive the first page as HTML.
 */
export async function listBlogIndexPage(
  locale: Locale,
  filters: PublicBlogListFilters,
  page: number,
  limit: number,
): Promise<BlogIndexResponse> {
  const skip = (page - 1) * limit;

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

  return {
    blogs: blogs.map((blog) => ({
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
    })),
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + blogs.length < total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
