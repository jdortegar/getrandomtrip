import { cache } from "react";
import { buildAlternates } from "@/lib/seo/urls";
import { blogLocalePaths } from "@/lib/seo/blogLocales";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import { findPublishedBySlug } from "@/lib/blog/blogRepository";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { normalizeUploadUrl } from "@/lib/media/upload-url";
import { hasLocale } from "@/lib/i18n/config";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBlogPostingSchema } from "@/lib/seo/schemas";
import BlogPostClient, {
  type BlogPost,
  BlogPostLoading,
} from "@/components/app/blog/BlogPostClient";
import { getTravelerStoryArticle } from "@/lib/blog/travelerStories";
import type { BlogLocaleSlugs } from "@/types/blog";

type BlogPageData = BlogPost & {
  availableLocales: Locale[];
  /** Per-locale paths for hreflang; absent when every locale shares `slug`. */
  localePaths?: Partial<Record<Locale, string>>;
};

function travelerStoryPost(
  slug: string,
  locale: string,
): BlogPageData | null {
  const story = getTravelerStoryArticle(slug, locale);
  if (!story) return null;

  return {
    author: {
      avatarUrl: "",
      bio: "",
      id: "",
      location: "",
      motto: null,
      name: "Randomtrip",
      slug: "",
      specialization: null,
    },
    availableLocales: story.availableLocales,
    blocks: [],
    content: story.content,
    coverUrl: story.coverUrl,
    createdAt: story.createdAt,
    faq: null,
    format: "article",
    id: story.id,
    publishedAt: story.publishedAt,
    seo: {
      description: story.subtitle,
      title: `${story.title} | Randomtrip`,
    },
    slug: story.slug,
    source: "RANDOMTRIP",
    subtitle: story.subtitle,
    tagline: "",
    tags: story.tags,
    title: story.title,
    travelType: [story.travelType],
    updatedAt: story.updatedAt,
  };
}

const lookupBlogPost = cache(
  async (
    slugOrId: string,
    locale: Locale,
  ): Promise<{ kind: "redirect"; slug: string } | BlogPageData | null> => {
    const lookup = await findPublishedBySlug(locale, slugOrId);
    if (lookup.kind === "redirect") return lookup;
    if (lookup.kind === "not_found") return travelerStoryPost(slugOrId, locale);
    const blog = lookup.post;

    return {
      availableLocales: blog.availableLocales,
      localePaths: blogLocalePaths(blog.localeSlugs),
      id: blog.id,
      slug: blog.slug,
      title: blog.title,
      subtitle: blog.subtitle ?? "",
      tagline: blog.tagline ?? "",
      coverUrl: blog.coverUrl,
      content: blog.content ?? "",
      blocks: blog.blocks as BlogPost["blocks"],
      faq: blog.faq as BlogPost["faq"],
      tags: blog.tags,
      travelType: blog.travelType,
      format: blog.format.toLowerCase(),
      source: blog.source,
      seo: blog.seo ?? undefined,
      publishedAt: blog.publishedAt?.toISOString() ?? null,
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
  },
);

/** 301s retired, other-locale and legacy-id params to the locale's slug;
 * 404s posts that are not public in this locale (no cross-locale fallback). */
async function getBlogPost(slugOrId: string, locale: Locale): Promise<BlogPageData> {
  const result = await lookupBlogPost(slugOrId, locale);
  if (!result) notFound();
  if ("kind" in result)
    permanentRedirect(pathForLocale(locale, `/blog/${result.slug}`));
  return result;
}

export async function generateMetadata(props: {
  params: Promise<{ locale?: string; slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale! : "es";
  const blog = await getBlogPost(params.slug, locale);

  const seoTitle = blog.seo?.title ?? `${blog.title} | Randomtrip`;
  const seoDescription = blog.seo?.description ?? blog.subtitle ?? undefined;

  return {
    alternates: buildAlternates(
      locale,
      blog.localePaths ?? `/blog/${blog.slug}`,
      blog.availableLocales,
    ),
    description: seoDescription,
    openGraph: {
      description: seoDescription,
      images: blog.coverUrl ? [{ url: blog.coverUrl }] : undefined,
      title: seoTitle,
      type: "article",
    },
    title: seoTitle,
  };
}

export default async function BlogDetailPage(props: {
  params: Promise<{ locale?: string; slug: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale! : "es";
  const blog = await getBlogPost(params.slug, locale);

  const jsonLdSchema = buildBlogPostingSchema({
    authorName: blog.author.name,
    locale,
    createdAt: blog.createdAt,
    description: blog.seo?.description ?? blog.subtitle ?? undefined,
    heroImage: blog.coverUrl ?? undefined,
    publishedAt: blog.publishedAt ?? undefined,
    slug: blog.slug,
    title: blog.title,
    updatedAt: blog.updatedAt,
  });

  return (
    <>
      <JsonLd schema={jsonLdSchema} />
      <Suspense fallback={<BlogPostLoading />}>
        <BlogPostClient blog={blog} locale={locale} />
      </Suspense>
    </>
  );
}
