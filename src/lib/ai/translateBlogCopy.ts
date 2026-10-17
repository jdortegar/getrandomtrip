import {
  visibleCopyText,
  type ExperienceCopyLocale,
} from "@/lib/ai/translateExperienceCopy";
import {
  emptyBlogLocaleDraft,
  getBlogLocaleView,
  pickBlogContentDraft,
} from "@/lib/helpers/blog-form";
import type { BlogEditorDraft, BlogLocaleDraft, BlogMediaBlock } from "@/types/blog";

export type BlogCopyPiece =
  | {
      html: boolean;
      key: "featureAttribution" | "featureText" | "subtitle" | "tagline" | "title";
      text: string;
    }
  | {
      html: boolean;
      id: "faq";
      index: number;
      key: "answer" | "question";
      text: string;
    }
  | {
      html: boolean;
      id: "section";
      index: number;
      key: "description" | "title";
      text: string;
    }
  | {
      html: boolean;
      id: "seo";
      key: "description" | "title";
      text: string;
    }
  | {
      html: boolean;
      id: "media";
      index: number;
      key: "caption" | "title";
      text: string;
    };

function isHtml(value: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(value);
}

function pushIfPresent(pieces: BlogCopyPiece[], piece: BlogCopyPiece) {
  if (visibleCopyText(piece.text)) pieces.push(piece);
}

/** Prose for one blog language, including media captions. */
export function collectBlogCopy(
  draft: BlogEditorDraft,
  locale: ExperienceCopyLocale,
): BlogCopyPiece[] {
  const source = getBlogLocaleView(draft, locale);
  const pieces: BlogCopyPiece[] = [];

  pushIfPresent(pieces, { html: false, key: "title", text: source.title });
  pushIfPresent(pieces, { html: false, key: "subtitle", text: source.subtitle });
  pushIfPresent(pieces, { html: false, key: "tagline", text: source.tagline ?? "" });
  pushIfPresent(pieces, { html: false, key: "featureText", text: source.featureText });
  pushIfPresent(pieces, {
    html: false,
    key: "featureAttribution",
    text: source.featureAttribution,
  });

  source.sections.forEach((section, index) => {
    pushIfPresent(pieces, {
      html: false,
      id: "section",
      index,
      key: "title",
      text: section.title,
    });
    pushIfPresent(pieces, {
      html: isHtml(section.description),
      id: "section",
      index,
      key: "description",
      text: section.description,
    });
  });

  source.faq.forEach((item, index) => {
    pushIfPresent(pieces, {
      html: false,
      id: "faq",
      index,
      key: "question",
      text: item.question,
    });
    pushIfPresent(pieces, {
      html: isHtml(item.answer),
      id: "faq",
      index,
      key: "answer",
      text: item.answer,
    });
  });

  pushIfPresent(pieces, {
    html: false,
    id: "seo",
    key: "title",
    text: source.seo?.title ?? "",
  });
  pushIfPresent(pieces, {
    html: false,
    id: "seo",
    key: "description",
    text: source.seo?.description ?? "",
  });

  (draft.translations[locale]?.media ?? []).forEach((block, index) => {
    if (block.type === "embed") {
      pushIfPresent(pieces, {
        html: false,
        id: "media",
        index,
        key: "title",
        text: block.title ?? "",
      });
      return;
    }
    pushIfPresent(pieces, {
      html: false,
      id: "media",
      index,
      key: "caption",
      text: block.caption ?? "",
    });
  });

  return pieces;
}

function translatedContent(
  source: ReturnType<typeof getBlogLocaleView>,
  pieces: BlogCopyPiece[],
): BlogLocaleDraft {
  const content = pickBlogContentDraft(source);
  content.sections = source.sections.map((section) => ({ ...section }));
  content.faq = source.faq.map((item) => ({ ...item }));
  content.seo = source.seo
    ? { ...source.seo, keywords: source.seo.keywords ? [...source.seo.keywords] : undefined }
    : undefined;

  for (const piece of pieces) {
    if ("id" in piece && piece.id === "section") {
      const section = content.sections[piece.index];
      if (section) section[piece.key] = piece.text;
      continue;
    }
    if ("id" in piece && piece.id === "faq") {
      const item = content.faq[piece.index];
      if (item) item[piece.key] = piece.text;
      continue;
    }
    if ("id" in piece && piece.id === "seo") {
      content.seo = { ...content.seo, [piece.key]: piece.text };
      continue;
    }
    if ("id" in piece && piece.id === "media") continue;
    if (!("id" in piece)) content[piece.key] = piece.text;
  }

  return content;
}

function translatedMedia(
  source: BlogMediaBlock[] | undefined,
  pieces: BlogCopyPiece[],
): BlogMediaBlock[] {
  const media = (source ?? []).map((block) => ({ ...block }));
  for (const piece of pieces) {
    if (!("id" in piece) || piece.id !== "media") continue;
    const block = media[piece.index];
    if (!block) continue;
    if (block.type === "embed" && piece.key === "title")
      media[piece.index] = { ...block, title: piece.text };
    if ((block.type === "image" || block.type === "video") && piece.key === "caption")
      media[piece.index] = { ...block, caption: piece.text };
  }
  return media;
}

/** Writes the translation into the target locale, copying media with captions. */
export function applyBlogCopy(
  draft: BlogEditorDraft,
  target: ExperienceCopyLocale,
  pieces: BlogCopyPiece[],
  from: ExperienceCopyLocale = draft.sourceLocale,
): BlogEditorDraft {
  const sourceView = getBlogLocaleView(draft, from);
  const content = translatedContent(sourceView, pieces);
  const media = translatedMedia(draft.translations[from]?.media, pieces);
  return {
    ...draft,
    translations: {
      ...draft.translations,
      [target]: {
        ...(draft.translations[target] ?? emptyBlogLocaleDraft()),
        ...content,
        media,
        original: undefined,
      },
    },
  };
}
