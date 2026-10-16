/**
 * Backfill for the blog translations rollout (odd/tasks/blog-translations.md,
 * T2): populates `blog_post_translations` and `blog_post_slug_history` from
 * the legacy BlogPost columns (Spanish) and the `translations.en` JSON.
 *
 * - One `es` row per post from the legacy columns (all blocks, media and
 *   captions included). `sourceLocale` keeps its column default ('es').
 * - One `en` row per post whose `translations.en` parses: its text blocks plus
 *   the Spanish post's media blocks (image/video/embed) appended in their
 *   original order with captions copied as-is, preserving today's public
 *   English rendering without losing media. Invalid JSON is skipped and reported.
 * - `isComplete` is recomputed, never copied from the legacy `ready` flag.
 * - Each translation's slug comes from its own title, unique per locale
 *   (deterministic order: createdAt, then id). Review copies get a null slug.
 *   Another post's legacy slug is never reused, and a history row is planned
 *   wherever the new slug differs from the legacy shared slug so old URLs 301.
 * - Idempotent: an existing (postId, locale) row is never modified (its slug
 *   is frozen); content differences are only reported as drift.
 *
 * Modes (dry-run is the default; forgetting a flag never writes):
 *   npm run db:backfill-blog-translations                 # plan summary only
 *   npm run db:backfill-blog-translations -- --apply      # write, one transaction per post
 *   npm run db:backfill-blog-translations -- --diff-only  # legacy vs rows drift, no writes
 *
 * Exit code is non-zero when the consistency check fails in --apply or
 * --diff-only (es rows must equal posts).
 */
import type { PrismaClient } from "@prisma/client";
import { withPrisma } from "./lib/withPrisma";
import { normalizeBlogTranslations } from "../src/lib/blog/content-locale";
import { CONTENT_LOCALES } from "../src/lib/blog/locales";
import { isBlogTranslationComplete } from "../src/lib/blog/translation-completeness";
import { blogBlockSchema } from "../src/lib/blog/translation-schema";
import { resolveUniqueSlug, slugForTitle } from "../src/lib/blog/translation-slug";
import type { BlogBlock, ContentLocale } from "../src/types/blog";

const LOG_PREFIX = "[backfill-blog-translations]";
const MEDIA_TYPES = new Set(["image", "video", "embed"]);

export type BackfillMode = "dry-run" | "apply" | "diff-only";

/** Legacy BlogPost columns the backfill reads. */
export interface LegacyBlogPostRow {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string | null;
  tagline: string | null;
  content: string | null;
  blocks: unknown;
  faq: unknown;
  seo: unknown;
  translations: unknown;
  publishedAt: Date | null;
  isReviewCopy: boolean;
  createdAt: Date;
}

/** Localized content written to one translation row (slug planned separately). */
export interface TranslationRowData {
  title: string;
  subtitle: string | null;
  tagline: string | null;
  content: string | null;
  blocks: unknown[];
  faq: unknown;
  seo: unknown;
  isComplete: boolean;
}

export interface ExistingTranslationRow {
  id: string;
  postId: string;
  locale: string;
  title: string;
  subtitle?: string | null;
  tagline?: string | null;
  content?: string | null;
  blocks?: unknown;
  faq?: unknown;
  seo?: unknown;
  slug: string | null;
  isComplete: boolean;
}

export interface ExistingSlugHistoryRow {
  locale: string;
  slug: string;
  translationId: string;
}

export interface PlannedTranslation {
  postId: string;
  locale: ContentLocale;
  /** `keep` means the row already exists and is left untouched. */
  action: "create" | "keep";
  existingId?: string;
  slug: string | null;
  data: TranslationRowData;
}

/** Legacy slug → the (postId, locale) translation created in the same run. */
export interface PlannedSlugHistory {
  postId: string;
  locale: ContentLocale;
  slug: string;
}

export interface TranslationDrift {
  postId: string;
  locale: ContentLocale;
  fields: string[];
}

export interface BlogTranslationBackfillReport {
  posts: number;
  es: { planned: number; existing: number };
  en: { planned: number; existing: number };
  invalidEnJson: number;
  slugHistory: number;
  slugCollisionsResolved: number;
  /** Rows (planned or existing) that are not complete, per locale. */
  incomplete: Record<ContentLocale, number>;
  drift: number;
}

export interface BlogTranslationBackfillPlan {
  translations: PlannedTranslation[];
  slugHistory: PlannedSlugHistory[];
  drift: TranslationDrift[];
  invalidEnJson: { postId: string; error: string }[];
  report: BlogTranslationBackfillReport;
}

const COMPARED_FIELDS = [
  "title",
  "subtitle",
  "tagline",
  "content",
  "blocks",
  "faq",
  "seo",
  "isComplete",
] as const;

/** Stable JSON: object keys sorted (JSONB reorders them), undefined → null. */
function canonical(value: unknown): string {
  return JSON.stringify(value ?? null, (_key, inner: unknown) => {
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return Object.fromEntries(
        Object.entries(inner as Record<string, unknown>).sort(([a], [b]) =>
          a < b ? -1 : a > b ? 1 : 0,
        ),
      );
    }
    return inner === undefined ? null : inner;
  });
}

/** Content fields where a legacy-derived row and a stored row disagree. */
export function diffTranslationFields(
  planned: Partial<TranslationRowData>,
  existing: Partial<TranslationRowData>,
): string[] {
  return COMPARED_FIELDS.filter(
    (field) => canonical(planned[field]) !== canonical(existing[field]),
  );
}

function asBlocks(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isMediaBlock(block: unknown): boolean {
  return (
    !!block &&
    typeof block === "object" &&
    MEDIA_TYPES.has((block as { type?: unknown }).type as string) &&
    typeof (block as { url?: unknown }).url === "string"
  );
}

function computeIsComplete(data: Omit<TranslationRowData, "isComplete">): boolean {
  // Legacy JSON is untyped: only schema-valid blocks feed completeness.
  const blocks = data.blocks.filter(
    (block) => blogBlockSchema.safeParse(block).success,
  ) as BlogBlock[];
  return isBlogTranslationComplete({
    title: data.title,
    content: data.content,
    blocks,
  });
}

function withCompleteness(
  data: Omit<TranslationRowData, "isComplete">,
): TranslationRowData {
  return { ...data, isComplete: computeIsComplete(data) };
}

function spanishData(post: LegacyBlogPostRow): TranslationRowData {
  return withCompleteness({
    title: post.title,
    subtitle: post.subtitle ?? null,
    tagline: post.tagline ?? null,
    content: post.content ?? null,
    blocks: asBlocks(post.blocks),
    faq: post.faq ?? null,
    seo: post.seo ?? null,
  });
}

type EnglishResult =
  | { kind: "none" }
  | { kind: "invalid"; error: string }
  | { kind: "valid"; data: TranslationRowData };

function englishData(post: LegacyBlogPostRow): EnglishResult {
  let normalized: ReturnType<typeof normalizeBlogTranslations>;
  try {
    normalized = normalizeBlogTranslations(post.translations);
  } catch (error) {
    return {
      kind: "invalid",
      error: error instanceof Error ? error.message : String(error),
    };
  }
  const en = normalized?.en;
  if (!en) return { kind: "none" };
  const spanishMedia = asBlocks(post.blocks).filter(isMediaBlock);
  return {
    kind: "valid",
    data: withCompleteness({
      title: en.title ?? "",
      subtitle: en.subtitle ?? null,
      tagline: en.tagline ?? null,
      content: en.content ?? null,
      blocks: [...(en.blocks ?? []), ...spanishMedia],
      faq: en.faq ?? null,
      seo: en.seo ?? null,
    }),
  };
}

function byCreatedAtThenId(a: LegacyBlogPostRow, b: LegacyBlogPostRow): number {
  const time = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (time !== 0) return time;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function localeSets(): Record<ContentLocale, Set<string>> {
  return Object.fromEntries(
    CONTENT_LOCALES.map((locale) => [locale, new Set<string>()]),
  ) as Record<ContentLocale, Set<string>>;
}

/** Pure planner: legacy posts + existing rows in, rows to create and a report out. */
export async function planBlogTranslationBackfill(
  posts: LegacyBlogPostRow[],
  existing: {
    translations: ExistingTranslationRow[];
    slugHistory: ExistingSlugHistoryRow[];
  },
): Promise<BlogTranslationBackfillPlan> {
  const ordered = [...posts].sort(byCreatedAtThenId);
  const existingByKey = new Map(
    existing.translations.map((row) => [`${row.postId}:${row.locale}`, row]),
  );
  const liveSlugs = localeSets();
  const historySlugs = localeSets();
  for (const row of existing.translations) {
    if (row.slug) liveSlugs[row.locale as ContentLocale]?.add(row.slug);
  }
  for (const row of existing.slugHistory) {
    historySlugs[row.locale as ContentLocale]?.add(row.slug);
  }
  // Legacy shared slugs are live URLs today; only their own post may reuse one.
  const legacyOwner = new Map<string, string>();
  for (const post of ordered) {
    if (post.slug && !post.isReviewCopy) legacyOwner.set(post.slug, post.id);
  }

  const translations: PlannedTranslation[] = [];
  const slugHistory: PlannedSlugHistory[] = [];
  const drift: TranslationDrift[] = [];
  const invalidEnJson: { postId: string; error: string }[] = [];
  let slugCollisionsResolved = 0;

  for (const post of ordered) {
    const english = englishData(post);
    if (english.kind === "invalid")
      invalidEnJson.push({ postId: post.id, error: english.error });

    const byLocale: Partial<Record<ContentLocale, TranslationRowData>> = {
      es: spanishData(post),
      ...(english.kind === "valid" ? { en: english.data } : {}),
    };

    for (const locale of CONTENT_LOCALES) {
      const data = byLocale[locale];
      if (!data) continue;

      const current = existingByKey.get(`${post.id}:${locale}`);
      if (current) {
        translations.push({
          postId: post.id,
          locale,
          action: "keep",
          existingId: current.id,
          slug: current.slug,
          data,
        });
        const fields = diffTranslationFields(data, {
          ...current,
          blocks: current.blocks as unknown[] | undefined,
        });
        if (fields.length) drift.push({ postId: post.id, locale, fields });
        continue;
      }

      let slug: string | null = null;
      if (!post.isReviewCopy) {
        const base = slugForTitle(data.title);
        slug = await resolveUniqueSlug(base, async (candidate) => {
          const owner = legacyOwner.get(candidate);
          return (
            liveSlugs[locale].has(candidate) ||
            historySlugs[locale].has(candidate) ||
            (owner !== undefined && owner !== post.id)
          );
        });
        if (slug !== base) slugCollisionsResolved += 1;
        liveSlugs[locale].add(slug);

        if (
          post.slug &&
          slug !== post.slug &&
          !liveSlugs[locale].has(post.slug) &&
          !historySlugs[locale].has(post.slug)
        ) {
          historySlugs[locale].add(post.slug);
          slugHistory.push({ postId: post.id, locale, slug: post.slug });
        }
      }

      translations.push({ postId: post.id, locale, action: "create", slug, data });
    }
  }

  const count = (locale: ContentLocale, action: PlannedTranslation["action"]) =>
    translations.filter((row) => row.locale === locale && row.action === action)
      .length;
  const incomplete = Object.fromEntries(
    CONTENT_LOCALES.map((locale) => [
      locale,
      translations.filter((row) => {
        if (row.locale !== locale) return false;
        const stored =
          row.action === "keep"
            ? existingByKey.get(`${row.postId}:${locale}`)?.isComplete
            : row.data.isComplete;
        return !stored;
      }).length,
    ]),
  ) as Record<ContentLocale, number>;

  return {
    translations,
    slugHistory,
    drift,
    invalidEnJson,
    report: {
      posts: posts.length,
      es: { planned: count("es", "create"), existing: count("es", "keep") },
      en: { planned: count("en", "create"), existing: count("en", "keep") },
      invalidEnJson: invalidEnJson.length,
      slugHistory: slugHistory.length,
      slugCollisionsResolved,
      incomplete,
      drift: drift.length,
    },
  };
}

// ── I/O runner ──────────────────────────────────────────────────────────

type Logger = Pick<Console, "log">;

/** Json columns are omitted when null: the row is created, so absent == NULL. */
function jsonOrOmit(value: unknown): object | undefined {
  return value === null || value === undefined ? undefined : (value as object);
}

async function applyPlan(
  client: PrismaClient,
  plan: BlogTranslationBackfillPlan,
): Promise<void> {
  const postIds = [
    ...new Set(
      plan.translations
        .filter((row) => row.action === "create")
        .map((row) => row.postId),
    ),
  ];
  for (const postId of postIds) {
    const creates = plan.translations.filter(
      (row) => row.postId === postId && row.action === "create",
    );
    const history = plan.slugHistory.filter((row) => row.postId === postId);
    await client.$transaction(async (tx) => {
      const ids = new Map<string, string>();
      for (const row of creates) {
        // Create-only upsert: a row written concurrently (or by an earlier
        // run) keeps its content and frozen slug.
        const saved = await tx.blogPostTranslation.upsert({
          where: { postId_locale: { postId, locale: row.locale } },
          update: {},
          create: {
            postId,
            locale: row.locale,
            title: row.data.title,
            subtitle: row.data.subtitle,
            tagline: row.data.tagline,
            content: row.data.content,
            blocks: jsonOrOmit(row.data.blocks),
            faq: jsonOrOmit(row.data.faq),
            seo: jsonOrOmit(row.data.seo),
            slug: row.slug,
            isComplete: row.data.isComplete,
          },
          select: { id: true },
        });
        ids.set(row.locale, saved.id);
      }
      for (const row of history) {
        const translationId = ids.get(row.locale);
        if (!translationId) continue;
        await tx.blogPostSlugHistory.upsert({
          where: { locale_slug: { locale: row.locale, slug: row.slug } },
          update: {},
          create: { locale: row.locale, slug: row.slug, translationId },
        });
      }
    });
  }
}

function printReport(
  logger: Logger,
  mode: BackfillMode,
  plan: BlogTranslationBackfillPlan,
): void {
  const { report } = plan;
  logger.log(`${LOG_PREFIX} mode: ${mode}`);
  logger.log(`${LOG_PREFIX} posts: ${report.posts}`);
  logger.log(
    `${LOG_PREFIX} es rows: ${report.es.planned} planned, ${report.es.existing} existing`,
  );
  logger.log(
    `${LOG_PREFIX} en rows: ${report.en.planned} planned, ${report.en.existing} existing`,
  );
  logger.log(`${LOG_PREFIX} invalid en JSON (skipped): ${report.invalidEnJson}`);
  for (const entry of plan.invalidEnJson)
    logger.log(`${LOG_PREFIX}   post ${entry.postId}: ${entry.error}`);
  logger.log(`${LOG_PREFIX} slug history rows planned: ${report.slugHistory}`);
  logger.log(
    `${LOG_PREFIX} slug collisions resolved: ${report.slugCollisionsResolved}`,
  );
  logger.log(
    `${LOG_PREFIX} incomplete translations: ${CONTENT_LOCALES.map((locale) => `${locale}=${report.incomplete[locale]}`).join(", ")}`,
  );
  logger.log(`${LOG_PREFIX} rows with content drift: ${report.drift}`);
  if (mode === "diff-only") {
    for (const entry of plan.drift)
      logger.log(
        `${LOG_PREFIX}   ${entry.postId} [${entry.locale}]: ${entry.fields.join(", ")}`,
      );
  }
}

export async function runBlogTranslationBackfill(
  client: PrismaClient,
  mode: BackfillMode,
  logger: Logger = console,
): Promise<{ ok: boolean; plan: BlogTranslationBackfillPlan }> {
  const [posts, translations, slugHistory] = await Promise.all([
    client.blogPost.findMany({
      select: {
        id: true,
        slug: true,
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
        createdAt: true,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    client.blogPostTranslation.findMany({
      select: {
        id: true,
        postId: true,
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
      },
    }),
    client.blogPostSlugHistory.findMany({
      select: { locale: true, slug: true, translationId: true },
    }),
  ]);

  const plan = await planBlogTranslationBackfill(posts, {
    translations,
    slugHistory,
  });
  printReport(logger, mode, plan);

  if (mode === "dry-run") {
    logger.log(
      `${LOG_PREFIX} DRY RUN — nothing written. Re-run with --apply to write.`,
    );
    return { ok: true, plan };
  }

  let esRows: number;
  if (mode === "apply") {
    await applyPlan(client, plan);
    esRows = await client.blogPostTranslation.count({ where: { locale: "es" } });
  } else {
    esRows = plan.report.es.existing;
  }

  const ok = esRows === plan.report.posts;
  logger.log(
    `${LOG_PREFIX} consistency (es rows == posts): ${esRows} == ${plan.report.posts} → ${ok ? "OK" : "FAILED"}`,
  );
  return { ok, plan };
}

// ── CLI entrypoint ──────────────────────────────────────────────────────

export function parseBackfillMode(args: string[]): BackfillMode {
  const apply = args.includes("--apply");
  const diffOnly = args.includes("--diff-only");
  if (apply && diffOnly)
    throw new Error("Pass at most one of --apply / --diff-only");
  if (apply) return "apply";
  if (diffOnly) return "diff-only";
  return "dry-run";
}

const isMainModule =
  process.argv[1]?.endsWith("backfill-blog-translations.ts") ?? false;

if (isMainModule) {
  const mode = parseBackfillMode(process.argv.slice(2));
  withPrisma((client) => runBlogTranslationBackfill(client, mode))
    .then(({ ok }) => {
      if (!ok) process.exitCode = 1;
    })
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    });
}
