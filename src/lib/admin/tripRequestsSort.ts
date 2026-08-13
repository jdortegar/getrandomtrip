import type { Prisma } from "@prisma/client";

/** Sortable dimensions for the admin trip-requests table — every real
 * column except Actions. */
export const TRIP_REQUEST_SORT_FIELDS = [
  "tripDate",
  "traveler",
  "origin",
  "type",
  "status",
  "payment",
] as const;
export type TripRequestSortBy = (typeof TRIP_REQUEST_SORT_FIELDS)[number];
export type TripRequestSortOrder = "asc" | "desc";

/** Soonest-upcoming-trip-first — anchored to "now", not a plain chronological
 * sort (see `sortTripDatesByProximity`). Matches the operational read of
 * this table: what's coming up next matters more than raw date order. */
export const TRIP_REQUEST_SORT_DEFAULT = {
  sortBy: "tripDate",
  sortOrder: "asc",
} as const;

/** First-click direction per field: trip date -> soonest upcoming first,
 * names -> a-z. */
export const TRIP_REQUEST_SORT_INITIAL_ORDER: Record<
  TripRequestSortBy,
  TripRequestSortOrder
> = {
  tripDate: "asc",
  traveler: "asc",
  origin: "asc",
  type: "asc",
  status: "asc",
  payment: "asc",
};

/** Whitelist validation — an unknown/absent value falls back to the shared
 * default field. Never throws; a raw client string must never reach a
 * dynamic Prisma `orderBy` key. */
export function parseTripRequestSortBy(value: unknown): TripRequestSortBy {
  return (TRIP_REQUEST_SORT_FIELDS as readonly unknown[]).includes(value)
    ? (value as TripRequestSortBy)
    : TRIP_REQUEST_SORT_DEFAULT.sortBy;
}

export function parseTripRequestSortOrder(value: unknown): TripRequestSortOrder {
  return value === "asc" || value === "desc"
    ? value
    : TRIP_REQUEST_SORT_DEFAULT.sortOrder;
}

/**
 * `tripDate`'s comparator is anchored to "now", not a plain chronological
 * column sort — Prisma's `orderBy` can't express this declaratively (no
 * computed "is this date in the future" expression), so the caller must
 * fetch every matching row, sort in memory with this function, then
 * paginate the result — see `route.ts`.
 *
 * asc  = soonest-upcoming first, furthest-upcoming next, then most-recent-
 *        past first, oldest-past last. A `startDate` equal to `now` counts
 *        as upcoming.
 * desc = the exact reverse of the asc sequence.
 * `startDate: null` always sorts last, in either direction — it never
 * flips into "first" just because the direction reversed.
 */
export function sortTripDatesByProximity<
  T extends { startDate: string | Date | null },
>(items: T[], sortOrder: TripRequestSortOrder, now: Date): T[] {
  const withDate = items.filter(
    (item): item is T & { startDate: string | Date } =>
      item.startDate !== null,
  );
  const withoutDate = items.filter((item) => item.startDate === null);

  const nowTime = now.getTime();
  const ascending = [...withDate].sort((a, b) => {
    const aTime = new Date(a.startDate).getTime();
    const bTime = new Date(b.startDate).getTime();
    const aUpcoming = aTime >= nowTime;
    const bUpcoming = bTime >= nowTime;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    return aUpcoming ? aTime - bTime : bTime - aTime;
  });

  const ordered = sortOrder === "desc" ? ascending.reverse() : ascending;
  return [...ordered, ...withoutDate];
}

export function tripRequestListOrderBy(
  sortBy: TripRequestSortBy,
  sortOrder: TripRequestSortOrder,
): Prisma.TripRequestOrderByWithRelationInput[] {
  const tie = [{ createdAt: "desc" as const }, { id: "asc" as const }];
  switch (sortBy) {
    case "traveler":
      return [{ user: { name: sortOrder } }, ...tie];
    case "origin":
      return [{ originCity: sortOrder }, ...tie];
    case "type":
      return [{ type: sortOrder }, ...tie];
    case "status":
      return [{ status: sortOrder }, ...tie];
    case "payment":
      return [{ payment: { status: sortOrder } }, ...tie];
    case "tripDate":
    default:
      return [{ startDate: sortOrder }, ...tie];
  }
}
