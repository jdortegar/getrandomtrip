import {
  sourceLocaleFor,
  visibleCopyText,
  type ExperienceCopyLocale,
} from "@/lib/ai/translateExperienceCopy";
import { getBlogLocaleDraft, pickBlogContentDraft } from "@/lib/helpers/blog-form";
import type { BlogContentDraft, BlogFormDraft } from "@/types/blog";

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
    };

function isHtml(value: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(value);
}

function pushIfPresent(pieces: BlogCopyPiece[], piece: BlogCopyPiece) {
  if (visibleCopyText(piece.text)) pieces.push(piece);
}

/** Prose for one blog language. Images, categories, and workflow fields stay shared. */
export function collectBlogCopy(
  draft: BlogFormDraft,
  locale: ExperienceCopyLocale,
): BlogCopyPiece[] {
  const source = getBlogLocaleDraft(draft, locale);
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

  return pieces;
}

function translatedContent(
  source: BlogFormDraft,
  pieces: BlogCopyPiece[],
): BlogContentDraft {
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
    if (!("id" in piece)) content[piece.key] = piece.text;
  }

  return content;
}

/** Writes the translation into Spanish canonical fields or the English draft. */
export function applyBlogCopy(
  draft: BlogFormDraft,
  target: ExperienceCopyLocale,
  pieces: BlogCopyPiece[],
): BlogFormDraft {
  const content = translatedContent(getBlogLocaleDraft(draft, sourceLocaleFor(target)), pieces);
  const { originalPost: _originalPost, ...english } = content;

  if (target === "en") return { ...draft, english };

  return {
    ...draft,
    faq: content.faq,
    featureAttribution: content.featureAttribution,
    featureText: content.featureText,
    sections: content.sections,
    seo: content.seo,
    subtitle: content.subtitle,
    tagline: content.tagline,
    title: content.title,
  };
}
