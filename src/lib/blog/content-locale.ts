import { z } from "zod";
import type { BlogTranslation, BlogTranslations } from "@/types/blog";

const shortText = z.string().max(500);
const richText = z.string().max(500_000);
const faqItem = z.object({
  question: shortText,
  answer: z.string().max(20_000),
});
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
  faq: z
    .object({ items: z.array(faqItem).max(100) })
    .nullable()
    .optional(),
  seo: z
    .object({
      title: shortText.optional(),
      description: z.string().max(2_000).optional(),
      keywords: z.array(shortText).max(100).optional(),
    })
    .nullable()
    .optional(),
});
const translationsSchema = z
  .object({ en: translationSchema.nullable().optional() })
  .strict();

/** TinyMCE's empty paragraphs are not usable article content. HTML is kept
 * verbatim, using the existing canonical article's trusted-author model. */
export function hasBlogArticleContent(html?: string | null): boolean {
  if (!html) return false;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/[\s\u200B-\u200D\uFEFF]/g, "");
  return !!text || /<(img|video|audio|iframe)\b[^>]*\bsrc\s*=/i.test(html);
}

export function isEnglishBlogReady(copy?: BlogTranslation | null): boolean {
  if (!copy?.title?.trim() || !hasBlogArticleContent(copy.content))
    return false;
  const sections =
    copy.blocks?.filter((block) => block.type === "section") ?? [];
  const quote = copy.blocks?.find((block) => block.type === "quote");
  // The public renderer prefers structural blocks over flattened HTML.
  if (sections.length)
    return (
      sections.some(
        (section) =>
          hasBlogArticleContent(section.title) ||
          hasBlogArticleContent(section.description),
      ) || !!quote?.text.trim()
    );
  return true;
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
