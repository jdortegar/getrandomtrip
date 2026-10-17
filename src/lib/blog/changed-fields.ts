import { equalBlogJson } from "./equal-json";
import { CONTENT_LOCALES } from "./locales";
import { LOCALIZED_BLOG_FIELDS, type LocalizedBlogField } from "./review-fields";
import {
  overwriteTranslationsFromCopy,
  type ReviewPostSnapshot,
} from "./blogRepository";
// ============================================================================
// Blog changed-fields utility
// Computes the set of fields that differ between a review copy and the
// original BlogPost. Used at send-to-tripper time to communicate what the
// admin changed. The blog analogue of src/lib/experiences/changed-fields.ts
// (a dedicated parallel implementation — field sets differ entirely).
//
// Tokens: shared post fields keep their bare name (`coverUrl`,
// `sourceLocale`); localized fields are compared per translation row and
// emitted as `<locale>.<field>` (`es.title`, `en.blocks`), or `<locale>.*`
// when the locale exists on only one side.
// ============================================================================

/**
 * Legacy BlogPost columns copied onto the original on approval (dual-write
 * until the contract rollout). Identity fields (id, authorId, createdAt,
 * slug) are intentionally excluded, as are review-mechanism fields
 * (reviewNote, tripperNote, reviewLockedBy, changedFields, isReviewCopy,
 * parentId, isDiscarded, publishedAt).
 */
export const MUTABLE_BLOG_FIELDS = [
  "title",
  "subtitle",
  "tagline",
  "coverUrl",
  "content",
  "blocks",
  "translations",
  "tags",
  "travelType",
  "excuseKey",
  "level",
  "label",
  "format",
  "seo",
  "faq",
  "sourceLocale",
] as const;

export type MutableBlogField = (typeof MUTABLE_BLOG_FIELDS)[number];

/** Post-level fields shared by every locale, diffed on the BlogPost itself. */
export const SHARED_BLOG_FIELDS = [
  "coverUrl",
  "tags",
  "travelType",
  "excuseKey",
  "level",
  "label",
  "format",
  "sourceLocale",
] as const;

/** Compared canonically: key-order-insensitive (JSONB reorders keys). */
const JSON_FIELDS = new Set<string>([
  "blocks",
  "seo",
  "faq",
  "tags",
  "travelType",
  "excuseKey",
]);

type FieldRecord = Record<string, unknown>;

type LocaleRow = { locale: string } & Partial<Record<LocalizedBlogField, unknown>>;

export interface ReviewTranslationRows {
  copy: LocaleRow[];
  original: LocaleRow[];
}

function fieldEqual(field: string, a: unknown, b: unknown): boolean {
  if (JSON_FIELDS.has(field)) return equalBlogJson(a, b);
  // Scalar comparison — treat null and undefined as equivalent nullish
  if (a == null && b == null) return true;
  return a === b;
}

function localizedTokens(rows: ReviewTranslationRows): string[] {
  return CONTENT_LOCALES.flatMap((locale) => {
    const copy = rows.copy.find((row) => row.locale === locale);
    const original = rows.original.find((row) => row.locale === locale);
    if (!copy && !original) return [];
    if (!copy || !original) return [`${locale}.*`];
    return LOCALIZED_BLOG_FIELDS.filter(
      (field) => !fieldEqual(field, copy[field], original[field]),
    ).map((field) => `${locale}.${field}`);
  });
}

/**
 * Computes the changedFields tokens between `copy` and `original`: shared
 * fields first, then `<locale>.<field>` tokens in `CONTENT_LOCALES` order.
 *
 * @param copy     - The review copy BlogPost record
 * @param original - The original BlogPost record
 * @param rows     - Translation rows of both posts (`loadTranslationsForReview`)
 * @returns        Tokens that differ; empty array means no changes
 */
export function computeChangedFields(
  copy: FieldRecord,
  original: FieldRecord,
  rows: ReviewTranslationRows,
): string[] {
  const shared = SHARED_BLOG_FIELDS.filter(
    (field) => !fieldEqual(field, copy[field], original[field]),
  );
  return [...shared, ...localizedTokens(rows)];
}

/**
 * Overwrites the original BlogPost with the copy inside a Prisma
 * transaction: the legacy columns (incl. `sourceLocale`) first, then the
 * translation rows per locale (original slugs kept, source translation
 * required to be complete — throwing rolls the caller's transaction back).
 * Preserves the original's `slug` (avoids @unique churn) and `publishedAt`
 * (keeps prior publish history if this is a re-publish).
 *
 * Preserved fields: id, authorId, createdAt, slug, isReviewCopy, parentId,
 *                    reviewLockedBy, reviewNote, changedFields.
 *
 * @param tx          - Prisma transaction client
 * @param originalId  - ID of the original BlogPost to overwrite
 * @param copyId      - ID of the review copy to read from
 * @returns           The updated original BlogPost record
 */
export async function overwriteOriginalWithCopy(

  tx: any,
  originalId: string,
  copyId: string,
): Promise<unknown> {

  const [copy, original] = await Promise.all([
    (tx.blogPost.findUnique as any)({ where: { id: copyId } }) as Promise<FieldRecord | null>,

    (tx.blogPost.findUnique as any)({ where: { id: originalId } }) as Promise<
      (FieldRecord & { publishedAt: Date | null }) | null
    >,
  ]);

  if (!copy) {
    throw new Error(`Review copy ${copyId} not found`);
  }
  if (!original) {
    throw new Error(`Original blog post ${originalId} not found`);
  }

  // Build the overwrite payload — only mutable fields, excluding slug
  const overwriteData: FieldRecord = {};
  for (const field of MUTABLE_BLOG_FIELDS) {
    if (field in copy) {
      overwriteData[field] = copy[field];
    }
  }


  const updated = await (tx.blogPost.update as any)({
    where: { id: originalId },
    data: {
      ...overwriteData,
      status: "PUBLISHED",
      isActive: true,
      publishedAt: original.publishedAt ?? new Date(),
      isReviewCopy: false,
      parentId: null,
      reviewLockedBy: null,
      reviewNote: null,
      changedFields: [],
    },
  });

  await overwriteTranslationsFromCopy(
    tx,
    originalId,
    copy as unknown as ReviewPostSnapshot,
    { requireCompleteSource: true },
  );

  return updated;
}
