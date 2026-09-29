export type TripRequestStatus =
  | "DRAFT"
  | "SAVED"
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "REVEALED"
  | "COMPLETED"
  | "CANCELLED";

export const TRIP_STATUS_FLOW: TripRequestStatus[] = [
  "DRAFT",
  "SAVED",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "REVEALED",
  "COMPLETED",
];

const ALL_TRIP_STATUSES: TripRequestStatus[] = [...TRIP_STATUS_FLOW, "CANCELLED"];

/**
 * Resolves the initial trip-request status filter from a `?status=` query
 * param (e.g. the admin overview's "needs destination assignment" pending
 * row deep-links to `?status=CONFIRMED`). Falls back to `"ALL"` when the
 * param is absent or not a recognized `TripRequestStatus`.
 */
export function resolveInitialStatusFilter(
  param: string | null,
): TripRequestStatus | "ALL" {
  if (param && (ALL_TRIP_STATUSES as string[]).includes(param)) {
    return param as TripRequestStatus;
  }
  return "ALL";
}

export function countTripsByStatus(
  trips: { status: TripRequestStatus }[],
): Record<TripRequestStatus, number> {
  const all: TripRequestStatus[] = [...TRIP_STATUS_FLOW, "CANCELLED"];
  const counts = Object.fromEntries(all.map((s) => [s, 0])) as Record<
    TripRequestStatus,
    number
  >;
  for (const trip of trips) {
    if (trip.status in counts) counts[trip.status]++;
  }
  return counts;
}
