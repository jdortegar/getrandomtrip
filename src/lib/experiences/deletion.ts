import { prisma } from "@/lib/prisma";

/** Statuses where a review decision is pending — the experience can't be deleted mid-review. */
const REVIEW_LOCKED_STATUSES = new Set(["PENDING_REVIEW", "PENDING_TRIPPER_REVIEW"]);

export type ExperienceDeleteBlockReason = "has_bookings" | "in_review";

export type ExperienceDeleteResult =
  | { ok: true }
  | { ok: false; reason: ExperienceDeleteBlockReason | "not_found" };

/**
 * Single hard-delete rule shared by tripper and admin: an experience can be
 * deleted only while nobody has booked it and no review decision is pending.
 * Once booked, TripRequest.experienceId (onDelete: SetNull) would silently lose
 * its experience — those must be archived/deactivated instead.
 */
export function canHardDeleteExperience(input: {
  status: string;
  tripRequestCount: number;
  /** Review copies are removed with their original, never on their own. */
  isReviewCopy?: boolean;
}): boolean {
  return (
    !input.isReviewCopy &&
    input.tripRequestCount === 0 &&
    !REVIEW_LOCKED_STATUSES.has(input.status)
  );
}

/** Prisma select fragment list queries add so `withCanDelete` can evaluate the rule. */
export const EXPERIENCE_TRIP_REQUEST_COUNT_SELECT = {
  _count: { select: { tripRequests: true } },
} as const;

/** Swaps a list row's `_count.tripRequests` for the `canDelete` flag the UI renders. */
export function withCanDelete<
  T extends { status: string; isReviewCopy?: boolean; _count: { tripRequests: number } },
>(
  row: T,
): Omit<T, "_count"> & { canDelete: boolean } {
  const { _count, ...rest } = row;
  return {
    ...rest,
    canDelete: canHardDeleteExperience({
      status: row.status,
      tripRequestCount: _count.tripRequests,
      isReviewCopy: row.isReviewCopy,
    }),
  };
}

/**
 * Re-checks the rule inside a transaction and deletes the experience plus its
 * review copies (linked only by parentId, no FK cascade). The row is locked
 * FOR UPDATE first: a concurrent booking (TripRequest FK insert needs a KEY
 * SHARE lock on it) or a status change to review waits until this commits, so
 * nothing can slip in between the check and the delete. Callers handle auth
 * and ownership before calling this.
 */
export async function deleteExperienceIfAllowed(id: string): Promise<ExperienceDeleteResult> {
  return prisma.$transaction(async (tx) => {
    const [experience] = await tx.$queryRaw<
      { id: string; status: string; isReviewCopy: boolean }[]
    >`SELECT id, status, "isReviewCopy" FROM experiences WHERE id = ${id} FOR UPDATE`;
    if (!experience || experience.isReviewCopy) return { ok: false, reason: "not_found" };

    if (REVIEW_LOCKED_STATUSES.has(experience.status)) {
      return { ok: false, reason: "in_review" };
    }
    const tripRequestCount = await tx.tripRequest.count({ where: { experienceId: id } });
    if (tripRequestCount > 0) return { ok: false, reason: "has_bookings" };

    await tx.experience.deleteMany({ where: { parentId: id, isReviewCopy: true } });
    await tx.experience.delete({ where: { id } });
    return { ok: true };
  });
}
