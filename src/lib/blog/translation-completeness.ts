import type {
  BlogBlock,
  BlogMediaBlock,
  BlogMediaMismatch,
  BlogTranslationContent,
} from "@/types/blog";

/** TinyMCE's empty paragraphs are not usable article content. HTML is kept
 * verbatim, using the existing canonical article's trusted-author model. */
export function hasBlogArticleContent(html?: string | null): boolean {
  if (!html) return false;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/[\s​-‍﻿]/g, "");
  return !!text || /<(img|video|audio|iframe)\b[^>]*\bsrc\s*=/i.test(html);
}

/** A translation is complete (publicly listable in its locale) when it has a
 * title and real article content; if it has structural sections, at least one
 * of them (or a quote) must carry text, because the public renderer prefers
 * them over flattened HTML. Media blocks never affect completeness.
 * Server-computed on every write; never trusted from clients. */
export function isBlogTranslationComplete(
  copy?: Partial<Pick<BlogTranslationContent, "title" | "content" | "blocks">> | null,
): boolean {
  if (!copy?.title?.trim() || !hasBlogArticleContent(copy.content))
    return false;
  const blocks = copy.blocks ?? [];
  const sections = blocks.filter((block) => block.type === "section");
  if (!sections.length) return true;
  const quote = blocks.find((block) => block.type === "quote");
  return (
    sections.some(
      (section) =>
        hasBlogArticleContent(section.title) ||
        hasBlogArticleContent(section.description),
    ) || !!quote?.text.trim()
  );
}

function isMediaBlock(block: BlogBlock): block is BlogMediaBlock {
  return (
    (block.type === "image" || block.type === "video" || block.type === "embed") &&
    typeof block.url === "string"
  );
}

function mediaUrls(copy?: Pick<BlogTranslationContent, "blocks"> | null): string[] {
  const urls = (copy?.blocks ?? []).filter(isMediaBlock).map((block) => block.url);
  return [...new Set(urls)];
}

/** Media URLs the target translation lacks (`missing`) or adds (`extra`)
 * compared with the source translation. A non-blocking editor warning only. */
export function findMediaMismatch(
  source?: Pick<BlogTranslationContent, "blocks"> | null,
  target?: Pick<BlogTranslationContent, "blocks"> | null,
): BlogMediaMismatch {
  const sourceUrls = mediaUrls(source);
  const targetUrls = mediaUrls(target);
  return {
    missing: sourceUrls.filter((url) => !targetUrls.includes(url)),
    extra: targetUrls.filter((url) => !sourceUrls.includes(url)),
  };
}
