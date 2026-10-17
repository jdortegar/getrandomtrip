import { z, ZodError } from "zod";
import type { ContentLocale } from "@/types/blog";
import type { ReviewTranslationRow } from "./blogRepository";
import { equalBlogJson } from "./equal-json";
import {
  computeTranslationIsComplete,
  resolveSourceLocale,
} from "./legacy-translation-mapping";
import { CONTENT_LOCALES, isContentLocale } from "./locales";
import {
  blogTranslationInputSchema,
  blogTranslationsByLocaleSchema,
} from "./translation-schema";

export type EditorTranslationInput = z.infer<typeof blogTranslationInputSchema>;

export type EditorTranslationsInput = Partial<
  Record<ContentLocale, EditorTranslationInput>
>;

export type EditorWriteErrorCode =
  | "invalid_source_locale"
  | "source_locale_incomplete";

export class EditorWriteError extends Error {
  constructor(
    readonly code: EditorWriteErrorCode,
    readonly locale?: ContentLocale,
  ) {
    super(code);
    this.name = "EditorWriteError";
  }
}

export interface EditorWriteContext {
  sourceLocale: ContentLocale;
  rows: ReviewTranslationRow[];
  isCreate?: boolean;
}

export interface EditorWriteRequest {
  translations?: EditorTranslationsInput;
  sourceLocale: ContentLocale;
  sourceLocaleChanged: boolean;
}

const LOCALIZED_BODY_KEYS = [
  "title",
  "subtitle",
  "tagline",
  "content",
  "blocks",
  "faq",
  "seo",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasLocalizedFields(body: Record<string, unknown>): boolean {
  return LOCALIZED_BODY_KEYS.some((key) => body[key] !== undefined);
}

function rowToInput(row: ReviewTranslationRow): EditorTranslationInput {
  return {
    title: row.title,
    subtitle: row.subtitle,
    tagline: row.tagline,
    content: row.content,
    blocks: Array.isArray(row.blocks) ? (row.blocks as EditorTranslationInput["blocks"]) : [],
    faq: row.faq as EditorTranslationInput["faq"],
    seo: row.seo as EditorTranslationInput["seo"],
  };
}

function overlayLegacyEs(
  body: Record<string, unknown>,
  current?: ReviewTranslationRow,
): EditorTranslationInput {
  return {
    title: typeof body.title === "string" ? body.title : (current?.title ?? ""),
    subtitle:
      body.subtitle !== undefined
        ? ((body.subtitle as string | null) ?? null)
        : (current?.subtitle ?? null),
    tagline:
      body.tagline !== undefined
        ? ((body.tagline as string | null) ?? null)
        : (current?.tagline ?? null),
    content:
      body.content !== undefined
        ? ((body.content as string | null) ?? null)
        : (current?.content ?? null),
    blocks:
      body.blocks !== undefined
        ? (body.blocks as EditorTranslationInput["blocks"])
        : Array.isArray(current?.blocks)
          ? (current.blocks as EditorTranslationInput["blocks"])
          : undefined,
    faq:
      body.faq !== undefined
        ? (body.faq as EditorTranslationInput["faq"])
        : (current?.faq as EditorTranslationInput["faq"]),
    seo:
      body.seo !== undefined
        ? (body.seo as EditorTranslationInput["seo"])
        : (current?.seo as EditorTranslationInput["seo"]),
  };
}

function legacyCreateEs(body: Record<string, unknown>): EditorTranslationInput {
  const input: EditorTranslationInput = {
    title: typeof body.title === "string" ? body.title : "",
  };
  if (body.subtitle !== undefined)
    input.subtitle = (body.subtitle as string | null) ?? null;
  if (body.tagline !== undefined)
    input.tagline = (body.tagline as string | null) ?? null;
  if (body.content !== undefined)
    input.content = (body.content as string | null) ?? null;
  if (body.blocks !== undefined)
    input.blocks = body.blocks as EditorTranslationInput["blocks"];
  if (body.faq !== undefined) input.faq = body.faq as EditorTranslationInput["faq"];
  if (body.seo !== undefined) input.seo = body.seo as EditorTranslationInput["seo"];
  return input;
}

function parseSourceLocale(value: unknown): ContentLocale | undefined {
  if (value === undefined) return undefined;
  if (!isContentLocale(value))
    throw new EditorWriteError("invalid_source_locale");
  return value;
}

function sourcePresent(
  translations: EditorTranslationsInput,
  locale: ContentLocale,
): boolean {
  return translations[locale] !== undefined;
}

function sourceCompleteAfter(
  translations: EditorTranslationsInput | undefined,
  rows: ReviewTranslationRow[],
  locale: ContentLocale,
): boolean {
  const planned = planEditorTranslations(translations ?? {}, rows, locale);
  return !!planned.find((row) => row.locale === locale)?.isComplete;
}

export function editorWriteErrorBody(error: EditorWriteError): {
  error: EditorWriteErrorCode;
  locale?: ContentLocale;
  message: string;
} {
  const messages: Record<EditorWriteErrorCode, string> = {
    invalid_source_locale: "Unsupported source locale.",
    source_locale_incomplete: "The source locale must have a complete translation.",
  };
  return {
    error: error.code,
    ...(error.locale ? { locale: error.locale } : {}),
    message: messages[error.code],
  };
}

/** Discriminates the editor by-locale body from the legacy flat POST/PATCH
 * used by NewExperienceShell: `translations` present → new shape; absent →
 * map top-level fields to `es` on create, or overlay the current `es` row
 * (keeping other locales) on update. Neither → rows stay untouched. */
export function parseEditorWriteRequest(
  body: unknown,
  context: EditorWriteContext,
): EditorWriteRequest {
  if (!isRecord(body)) {
    throw new EditorWriteError("invalid_source_locale");
  }

  const sourceLocale = parseSourceLocale(body.sourceLocale) ?? context.sourceLocale;
  const sourceLocaleChanged = sourceLocale !== context.sourceLocale;

  let translations: EditorTranslationsInput | undefined;
  if (body.translations !== undefined) {
    try {
      translations = blogTranslationsByLocaleSchema.parse(body.translations);
    } catch (error) {
      if (error instanceof ZodError) throw error;
      throw error;
    }
  } else if (context.isCreate && hasLocalizedFields(body)) {
    translations = { es: legacyCreateEs(body) };
  } else if (!context.isCreate && hasLocalizedFields(body)) {
    const currentEs = context.rows.find((row) => row.locale === "es");
    translations = { es: overlayLegacyEs(body, currentEs) };
    for (const row of context.rows) {
      if (row.locale === "es" || !isContentLocale(row.locale)) continue;
      translations[row.locale] = rowToInput(row);
    }
  }

  if (context.isCreate) {
    if (!sourcePresent(translations ?? {}, sourceLocale))
      throw new EditorWriteError("source_locale_incomplete", sourceLocale);
  } else if (
    sourceLocaleChanged &&
    !sourceCompleteAfter(translations, context.rows, sourceLocale)
  ) {
    throw new EditorWriteError("source_locale_incomplete", sourceLocale);
  }

  return {
    translations,
    sourceLocale,
    sourceLocaleChanged,
  };
}

export function planEditorTranslations(
  translations: EditorTranslationsInput,
  current: ReviewTranslationRow[],
  sourceLocale: ContentLocale,
): ReviewTranslationRow[] {
  const rows: ReviewTranslationRow[] = [];
  for (const locale of CONTENT_LOCALES) {
    const input = translations[locale];
    if (input) {
      const data = {
        title: input.title,
        subtitle: input.subtitle ?? null,
        tagline: input.tagline ?? null,
        content: input.content ?? null,
        blocks: input.blocks ?? [],
        faq: input.faq ?? null,
        seo: input.seo ?? null,
      };
      rows.push({
        locale,
        ...data,
        isComplete: computeTranslationIsComplete(data),
      });
      continue;
    }
    if (locale !== sourceLocale) continue;
    const kept = current.find((row) => row.locale === locale);
    if (kept)
      rows.push({
        ...kept,
        isComplete: computeTranslationIsComplete(kept),
      });
  }
  return rows;
}

export function translationsChanged(
  translations: EditorTranslationsInput,
  current: ReviewTranslationRow[],
  sourceLocale: ContentLocale,
): boolean {
  const planned = planEditorTranslations(translations, current, sourceLocale);
  if (planned.length !== current.length) return true;
  return planned.some((row) => {
    const before = current.find((candidate) => candidate.locale === row.locale);
    if (!before) return true;
    return !equalBlogJson(
      {
        title: before.title,
        subtitle: before.subtitle,
        tagline: before.tagline,
        content: before.content,
        blocks: before.blocks,
        faq: before.faq,
        seo: before.seo,
      },
      {
        title: row.title,
        subtitle: row.subtitle,
        tagline: row.tagline,
        content: row.content,
        blocks: row.blocks,
        faq: row.faq,
        seo: row.seo,
      },
    );
  });
}

export { resolveSourceLocale };

export interface LoadedTranslationRow {
  locale: string;
  title: string;
  subtitle?: string | null;
  tagline?: string | null;
  content?: string | null;
  blocks?: unknown;
  faq?: unknown;
  seo?: unknown;
  isComplete?: boolean;
}

/** Rows already on the post. Empty when the post has no translation rows. */
export function rowsFromLoadedPost(post: {
  translationRows?: LoadedTranslationRow[] | null;
}): ReviewTranslationRow[] {
  const stored = post.translationRows ?? [];
  return stored
    .filter((row) => isContentLocale(row.locale))
    .sort((a, b) => localeRank(a.locale) - localeRank(b.locale))
    .map((row) => {
      const data = {
        title: row.title,
        subtitle: row.subtitle ?? null,
        tagline: row.tagline ?? null,
        content: row.content ?? null,
        blocks: Array.isArray(row.blocks) ? row.blocks : [],
        faq: row.faq ?? null,
        seo: row.seo ?? null,
      };
      return {
        locale: row.locale,
        ...data,
        isComplete: row.isComplete ?? computeTranslationIsComplete(data),
      };
    });
}

function localeRank(locale: string): number {
  const index = CONTENT_LOCALES.indexOf(locale as ContentLocale);
  return index === -1 ? CONTENT_LOCALES.length : index;
}
