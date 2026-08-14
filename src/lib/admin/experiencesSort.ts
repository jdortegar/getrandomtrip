import type { Prisma } from "@prisma/client";

/** Sortable columns for the admin experiences table. Type/Level is an array
 * field with no meaningful single-column order, so it's excluded — same as
 * Actions. */
export const EXPERIENCE_SORT_FIELDS = [
  "experience",
  "tripper",
  "status",
  "updated",
] as const;
export type ExperienceSortBy = (typeof EXPERIENCE_SORT_FIELDS)[number];
export type ExperienceSortOrder = "asc" | "desc";

/** Matches the table's pre-sorting default: most recently updated first. */
export const EXPERIENCE_SORT_DEFAULT = {
  sortBy: "updated",
  sortOrder: "desc",
} as const;

/** First-click direction per field: names a-z, most-recently-updated first. */
export const EXPERIENCE_SORT_INITIAL_ORDER: Record<
  ExperienceSortBy,
  ExperienceSortOrder
> = {
  experience: "asc",
  tripper: "asc",
  status: "asc",
  updated: "desc",
};

/** Whitelist validation — an unknown/absent value falls back to the shared
 * default field. Never throws; a raw client string must never reach a
 * dynamic Prisma `orderBy` key. */
export function parseExperienceSortBy(value: unknown): ExperienceSortBy {
  return (EXPERIENCE_SORT_FIELDS as readonly unknown[]).includes(value)
    ? (value as ExperienceSortBy)
    : EXPERIENCE_SORT_DEFAULT.sortBy;
}

export function parseExperienceSortOrder(value: unknown): ExperienceSortOrder {
  return value === "asc" || value === "desc"
    ? value
    : EXPERIENCE_SORT_DEFAULT.sortOrder;
}

export function experienceListOrderBy(
  sortBy: ExperienceSortBy,
  sortOrder: ExperienceSortOrder,
): Prisma.ExperienceOrderByWithRelationInput[] {
  const tie = [{ createdAt: "desc" as const }, { id: "asc" as const }];
  switch (sortBy) {
    case "experience":
      return [{ title: sortOrder }, ...tie];
    case "tripper":
      return [{ owner: { name: sortOrder } }, ...tie];
    case "status":
      return [{ status: sortOrder }, ...tie];
    case "updated":
    default:
      return [{ updatedAt: sortOrder }, ...tie];
  }
}
