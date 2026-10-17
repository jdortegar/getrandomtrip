import { Prisma } from "@prisma/client";
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
import {
  LEGACY_MAPPED_LOCALES,
  assertLegacySourceComplete,
  legacyEnglishTranslation,
  legacySpanishTranslation,
  type LegacyBlogContent,
  type TranslationRowData,
} from "./legacy-translation-mapping";
import {
  resolveUniqueSlug,
  shouldRegenerateSlug,
  slugForTitle,
  type RegenerateSlugInput,
} from "./translation-slug";

// The only module that reads or writes `blog_post_translations` /
// `blog_post_slug_history`.
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

// ── Writes (dual-write from the legacy columns until the editor sends rows) ──

/** The post as just written: legacy content plus the fields slug rules need. */
export interface LegacyBlogSnapshot extends LegacyBlogContent {
  id: string;
  publishedAt: Date | string | null;
  isReviewCopy: boolean;
  status?: string;
  sourceLocale?: string | null;
}

export interface SyncTranslationsOptions {
  /** Explicit per-locale slug regeneration for already-published posts. */
  regenerateSlug?: RegenerateSlugInput;
}

interface CurrentRow {
  id: string;
  locale: string;
  title: string;
  slug: string | null;
}

interface SlugPlan {
  slug: string | null;
  /** Slug retired by this write; recorded in history for 301s. */
  retired?: string;
}

/** Json columns: SQL NULL for absent values. */
function jsonInput(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value === null || value === undefined
    ? Prisma.DbNull
    : (value as Prisma.InputJsonValue);
}

/** First free slug for `title` in `locale`, never colliding with another
 * translation's live slug or any retired slug in that locale. */
async function uniqueSlugFor(
  tx: Prisma.TransactionClient,
  locale: string,
  title: string,
  ownId?: string,
): Promise<string> {
  return resolveUniqueSlug(slugForTitle(title), async (candidate) => {
    const [live, retired] = await Promise.all([
      tx.blogPostTranslation.findFirst({
        where: {
          locale,
          slug: candidate,
          ...(ownId ? { id: { not: ownId } } : {}),
        },
        select: { id: true },
      }),
      tx.blogPostSlugHistory.findFirst({
        where: { locale, slug: candidate },
        select: { id: true },
      }),
    ]);
    return !!live || !!retired;
  });
}

/** Slug rules: review copies → null; new rows → from the title; unpublished
 * rows follow the title (no history); published rows are frozen unless an
 * explicit regenerate is requested, which retires the old slug. */
async function planSlug(
  tx: Prisma.TransactionClient,
  post: LegacyBlogSnapshot,
  locale: string,
  title: string,
  current: CurrentRow | undefined,
  explicitRegenerate: boolean,
): Promise<SlugPlan> {
  if (post.isReviewCopy) return { slug: null };
  if (!current?.slug)
    return { slug: await uniqueSlugFor(tx, locale, title, current?.id) };

  const published = !!post.publishedAt;
  const titleChanged = current.title !== title;
  const regenerate =
    shouldRegenerateSlug({ publishedAt: post.publishedAt, explicitRegenerate }) &&
    (explicitRegenerate || titleChanged);
  if (!regenerate) return { slug: current.slug };

  const slug = await uniqueSlugFor(tx, locale, title, current.id);
  // No history before first publish: the old slug was never a public URL.
  return published && slug !== current.slug
    ? { slug, retired: current.slug }
    : { slug };
}

function rowContent(data: TranslationRowData) {
  return {
    title: data.title,
    subtitle: data.subtitle,
    tagline: data.tagline,
    content: data.content,
    blocks: jsonInput(data.blocks),
    faq: jsonInput(data.faq),
    seo: jsonInput(data.seo),
    isComplete: data.isComplete,
  };
}

/** Mirrors the legacy columns (es) and `translations.en` (en) into translation
 * rows inside the caller's transaction: upserts present locales, deletes `en`
 * when legacy English was cleared (invalid legacy JSON leaves it untouched),
 * recomputes `isComplete`, and applies the slug rules. */
export async function syncTranslationsFromLegacy(
  tx: Prisma.TransactionClient,
  post: LegacyBlogSnapshot,
  options: SyncTranslationsOptions = {},
): Promise<void> {
  const english = legacyEnglishTranslation(post);
  const byLocale: Partial<Record<string, TranslationRowData>> = {
    es: legacySpanishTranslation(post),
    ...(english.kind === "valid" ? { en: english.data } : {}),
  };
  const currentRows: CurrentRow[] = await tx.blogPostTranslation.findMany({
    where: { postId: post.id },
    select: { id: true, locale: true, title: true, slug: true },
  });

  const cleared = LEGACY_MAPPED_LOCALES.filter(
    (locale) =>
      !byLocale[locale] &&
      !(locale === "en" && english.kind === "invalid") &&
      currentRows.some((row) => row.locale === locale),
  );
  if (cleared.length)
    await tx.blogPostTranslation.deleteMany({
      where: { postId: post.id, locale: { in: [...cleared] } },
    });

  for (const locale of LEGACY_MAPPED_LOCALES) {
    const data = byLocale[locale];
    if (!data) continue;
    const current = currentRows.find((row) => row.locale === locale);
    const { slug, retired } = await planSlug(
      tx,
      post,
      locale,
      data.title,
      current,
      !!options.regenerateSlug?.[locale],
    );
    const content = rowContent(data);
    const saved = await tx.blogPostTranslation.upsert({
      where: { postId_locale: { postId: post.id, locale } },
      create: { postId: post.id, locale, ...content, slug },
      update: { ...content, slug },
      select: { id: true },
    });
    if (retired)
      await tx.blogPostSlugHistory.upsert({
        where: { locale_slug: { locale, slug: retired } },
        update: {},
        create: { locale, slug: retired, translationId: saved.id },
      });
  }
}

const LEGACY_SNAPSHOT_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  tagline: true,
  content: true,
  blocks: true,
  faq: true,
  seo: true,
  translations: true,
  publishedAt: true,
  isReviewCopy: true,
  status: true,
  sourceLocale: true,
} satisfies Prisma.BlogPostSelect;

/** Re-reads the post inside the transaction and syncs its rows; with
 * `requireCompleteSource` it first throws `SourceTranslationIncompleteError`
 * (rolling the transaction back) when the source translation is incomplete. */
export async function syncTranslationsForPost(
  tx: Prisma.TransactionClient,
  postId: string,
  options: SyncTranslationsOptions & { requireCompleteSource?: boolean } = {},
): Promise<void> {
  const post = await tx.blogPost.findUnique({
    where: { id: postId },
    select: LEGACY_SNAPSHOT_SELECT,
  });
  if (!post) throw new Error(`Blog post ${postId} not found`);
  if (options.requireCompleteSource) assertLegacySourceComplete(post);
  await syncTranslationsFromLegacy(tx, post, {
    regenerateSlug: options.regenerateSlug,
  });
}
