// ============================================================================
// Blog changed-fields utility
// Computes the set of mutable fields that differ between a review copy and
// the original BlogPost. Used at send-to-tripper time to communicate what
// the admin changed. The blog analogue of src/lib/experiences/changed-fields.ts
// (a dedicated parallel implementation — field sets differ entirely).
// ============================================================================

/**
 * All mutable fields that are compared when computing changedFields.
 * Identity fields (id, authorId, createdAt, slug) are intentionally excluded,
 * as are review-mechanism fields (reviewNote, tripperNote, reviewLockedBy,
 * changedFields, isReviewCopy, parentId, isDiscarded, publishedAt).
 */
export const MUTABLE_BLOG_FIELDS = [
  "title",
  "subtitle",
  "tagline",
  "coverUrl",
  "content",
  "blocks",
  "tags",
  "travelType",
  "excuseKey",
  "format",
  "seo",
  "faq",
] as const;

export type MutableBlogField = (typeof MUTABLE_BLOG_FIELDS)[number];

/**
 * JSON-serializable fields — compared via JSON.stringify for deep equality.
 */
const JSON_FIELDS = new Set<string>(["blocks", "seo", "faq"]);

/**
 * Array fields (scalar arrays) — compared by serializing to JSON.
 */
const ARRAY_FIELDS = new Set<string>(["tags"]);

type FieldRecord = Record<string, unknown>;

function fieldEqual(field: string, a: unknown, b: unknown): boolean {
  if (JSON_FIELDS.has(field) || ARRAY_FIELDS.has(field)) {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  }
  // Scalar comparison — treat null and undefined as equivalent nullish
  if (a == null && b == null) return true;
  return a === b;
}

/**
 * Computes which mutable fields differ between `copy` and `original`.
 *
 * @param copy    - The review copy BlogPost record
 * @param original - The original BlogPost record
 * @returns       Array of field names that differ; empty array means no changes
 */
export function computeChangedFields(
  copy: FieldRecord,
  original: FieldRecord,
): string[] {
  return MUTABLE_BLOG_FIELDS.filter(
    (field) => !fieldEqual(field, copy[field], original[field]),
  );
}

/**
 * Overwrites the original BlogPost with the copy's mutable fields inside a
 * Prisma transaction. Preserves the original's `slug` (avoids @unique churn)
 * and `publishedAt` (keeps prior publish history if this is a re-publish).
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  originalId: string,
  copyId: string,
): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [copy, original] = await Promise.all([
    (tx.blogPost.findUnique as any)({ where: { id: copyId } }) as Promise<FieldRecord | null>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tx.blogPost.update as any)({
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
}
