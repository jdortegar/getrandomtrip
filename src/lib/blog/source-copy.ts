import type { Prisma } from "@prisma/client";
import { resolveSourceLocale } from "./legacy-translation-mapping";

/** One locale row used to flatten admin/tripper list and email titles. */
export interface SourceCopyRow {
  locale: string;
  title: string;
  subtitle?: string | null;
  tagline?: string | null;
  content?: string | null;
  blocks?: unknown;
  faq?: unknown;
  seo?: unknown;
  slug?: string | null;
}

export interface FlattenedSourceCopy {
  title: string;
  subtitle: string | null;
  tagline: string | null;
  content: string | null;
  blocks: unknown;
  faq: unknown;
  seo: unknown;
  slug: string | null;
}

export const LIST_TRANSLATION_SELECT = {
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
} as const;

export const ADMIN_LIST_TRANSLATION_SELECT = {
  locale: true,
  title: true,
  subtitle: true,
  tagline: true,
  slug: true,
} as const;

export function pickSourceRow<T extends SourceCopyRow>(
  sourceLocale: string,
  rows: T[] | null | undefined,
): T | undefined {
  const list = rows ?? [];
  const source = resolveSourceLocale(sourceLocale);
  return list.find((row) => row.locale === source) ?? list[0];
}

export function flattenSourceCopy(
  sourceLocale: string,
  rows: SourceCopyRow[],
): FlattenedSourceCopy {
  const row = pickSourceRow(sourceLocale, rows);
  return {
    title: row?.title ?? "",
    subtitle: row?.subtitle ?? null,
    tagline: row?.tagline ?? null,
    content: row?.content ?? null,
    blocks: row?.blocks ?? [],
    faq: row?.faq ?? null,
    seo: row?.seo ?? null,
    slug: row?.slug ?? null,
  };
}

/** Title search across translation rows (any locale). */
export function titleSearchWhere(search: string): Prisma.BlogPostWhereInput {
  return {
    translationRows: {
      some: {
        title: { contains: search, mode: "insensitive" },
      },
    },
  };
}
