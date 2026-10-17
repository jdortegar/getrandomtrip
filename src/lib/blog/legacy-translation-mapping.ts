import type { BlogBlock, ContentLocale } from "@/types/blog";
import { normalizeBlogTranslations } from "./content-locale";
import { CONTENT_LOCALES, isContentLocale } from "./locales";
import { isBlogTranslationComplete } from "./translation-completeness";
import { blogBlockSchema } from "./translation-schema";

// Pure mapping from the expand-phase BlogPost shape (Spanish columns + optional
// `translations.en` JSON) to translation rows. Used by the backfill script
// only. Writers no longer reverse-map rows onto BlogPost columns.

const MEDIA_TYPES = new Set(["image", "video", "embed"]);

/** Locales the legacy shape can carry: `es` (columns) and `en` (JSON). */
export const LEGACY_MAPPED_LOCALES = ["es", "en"] as const satisfies readonly ContentLocale[];

/** Legacy BlogPost content the mapping reads. */
export interface LegacyBlogContent {
  title: string;
  subtitle?: string | null;
  tagline?: string | null;
  content?: string | null;
  blocks?: unknown;
  faq?: unknown;
  seo?: unknown;
  translations?: unknown;
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

export type LegacyEnglishResult =
  | { kind: "none" }
  | { kind: "invalid"; error: string }
  | { kind: "valid"; data: TranslationRowData };

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

/** Server-side completeness. Legacy JSON is untyped: only schema-valid
 * blocks feed it. */
export function computeTranslationIsComplete(
  data: Omit<TranslationRowData, "isComplete">,
): boolean {
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
  return { ...data, isComplete: computeTranslationIsComplete(data) };
}

/** The `es` row: legacy columns, all blocks (media and captions) included. */
export function legacySpanishTranslation(post: LegacyBlogContent): TranslationRowData {
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

/** The `en` row from `translations.en`: its text blocks plus the Spanish
 * media blocks appended in order (captions as-is). The legacy `ready` flag is
 * dropped and completeness recomputed. */
export function legacyEnglishTranslation(post: LegacyBlogContent): LegacyEnglishResult {
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

/** Whether the legacy shape yields a complete translation in `locale`. */
export function isLegacyLocaleComplete(
  post: LegacyBlogContent,
  locale: ContentLocale,
): boolean {
  if (locale === "es") return legacySpanishTranslation(post).isComplete;
  if (locale === "en") {
    const english = legacyEnglishTranslation(post);
    return english.kind === "valid" && english.data.isComplete;
  }
  return false;
}

/** The post's source locale, defaulting to the column default. */
export function resolveSourceLocale(value: unknown): ContentLocale {
  return isContentLocale(value) ? value : CONTENT_LOCALES[0];
}

/** Submitting for review or publishing needs a complete source translation. */
export class SourceTranslationIncompleteError extends Error {
  readonly code = "source_translation_incomplete";

  constructor(readonly locale: ContentLocale) {
    super(`The source translation (${locale}) is incomplete`);
    this.name = "SourceTranslationIncompleteError";
  }
}

/** Throws when the legacy shape's source translation is incomplete. */
export function assertLegacySourceComplete(
  post: LegacyBlogContent & { sourceLocale?: unknown },
): void {
  const locale = resolveSourceLocale(post.sourceLocale);
  if (!isLegacyLocaleComplete(post, locale))
    throw new SourceTranslationIncompleteError(locale);
}

