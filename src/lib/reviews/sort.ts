import type { Prisma } from "@prisma/client";

/**
 * The first sort convention in this codebase — the tokens, whitelists,
 * default, and the token -> Prisma `orderBy` mapper used by both reviews
 * surfaces (tripper's own reviews page and the admin reviews table).
 *
 * Prisma is imported type-only so this module stays importable from client
 * components without pulling the Prisma runtime into the client bundle.
 */

export const REVIEW_SORT_FIELDS = ["rating", "created", "traveler", "tripper"] as const;
export const TRIPPER_REVIEW_SORT_FIELDS = ["rating", "created"] as const;
export const ADMIN_REVIEW_SORT_FIELDS = REVIEW_SORT_FIELDS;

export type ReviewSortBy = (typeof REVIEW_SORT_FIELDS)[number];
export type TripperReviewSortBy = (typeof TRIPPER_REVIEW_SORT_FIELDS)[number];
export type ReviewSortOrder = "asc" | "desc";

export const REVIEW_SORT_DEFAULT = { sortBy: "created", sortOrder: "desc" } as const;

/** First-click direction per field: numeric/date -> desc, names -> asc. */
export const REVIEW_SORT_INITIAL_ORDER: Record<ReviewSortBy, ReviewSortOrder> = {
  created: "desc",
  rating: "desc",
  traveler: "asc",
  tripper: "asc",
};

/**
 * Whitelist validation for `sortBy`. Unknown/absent value falls back to the
 * shared default field. Never throws — a raw client string must never reach
 * a dynamic Prisma `orderBy` key.
 */
export function parseReviewSortBy<T extends ReviewSortBy>(
  value: unknown,
  allowed: readonly T[],
): T | typeof REVIEW_SORT_DEFAULT.sortBy {
  return (allowed as readonly unknown[]).includes(value)
    ? (value as T)
    : REVIEW_SORT_DEFAULT.sortBy;
}

/** Unknown/absent input returns "desc". Never throws. */
export function parseReviewSortOrder(value: unknown): ReviewSortOrder {
  return value === "asc" || value === "desc" ? value : "desc";
}

/**
 * The only sort logic in the change — all four tokens produce one
 * `findMany`'s worth of `orderBy`, no branch, no second query, no extra
 * module. The `tripper` case is deliberately plain: no `nulls` option, no
 * `tripperId` filter. Postgres' native "NULL is greatest" placement applies
 * (Randomtrip rows land last on `asc`, first on `desc`) — accepted behavior,
 * not a gap to work around.
 */
export function reviewListOrderBy(
  sortBy: ReviewSortBy,
  sortOrder: ReviewSortOrder,
): Prisma.ReviewOrderByWithRelationInput[] {
  const tie = [{ createdAt: "desc" as const }, { id: "asc" as const }];
  switch (sortBy) {
    case "rating":
      return [{ rating: sortOrder }, ...tie];
    case "traveler":
      return [{ user: { name: sortOrder } }, ...tie];
    case "tripper":
      return [{ tripper: { name: sortOrder } }, ...tie];
    case "created":
    default:
      return [{ createdAt: sortOrder }, { id: "asc" as const }];
  }
}
