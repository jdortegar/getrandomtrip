import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  BlogBlock,
  BlogEditorPost,
  BlogEditorTranslation,
  BlogEditorTranslations,
  BlogLocaleSlugs,
  BlogPost,
  ContentLocale,
  PublicBlogListFilters,
  PublicBlogLookup,
  PublicBlogPost,
  PublicBlogSummary,
} from "@/types/blog";
import { CONTENT_LOCALES, isContentLocale } from "./locales";
import type { EditorTranslationsInput } from "./editor-write";
import {
  SourceTranslationIncompleteError,
  computeTranslationIsComplete,
  resolveSourceLocale,
  type TranslationRowData,
} from "./legacy-translation-mapping";
import { pickSourceRow } from "./source-copy";
import { resolveUniqueSlug, slugForTitle } from "./translation-slug";

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

// ── Writes: translation rows are the only localized store ──

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

/** Slug rules: review copies → null; otherwise the slug follows the title on
 * save. A published slug that actually changes is retired for 301s. */
interface SlugTarget {
  publishedAt: Date | string | null;
  isReviewCopy: boolean;
}

async function planSlug(
  tx: Prisma.TransactionClient,
  post: SlugTarget,
  locale: string,
  title: string,
  current: CurrentRow | undefined,
): Promise<SlugPlan> {
  if (post.isReviewCopy) return { slug: null };
  if (!current?.slug)
    return { slug: await uniqueSlugFor(tx, locale, title, current?.id) };
  if (current.title === title) return { slug: current.slug };

  const slug = await uniqueSlugFor(tx, locale, title, current.id);
  return post.publishedAt && slug !== current.slug
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

/** Source completeness uses stored rows only. Posts with no rows have no
 * source translation — there are no legacy columns to fall back to. */
export async function syncTranslationsForPost(
  tx: Prisma.TransactionClient,
  postId: string,
  options: { requireCompleteSource?: boolean } = {},
): Promise<void> {
  const post = await tx.blogPost.findUnique({
    where: { id: postId },
    select: { sourceLocale: true },
  });
  if (!post) throw new Error(`Blog post ${postId} not found`);
  if (!options.requireCompleteSource) return;
  const existing = await tx.blogPostTranslation.findMany({
    where: { postId },
    select: { locale: true, isComplete: true },
  });
  const source = resolveSourceLocale(post.sourceLocale);
  if (!existing.find((row) => row.locale === source)?.isComplete)
    throw new SourceTranslationIncompleteError(source);
}

/** Title of the source-locale translation, or empty when the post has none. */
export async function sourceTitleForPost(
  client: Pick<Prisma.TransactionClient, "blogPost">,
  postId: string,
): Promise<string> {
  const post = await client.blogPost.findUnique({
    where: { id: postId },
    select: {
      sourceLocale: true,
      translationRows: { select: { locale: true, title: true } },
    },
  });
  if (!post) return "";
  return pickSourceRow(post.sourceLocale, post.translationRows)?.title ?? "";
}

// ── Review copies: rows are cloned with a null slug; approval overwrites the
// original per locale, keeping its slugs and slug history (slugs are out of
// review). ──

/** One locale's localized content as compared and copied during review. */
export interface ReviewTranslationRow extends TranslationRowData {
  locale: string;
}

/** A review-flow post: id plus sourceLocale. Rows come from translationRows. */
export interface ReviewPostSnapshot {
  id: string;
  sourceLocale?: unknown;
}

type ReviewClient = Pick<Prisma.TransactionClient, "blogPostTranslation">;

const REVIEW_ROW_SELECT = {
  locale: true,
  title: true,
  subtitle: true,
  tagline: true,
  content: true,
  blocks: true,
  faq: true,
  seo: true,
  isComplete: true,
} satisfies Prisma.BlogPostTranslationSelect;

type ReviewRowRecord = Prisma.BlogPostTranslationGetPayload<{
  select: typeof REVIEW_ROW_SELECT;
}>;

function localeRank(locale: string): number {
  const index = CONTENT_LOCALES.indexOf(locale as ContentLocale);
  return index === -1 ? CONTENT_LOCALES.length : index;
}

function toReviewRow(row: ReviewRowRecord): ReviewTranslationRow {
  return {
    locale: row.locale,
    title: row.title,
    subtitle: row.subtitle ?? null,
    tagline: row.tagline ?? null,
    content: row.content ?? null,
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    faq: row.faq ?? null,
    seo: row.seo ?? null,
    isComplete: row.isComplete,
  };
}

/** The post's translation rows in `CONTENT_LOCALES` order. Empty when none. */
export async function loadTranslationsForReview(
  client: ReviewClient,
  post: ReviewPostSnapshot,
): Promise<ReviewTranslationRow[]> {
  const rows = await client.blogPostTranslation.findMany({
    where: { postId: post.id },
    select: REVIEW_ROW_SELECT,
  });
  return rows
    .map(toReviewRow)
    .sort((a, b) => localeRank(a.locale) - localeRank(b.locale));
}

/** Clones every translation row of the original into its new review copy
 * (same locale, content and completeness; slug null). */
export async function cloneTranslationsToCopy(
  tx: Prisma.TransactionClient,
  originalId: string,
  copyId: string,
): Promise<void> {
  const rows = await tx.blogPostTranslation.findMany({
    where: { postId: originalId },
    select: REVIEW_ROW_SELECT,
  });
  if (!rows.length) return;
  await tx.blogPostTranslation.createMany({
    data: rows.map((row) => ({
      postId: copyId,
      locale: row.locale,
      title: row.title,
      subtitle: row.subtitle,
      tagline: row.tagline,
      content: row.content,
      blocks: jsonInput(row.blocks),
      faq: jsonInput(row.faq),
      seo: jsonInput(row.seo),
      isComplete: row.isComplete,
      slug: null,
    })),
  });
}

/** Overwrites the original's rows from the approved copy inside the caller's
 * transaction: upserts each copy locale (keeping the original's slug; a new
 * locale gets one from its title), deletes locales the copy removed, and
 * recomputes `isComplete`. With `requireCompleteSource` it throws
 * `SourceTranslationIncompleteError` before writing anything. */
export async function overwriteTranslationsFromCopy(
  tx: Prisma.TransactionClient,
  originalId: string,
  copy: ReviewPostSnapshot,
  options: { requireCompleteSource?: boolean } = {},
): Promise<void> {
  const copyRows = (await loadTranslationsForReview(tx, copy)).map((row) => ({
    ...row,
    isComplete: computeTranslationIsComplete(row),
  }));
  if (options.requireCompleteSource) {
    const source = resolveSourceLocale(copy.sourceLocale);
    if (!copyRows.find((row) => row.locale === source)?.isComplete)
      throw new SourceTranslationIncompleteError(source);
  }

  const currentRows: CurrentRow[] = await tx.blogPostTranslation.findMany({
    where: { postId: originalId },
    select: { id: true, locale: true, title: true, slug: true },
  });
  const removed = currentRows
    .filter((row) => !copyRows.some((candidate) => candidate.locale === row.locale))
    .map((row) => row.locale);
  if (removed.length)
    await tx.blogPostTranslation.deleteMany({
      where: { postId: originalId, locale: { in: removed } },
    });

  for (const row of copyRows) {
    const current = currentRows.find((candidate) => candidate.locale === row.locale);
    const slug =
      current?.slug ?? (await uniqueSlugFor(tx, row.locale, row.title, current?.id));
    const content = rowContent(row);
    await tx.blogPostTranslation.upsert({
      where: { postId_locale: { postId: originalId, locale: row.locale } },
      create: { postId: originalId, locale: row.locale, ...content, slug },
      update: { ...content, slug },
      select: { id: true },
    });
  }
}

// ── Editor reads/writes: translations keyed by locale (decision 8) ──

export interface EditorWriteTarget {
  id: string;
  publishedAt: Date | string | null;
  isReviewCopy: boolean;
  sourceLocale: ContentLocale;
}

const EDITOR_ROW_SELECT = {
  locale: true,
  title: true,
  subtitle: true,
  tagline: true,
  content: true,
  blocks: true,
  faq: true,
  seo: true,
  slug: true,
  isComplete: true,
} satisfies Prisma.BlogPostTranslationSelect;

const EDITOR_POST_SELECT = {
  id: true,
  authorId: true,
  source: true,
  status: true,
  format: true,
  sourceLocale: true,
  coverUrl: true,
  tags: true,
  travelType: true,
  excuseKey: true,
  level: true,
  label: true,
  isActive: true,
  isReviewCopy: true,
  parentId: true,
  reviewNote: true,
  tripperNote: true,
  reviewLockedBy: true,
  changedFields: true,
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
  translationRows: { select: EDITOR_ROW_SELECT },
} satisfies Prisma.BlogPostSelect;

type EditorRowRecord = Prisma.BlogPostTranslationGetPayload<{
  select: typeof EDITOR_ROW_SELECT;
}>;

function inputToRowData(
  input: NonNullable<EditorTranslationsInput[ContentLocale]>,
): TranslationRowData {
  const data = {
    title: input.title,
    subtitle: input.subtitle ?? null,
    tagline: input.tagline ?? null,
    content: input.content ?? null,
    blocks: input.blocks ?? [],
    faq: input.faq ?? null,
    seo: input.seo ?? null,
  };
  return { ...data, isComplete: computeTranslationIsComplete(data) };
}

function toEditorTranslation(
  data: TranslationRowData,
  slug: string | null,
): BlogEditorTranslation {
  return {
    title: data.title,
    subtitle: data.subtitle,
    tagline: data.tagline,
    content: data.content,
    blocks: data.blocks as BlogBlock[],
    faq: data.faq as BlogPost["faq"],
    seo: (data.seo as BlogPost["seo"] | null) ?? null,
    slug,
    isComplete: data.isComplete,
  };
}

function editorTranslationFromRow(row: EditorRowRecord): BlogEditorTranslation {
  return {
    title: row.title,
    subtitle: row.subtitle,
    tagline: row.tagline,
    content: row.content,
    blocks: Array.isArray(row.blocks) ? (row.blocks as BlogBlock[]) : [],
    faq: row.faq as BlogPost["faq"],
    seo: (row.seo as BlogPost["seo"] | null) ?? null,
    slug: row.slug,
    isComplete: row.isComplete,
  };
}

/** Writes the requested locales, deletes omitted non-source locales, and
 * never deletes the source row. Slugs follow each locale's title on save. */
export async function writeTranslationsFromEditor(
  tx: Prisma.TransactionClient,
  target: EditorWriteTarget,
  translations: EditorTranslationsInput,
): Promise<BlogEditorTranslations> {
  const currentRows = await tx.blogPostTranslation.findMany({
    where: { postId: target.id },
    select: {
      id: true,
      locale: true,
      title: true,
      slug: true,
      subtitle: true,
      tagline: true,
      content: true,
      blocks: true,
      faq: true,
      seo: true,
      isComplete: true,
    },
  });
  const requested = new Set(
    CONTENT_LOCALES.filter((locale) => translations[locale] !== undefined),
  );
  const removed = currentRows
    .filter(
      (row) => !requested.has(row.locale as ContentLocale) && row.locale !== target.sourceLocale,
    )
    .map((row) => row.locale);
  if (removed.length)
    await tx.blogPostTranslation.deleteMany({
      where: { postId: target.id, locale: { in: removed } },
    });

  const result: BlogEditorTranslations = {};
  for (const locale of CONTENT_LOCALES) {
    const input = translations[locale];
    if (!input) continue;
    const data = inputToRowData(input);
    const current = currentRows.find((row) => row.locale === locale);
    const { slug, retired } = await planSlug(
      tx,
      target,
      locale,
      data.title,
      current,
    );
    const content = rowContent(data);
    const saved = await tx.blogPostTranslation.upsert({
      where: { postId_locale: { postId: target.id, locale } },
      create: { postId: target.id, locale, ...content, slug },
      update: { ...content, slug },
      select: { id: true },
    });
    if (retired)
      await tx.blogPostSlugHistory.upsert({
        where: { locale_slug: { locale, slug: retired } },
        update: {},
        create: { locale, slug: retired, translationId: saved.id },
      });
    result[locale] = toEditorTranslation(data, slug);
  }

  if (!requested.has(target.sourceLocale)) {
    const source = currentRows.find((row) => row.locale === target.sourceLocale);
    if (source)
      result[target.sourceLocale] = editorTranslationFromRow(source);
  }
  return result;
}

/** Editor/review read: shared post fields plus translations keyed by locale
 * (slug + isComplete read-only). Posts without rows return empty translations. */
export async function getForEditor(id: string): Promise<BlogEditorPost | null> {
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: EDITOR_POST_SELECT,
  });
  if (!post) return null;
  const translations = Object.fromEntries(
    post.translationRows
      .filter((row) => isContentLocale(row.locale))
      .map((row) => [row.locale, editorTranslationFromRow(row)]),
  );
  return {
    id: post.id,
    authorId: post.authorId,
    source: post.source,
    status: post.status,
    format: post.format,
    sourceLocale: resolveSourceLocale(post.sourceLocale),
    coverUrl: post.coverUrl,
    tags: post.tags,
    travelType: post.travelType,
    excuseKey: post.excuseKey,
    level: post.level,
    label: post.label,
    isActive: post.isActive,
    isReviewCopy: post.isReviewCopy,
    parentId: post.parentId,
    reviewNote: post.reviewNote,
    tripperNote: post.tripperNote,
    reviewLockedBy: post.reviewLockedBy,
    changedFields: Array.isArray(post.changedFields) ? post.changedFields : [],
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author,
    translations,
  };
}
