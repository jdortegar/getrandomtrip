import type {
  BlogBlock,
  BlogEditorDraft,
  BlogEditorPayload,
  BlogEditorPost,
  BlogEditorTranslation,
  BlogFormDraft,
  BlogLocaleDraft,
  BlogMediaBlock,
  BlogPost,
  BlogStatus,
  BlogTranslationContent,
  BlogTranslationInput,
  ContentLocale,
} from "@/types/blog";
import { resolveSourceLocale } from "@/lib/blog/legacy-translation-mapping";
import { CONTENT_LOCALES, isContentLocale } from "@/lib/blog/locales";

/**
 * Submission completeness gate for the tripper "submit for review" action.
 * Mirrors `getExperienceCompleteness` — pure function, no DOM/client deps.
 * The server maps the DB row into this shape before calling (subtitle/tags/
 * faq/gallery/sections are optional and not checked here).
 */
export function getBlogCompleteness(
  draft: Pick<BlogFormDraft, "title" | "coverUrl"> & { content?: string | null },
): { complete: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!draft.title?.trim()) missing.push("title");
  if (!draft.coverUrl?.trim()) missing.push("coverUrl");
  if (!draft.content?.trim()) missing.push("content");

  return { complete: missing.length === 0, missing };
}

export function isBlogTabComplete(tabId: string, draft: BlogFormDraft): boolean {
  switch (tabId) {
    case "general":
      return !!(draft.title.trim() && draft.coverUrl.trim());
    case "content":
      return (
        !!draft.featureText.trim() ||
        draft.sections.some((s) => s.title.trim() || s.description.trim())
      );
    case "faq":
      return draft.faq.length > 0 && draft.faq.every((f) => f.question.trim() && f.answer.trim());
    case "gallery":
      return true;
    default:
      return false;
  }
}

/** Optional FAQ content affects its checkmark, never navigation/submission. */
export function isBlogTabEligible(tabId: string, draft: BlogFormDraft): boolean {
  return tabId === "faq" || isBlogTabComplete(tabId, draft);
}

export function getMissingBlogFields(
  tabId: string,
  draft: BlogFormDraft,
  labels: Record<string, string>,
): string[] {
  const missing: string[] = [];
  if (tabId === "general") {
    if (!draft.title.trim()) missing.push(labels.title ?? "Title");
    if (!draft.coverUrl.trim()) missing.push(labels.coverImage ?? "Cover image");
  }
  return missing;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isMediaBlock(block: BlogBlock): block is BlogMediaBlock {
  return block.type === "image" || block.type === "video" || block.type === "embed";
}

export function emptyBlogLocaleDraft(): BlogLocaleDraft {
  return {
    title: "",
    subtitle: "",
    featureText: "",
    featureAttribution: "",
    sections: [{ title: "", description: "" }],
    faq: [{ question: "", answer: "" }],
  };
}

export function emptyBlogEditorDraft(
  sourceLocale: ContentLocale = "es",
): BlogEditorDraft {
  return {
    sourceLocale,
    translations: { [sourceLocale]: emptyBlogLocaleDraft() },
    status: "draft",
    coverUrl: "",
    gallery: [],
    travelType: [],
    excuseKey: [],
    level: "",
    label: "",
    tripperNote: null,
  };
}

/** Lifts a flat single-locale form draft into editor state (legacy callers / tests). */
export function editorDraftFromForm(
  form: BlogFormDraft,
  sourceLocale: ContentLocale = "es",
): BlogEditorDraft {
  return {
    ...emptyBlogEditorDraft(sourceLocale),
    translations: { [sourceLocale]: pickBlogContentDraft(form) },
    status: form.status,
    coverUrl: form.coverUrl,
    gallery: form.gallery,
    travelType: form.travelType,
    excuseKey: form.excuseKey,
    level: form.level,
    label: form.label,
    tripperNote: form.tripperNote,
  };
}

export function coerceEditorDraft(
  draft: BlogEditorDraft | BlogFormDraft,
  fallbackSource: ContentLocale,
): BlogEditorDraft {
  if ("translations" in draft && draft.translations) return draft;
  return editorDraftFromForm(draft as BlogFormDraft, fallbackSource);
}

export function pickBlogContentDraft(draft: BlogFormDraft): BlogLocaleDraft {
  return {
    title: draft.title,
    subtitle: draft.subtitle,
    featureText: draft.featureText,
    featureAttribution: draft.featureAttribution,
    sections: draft.sections,
    faq: draft.faq,
    tagline: draft.tagline,
    seo: draft.seo,
  };
}

export const BLOG_LOCALIZED_DRAFT_FIELDS = new Set<keyof BlogFormDraft>([
  "title",
  "subtitle",
  "featureText",
  "featureAttribution",
  "sections",
  "faq",
  "tagline",
  "seo",
]);

function galleryFromBlocks(blocks: BlogBlock[]): string[] {
  return blocks.filter((block): block is Extract<BlogBlock, { type: "image" }> => block.type === "image")
    .map((block) => block.url);
}

function mediaFromBlocks(blocks: BlogBlock[]): BlogMediaBlock[] {
  return blocks.filter(isMediaBlock);
}

function mapContentToLocaleDraft(
  post: Partial<BlogTranslationContent> & { blocks?: BlogBlock[] },
): BlogLocaleDraft {
  const blocks = post.blocks ?? [];
  const quoteBlock = blocks.find(
    (b): b is Extract<BlogBlock, { type: "quote" }> => b.type === "quote",
  );
  const sectionBlocks = blocks.filter(
    (b): b is Extract<BlogBlock, { type: "section" }> => b.type === "section",
  );
  let sections = sectionBlocks.map((b) => ({
    title: b.title,
    description: b.description,
  }));
  if (sections.length === 0 && blocks.length === 0) {
    const legacyContent = post.content?.trim();
    sections = [{ title: "", description: legacyContent ?? "" }];
  }
  const faqItems = post.faq?.items;
  return {
    title: post.title ?? "",
    subtitle: post.subtitle ?? "",
    featureText: quoteBlock?.text ?? "",
    featureAttribution: quoteBlock?.cite ?? "",
    sections,
    faq: faqItems && faqItems.length > 0 ? faqItems : [{ question: "", answer: "" }],
    tagline: post.tagline ?? undefined,
    seo: post.seo ?? undefined,
    original: {
      title: post.title ?? "",
      subtitle: post.subtitle,
      tagline: post.tagline,
      content: post.content,
      blocks: post.blocks,
      faq: post.faq,
      seo: post.seo,
    },
    media: mediaFromBlocks(blocks),
  };
}

function isEditorPost(
  post: Partial<BlogPost> | BlogEditorPost,
): post is BlogEditorPost {
  const translations = (post as BlogEditorPost).translations;
  return !!translations && ("es" in translations || "en" in translations) &&
    !!(translations.es?.isComplete !== undefined || translations.en?.isComplete !== undefined ||
      translations.es?.slug !== undefined || translations.en?.slug !== undefined);
}

/** Maps a fetched post (`getForEditor` or a flattened public shape) into editor state. */
export function mapBlogPostToDraft(
  post: Partial<BlogPost> | BlogEditorPost,
): BlogEditorDraft {
  if (isEditorPost(post)) return mapEditorPostToDraft(post);

  const sourceLocale = resolveSourceLocale(
    (post as Partial<BlogPost> & { sourceLocale?: unknown }).sourceLocale,
  );
  const es = mapContentToLocaleDraft(post);
  const translations: BlogEditorDraft["translations"] = { es };
  const english = post.translations?.en;
  if (english)
    translations.en = mapContentToLocaleDraft({
      ...english,
      blocks: english.blocks ?? [],
    });
  return {
    sourceLocale,
    translations,
    status: (post.status?.toLowerCase() ?? "draft") as BlogStatus,
    coverUrl: post.coverUrl ?? "",
    gallery: galleryFromBlocks(post.blocks ?? []),
    travelType: post.travelType ?? [],
    excuseKey: post.excuseKey ?? [],
    level: post.level ?? "",
    label: post.label ?? "",
    tripperNote: post.tripperNote ?? null,
  };
}

export function mapEditorPostToDraft(post: BlogEditorPost): BlogEditorDraft {
  const translations: BlogEditorDraft["translations"] = {};
  const translationMeta: NonNullable<BlogEditorDraft["translationMeta"]> = {};
  for (const locale of CONTENT_LOCALES) {
    const row = post.translations[locale];
    if (!row) continue;
    translations[locale] = mapContentToLocaleDraft(row);
    translationMeta[locale] = { slug: row.slug, isComplete: row.isComplete };
  }
  const source = translations[post.sourceLocale];
  const gallery = source?.media
    ? source.media.filter((block) => block.type === "image").map((block) => block.url)
    : [];
  return {
    sourceLocale: post.sourceLocale,
    translations,
    translationMeta,
    publishedAt: post.publishedAt,
    isReviewCopy: post.isReviewCopy,
    status: (post.status.toLowerCase() ?? "draft") as BlogStatus,
    coverUrl: post.coverUrl ?? "",
    gallery,
    travelType: post.travelType,
    excuseKey: post.excuseKey,
    level: post.level ?? "",
    label: post.label ?? "",
    tripperNote: post.tripperNote,
  };
}

/** Flat single-locale view for the step components. */
export function getBlogLocaleView(
  draft: BlogEditorDraft,
  locale: string,
): BlogFormDraft {
  const copy =
    (isContentLocale(locale) && draft.translations?.[locale]) || emptyBlogLocaleDraft();
  return {
    status: draft.status,
    title: copy.title,
    subtitle: copy.subtitle,
    coverUrl: draft.coverUrl,
    featureText: copy.featureText,
    featureAttribution: copy.featureAttribution,
    sections: copy.sections,
    faq: copy.faq,
    gallery: draft.gallery,
    travelType: draft.travelType,
    excuseKey: draft.excuseKey,
    level: draft.level,
    label: draft.label,
    tripperNote: draft.tripperNote,
    tagline: copy.tagline,
    seo: copy.seo,
  };
}

export const getBlogLocaleDraft = getBlogLocaleView;

function buildLocaleInput(
  locale: BlogLocaleDraft,
  gallery: string[],
): BlogTranslationInput {
  const contentParts: string[] = [];
  const featureText = locale.featureText.trim();
  const featureAttribution = locale.featureAttribution.trim();
  if (featureText) {
    const cite = featureAttribution ? `<cite>— ${escapeHtml(featureAttribution)}</cite>` : "";
    contentParts.push(`<blockquote>${escapeHtml(featureText)}${cite}</blockquote>`);
  }
  const nonEmptySections = locale.sections.filter(
    (s) => s.title.trim() || s.description.trim(),
  );
  for (const section of nonEmptySections) {
    if (section.title.trim())
      contentParts.push(`<h2>${escapeHtml(section.title.trim())}</h2>`);
    if (section.description.trim()) contentParts.push(section.description);
  }

  const media: BlogBlock[] = locale.media?.length
    ? locale.media.filter(
        (block) => block.type !== "image" || gallery.includes(block.url),
      ).concat(
        gallery
          .filter((url) => !locale.media?.some((block) => block.type === "image" && block.url === url))
          .map((url) => ({ type: "image" as const, url })),
      )
    : gallery.map((url) => ({ type: "image" as const, url }));

  let blocks: BlogBlock[] = [
    ...(featureText
      ? [{ type: "quote" as const, text: featureText, cite: featureAttribution || undefined }]
      : []),
    ...nonEmptySections.map((s) => ({
      type: "section" as const,
      title: s.title,
      description: s.description,
    })),
    ...media,
  ];

  const original = locale.original;
  const baseline = original ? mapContentToLocaleDraft(original) : null;
  const bodyUnchanged =
    baseline &&
    ["featureText", "featureAttribution", "sections"].every(
      (key) =>
        JSON.stringify(locale[key as keyof BlogLocaleDraft]) ===
        JSON.stringify(baseline[key as keyof BlogLocaleDraft]),
    );
  if (bodyUnchanged && original?.blocks) {
    const originalGallery = galleryFromBlocks(original.blocks as BlogBlock[]);
    blocks =
      JSON.stringify(gallery) === JSON.stringify(originalGallery)
        ? (original.blocks as BlogBlock[])
        : [
            ...(original.blocks as BlogBlock[]).filter((block) => block.type !== "image"),
            ...gallery.map(
              (url) =>
                (original.blocks as BlogBlock[]).find(
                  (block) => block.type === "image" && block.url === url,
                ) ?? { type: "image" as const, url },
            ),
          ];
  }

  const nonEmptyFaq = locale.faq.filter((f) => f.question.trim() || f.answer.trim());
  return {
    title: locale.title,
    subtitle:
      baseline && locale.subtitle === baseline.subtitle
        ? original?.subtitle ?? null
        : locale.subtitle.trim()
          ? locale.subtitle.trim()
          : null,
    tagline: locale.tagline,
    content: bodyUnchanged
      ? original?.content ?? null
      : contentParts.length > 0
        ? contentParts.join("\n")
        : null,
    blocks,
    faq:
      baseline && JSON.stringify(locale.faq) === JSON.stringify(baseline.faq)
        ? original?.faq ?? null
        : nonEmptyFaq.length > 0
          ? { items: nonEmptyFaq }
          : null,
    seo: locale.seo,
  };
}

/** POST/PATCH payload: translations keyed by locale plus shared fields. */
export function buildBlogSubmitPayload(draft: BlogEditorDraft): BlogEditorPayload {
  const translations: BlogEditorPayload["translations"] = {};
  for (const locale of CONTENT_LOCALES) {
    const localeDraft = draft.translations[locale];
    if (!localeDraft) continue;
    translations[locale] = buildLocaleInput(localeDraft, draft.gallery);
  }
  return {
    sourceLocale: draft.sourceLocale,
    translations,
    coverUrl: draft.coverUrl || null,
    travelType: draft.travelType,
    excuseKey: draft.excuseKey,
    level: draft.level || null,
    label: draft.label.trim() || null,
    tripperNote: draft.tripperNote ?? null,
  };
}

export function syncGalleryAcrossLocales(
  translations: BlogEditorDraft["translations"],
  gallery: string[],
): BlogEditorDraft["translations"] {
  const next: BlogEditorDraft["translations"] = {};
  for (const locale of CONTENT_LOCALES) {
    const current = translations[locale];
    if (!current) continue;
    const kept = (current.media ?? []).filter(
      (block) => block.type !== "image" || gallery.includes(block.url),
    );
    const added = gallery
      .filter((url) => !kept.some((block) => block.type === "image" && block.url === url))
      .map((url) => ({ type: "image" as const, url }));
    next[locale] = { ...current, media: [...kept, ...added] };
  }
  return next;
}

export function editorTranslationToContent(
  row: BlogEditorTranslation,
): BlogTranslationContent {
  return {
    title: row.title,
    subtitle: row.subtitle,
    tagline: row.tagline,
    content: row.content,
    blocks: row.blocks,
    faq: row.faq,
    seo: row.seo,
  };
}
