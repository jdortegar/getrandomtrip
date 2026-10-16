import { z } from "zod";
import type { BlogTranslation, BlogTranslations } from "@/types/blog";
import {
  faqItemSchema as faqItem,
  faqSchema,
  richText,
  seoSchema,
  shortText,
} from "./translation-schema";
import {
  hasBlogArticleContent,
  isBlogTranslationComplete,
} from "./translation-completeness";

export { hasBlogArticleContent };

// Legacy `translations.en` JSON shape (text blocks only); kept until the
// contract rollout removes the column.
const translationSchema = z.object({
  title: shortText.optional(),
  subtitle: z.string().max(2_000).nullable().optional(),
  tagline: z.string().max(2_000).nullable().optional(),
  content: richText.nullable().optional(),
  blocks: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("section"),
          title: shortText,
          description: richText,
        }),
        z.object({
          type: z.literal("quote"),
          text: z.string().max(20_000),
          cite: shortText.optional(),
        }),
        z.object({ type: z.literal("paragraph"), text: richText }),
        z.object({ type: z.literal("faq"), items: z.array(faqItem).max(100) }),
      ]),
    )
    .max(200)
    .optional(),
  faq: faqSchema.nullable().optional(),
  seo: seoSchema.nullable().optional(),
});
const translationsSchema = z
  .object({ en: translationSchema.nullable().optional() })
  .strict();

export function isEnglishBlogReady(copy?: BlogTranslation | null): boolean {
  return isBlogTranslationComplete(copy);
}

/** Undefined means PATCH omission, null explicitly removes English. Unknown
 * copy keys (including a forged ready flag) are stripped before persistence. */
export function normalizeBlogTranslations(
  value: unknown,
): BlogTranslations | null | undefined {
  if (value === undefined || value === null) return value;
  const parsed = translationsSchema.parse(value);
  if (!parsed.en) return null;
  return { en: { ...parsed.en, ready: isEnglishBlogReady(parsed.en) } };
}

/** Queryable readiness is always computed by write APIs, never by clients. */
export function blogLocaleWhere(locale: string) {
  return locale === "en"
    ? { translations: { path: ["en", "ready"], equals: true } }
    : {};
}

function englishCopy(post: LocalizableBlog): BlogTranslation | null {
  const result = translationsSchema.safeParse(post.translations);
  return result.success ? (result.data.en ?? null) : null;
}

/** Canonical columns are Spanish unless they are only a copy of the English translation. */
function hasDistinctSpanishCopy(post: LocalizableBlog, copy: BlogTranslation | null): boolean {
  if (!post.title?.trim()) return false;
  if (!copy?.title?.trim()) return true;
  if (post.title.trim() !== copy.title.trim()) return true;
  if (typeof post.content !== "string" || typeof copy.content !== "string") return false;
  return post.content !== copy.content;
}

interface LocalizableBlog {
  title?: string;
  subtitle?: unknown;
  tagline?: unknown;
  content?: unknown;
  blocks?: unknown;
  faq?: unknown;
  seo?: unknown;
  translations?: unknown;
}

/** Public projection only. Never use a resolved record to seed an editor.
 * Optional English copy is blank, not Spanish. Gallery URLs remain shared;
 * captions and embedded titles are authored text and must not fall back. */
export function resolveBlogContent<T extends LocalizableBlog>(
  post: T,
  locale: string,
): T | null {
  const copy = englishCopy(post);
  if (locale !== "en") return hasDistinctSpanishCopy(post, copy) ? post : null;
  if (!isEnglishBlogReady(copy)) return null;
  const media = Array.isArray(post.blocks)
    ? post.blocks.flatMap((block: unknown) => {
        if (
          !block ||
          typeof block !== "object" ||
          !("type" in block) ||
          !("url" in block) ||
          typeof block.url !== "string"
        )
          return [];
        if (block.type !== "image" && block.type !== "video") return [];
        return [{ type: block.type, url: block.url }];
      })
    : [];
  return {
    ...post,
    title: copy!.title!,
    subtitle: copy!.subtitle ?? null,
    tagline: copy!.tagline ?? null,
    content: copy!.content ?? null,
    blocks: [...(copy!.blocks ?? []), ...media],
    faq: copy!.faq ?? null,
    seo: copy!.seo ?? null,
    translations: undefined,
  };
}

export function resolveBlogList<T extends LocalizableBlog>(
  posts: T[],
  locale: string,
): T[] {
  return posts.flatMap((post) => {
    const resolved = resolveBlogContent(post, locale);
    return resolved ? [resolved] : [];
  });
}
