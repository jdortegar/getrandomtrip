import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  BlogBlock,
  BlogLocaleSlugs,
  BlogPost,
  ContentLocale,
  PublicBlogListFilters,
  PublicBlogLookup,
  PublicBlogPost,
  PublicBlogSummary,
} from "@/types/blog";
import { CONTENT_LOCALES, isContentLocale } from "./locales";

// The only module that reads `blog_post_translations` / `blog_post_slug_history`.
// A locale is public iff the post is PUBLISHED, active, not a review copy, and
// its translation in that locale is complete. No cross-locale fallback.

const PUBLIC_POST_WHERE = {
  status: "PUBLISHED",
  isActive: true,
  isReviewCopy: false,
} satisfies Prisma.BlogPostWhereInput;

/** CUIDs start with 'c' and are 25 chars; slugs are lowercase with dashes. */
function isCuid(param: string): boolean {
  return param.length === 25 && /^c[a-z0-9]+$/.test(param);
}

const POST_SELECT = {
  id: true,
  authorId: true,
  coverUrl: true,
  tags: true,
  travelType: true,
  excuseKey: true,
  level: true,
  label: true,
  format: true,
  source: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
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
  translationRows: {
    where: { isComplete: true },
    select: { locale: true, slug: true },
  },
} satisfies Prisma.BlogPostSelect;

const SUMMARY_SELECT = {
  locale: true,
  slug: true,
  title: true,
  subtitle: true,
  tagline: true,
  post: { select: POST_SELECT },
} satisfies Prisma.BlogPostTranslationSelect;

const DETAIL_SELECT = {
  ...SUMMARY_SELECT,
  content: true,
  blocks: true,
  faq: true,
  seo: true,
} satisfies Prisma.BlogPostTranslationSelect;

type SummaryRow = Prisma.BlogPostTranslationGetPayload<{
  select: typeof SUMMARY_SELECT;
}>;
type DetailRow = Prisma.BlogPostTranslationGetPayload<{
  select: typeof DETAIL_SELECT;
}>;

interface LocaleSlugRow {
  locale: string;
  slug: string | null;
}

function toLocaleSlugs(rows: LocaleSlugRow[], postId: string): BlogLocaleSlugs {
  const slugs: BlogLocaleSlugs = {};
  for (const locale of CONTENT_LOCALES) {
    const row = rows.find((candidate) => candidate.locale === locale);
    if (row) slugs[locale] = row.slug ?? postId;
  }
  return slugs;
}

function localesOf(slugs: BlogLocaleSlugs): ContentLocale[] {
  return CONTENT_LOCALES.filter((locale) => slugs[locale] !== undefined);
}

function toSummary(row: SummaryRow): PublicBlogSummary {
  const { post } = row;
  const localeSlugs = toLocaleSlugs(post.translationRows, post.id);
  return {
    id: post.id,
    authorId: post.authorId,
    slug: row.slug ?? post.id,
    locale: isContentLocale(row.locale) ? row.locale : CONTENT_LOCALES[0],
    availableLocales: localesOf(localeSlugs),
    localeSlugs,
    title: row.title,
    subtitle: row.subtitle,
    tagline: row.tagline,
    coverUrl: post.coverUrl,
    tags: post.tags,
    travelType: post.travelType,
    excuseKey: post.excuseKey,
    level: post.level,
    label: post.label,
    format: post.format,
    source: post.source,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author,
  };
}

function toDetail(row: DetailRow): PublicBlogPost {
  return {
    ...toSummary(row),
    content: row.content,
    blocks: Array.isArray(row.blocks)
      ? (row.blocks as unknown as BlogBlock[])
      : undefined,
    faq: row.faq,
    seo: (row.seo as BlogPost["seo"] | null) ?? null,
  };
}

/** Public slug of `postId` in `locale`, or null when that locale is not public. */
async function publicSlugFor(
  postId: string,
  locale: ContentLocale,
): Promise<string | null> {
  const row = await prisma.blogPostTranslation.findFirst({
    where: { postId, locale, isComplete: true, post: PUBLIC_POST_WHERE },
    select: { slug: true },
  });
  if (!row) return null;
  return row.slug ?? postId;
}

async function redirectTo(
  postId: string,
  locale: ContentLocale,
  param: string,
): Promise<PublicBlogLookup> {
  const slug = await publicSlugFor(postId, locale);
  return slug && slug !== param
    ? { kind: "redirect", slug }
    : { kind: "not_found" };
}

/** Resolves a public blog URL param in `locale`: a live slug, a retired slug
 * (301), another locale's slug (301 only when translated), or a legacy id. */
export async function findPublishedBySlug(
  locale: ContentLocale,
  param: string,
): Promise<PublicBlogLookup> {
  const live = await prisma.blogPostTranslation.findFirst({
    where: {
      locale,
      slug: param,
      isComplete: true,
      post: PUBLIC_POST_WHERE,
    },
    select: DETAIL_SELECT,
  });
  if (live) return { kind: "found", post: toDetail(live) };

  const retired = await prisma.blogPostSlugHistory.findFirst({
    where: { locale, slug: param },
    select: { translation: { select: { postId: true } } },
  });
  if (retired) return redirectTo(retired.translation.postId, locale, param);

  const otherLive = await prisma.blogPostTranslation.findFirst({
    where: { locale: { not: locale }, slug: param },
    select: { postId: true },
  });
  if (otherLive) return redirectTo(otherLive.postId, locale, param);

  const otherRetired = await prisma.blogPostSlugHistory.findFirst({
    where: { locale: { not: locale }, slug: param },
    select: { translation: { select: { postId: true } } },
  });
  if (otherRetired)
    return redirectTo(otherRetired.translation.postId, locale, param);

  if (isCuid(param)) {
    const byId = await prisma.blogPostTranslation.findFirst({
      where: {
        postId: param,
        locale,
        isComplete: true,
        post: PUBLIC_POST_WHERE,
      },
      select: DETAIL_SELECT,
    });
    if (!byId) return { kind: "not_found" };
    return byId.slug
      ? { kind: "redirect", slug: byId.slug }
      : { kind: "found", post: toDetail(byId) };
  }

  return { kind: "not_found" };
}

/** Public posts with a complete translation in `locale`, newest first. */
export async function listPublished(
  locale: ContentLocale,
  filters: PublicBlogListFilters = {},
): Promise<PublicBlogSummary[]> {
  const post: Prisma.BlogPostWhereInput = { ...PUBLIC_POST_WHERE };
  if (Array.isArray(filters.authorId)) post.authorId = { in: filters.authorId };
  else if (filters.authorId) post.authorId = filters.authorId;
  if (filters.level) post.level = filters.level;
  if (filters.travelType) post.travelType = { has: filters.travelType };
  if (filters.excuseKey) post.excuseKey = { has: filters.excuseKey };
  if (filters.requireCover) post.coverUrl = { not: null };

  const search = filters.search?.trim();
  const rows = await prisma.blogPostTranslation.findMany({
    where: {
      locale,
      isComplete: true,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      post,
    },
    orderBy: { post: { [filters.orderBy ?? "publishedAt"]: "desc" } },
    ...(typeof filters.take === "number" ? { take: filters.take } : {}),
    select: SUMMARY_SELECT,
  });
  return rows.map(toSummary);
}

/** Locales with a complete translation, from loaded rows or by public post id. */
export async function availableLocales(
  post: string | { translationRows: LocaleSlugRow[] },
): Promise<ContentLocale[]> {
  if (typeof post !== "string")
    return localesOf(toLocaleSlugs(post.translationRows, ""));
  const rows = await prisma.blogPostTranslation.findMany({
    where: { postId: post, isComplete: true, post: PUBLIC_POST_WHERE },
    select: { locale: true, slug: true },
  });
  return localesOf(toLocaleSlugs(rows, post));
}

/** Every public post's complete locale slugs (sitemap / hreflang). */
export async function listPublishedLocaleSlugs(): Promise<
  { id: string; updatedAt: Date; localeSlugs: BlogLocaleSlugs }[]
> {
  const posts = await prisma.blogPost.findMany({
    where: PUBLIC_POST_WHERE,
    select: {
      id: true,
      updatedAt: true,
      translationRows: {
        where: { isComplete: true },
        select: { locale: true, slug: true },
      },
    },
  });
  return posts.flatMap((post) => {
    const localeSlugs = toLocaleSlugs(post.translationRows, post.id);
    return localesOf(localeSlugs).length
      ? [{ id: post.id, updatedAt: post.updatedAt, localeSlugs }]
      : [];
  });
}
