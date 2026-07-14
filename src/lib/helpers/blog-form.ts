import type { BlogFormDraft, BlogPost } from "@/types/blog";

type BlogBlock = BlogPost["blocks"][number];

/**
 * Tabs with no required fields are vacuously "complete" — see
 * NewBlogPostShell's completedTabIds for how this pairs with visitedTabIds
 * so an untouched optional tab doesn't show a checkmark prematurely.
 */
export function isBlogTabComplete(tabId: string, draft: BlogFormDraft): boolean {
  switch (tabId) {
    case "general":
      return !!(draft.title.trim() && draft.coverUrl.trim());
    case "content":
    case "faq":
    case "gallery":
      return true;
    default:
      return false;
  }
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

/**
 * Builds the POST/PATCH `/api/tripper/blogs` payload from a `BlogFormDraft`.
 *
 * `blocks` is the authoritative, round-trippable representation — a `quote`
 * block for the feature text, a `section` block per entry, and an `image`
 * block per gallery photo (not a dedicated `gallery` block type, so the
 * public page's existing carousel-extraction logic — which only recognizes
 * `type: "image"` — keeps working unchanged). `mapBlogPostToDraft` below
 * reads these same blocks back into a `BlogFormDraft` for editing.
 *
 * The public blog page (`src/app/[locale]/blog/[slug]/page.tsx`) still
 * renders the flat `content` HTML field directly and does not render
 * `section`/`quote` blocks, so `content` is also synthesized here from the
 * feature quote + sections to keep posts visible there without changing
 * that render pipeline.
 */
export function buildBlogSubmitPayload(draft: BlogFormDraft) {
  const contentParts: string[] = [];

  const featureText = draft.featureText.trim();
  const featureAttribution = draft.featureAttribution.trim();
  if (featureText) {
    const cite = featureAttribution ? `<cite>— ${escapeHtml(featureAttribution)}</cite>` : "";
    contentParts.push(`<blockquote>${escapeHtml(featureText)}${cite}</blockquote>`);
  }

  const nonEmptySections = draft.sections.filter(
    (s) => s.title.trim() || s.description.trim(),
  );
  for (const section of nonEmptySections) {
    if (section.title.trim()) {
      contentParts.push(`<h2>${escapeHtml(section.title.trim())}</h2>`);
    }
    // `description` is already an HTML fragment from RichTextInput (TinyMCE) —
    // same trust model as the rich-text `content` field BlogComposer already
    // stores verbatim, so it's inserted as-is (not re-escaped).
    if (section.description.trim()) {
      contentParts.push(section.description);
    }
  }

  const blocks = [
    ...(featureText
      ? [{ type: "quote" as const, text: featureText, cite: featureAttribution || undefined }]
      : []),
    ...nonEmptySections.map((s) => ({
      type: "section" as const,
      title: s.title,
      description: s.description,
    })),
    ...draft.gallery.map((url) => ({ type: "image" as const, url })),
  ];

  const nonEmptyFaq = draft.faq.filter(
    (f) => f.question.trim() || f.answer.trim(),
  );

  return {
    title: draft.title,
    subtitle: draft.subtitle.trim() ? draft.subtitle.trim() : null,
    coverUrl: draft.coverUrl || null,
    content: contentParts.length > 0 ? contentParts.join("\n") : null,
    blocks,
    faq: nonEmptyFaq.length > 0 ? { items: nonEmptyFaq } : null,
    status: draft.status,
  };
}

/**
 * Reverse of `buildBlogSubmitPayload` — maps a fetched `BlogPost` back into a
 * `BlogFormDraft` for editing in `NewBlogPostShell`.
 *
 * Posts created by this shell round-trip cleanly via the `quote`/`section`/
 * `image` blocks. Posts authored before this migration (via the old
 * `BlogComposer` free-text body) have no `section` blocks — their entire
 * `content` HTML is folded into a single section's description instead of
 * being silently dropped, so opening a legacy post here doesn't wipe it out
 * on the next autosave.
 */
export function mapBlogPostToDraft(post: Partial<BlogPost>): BlogFormDraft {
  const blocks = post.blocks ?? [];

  const quoteBlock = blocks.find(
    (b): b is Extract<BlogBlock, { type: "quote" }> => b.type === "quote",
  );
  const sectionBlocks = blocks.filter(
    (b): b is Extract<BlogBlock, { type: "section" }> => b.type === "section",
  );
  const imageBlocks = blocks.filter(
    (b): b is Extract<BlogBlock, { type: "image" }> => b.type === "image",
  );

  let sections = sectionBlocks.map((b) => ({
    title: b.title,
    description: b.description,
  }));
  if (sections.length === 0) {
    const legacyContent = post.content?.trim();
    sections = [{ title: "", description: legacyContent ?? "" }];
  }

  const faqItems = post.faq?.items;

  return {
    status: post.status ?? "draft",
    title: post.title ?? "",
    subtitle: post.subtitle ?? "",
    coverUrl: post.coverUrl ?? "",
    featureText: quoteBlock?.text ?? "",
    featureAttribution: quoteBlock?.cite ?? "",
    sections,
    faq: faqItems && faqItems.length > 0 ? faqItems : [{ question: "", answer: "" }],
    gallery: imageBlocks.map((b) => b.url),
  };
}
