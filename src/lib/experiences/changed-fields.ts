// ============================================================================
// Experience changed-fields utility
// Computes the set of mutable fields that differ between a review copy and
// the original experience. Used at send-to-tripper time to communicate what
// the admin changed.
// ============================================================================

/**
 * All mutable fields that are compared when computing changedFields.
 * Identity fields (id, ownerId, createdAt, slug) are intentionally excluded.
 * Admin-only fields (pricingByType, reviewNote) are included because the admin
 * may adjust them in the copy.
 */
export const MUTABLE_EXPERIENCE_FIELDS = [
  "title",
  "teaser",
  "description",
  "type",
  "level",
  "heroImage",
  "tags",
  "destinationCountry",
  "destinationCity",
  "excuseKey",
  "minNights",
  "maxNights",
  "minPax",
  "maxPax",
  "pricingByType",
  "hotels",
  "activities",
  "itinerary",
  "inclusions",
  "exclusions",
  "accommodationType",
  "transport",
  "climate",
  "maxTravelTime",
  "departPref",
  "arrivePref",
  "season",
  "highlights",
  // XSED fields
  "titleInternal",
  "tripDate",
  "revealAt",
  "minSpots",
  "maxSpots",
  "cancellationPolicy",
  "weatherPolicy",
  "accessibilityNotes",
  "safetyNotes",
  "revealCopy",
  "preRevealCopy",
  "packingHints",
  "whatsappMessageTemplate",
  "adminNotes",
  "supplierNotes",
] as const;

export type MutableExperienceField = (typeof MUTABLE_EXPERIENCE_FIELDS)[number];

/**
 * JSON-serializable fields — compared via JSON.stringify for deep equality.
 */
const JSON_FIELDS = new Set<string>([
  "hotels",
  "activities",
  "itinerary",
  "inclusions",
  "exclusions",
  "pricingByType",
]);

/**
 * Array fields (scalar arrays) — compared by serializing to JSON.
 */
const ARRAY_FIELDS = new Set<string>([
  "type",
  "tags",
  "excuseKey",
  "season",
  "highlights",
]);

type FieldRecord = Record<string, unknown>;

function fieldEqual(field: string, a: unknown, b: unknown): boolean {
  if (JSON_FIELDS.has(field) || ARRAY_FIELDS.has(field)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  // Scalar comparison — treat null and undefined as equivalent nullish
  if (a == null && b == null) return true;
  return a === b;
}

/**
 * Computes which mutable fields differ between `copy` and `original`.
 *
 * @param copy    - The review copy experience record
 * @param original - The original experience record
 * @returns       Array of field names that differ; empty array means no changes
 */
export function computeChangedFields(
  copy: FieldRecord,
  original: FieldRecord,
): string[] {
  return MUTABLE_EXPERIENCE_FIELDS.filter(
    (field) => !fieldEqual(field, copy[field], original[field]),
  );
}

/**
 * Overwrites the original experience with the copy's mutable fields inside
 * a Prisma transaction.
 *
 * Preserved fields: id, ownerId, createdAt, slug, isReviewCopy, parentId,
 *                   reviewLockedBy, reviewNote, changedFields.
 *
 * @param tx          - Prisma transaction client
 * @param originalId  - ID of the original experience to overwrite
 * @param copyId      - ID of the review copy to read from
 * @returns           The updated original experience record
 */
export async function overwriteOriginalWithCopy(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  originalId: string,
  copyId: string,
): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const copy = await (tx.experience.findUnique as any)({
    where: { id: copyId },
  }) as FieldRecord | null;

  if (!copy) {
    throw new Error(`Review copy ${copyId} not found`);
  }

  // Build the overwrite payload — only mutable fields, excluding slug
  const overwriteData: FieldRecord = {};
  for (const field of MUTABLE_EXPERIENCE_FIELDS) {
    if (field in copy) {
      overwriteData[field] = copy[field];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tx.experience.update as any)({
    where: { id: originalId },
    data: {
      ...overwriteData,
      status: "ACTIVE",
      isActive: true,
      isReviewCopy: false,
      parentId: null,
      reviewLockedBy: null,
      reviewNote: null,
      changedFields: [],
    },
  });
}
